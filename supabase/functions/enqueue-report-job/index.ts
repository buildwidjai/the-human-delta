// Enqueue a report-generation job after a successful payment.
// The browser POSTs the same payload it used to send to
// generate-leadership-report PLUS the raw recipient email. We:
//   1. Verify the payment token (or accept a re-attempt with prior PAID row).
//   2. Encrypt the raw email with REPORT_EMAIL_ENCRYPTION_KEY (AES-GCM).
//   3. Insert a `pending` row into report_jobs with the full llm_input
//      snapshot (so retries use byte-identical input).
//   4. Fire-and-forget invoke process-report-queue so the worker starts
//      immediately. Returns { jobId }.

import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";
import { encryptEmail } from "../_shared/email-crypto.ts";

declare const Deno: { env: { get(name: string): string | undefined }; serve: (h: (req: Request) => Response | Promise<Response>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AnswerSchema = z.object({
  id: z.number(),
  pillar: z.string(),
  trait: z.string().optional().default(""),
  value: z.number(),
  reverse: z.boolean(),
});

const BodySchema = z.object({
  paymentToken: z.string().min(1).optional(),
  assessmentId: z.string().min(1),
  sessionId: z.string().min(1),
  reattempt: z.boolean().optional().default(false),
  clientName: z.string().min(1),
  email: z.string().email(),
  position: z.string().optional(),
  ageRange: z.string().optional(),
  experienceRange: z.string().optional(),
  experienceYears: z.number().optional(),
  gender: z.string().optional(),
  industry: z.string().optional(),
  hashedEmail: z.string().regex(/^[a-f0-9]{64}$/),
  answers: z.array(AnswerSchema).min(1),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function verifyPaymentToken(token: string, expectedAssessmentId: string): Promise<boolean> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const firstDot = payload.indexOf(".");
  if (firstDot < 0) return false;
  const assessmentId = payload.slice(0, firstDot);
  const exp = Number(payload.slice(firstDot + 1));
  if (!Number.isFinite(exp)) return false;
  if (Math.floor(Date.now() / 1000) > exp) return false;
  if (expectedAssessmentId !== assessmentId) return false;
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) return false;
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const expected = new TextDecoder().decode(encodeHex(new Uint8Array(signed)));
    return expected === sig;
  } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const body = parsed.data;

  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // ── Payment gate (mirror generate-leadership-report) ────────────────
  let paymentTransactionId: string | null = null;
  let isReattempt = false;

  if (body.reattempt) {
    const { data: priorPaid } = await sb
      .from("transaction_audit_logs")
      .select("payment_transaction_id")
      .eq("session_id", body.sessionId)
      .eq("hashed_email", body.hashedEmail)
      .not("payment_transaction_id", "is", null)
      .order("report_generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!priorPaid?.payment_transaction_id) {
      return json({ error: "No prior paid attempt found for this session" }, 402);
    }
    paymentTransactionId = priorPaid.payment_transaction_id;
    isReattempt = true;
  } else {
    if (!body.paymentToken) return json({ error: "Payment token required" }, 402);
    const ok = await verifyPaymentToken(body.paymentToken, body.assessmentId);
    if (!ok) return json({ error: "Payment token invalid or expired" }, 402);
    paymentTransactionId = body.assessmentId;
  }

  // ── Encrypt the raw email ──────────────────────────────────────────
  let emailEncrypted: string;
  try {
    emailEncrypted = await encryptEmail(body.email);
  } catch (e) {
    console.error("[enqueue-report-job] encryption failed", (e as Error).message);
    return json({ error: "Server misconfigured" }, 500);
  }

  // ── llm_input snapshot — exact body to POST to generate-leadership-report ──
  const llmInput = {
    paymentToken: body.paymentToken ?? null,
    assessmentId: body.assessmentId,
    sessionId: body.sessionId,
    reattempt: body.reattempt,
    clientName: body.clientName,
    position: body.position ?? null,
    ageRange: body.ageRange ?? null,
    experienceRange: body.experienceRange ?? null,
    experienceYears: body.experienceYears ?? null,
    gender: body.gender ?? null,
    industry: body.industry ?? null,
    hashedEmail: body.hashedEmail,
    answers: body.answers,
  };

  const { data: inserted, error: insertErr } = await sb
    .from("report_jobs")
    .insert({
      session_id: body.sessionId,
      assessment_id: body.assessmentId,
      payment_token: body.paymentToken ?? null,
      payment_transaction_id: paymentTransactionId,
      is_reattempt: isReattempt,
      hashed_email: body.hashedEmail,
      email_encrypted: emailEncrypted,
      client_name: body.clientName,
      llm_input: llmInput,
      status: "pending",
    })
    .select("job_id")
    .single();

  if (insertErr || !inserted) {
    console.error("[enqueue-report-job] insert failed", insertErr);
    return json({ error: "Failed to enqueue job" }, 500);
  }

  // ── Fire the worker (no await — return to client immediately) ───────
  const workerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-report-queue`;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
    body: JSON.stringify({ trigger: "enqueue", jobId: inserted.job_id }),
  }).catch((e) => console.error("[enqueue-report-job] worker kick failed", e));

  return json({ jobId: inserted.job_id });
});