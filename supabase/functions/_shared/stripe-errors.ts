// Helper to extract a small, sanitised view of a Stripe SDK error
// suitable for our own audit log. We deliberately drop verbose fields
// (raw response body, account id, headers) — we only keep what we need
// for support diagnostics: error code, human-readable message, request id.
export interface ExtractedStripeError {
  code: string | null;
  message: string;
  requestId: string | null;
}

export function extractStripeError(err: unknown): ExtractedStripeError {
  const e = err as Record<string, unknown> | null;
  const code = typeof e?.code === "string"
    ? e.code as string
    : (typeof (e as any)?.type === "string" ? (e as any).type as string : null);
  const message = typeof (e as any)?.message === "string" ? (e as any).message : String(err);
  const requestId = typeof (e as any)?.requestId === "string" ? (e as any).requestId : null;
  return { code, message, requestId };
}

// Generic, non-leaky message safe to send to the browser.
export const GENERIC_CHECKOUT_ERROR = "Checkout creation failed — please try again.";
export const GENERIC_PRICE_ERROR = "Price lookup failed — please try again.";
