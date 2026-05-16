// Mint a short-lived signed token used to gate the report function.
//
// Called from /checkout/return after Stripe's hosted Payment Link redirects
// back. We REQUIRE a Stripe Checkout `sessionId` and verify it server-side:
//   • session.payment_status === "paid" (or "no_payment_required" for 100%-off
//     promo codes that auto-complete the session)
//   • session.client_reference_id matches the supplied assessmentId
// Only then do we mint the HMAC-SHA256 signed token that gates
// generate-leadership-report.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/hex.ts";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

declare const Deno: { env: { get(name: string): string | undefined } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOKEN_TTL_SECONDS = 30 * 60; // 30 minutes

function getSecret(): string {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return secret;
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return new TextDecoder().decode(encode(new Uint8Array(signed)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const assessmentId =
    typeof body === "object" && body !== null && typeof (body as Record<string, unknown>)["assessmentId"] === "string"
      ? ((body as Record<string, unknown>)["assessmentId"] as string)
      : null;

  if (!assessmentId || assessmentId.length > 200) {
    return new Response(JSON.stringify({ error: "Missing or invalid assessmentId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sessionId =
    typeof body === "object" && body !== null && typeof (body as Record<string, unknown>)["sessionId"] === "string"
      ? ((body as Record<string, unknown>)["sessionId"] as string)
      : null;

  // Stripe Checkout Session IDs always start with "cs_" and are bounded in length.
  if (!sessionId || !/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) {
    return new Response(JSON.stringify({ error: "Missing or invalid sessionId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify the Stripe Checkout session before minting a token. Try sandbox
  // first, then live — whichever returns a session is the right environment.
  let verifiedEnv: StripeEnv | null = null;
  let session: {
    id?: string;
    object?: string;
    payment_status?: string;
    status?: string;
    client_reference_id?: string | null;
    customer_email?: string | null;
    customer_details?: { email?: string | null } | null;
  } | null = null;
  const debugErrors: Record<string, string> = {};
  for (const env of ["sandbox", "live"] as const) {
    try {
      const stripe = createStripeClient(env);
      const found = await stripe.checkout.sessions.retrieve(sessionId);
      const candidate = found as typeof session;
      // Guard against gateway/stub responses that don't actually carry
      // Checkout Session fields. Only accept a real session.
      if (candidate && candidate.object === "checkout.session" && candidate.id) {
        session = candidate;
        verifiedEnv = env;
        break;
      }
      debugErrors[env] = `unexpected response (object=${candidate?.object ?? "null"})`;
    } catch (e) {
      debugErrors[env] = (e as Error).message;
      // Try the other environment.
    }
  }

  if (!session || !verifiedEnv) {
    console.error("[mint-report-token] Stripe session not found", { sessionId, debug: debugErrors });
    return new Response(JSON.stringify({ error: "Stripe session not found" }), {
      status: 402,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const paid =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required" ||
    session.status === "complete";
  if (!paid) {
    console.error("[mint-report-token] Payment not completed", {
      id: session.id ?? null,
      object: session.object ?? null,
      payment_status: session.payment_status ?? null,
      status: session.status ?? null,
      env: verifiedEnv,
    });
    return new Response(JSON.stringify({ error: "Payment not completed" }), {
      status: 402,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (session.client_reference_id && session.client_reference_id !== assessmentId) {
    return new Response(JSON.stringify({ error: "Assessment / payment mismatch" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
    const payload = `${assessmentId}.${exp}`;
    const sig = await hmac(getSecret(), payload);
    const token = `${payload}.${sig}`;

    const email = session.customer_details?.email ?? session.customer_email ?? null;

    return new Response(JSON.stringify({ token, exp, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[mint-report-token] token signing failed:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});