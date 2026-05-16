// Edge function: delete-my-data
// GDPR Art. 17 / CCPA §1798.105 / LGPD Art. 18 / DPDP s.12 erasure endpoint.
//
// Two-step flow to prove email ownership (the email itself is the proof
// channel — only the inbox owner can click the confirmation link):
//
//   POST { action: "request", email }
//     → mints HMAC-SHA256 token (TTL 30 min) over sha256(email)+exp
//     → emails a confirmation link to that address
//     → ALWAYS returns { sent: true } (never reveal whether records exist)
//
//   POST { action: "confirm", token }
//     → verifies HMAC + expiry
//     → hard-deletes ALL rows in temr_audit_logs, transaction_audit_logs,
//       report_jobs and any narrative storage objects matching the
//       hashed_email derived from the token
//     → returns counts so the caller can confirm
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode } from "https://deno.land/std@0.168.0/encoding/hex.ts";
import { sendEmail } from "../_shared/smtp.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (h: (req: Request) => Response | Promise<Response>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOKEN_TTL_SECONDS = 30 * 60;

const RequestSchema = z.object({
  action: z.literal("request"),
  email: z.string().trim().toLowerCase().email().max(254),
  returnUrl: z.string().url().max(500).optional(),
});
const ConfirmSchema = z.object({
  action: z.literal("confirm"),
  token: z.string().min(20).max(400),
});
const BodySchema = z.union([RequestSchema, ConfirmSchema]);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSecret(): string {
  const s = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!s) throw new Error("missing signing secret");
  return s;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return new TextDecoder().decode(encode(new Uint8Array(signed)));
}

// Constant-time string compare to avoid timing-based signature recovery.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const ALLOWED_ORIGINS = new Set([
  "https://thehumandelta.lovable.app",
  "https://id-preview--4979cb0c-3ebb-4e02-9df5-7c46cb906376.lovable.app",
]);

function pickReturnBase(returnUrl: string | undefined, origin: string | null): string {
  const candidate = returnUrl ?? origin ?? "";
  try {
    const u = new URL(candidate);
    const base = `${u.protocol}//${u.host}`;
    if (ALLOWED_ORIGINS.has(base)) return base;
  } catch { /* fall through */ }
  return "https://thehumandelta.lovable.app";
}

async function handleRequest(email: string, returnBase: string): Promise<Response> {
  const hashed = await sha256Hex(email);
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${hashed}.${exp}`;
  const sig = await hmac(getSecret(), payload);
  const token = `${payload}.${sig}`;

  const link = `${returnBase}/delete-confirm?token=${encodeURIComponent(token)}`;
  const subject = "Confirm deletion of your Human Delta data";
  const text =
    `We received a request to permanently delete all data associated with this email address.\n\n` +
    `If you made this request, confirm within 30 minutes by opening:\n${link}\n\n` +
    `If you did not request this, ignore this email — nothing will be deleted.`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#0b1220;line-height:1.6;max-width:560px">
      <h2 style="margin:0 0 16px">Confirm data deletion</h2>
      <p>We received a request to <strong>permanently delete</strong> all data associated with this email address from The Human Delta.</p>
      <p>If you made this request, confirm within 30 minutes:</p>
      <p style="margin:24px 0">
        <a href="${link}" style="display:inline-block;background:#0b1220;color:#f5d27c;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">
          Confirm deletion
        </a>
      </p>
      <p style="font-size:12px;color:#5b6472">If you did not request this, ignore this email — nothing will be deleted.</p>
    </div>`;

  try {
    await sendEmail({ to: email, subject, text, html });
  } catch (err) {
    // Log internally but never reveal whether the address exists / failed.
    console.error("[delete-my-data] confirmation send failed:", (err as Error).message);
  }
  return json({ sent: true });
}

async function handleConfirm(token: string): Promise<Response> {
  const parts = token.split(".");
  if (parts.length !== 3) return json({ error: "Invalid or expired link" }, 400);
  const [hashed, expStr, sig] = parts;
  if (!/^[a-f0-9]{64}$/.test(hashed) || !/^\d+$/.test(expStr)) {
    return json({ error: "Invalid or expired link" }, 400);
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) {
    return json({ error: "Invalid or expired link" }, 400);
  }
  let expected: string;
  try {
    expected = await hmac(getSecret(), `${hashed}.${exp}`);
  } catch (err) {
    console.error("[delete-my-data] hmac failed:", (err as Error).message);
    return json({ error: "Internal server error" }, 500);
  }
  if (!safeEqual(expected, sig)) return json({ error: "Invalid or expired link" }, 400);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  let storagePathsRemoved = 0;
  try {
    const { data: rows } = await sb
      .from("temr_audit_logs")
      .select("narrative_storage_path")
      .eq("hashed_email", hashed);
    const paths = (rows ?? [])
      .map((r) => (r as { narrative_storage_path: string | null }).narrative_storage_path)
      .filter((p): p is string => typeof p === "string" && p.length > 0);
    if (paths.length > 0) {
      const { error: rmErr } = await sb.storage.from("pivot-reports").remove(paths);
      if (!rmErr) storagePathsRemoved = paths.length;
      else console.error("[delete-my-data] storage remove failed:", rmErr.message);
    }
  } catch (err) {
    console.error("[delete-my-data] storage step failed:", (err as Error).message);
  }

  const { count: temrCount, error: temrErr } = await sb
    .from("temr_audit_logs").delete({ count: "exact" }).eq("hashed_email", hashed);
  if (temrErr) {
    console.error("[delete-my-data] temr_audit_logs delete failed:", temrErr.message);
    return json({ error: "Deletion failed" }, 500);
  }
  const { count: txCount, error: txErr } = await sb
    .from("transaction_audit_logs").delete({ count: "exact" }).eq("hashed_email", hashed);
  if (txErr) {
    console.error("[delete-my-data] transaction_audit_logs delete failed:", txErr.message);
    return json({ error: "Deletion failed" }, 500);
  }
  const { count: jobCount, error: jobErr } = await sb
    .from("report_jobs").delete({ count: "exact" }).eq("hashed_email", hashed);
  if (jobErr) {
    console.error("[delete-my-data] report_jobs delete failed:", jobErr.message);
    return json({ error: "Deletion failed" }, 500);
  }

  return json({
    deleted: {
      temr_audit_logs: temrCount ?? 0,
      transaction_audit_logs: txCount ?? 0,
      report_jobs: jobCount ?? 0,
      storage_objects: storagePathsRemoved,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: "Invalid request" }, 400);

  if (parsed.data.action === "request") {
    const base = pickReturnBase(parsed.data.returnUrl, req.headers.get("origin"));
    return await handleRequest(parsed.data.email, base);
  }
  return await handleConfirm(parsed.data.token);
});
