// One-off QA endpoint: enqueues a fully-randomised report job to the test
// inbox stored in the TEST_EMAIL_ID secret. Gated by DEV_BYPASS_SECRET so it
// can never be triggered from the browser without the server-only header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encryptEmail } from "../_shared/email-crypto.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (h: (req: Request) => Response | Promise<Response>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-dev-bypass",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const QUESTIONS: Array<{ id: number; pillar: "T" | "E" | "M" | "R"; reverse: boolean; trait: string }> = [
  { id: 1, pillar: "E", reverse: false, trait: "Objectivity in feedback" },
  { id: 2, pillar: "E", reverse: false, trait: "Mood awareness" },
  { id: 3, pillar: "E", reverse: false, trait: "Self-worth separation" },
  { id: 4, pillar: "E", reverse: false, trait: "Stress reset routine" },
  { id: 5, pillar: "E", reverse: false, trait: "Schedule control" },
  { id: 101, pillar: "E", reverse: false, trait: "React vs respond" },
  { id: 102, pillar: "E", reverse: false, trait: "Composure under stakes" },
  { id: 103, pillar: "E", reverse: false, trait: "Internal standards" },
  { id: 6, pillar: "M", reverse: false, trait: "Simplifying complexity" },
  { id: 7, pillar: "M", reverse: false, trait: "Root-cause thinking" },
  { id: 8, pillar: "M", reverse: false, trait: "Decisive with 70%" },
  { id: 9, pillar: "M", reverse: false, trait: "AI stress-testing" },
  { id: 10, pillar: "M", reverse: true,  trait: "Tolerance for ambiguity" },
  { id: 201, pillar: "M", reverse: false, trait: "Holding opposing views" },
  { id: 202, pillar: "M", reverse: false, trait: "Second-order thinking" },
  { id: 203, pillar: "M", reverse: false, trait: "Trend vs priority" },
  { id: 11, pillar: "T", reverse: false, trait: "Deep-work blocks" },
  { id: 12, pillar: "T", reverse: false, trait: "Saying no clearly" },
  { id: 13, pillar: "T", reverse: false, trait: "Tracking outcomes" },
  { id: 14, pillar: "T", reverse: false, trait: "Energy management" },
  { id: 15, pillar: "T", reverse: true,  trait: "Avoiding overcommitment" },
  { id: 301, pillar: "T", reverse: false, trait: "Meeting hygiene" },
  { id: 302, pillar: "T", reverse: false, trait: "Daily prioritisation" },
  { id: 303, pillar: "T", reverse: false, trait: "Recovery rituals" },
  { id: 16, pillar: "R", reverse: false, trait: "Hard conversations" },
  { id: 17, pillar: "R", reverse: false, trait: "Active listening" },
  { id: 18, pillar: "R", reverse: true,  trait: "Trust extension" },
  { id: 19, pillar: "R", reverse: true,  trait: "Conflict avoidance" },
  { id: 20, pillar: "R", reverse: false, trait: "Asking for help" },
  { id: 401, pillar: "R", reverse: false, trait: "Feedback giving" },
  { id: 402, pillar: "R", reverse: false, trait: "Cross-team alignment" },
  { id: 403, pillar: "R", reverse: false, trait: "Repairing rifts" },
];

function rint(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[rint(0, arr.length - 1)]; }

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Developer-only QA endpoint. Caller must present the shared
  // DEV_BYPASS_SECRET in the `x-dev-bypass` header. Without it we
  // refuse the request — otherwise anyone could trigger real LLM /
  // SMTP work and burn API credits.
  const expectedSecret = Deno.env.get("DEV_BYPASS_SECRET") ?? "";
  const presented = req.headers.get("x-dev-bypass") ?? "";
  if (!expectedSecret || presented !== expectedSecret) {
    return json({ error: "Forbidden" }, 403);
  }

  const email = Deno.env.get("TEST_EMAIL_ID") ?? "";
  if (!email) return json({ error: "TEST_EMAIL_ID not configured" }, 500);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const firstNames = ["Aarav", "Priya", "Sam", "Maya", "Diego", "Lena", "Kenji", "Noor", "Theo", "Ana"];
  const lastNames = ["Patel", "Singh", "Garcia", "Kim", "Schmidt", "Rossi", "Khan", "Mendez", "Park", "Costa"];
  const positions = ["Engineering Manager", "VP Product", "Head of Operations", "Director of Sales", "Chief of Staff"];
  const industries = ["FinTech", "SaaS", "Healthcare", "Renewable Energy", "Logistics", "EdTech"];
  const genders = ["Male", "Female", "Other"];
  const ageRanges = ["28-35", "36-42", "43-50", "51-58"];
  const expRanges = ["4-7", "8-12", "13-18", "19-25"];

  const clientName = `${pick(firstNames)} ${pick(lastNames)}`;
  const demographics = {
    position: pick(positions),
    ageRange: pick(ageRanges),
    experienceRange: pick(expRanges),
    experienceYears: rint(4, 25),
    gender: pick(genders),
    industry: pick(industries),
  };

  const answers = QUESTIONS.map(q => ({ ...q, value: rint(1, 5) }));

  const sessionId = `dev-test-${crypto.randomUUID()}`;
  const assessmentId = `dev-test-${crypto.randomUUID()}`;
  const hashedEmail = await sha256Hex(email.toLowerCase().trim());

  // NOTE: omit paymentToken entirely — engine schema requires
  // string.min(1) when present. The worker forwards the
  // x-dev-bypass header so the engine's payment gate is satisfied.
  const llmInput = {
    assessmentId,
    sessionId,
    reattempt: false,
    clientName,
    ...demographics,
    hashedEmail,
    answers,
  };

  let emailEncrypted: string;
  try { emailEncrypted = await encryptEmail(email); }
  catch (e) { return json({ error: "encrypt failed: " + (e as Error).message }, 500); }

  const { data: inserted, error: insertErr } = await sb
    .from("report_jobs")
    .insert({
      session_id: sessionId,
      assessment_id: assessmentId,
      payment_token: null,
      payment_transaction_id: assessmentId,
      is_reattempt: false,
      hashed_email: hashedEmail,
      email_encrypted: emailEncrypted,
      client_name: clientName,
      llm_input: llmInput,
      status: "pending",
    })
    .select("job_id")
    .single();

  if (insertErr || !inserted) return json({ error: "insert failed", detail: insertErr }, 500);

  const workerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-report-queue`;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  fetch(workerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
    body: JSON.stringify({ trigger: "dev-test", jobId: inserted.job_id }),
  }).catch(() => {});

  // NOTE: deliberately do NOT echo `recipient` — that would leak the
  // server-only TEST_EMAIL_ID secret to any caller who knows the bypass.
  return json({ ok: true, jobId: inserted.job_id, sessionId, assessmentId, clientName, demographics });
});
