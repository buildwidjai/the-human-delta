// Edge Function: generate-leadership-report
// V12.4 Forensic Pivot Report engine.
// 1) Verifies payment token, 2) computes T/E/M/R + per-trait scores from raw answers,
// 3) deterministically assigns archetype via logic gates,
// 4) calls Gemini with the V12.4 system prompt (extended 15-section schema),
// 5) server-fills sec_08.top_traits from top-3 trait scores,
// 6) returns { report, meta } matching the existing Report.tsx contract.

import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encode as encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";
import {
  deriveArchetype,
  ARCHETYPE_LIBRARY,
  type ArchetypeKey,
  type TemrScores as SharedTemrScores,
} from "../_shared/archetype.ts";
import { V12_4_SYSTEM_PROMPT } from "../_shared/v12-4-system-prompt.ts";
import { maskPii } from "../_shared/pii-mask.ts";
import { createStripeClient, type StripeEnv } from "../_shared/stripe.ts";

declare const Deno: { env: { get(name: string): string | undefined }; serve: (h: (req: Request) => Response | Promise<Response>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── LLM cost pricing (USD per 1M tokens) ────────────────────────────
// Lovable AI Gateway list prices. Keep in sync with knowledge/pricing.
const LLM_PRICING: Record<string, { in: number; out: number }> = {
  "gemini-2.5-pro":        { in: 1.25, out: 10.00 },
  "gemini-2.5-flash":      { in: 0.30, out: 2.50 },
  "gemini-2.5-flash-lite": { in: 0.10, out: 0.40 },
  "gpt-5":                 { in: 1.25, out: 10.00 },
  "gpt-5-mini":            { in: 0.25, out: 2.00 },
  "gpt-5-nano":            { in: 0.05, out: 0.40 },
};

function computeLlmCostUsd(
  model: string | null | undefined,
  inTokens: number | null | undefined,
  outTokens: number | null | undefined,
): number | null {
  if (!model) return null;
  // Strip provider prefix ("google/", "openai/") if present.
  const key = model.toLowerCase().replace(/^[a-z]+\//, "");
  const rates = LLM_PRICING[key];
  if (!rates) return null;
  const ti = Math.max(0, Number(inTokens ?? 0));
  const to = Math.max(0, Number(outTokens ?? 0));
  const cost = (ti * rates.in + to * rates.out) / 1_000_000;
  // Round to 6 decimals (matches numeric(10,6) column precision).
  return Math.round(cost * 1_000_000) / 1_000_000;
}

// Zero-decimal currencies — amount_total is already in major units.
const ZERO_DECIMAL = new Set([
  "bif","clp","djf","gnf","jpy","kmf","krw","mga",
  "pyg","rwf","ugx","vnd","vuv","xaf","xof","xpf",
]);

/**
 * Look up the actual amount paid by the customer on the Stripe Checkout
 * Session (after promo codes / discounts), returned in MAJOR currency
 * units. Stored as-is on `transaction_audit_logs.amount_paid_usd`.
 * Returns null for non-Stripe transaction ids (dev bypass) or on lookup
 * failure — the audit row is still written without the field.
 */
async function fetchAmountPaidMajor(
  paymentTransactionId: string | null,
): Promise<number | null> {
  if (!paymentTransactionId || !/^cs_[A-Za-z0-9_]{10,200}$/.test(paymentTransactionId)) {
    return null;
  }
  for (const env of ["sandbox", "live"] as const) {
    try {
      const stripe = createStripeClient(env as StripeEnv);
      const s = await stripe.checkout.sessions.retrieve(paymentTransactionId);
      if (!s || (s as any).object !== "checkout.session") continue;
      const total = (s as any).amount_total;
      const currency = String((s as any).currency ?? "").toLowerCase();
      if (typeof total !== "number") return null;
      if (ZERO_DECIMAL.has(currency)) return total;
      return total / 100;
    } catch {
      // try other environment
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// V12.4 ARCHETYPE LIBRARY
// (selection logic lives in ../_shared/archetype.ts — single source of truth
// shared with the on-screen preview so the two surfaces never disagree)
// ─────────────────────────────────────────────────────────────────────
// ARCHETYPE_LIBRARY is imported from /knowledge/archetypes.ts above.

type TemrScores = SharedTemrScores;

// ─────────────────────────────────────────────────────────────────────
// SCORING (ported from human-delta-v12)
// ─────────────────────────────────────────────────────────────────────
interface RawAnswer { id: number; pillar: string; trait: string; value: number; reverse: boolean }
interface ScoredAnswer extends RawAnswer { scored: number }

function computePillarScores(scored: ScoredAnswer[]): TemrScores {
  const buckets: Record<string, number[]> = { T: [], E: [], M: [], R: [] };
  for (const a of scored) if (a.pillar in buckets) buckets[a.pillar].push(a.scored);
  const out: TemrScores = { T: 0, E: 0, M: 0, R: 0 };
  for (const k of ["T", "E", "M", "R"] as const) {
    const arr = buckets[k];
    if (arr.length === 0) { out[k] = 0; continue; }
    const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
    out[k] = Math.round(((avg - 1) / 4) * 100);
  }
  return out;
}

function computeTraitScores(scored: ScoredAnswer[]) {
  const map = new Map<string, { sum: number; count: number; pillar: string }>();
  for (const a of scored) {
    const key = a.trait || `${a.pillar}-${a.id}`;
    const cur = map.get(key) ?? { sum: 0, count: 0, pillar: a.pillar };
    cur.sum += a.scored; cur.count += 1;
    map.set(key, cur);
  }
  return [...map.entries()].map(([name, v]) => ({
    name, pillar: v.pillar,
    score: Math.round(((v.sum / v.count - 1) / 4) * 100),
  }));
}

// ─────────────────────────────────────────────────────────────────────
// V12.4 SYSTEM PROMPT — sourced from /knowledge/prompts/v12-4-system.ts
// ─────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = V12_4_SYSTEM_PROMPT;

// ─────────────────────────────────────────────────────────────────────
// REQUEST / VALIDATION
// ─────────────────────────────────────────────────────────────────────
const AnswerSchema = z.object({
  id: z.number(),
  pillar: z.string(),
  trait: z.string().optional().default(""),
  value: z.number(),
  reverse: z.boolean(),
});

const BodySchema = z.object({
  paymentToken: z.string().min(1).optional(),
  assessmentId: z.string().optional(),
  // Browser-session UUID (distinct from per-attempt audit_id). Used for the
  // payment-gate lookup so a failed run can be re-attempted free of charge.
  sessionId: z.string().optional(),
  // Set true by the re-attempt flow. Server still verifies a prior PAID
  // row exists for (sessionId, hashedEmail) before honouring it.
  reattempt: z.boolean().optional().default(false),
  clientName: z.string().min(1),
  position: z.string().nullish(),
  ageRange: z.string().nullish(),
  experienceRange: z.string().nullish(),
  experienceYears: z.number().nullish(),
  gender: z.string().nullish(),
  industry: z.string().nullish(),
  // SHA-256 hex digest (64 lowercase hex chars). Required so the user
  // can later retrieve this report for free via the get-report function.
  hashedEmail: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  answers: z.array(AnswerSchema).min(1),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function verifyPaymentToken(token: string, expectedAssessmentId: string | null): Promise<boolean> {
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
  if (expectedAssessmentId && expectedAssessmentId !== assessmentId) return false;
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) return false;
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const expected = new TextDecoder().decode(encodeHex(new Uint8Array(signed)));
    return expected === sig;
  } catch { return false; }
}

function extractLikelyJson(raw: string): string {
  let cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  // Gemini sometimes emits a stray single character before a top-level section
  // key, e.g. `},\ne"sec_05": {`. jsonrepair does not always remove it.
  return cleaned
    .replace(/([,{]\s*)[A-Za-z]+(?="(?:metadata|sec_\d+(?:_\d+)?)"\s*:)/g, "$1")
    .replace(/(^\s*)[A-Za-z]+(?="(?:metadata|sec_\d+(?:_\d+)?)"\s*:)/gm, "$1");
}

async function parseReportJson(raw: string): Promise<Record<string, any>> {
  const cleaned = extractLikelyJson(raw);
  try {
    return JSON.parse(cleaned);
  } catch (firstErr) {
    try {
      const { jsonrepair } = await import("npm:jsonrepair@3.8.0");
      return JSON.parse(jsonrepair(cleaned));
    } catch (repairErr) {
      console.error("[generate-leadership-report] JSON repair failed:", (repairErr as Error).message);
      throw firstErr;
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")    return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("GOOGLE_API_KEY") ?? Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return json({ error: "Server misconfigured: missing GOOGLE_API_KEY" }, 500);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const body = parsed.data;

  // ── Payment gate ────────────────────────────────────────────────────
  // session_id is the browser-session UUID (distinct from per-attempt
  // audit_id). We fall back to assessmentId for backward compat with
  // older clients that didn't send a separate sessionId.
  const effectiveSessionId = body.sessionId ?? body.assessmentId ?? null;
  const sb = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  let paymentTransactionId: string | null = null;
  let isReattempt = false;

  // ── Developer bypass ────────────────────────────────────────────────
  // Restricted to callers who present the server-only `DEV_BYPASS_SECRET`
  // in the `x-dev-bypass` header. Used by internal QA scripts (Jaideep Das,
  // Rajeev Ranjan Sinha) to skip the Stripe round-trip when running test
  // flows. The secret is never exposed to the browser; rotating/deleting it
  // immediately disables the bypass.
  const devBypassHeader = req.headers.get("x-dev-bypass") ?? "";
  const devSecret       = Deno.env.get("DEV_BYPASS_SECRET") ?? "";
  const devBypass =
    devBypassHeader.length > 0 &&
    devSecret.length > 0 &&
    devBypassHeader === devSecret;

  if (devBypass) {
    paymentTransactionId = body.assessmentId ?? `dev-${crypto.randomUUID()}`;
    console.log("[generate-leadership-report] DEV BYPASS active for session", effectiveSessionId);
  } else if (body.reattempt) {
    // Re-attempt after a failed run: look up a prior PAID row for this
    // (session_id, hashed_email). If one exists we inherit its
    // payment_transaction_id and SKIP charging the user again.
    if (!effectiveSessionId || !body.hashedEmail) {
      return json({ error: "Re-attempt requires sessionId and hashedEmail" }, 400);
    }
    const { data: priorPaid } = await sb
      .from("transaction_audit_logs")
      .select("payment_transaction_id")
      .eq("session_id", effectiveSessionId)
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
    // Standard paid flow: a valid payment token is REQUIRED. Omitting it
    // (or passing an empty/invalid one) MUST fail closed — never generate
    // a report for free.
    if (!body.paymentToken) {
      return json({ error: "Payment token required" }, 402);
    }
    const ok = await verifyPaymentToken(body.paymentToken, body.assessmentId ?? null);
    if (!ok) return json({ error: "Payment token invalid or expired" }, 402);
    // assessmentId is the Stripe client_reference_id stamped on the
    // checkout session — use it as the canonical payment transaction id.
    paymentTransactionId = body.assessmentId ?? null;
  }

  // ── Narrative cache ────────────────────────────────────────────────
  // If the LLM has already produced a valid narrative for this
  // (session_id, hashed_email) in a prior call, REUSE it. Any subsequent
  // call (post-timeout retry, re-attempt, duplicate POST from a flaky
  // network) must NEVER re-invoke the LLM — we already have the output
  // and can render HTML/PDF from it.
  if (effectiveSessionId && body.hashedEmail) {
    const { data: priorSuccess } = await sb
      .from("transaction_audit_logs")
      .select("report_id, llm_output, archetype_scores, demographics, llm_model, payment_request_id")
      .eq("session_id", effectiveSessionId)
      .eq("hashed_email", body.hashedEmail)
      .eq("llm_generation_status", "success")
      .not("llm_output", "is", null)
      .order("report_generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const cachedReport =
      priorSuccess?.llm_output && typeof priorSuccess.llm_output === "object" && !Array.isArray(priorSuccess.llm_output)
        ? (priorSuccess.llm_output as Record<string, any>)
        : null;
    if (cachedReport && !("raw" in cachedReport)) {
      const a = (priorSuccess!.archetype_scores ?? {}) as Record<string, any>;
      console.log("[generate-leadership-report] reusing cached narrative for session", effectiveSessionId);
      // Ensure a transaction_audit_logs row exists for THIS paymentTransactionId
      // even when we short-circuit on a cached narrative. Without this row,
      // process-report-queue's later UPDATE (keyed on payment_transaction_id)
      // is a silent no-op and email_request_id / email_sent_at /
      // email_sent_success / payment_request_id are never populated.
      if (paymentTransactionId) {
        try {
          const { data: existingAudit } = await sb
            .from("transaction_audit_logs")
            .select("audit_id")
            .eq("payment_transaction_id", paymentTransactionId)
            .maybeSingle();
          if (!existingAudit) {
            const cachedAmountPaid = await fetchAmountPaidMajor(paymentTransactionId);
            await sb.from("transaction_audit_logs").insert({
              report_id: priorSuccess!.report_id ?? null,
              session_id: effectiveSessionId,
              hashed_email: body.hashedEmail ?? null,
              payment_transaction_id: paymentTransactionId,
              payment_request_id: (priorSuccess as any)?.payment_request_id ?? paymentTransactionId,
              payment_success: true,
              payment_completed_at: new Date().toISOString(),
              is_reattempt: isReattempt,
              llm_generation_status: "success",
              llm_transaction_status: "cached",
              final_transaction_status: "success",
              llm_output: cachedReport,
              llm_model: priorSuccess!.llm_model ?? null,
              archetype_scores: priorSuccess!.archetype_scores ?? null,
              demographics: priorSuccess!.demographics ?? {
                gender: body.gender ?? null,
                ageRange: body.ageRange ?? null,
                experienceRange: body.experienceRange ?? null,
                experienceYears: body.experienceYears ?? null,
                industry: body.industry ?? null,
                position: body.position ?? null,
              },
              report_generated_at: new Date().toISOString(),
              // Cached path: LLM was not re-invoked, so no new cost.
              llm_cost_usd: 0,
              amount_paid_usd: cachedAmountPaid,
            });
          }
        } catch (auditErr) {
          console.error("[generate-leadership-report] cached-path audit insert failed:", (auditErr as Error).message);
        }
      }
      return json({
        report: cachedReport,
        meta: {
          pillarScores: a.pillar_scores ?? null,
          overall: a.overall ?? null,
          archetype: a.archetype_label ?? null,
          primary: a.primary_pillar ?? null,
          secondary: a.secondary_pillar ?? null,
          lowest: a.lowest_pillar ?? null,
          tierLevel: null,
          latencyMs: 0,
          model: priorSuccess!.llm_model ?? null,
          clientName: body.clientName,
          industry: body.industry ?? null,
          reportId: priorSuccess!.report_id ?? null,
          cached: true,
        },
      });
    }
  }

  // 1) score
  const scored: ScoredAnswer[] = body.answers.map((a) => ({ ...a, scored: a.reverse ? 6 - a.value : a.value }));
  const pillarScores = computePillarScores(scored);
  const overall = Math.round((pillarScores.T + pillarScores.E + pillarScores.M + pillarScores.R) / 4);
  const traits = computeTraitScores(scored);
  const tierLevel = overall >= 80 ? "Tier 1: Architect" : overall >= 65 ? "Tier 2: Operator" : overall >= 45 ? "Tier 3: Solver" : "Tier 4: Subsidiser";

  // 2) deterministic archetype — shared with the on-screen preview module so
  // the preview header and the final PDF can never disagree.
  const derived = deriveArchetype(pillarScores);
  const archetypeKey: ArchetypeKey = derived.key;
  const primary = derived.primary, secondary = derived.secondary, lowest = derived.lowest;
  const entry = ARCHETYPE_LIBRARY[archetypeKey];

  // 2b) public-facing report ID — short, human-readable, persisted on audit row
  const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
  const year = new Date().getUTCFullYear();
  let publicReportId = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const buf = new Uint8Array(6);
    crypto.getRandomValues(buf);
    const code = Array.from(buf, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
    const candidate = `HD-${year}-${code}`;
    const { data: existing } = await sb.from("temr_audit_logs")
      .select("public_report_id").eq("public_report_id", candidate).maybeSingle();
    if (!existing) { publicReportId = candidate; break; }
  }
  if (!publicReportId) publicReportId = `HD-${year}-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  // 3) gemini
  const userPayload = {
    clientName: body.clientName,
    position: body.position ?? null,
    industry: body.industry ?? null,
    scores: pillarScores,
    overall,
    primary_pillar: primary,
    archetype_key: archetypeKey,
    archetype_label: entry.label,
    anchor_signal: entry.anchor,
    growth_hurdle: entry.hurdle,
    top_traits: [...traits].sort((a, b) => b.score - a.score).slice(0, 3),
    instructions: "Use anchor_signal verbatim as sec_01.headline. Use growth_hurdle verbatim as sec_01_5.logic. Populate every other field per the schema. Do not invent the archetype, anchor, or hurdle text. For sec_08.top_traits, return an entry per provided trait with a specific 1-sentence warning describing the cultural failure mode that strength creates when uncoupled from accountability.",
  };

  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-pro";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const startedAt = Date.now();
  let llmRaw = "";
  let report: Record<string, any> | null = null;
  let parseError: string | null = null;
  let llmRequestId: string | null = null;
  let llmInputTokens: number | null = null;
  let llmOutputTokens: number | null = null;
  let llmAttemptDurationMs: number | null = null;
  let llmHttpStatus: number | null = null;
  let attemptsMade = 0;
  let successfulAttempt: number | null = null;
  // Up to 2 attempts, but ONLY retry on malformed-JSON parse errors (genuinely
  // transient). Each attempt is bounded by a 120s AbortController — Gemini 2.5
  // Pro routinely takes 90–140s end-to-end, so a tighter timeout produces
  // false-positive aborts. If the first attempt aborts at 120s, we skip the
  // retry: a hung call is unlikely to recover and a second 120s attempt would
  // blow past the edge function's ~150s wall-clock budget.
  const requestBody = JSON.stringify({
    systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: JSON.stringify(userPayload) }] }],
    generationConfig: { temperature: 0.1, topP: 0.1, responseMimeType: "application/json", maxOutputTokens: 24576 },
  });
  for (let attempt = 1; attempt <= 2; attempt++) {
    attemptsMade = attempt;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120_000);
    let aborted = false;
    ctrl.signal.addEventListener("abort", () => { aborted = true; });
    const attemptStart = Date.now();
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
        signal: ctrl.signal,
      });
      llmHttpStatus = resp.status;
      llmRequestId =
        resp.headers.get("x-request-id") ??
        resp.headers.get("x-goog-request-id") ??
        llmRequestId;
      if (!resp.ok) {
        const t = await resp.text();
        const msg = `Gemini HTTP ${resp.status}: ${t.slice(0, 500)}`;
        // Don't retry on quota/billing/auth errors — they won't self-heal.
        if (resp.status === 429 || resp.status === 401 || resp.status === 403) {
          parseError = msg;
          console.error("[generate-leadership-report] Gemini hard error:", msg);
          break;
        }
        throw new Error(msg);
      }
      const data = await resp.json();
      llmRequestId = data?.responseId ?? llmRequestId;
      llmInputTokens = data?.usageMetadata?.promptTokenCount ?? llmInputTokens;
      llmOutputTokens = data?.usageMetadata?.candidatesTokenCount ?? llmOutputTokens;
      llmRaw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!llmRaw) throw new Error("Empty response from Gemini");
      report = await parseReportJson(llmRaw);
      parseError = null;
      successfulAttempt = attempt;
      break; // success
    } catch (err) {
      parseError = (err as Error).message;
      console.error(
        `[generate-leadership-report] attempt ${attempt}/2 failed:`,
        parseError,
      );
      // Don't retry on timeout/abort — a hung Gemini call is unlikely to
      // recover within our remaining budget. Only malformed-JSON parse
      // errors (SyntaxError) are worth a second attempt.
      const isParseError = err instanceof SyntaxError;
      if (aborted || !isParseError) break;
    } finally {
      clearTimeout(timer);
      llmAttemptDurationMs = Date.now() - attemptStart;
    }
  }
  const latencyMs = Date.now() - startedAt;

  // 4) audit log (best-effort)
  try {
    await sb.from("temr_audit_logs").insert({
      session_id: body.assessmentId ?? null,
      public_report_id: publicReportId,
      hashed_email: body.hashedEmail ?? null,
      status: parseError ? "failed" : "completed",
      system_prompt_version: "v12.4-mentor-extended",
      // GDPR/PII: name is a direct identifier — DO NOT persist it on the
      // audit row. The name lives only inside the rendered narrative
      // (llm_output) where it's required for the PDF.
      demographics: { gender: body.gender ?? null, ageRange: body.ageRange ?? null, experienceRange: body.experienceRange ?? null, industry: body.industry ?? null, position: body.position ?? null },
      demographic_data: { gender: body.gender ?? null, ageRange: body.ageRange ?? null, experienceRange: body.experienceRange ?? null, industry: body.industry ?? null, position: body.position ?? null },
      raw_responses: body.answers,
      computed_scores: pillarScores,
      trait_scores: traits,
      // Full payload sent to the LLM — used by /get-report to reconstruct
      // the same `meta` object on free retrievals.
      llm_input: {
        system_prompt_version: "v12.4-mentor-extended",
        model,
        user_payload: userPayload,
      },
      archetype: entry.label,
      primary_pillar: primary,
      secondary_pillar: secondary,
      lowest_pillar: lowest,
      llm_model: model,
      llm_output_raw: llmRaw,
      llm_parse_success: !parseError,
      llm_parse_error: parseError,
      total_duration_ms: latencyMs,
      output_validated: !parseError,
      report_delivered: !parseError,
    });
  } catch (auditErr) {
    console.error("[generate-leadership-report] audit log failed:", (auditErr as Error).message);
  }

  // 4b) transaction audit log — per-run forensic record (no creator prompts).
  try {
    const llmInputPrompt = {
      model,
      system_prompt_version: "v12.4-mentor-extended",
      user_payload: userPayload,
      generation_config: { temperature: 0.1, topP: 0.1, responseMimeType: "application/json", maxOutputTokens: 24576 },
    };
    // Best-effort cost + amount lookups. Either failing must NOT block
    // the audit insert — these are reporting fields, not gating logic.
    const llmCostUsd = computeLlmCostUsd(model, llmInputTokens, llmOutputTokens);
    const amountPaidUsd = await fetchAmountPaidMajor(paymentTransactionId);
    await sb.from("transaction_audit_logs").insert({
      report_id: publicReportId,
      session_id: effectiveSessionId,
      hashed_email: body.hashedEmail ?? null,
      payment_transaction_id: paymentTransactionId,
      // Successful report generation only ever happens after a verified
      // payment (or a known-paid re-attempt). Mark the payment side of
      // the audit row as successful and stamp the completion time so
      // ops can correlate Stripe with our internal records.
      payment_success: true,
      payment_completed_at: new Date().toISOString(),
      is_reattempt: isReattempt,
      llm_input: {
        model,
        system_prompt_version: "v12.4-mentor-extended",
        user_payload: userPayload,
        generation_config: { temperature: 0.1, topP: 0.1, responseMimeType: "application/json", maxOutputTokens: 24576 },
      },
      report_generated_at: new Date(startedAt).toISOString(),
      // Demographics WITHOUT name / email
      demographics: {
        gender: body.gender ?? null,
        ageRange: body.ageRange ?? null,
        experienceRange: body.experienceRange ?? null,
        experienceYears: body.experienceYears ?? null,
        industry: body.industry ?? null,
        position: body.position ?? null,
      },
      archetype_scores: {
        archetype_key: archetypeKey,
        archetype_label: entry.label,
        primary_pillar: primary,
        secondary_pillar: secondary,
        lowest_pillar: lowest,
        pillar_scores: pillarScores,
        overall,
        trait_scores: traits,
      },
      llm_model: model,
      llm_request_id: llmRequestId,
      llm_transaction_status: llmHttpStatus !== null ? `HTTP_${llmHttpStatus}` : (parseError ? "ERROR" : "UNKNOWN"),
      llm_input_prompt: llmInputPrompt,
      llm_input_tokens: llmInputTokens,
      llm_output: report ?? (llmRaw ? { raw: llmRaw } : null),
      llm_output_tokens: llmOutputTokens,
      llm_duration_ms: llmAttemptDurationMs,
      retry_count: Math.max(0, Math.min(2, attemptsMade - 1)),
      successful_retry_number: successfulAttempt !== null ? successfulAttempt - 1 : null,
      llm_generation_status: parseError ? "failed" : "success",
      final_transaction_status: parseError ? "failed" : "success",
      total_duration_ms: latencyMs,
      llm_cost_usd: llmCostUsd,
      amount_paid_usd: amountPaidUsd,
      // QA test runs go through the dev-bypass header AND carry no real
      // payment token (see dev-test-flow). The worker also forwards the
      // dev-bypass header on retries of REAL paid jobs, so we additionally
      // require the payment token to be absent before flagging as a test
      // run — otherwise genuine customer retries would be mis-classified.
      test_run: devBypass && !body.paymentToken,
      // LLM-side errors land here (PII-scrubbed). Stays separate from
      // payment_error_message so the two failure modes don't get conflated.
      llm_error_details: parseError ? maskPii(parseError) : null,
    });
  } catch (txErr) {
    console.error("[generate-leadership-report] transaction audit log failed:", (txErr as Error).message);
  }

  if (parseError || !report) {
    // Don't leak Gemini error bodies to the client — full detail is in
    // server logs via the console.error calls above.
    return json({ error: "Report generation failed" }, 502);
  }

  // 5) defence-in-depth: force authoritative metadata + server-fill top traits.
  // The LLM is told to use the provided archetype verbatim; if it ever returns
  // a different key we log it and overwrite, so the preview and the PDF stay
  // aligned even under model drift.
  const llmKey = (report.metadata as { archetype_key?: string } | undefined)?.archetype_key;
  if (llmKey && llmKey !== archetypeKey) {
    console.warn(`[generate-leadership-report] archetype drift: llm=${llmKey} deterministic=${archetypeKey} — overwriting`);
  }
  report.metadata = {
    ...(report.metadata ?? {}),
    archetype: entry.label,
    archetype_key: archetypeKey,
    delta_score: overall,
    primary_pillar: primary,
    anchor_signal: entry.anchor,
  };
  // Server-fill top_traits on sec_08 from computed traits (Gemini doesn't have to invent them).
  const topTraits = [...traits].sort((a, b) => b.score - a.score).slice(0, 3).map((t) => ({
    name: t.name, score: t.score,
    warning: report?.sec_08?.top_traits?.find?.((x: any) => x?.name === t.name)?.warning ?? "",
  }));
  report.sec_08 = { ...(report.sec_08 ?? {}), top_traits: topTraits };

  return json({
    report,
    meta: {
      pillarScores, overall,
      archetype: entry.label,
      primary, secondary, lowest, tierLevel, latencyMs, model,
      clientName: body.clientName,
      industry: body.industry ?? null,
      reportId: publicReportId,
    },
  });
});
