// Best-effort PII scrubber used before persisting error strings to
// transaction_audit_logs. We never want raw emails, phone numbers,
// long-form names or auth tokens to land in audit rows that ops/
// support staff might browse.
//
// This is defence-in-depth, not a guarantee — keep error strings short
// and structured at the call site where possible.

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// E.164-ish and common loose phone formats (8+ digits, optional + and separators)
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/g;
// JWT-looking tokens
const JWT_RE = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
// Stripe-ish secrets / long opaque tokens (sk_, pi_, cs_, etc. + 16+ chars)
const STRIPE_RE = /\b(sk|pk|rk|cs|pi|ch|cus|seti|sub|sub_sched|in|src|tok|whsec)_[A-Za-z0-9]{16,}\b/g;
// Bearer tokens
const BEARER_RE = /Bearer\s+[A-Za-z0-9._\-]+/gi;
// IPv4
const IPV4_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

export function maskPii(input: unknown, maxLen = 1000): string {
  if (input === null || input === undefined) return "";
  let s = typeof input === "string" ? input : (() => {
    try { return JSON.stringify(input); } catch { return String(input); }
  })();
  s = s
    .replace(EMAIL_RE, "[email]")
    .replace(JWT_RE, "[jwt]")
    .replace(STRIPE_RE, "[stripe_id]")
    .replace(BEARER_RE, "Bearer [redacted]")
    .replace(PHONE_RE, "[phone]")
    .replace(IPV4_RE, "[ip]");
  if (s.length > maxLen) s = s.slice(0, maxLen) + "…[truncated]";
  return s;
}