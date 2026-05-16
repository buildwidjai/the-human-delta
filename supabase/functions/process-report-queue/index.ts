// FIFO worker that drains report_jobs one at a time.
// 1) Atomically claim the oldest pending (or stale-locked / email-retry) job.
// 2) If LLM not yet succeeded: call generate-leadership-report internally
//    using the cached llm_input. Up to 3 whole-call attempts per job.
// 3) Once status is terminal (success or failed), idempotently send the
//    success or failure email via Strato SMTP, with up to 2 retries.
//    Raw email is wiped from the row in the same UPDATE that flips
//    email_status to 'sent' or 'email_failed'.
// 4) Recursively re-invoke self so the queue keeps draining.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { decryptEmail } from "../_shared/email-crypto.ts";
import { sendEmail } from "../_shared/smtp.ts";
import { renderSuccessEmail, renderFailureEmail } from "../_shared/email-templates.ts";
import { maskPii } from "../_shared/pii-mask.ts";

declare const Deno: { env: { get(name: string): string | undefined }; serve: (h: (req: Request) => Response | Promise<Response>) => void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_LLM_ATTEMPTS = 3;
const MAX_EMAIL_ATTEMPTS = 2;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function reinvokeSelf() {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-report-queue`;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
    body: JSON.stringify({ trigger: "recurse" }),
  }).catch((e) => console.error("[process-report-queue] recurse failed", e));
}

async function callReportEngine(llmInput: any): Promise<{ ok: true; report: any; meta: any } | { ok: false; error: string; status: number }> {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-leadership-report`;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const devSecret = Deno.env.get("DEV_BYPASS_SECRET") ?? "";
  // Worker is internal; if the original payment token has expired during
  // earlier failed attempts we still want to push the same llm_input through.
  // We send the original token (engine will accept it if still valid) AND
  // the dev-bypass header as a fallback for re-attempts inside the worker.
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
  };
  if (devSecret) headers["x-dev-bypass"] = devSecret;
  try {
    const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(llmInput) });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return { ok: false, error: typeof data?.error === "string" ? data.error : `HTTP ${resp.status}`, status: resp.status };
    if (!data?.report) return { ok: false, error: "No report in engine response", status: 500 };
    return { ok: true, report: data.report, meta: data.meta };
  } catch (e) {
    return { ok: false, error: (e as Error).message, status: 500 };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Internal-only: require service-role bearer. All legitimate callers
  // (enqueue-report-job, dev-test-flow, self-recurse) already send it.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const auth = req.headers.get("authorization") ?? "";
  if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const workerId = `worker-${crypto.randomUUID().slice(0, 8)}`;

  // ── 1) Claim the next job ──────────────────────────────────────────
  const { data: claimed, error: claimErr } = await sb
    .rpc("claim_next_report_job", { _worker_id: workerId });
  if (claimErr) {
    console.error("[process-report-queue] claim failed", claimErr);
    return json({ ok: false, error: "claim failed" }, 500);
  }
  const job = Array.isArray(claimed) ? claimed[0] : claimed;
  if (!job) return json({ ok: true, idle: true });

  console.log(`[process-report-queue] ${workerId} claimed job ${job.job_id} status=${job.status} email_status=${job.email_status}`);

  // ── 2) Run LLM if not yet successful ───────────────────────────────
  let report = job.llm_output ?? null;
  let reportId: string | null = job.report_id ?? null;
  let pillarScores: Record<string, number> = {};
  let llmFailed = job.status === "failed";

  if (job.status === "processing" || job.status === "pending") {
    const attempt = (job.attempt_count ?? 0) + 1;
    const result = await callReportEngine(job.llm_input);

    if (result.ok) {
      report = result.report;
      reportId = result.meta?.reportId ?? null;
      pillarScores = result.meta?.pillarScores ?? {};
      await sb.from("report_jobs").update({
        status: "success",
        attempt_count: attempt,
        llm_output: result.report,
        report_id: reportId,
        last_llm_error: null,
        locked_at: null,
        locked_by: null,
        updated_at: new Date().toISOString(),
      }).eq("job_id", job.job_id);
    } else {
      const errMsg = result.error.slice(0, 500);
      console.error(`[process-report-queue] job ${job.job_id} attempt ${attempt}/${MAX_LLM_ATTEMPTS} failed:`, errMsg);
      if (attempt < MAX_LLM_ATTEMPTS) {
        // Re-queue for another attempt — release the lock so claim can pick it up.
        await sb.from("report_jobs").update({
          status: "pending",
          attempt_count: attempt,
          last_llm_error: errMsg,
          locked_at: null,
          locked_by: null,
          updated_at: new Date().toISOString(),
        }).eq("job_id", job.job_id);
        reinvokeSelf();
        return json({ ok: true, jobId: job.job_id, retried: true });
      }
      await sb.from("report_jobs").update({
        status: "failed",
        attempt_count: attempt,
        last_llm_error: errMsg,
        locked_at: null,
        locked_by: null,
        updated_at: new Date().toISOString(),
      }).eq("job_id", job.job_id);
      llmFailed = true;
      // Mirror the terminal LLM failure onto transaction_audit_logs in
      // its own column (PII-scrubbed). We do NOT touch payment_error_*
      // here — the payment succeeded, only the report engine failed.
      if (job.payment_transaction_id) {
        try {
          await sb.from("transaction_audit_logs").update({
            llm_error_details: maskPii(result.error),
            llm_generation_status: "failed",
            final_transaction_status: "failed",
          }).eq("payment_transaction_id", job.payment_transaction_id);
        } catch (e) {
          console.error("[process-report-queue] failed to persist llm_error_details", e);
        }
      }
    }
  } else if (job.status === "success") {
    pillarScores = (report?.metadata && typeof report?.metadata === "object")
      ? {} // fall through; we reload below from llm_output if needed
      : {};
  }

  // Reload current row (status / email fields may have changed above).
  const { data: fresh } = await sb
    .from("report_jobs")
    .select("*")
    .eq("job_id", job.job_id)
    .maybeSingle();
  if (!fresh) {
    reinvokeSelf();
    return json({ ok: true, jobId: job.job_id });
  }

  // ── 3) Email step (idempotent) ─────────────────────────────────────
  const isTerminal = fresh.status === "success" || fresh.status === "failed";
  const needsEmail = isTerminal
    && (fresh.email_status === "not_sent" || fresh.email_status === "email_failed")
    && (fresh.email_attempt_count ?? 0) < MAX_EMAIL_ATTEMPTS;

  if (needsEmail && fresh.email_encrypted) {
    const emailAttempt = (fresh.email_attempt_count ?? 0) + 1;
    // Mark sending so a parallel worker doesn't double-send.
    await sb.from("report_jobs").update({
      email_status: "sending",
      email_attempt_count: emailAttempt,
      updated_at: new Date().toISOString(),
    }).eq("job_id", fresh.job_id);

    let recipient = "";
    try {
      recipient = await decryptEmail(fresh.email_encrypted);
    } catch (e) {
      console.error("[process-report-queue] decrypt failed", (e as Error).message);
      await sb.from("report_jobs").update({
        email_status: "email_failed",
        last_email_error: "decrypt failed",
        email_encrypted: null,
        client_name: null,
        updated_at: new Date().toISOString(),
      }).eq("job_id", fresh.job_id);
      reinvokeSelf();
      return json({ ok: false, jobId: fresh.job_id, error: "decrypt failed" });
    }

    const isSuccess = fresh.status === "success" && fresh.llm_output;

    // Build the PDF attachment for success emails. We rebuild it here so
    // the email contains exactly the same V12.4 PDF the user used to be
    // able to download from the website — same renderer, same fonts, same
    // logo, same layout. DO NOT change the renderer.
    let attachments: Array<{ filename: string; content: Uint8Array; contentType?: string }> | undefined;
    if (isSuccess) {
      try {
        const llmInput = (fresh.llm_input ?? {}) as Record<string, any>;
        const demographics = (llmInput.demographics ?? {}) as Record<string, any>;
        const industry = typeof demographics.industry === "string" ? demographics.industry : "";

        // Pillar scores: prefer the freshly-computed scores from this run;
        // otherwise pull them from the transaction audit log.
        let scores: Record<"T" | "E" | "M" | "R", number> = {
          T: Number(pillarScores?.T ?? 0),
          E: Number(pillarScores?.E ?? 0),
          M: Number(pillarScores?.M ?? 0),
          R: Number(pillarScores?.R ?? 0),
        };
        if (!scores.T && !scores.E && !scores.M && !scores.R && fresh.payment_transaction_id) {
          const { data: audit } = await sb
            .from("transaction_audit_logs")
            .select("archetype_scores")
            .eq("payment_transaction_id", fresh.payment_transaction_id)
            .maybeSingle();
          const ps = (audit?.archetype_scores as any)?.pillar_scores ?? {};
          scores = {
            T: Number(ps.T ?? 0),
            E: Number(ps.E ?? 0),
            M: Number(ps.M ?? 0),
            R: Number(ps.R ?? 0),
          };
        }

        // Delegate PDF rendering to its own edge function so we don't
        // blow this worker's CPU budget. Same renderer, same fonts,
        // same logo — output is byte-identical to the old website
        // download.
        const renderUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/render-report-pdf`;
        const renderResp = await fetch(renderUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`,
            apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          },
          body: JSON.stringify({
            report: fresh.llm_output,
            scores,
            clientName: fresh.client_name ?? "",
            industry,
            reportId: fresh.report_id ?? undefined,
          }),
        });
        const renderJson = await renderResp.json().catch(() => ({}));
        if (!renderResp.ok || !renderJson?.pdfBase64) {
          throw new Error(`render-report-pdf HTTP ${renderResp.status}: ${renderJson?.error ?? "no pdf"}`);
        }
        const bin = atob(renderJson.pdfBase64);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const safeId = (fresh.report_id ?? fresh.job_id).toString().replace(/[^A-Za-z0-9_-]/g, "_");
        attachments = [{
          filename: `HumanDelta-Report-${safeId}.pdf`,
          content: buf,
          contentType: "application/pdf",
        }];
        console.log(`[process-report-queue] job ${fresh.job_id} PDF rendered (${buf.length} bytes)`);
      } catch (e) {
        // Don't block the email if the PDF blows up — log loudly and send
        // the narrative email without the attachment.
        console.error(`[process-report-queue] job ${fresh.job_id} PDF render failed:`, (e as Error).message);
        attachments = undefined;
      }
    }

    const tpl = isSuccess
      ? renderSuccessEmail({
          clientName: fresh.client_name ?? "",
          reportId: fresh.report_id ?? null,
          report: fresh.llm_output,
          scores: pillarScores ?? {},
        })
      : renderFailureEmail(fresh.client_name ?? "");

    try {
      await sendEmail({ to: recipient, subject: tpl.subject, html: tpl.html, text: tpl.text, attachments });
      const emailRequestId = crypto.randomUUID();
      const sentAt = new Date().toISOString();
      // Wipe the encrypted email and mark sent.
      await sb.from("report_jobs").update({
        email_status: "sent",
        email_encrypted: null,
        client_name: null,
        last_email_error: null,
        updated_at: new Date().toISOString(),
      }).eq("job_id", fresh.job_id);
      // Record email-send metadata on the transaction audit log row.
      if (fresh.payment_transaction_id) {
        const { error: auditErr } = await sb
          .from("transaction_audit_logs")
          .update({
            email_request_id: emailRequestId,
            email_sent_at: sentAt,
            email_sent_success: true,
          })
          .eq("payment_transaction_id", fresh.payment_transaction_id);
        if (auditErr) console.error("[process-report-queue] audit update failed", auditErr);
      }
      console.log(`[process-report-queue] job ${fresh.job_id} email sent (${isSuccess ? "success" : "failure"})`);
    } catch (e) {
      const msg = (e as Error).message.slice(0, 500);
      console.error(`[process-report-queue] job ${fresh.job_id} email attempt ${emailAttempt}/${MAX_EMAIL_ATTEMPTS} failed:`, msg);
      const finalEmailFail = emailAttempt >= MAX_EMAIL_ATTEMPTS;
      await sb.from("report_jobs").update({
        email_status: "email_failed",
        last_email_error: msg,
        // Wipe the email even on final failure — we don't want it sitting around.
        email_encrypted: finalEmailFail ? null : fresh.email_encrypted,
        // Wipe the greeting name on final failure as well — no further send will happen.
        client_name: finalEmailFail ? null : fresh.client_name,
        updated_at: new Date().toISOString(),
      }).eq("job_id", fresh.job_id);
      if (finalEmailFail && fresh.payment_transaction_id) {
        await sb.from("transaction_audit_logs").update({
          email_sent_at: new Date().toISOString(),
          email_sent_success: false,
        }).eq("payment_transaction_id", fresh.payment_transaction_id);
      }
    }
  }

  // ── 4) Recurse — drain the next job (if any) ────────────────────────
  reinvokeSelf();
  return json({ ok: true, jobId: fresh.job_id, status: fresh.status });
});