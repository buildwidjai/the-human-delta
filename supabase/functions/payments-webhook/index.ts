import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

// Minimal webhook handler — we don't persist subscriptions for this product
// (one-time purchase). Logs events for observability. Returns 200 fast so
// Stripe doesn't retry.
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as StripeEnv;
  try {
    const event = await verifyWebhook(req, env);
    console.log("[payments-webhook]", env, event.type);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[payments-webhook] error", (e as Error).message);
    return new Response("Webhook error", { status: 400 });
  }
});