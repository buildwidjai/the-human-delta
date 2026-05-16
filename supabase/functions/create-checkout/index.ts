import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { extractStripeError, GENERIC_CHECKOUT_ERROR } from "../_shared/stripe-errors.ts";
import { maskPii } from "../_shared/pii-mask.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Captured in the outer scope so the catch block can write a row to
  // transaction_audit_logs even when we fail before reading the body.
  let assessmentIdForAudit: string | null = null;

  try {
    const { priceId, customerEmail, assessmentId, returnUrl, environment } = await req.json();
    if (typeof assessmentId === "string") assessmentIdForAudit = assessmentId;
    if (!priceId || typeof priceId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
      return new Response(JSON.stringify({ error: "Invalid priceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!assessmentId || typeof assessmentId !== "string") {
      return new Response(JSON.stringify({ error: "Missing assessmentId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Allowlist of origins permitted as Stripe `return_url`. Without this,
    // an unauthenticated caller could mint a checkout session that
    // redirects the paying user to an attacker-controlled URL after
    // payment (open redirect / phishing).
    const ALLOWED_RETURN_ORIGINS = new Set<string>([
      "https://thehumandelta.lovable.app",
      "https://id-preview--4979cb0c-3ebb-4e02-9df5-7c46cb906376.lovable.app",
      // Live sandbox preview origin (lovableproject.com) used by the
      // in-editor preview iframe. Distinct from the static `id-preview-…`
      // origin above.
      "https://4979cb0c-3ebb-4e02-9df5-7c46cb906376.lovableproject.com",
      "http://localhost:8080",
      "http://localhost:5173",
      "http://localhost:3000",
    ]);
    let safeReturnUrl: string | null = null;
    if (returnUrl) {
      if (typeof returnUrl !== "string") {
        return new Response(JSON.stringify({ error: "Invalid returnUrl" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const u = new URL(returnUrl);
        if (!ALLOWED_RETURN_ORIGINS.has(u.origin)) {
          return new Response(JSON.stringify({ error: "Invalid returnUrl" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        safeReturnUrl = returnUrl;
      } catch {
        return new Response(JSON.stringify({ error: "Invalid returnUrl" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const env = (environment || "sandbox") as StripeEnv;
    const stripe = createStripeClient(env);

    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripePrice = prices.data[0];

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: "payment",
      ui_mode: "embedded",
      // Show the promotion code field on embedded checkout. Codes must be
      // created in the underlying Stripe account to be accepted.
      allow_promotion_codes: true,
      return_url: (() => {
        if (safeReturnUrl) return safeReturnUrl;
        const reqOrigin = req.headers.get("origin") ?? "";
        const fallbackOrigin = ALLOWED_RETURN_ORIGINS.has(reqOrigin)
          ? reqOrigin
          : "https://thehumandelta.lovable.app";
        return `${fallbackOrigin}/report?session_id={CHECKOUT_SESSION_ID}`;
      })(),
      ...(customerEmail && { customer_email: customerEmail }),
      // Bind the assessment id to the session in TWO places so the return
      // page can prove ownership without trusting client input:
      //   • client_reference_id — surfaced on the Session and consumed by
      //     mint-report-token to verify the supplied assessmentId matches.
      //   • metadata.assessmentId — mirrored for webhook handlers.
      client_reference_id: assessmentId,
      metadata: { assessmentId },
      payment_intent_data: { metadata: { assessmentId } },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Always log the full error server-side for ops diagnostics, but never
    // surface Stripe internals (account id, raw response body, request
    // headers) to the browser.
    console.error("[create-checkout] Stripe error", error);
    const extracted = extractStripeError(error);

    // Best-effort audit write — failures here must not mask the original
    // error response to the client.
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceKey && assessmentIdForAudit) {
        const sb = createClient(supabaseUrl, serviceKey);
        await sb.from("transaction_audit_logs").insert({
          session_id: assessmentIdForAudit,
          payment_success: false,
          payment_error_code: extracted.code,
          payment_error_message: extracted.message,
          payment_request_id: extracted.requestId,
          payment_completed_at: new Date().toISOString(),
          final_transaction_status: "payment_failed",
          // General (non-LLM) error capture. Kept separate from
          // payment_error_message so we keep the original Stripe-facing
          // message intact while still recording the raw failure (PII
          // scrubbed) for forensic review.
          error_details: maskPii(error),
          // Real customer flow — never a test run from this endpoint.
          test_run: false,
        });
      }
    } catch (auditErr) {
      console.error("[create-checkout] failed to write audit row", auditErr);
    }

    return new Response(JSON.stringify({ error: GENERIC_CHECKOUT_ERROR }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});