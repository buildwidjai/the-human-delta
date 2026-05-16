## Goal

Stop offering the report as a download. After payment we enqueue a job, a sequential worker (FIFO, one at a time) generates the report (3 LLM attempts max, unchanged), then emails the rendered narrative to the address captured at payment using Strato SMTP. Exactly one email per generation event (success or failure). Raw email lives only inside the queue row, encrypted, and is wiped after dispatch.

## Required secrets (you must add before the queue worker can send)

- `SMTP_HOST` = `smtp.strato.com`
- `SMTP_PORT` = `465` (SSL) — confirm if you use STARTTLS on 587 instead
- `SMTP_USER` = `performance@thehumandelta.com`
- `SMTP_PASSWORD` = your Strato mailbox password
- `REPORT_EMAIL_ENCRYPTION_KEY` = a 32-byte base64 key (used to AES-GCM encrypt raw emails at rest in `report_jobs.email_encrypted`)

I'll prompt for these via `add_secret` once the plan is approved.

## 1. Database schema (new migration)

New table `report_jobs` (the persistent FIFO queue):

- `job_id uuid PK`
- `session_id text` — browser session
- `assessment_id text`
- `payment_token text` — the HMAC token from mint-report-token (so worker can re-verify)
- `payment_transaction_id text`
- `is_reattempt boolean default false`
- `hashed_email text` — for record linkage
- `email_encrypted text` — AES-GCM(iv||ciphertext||tag), base64; nulled after dispatch
- `client_name text` — needed for the email greeting/subject
- `llm_input jsonb` — full request body snapshot for `generate-leadership-report` (so retries use identical input)
- `status text default 'pending'` — `pending | processing | success | failed`
- `attempt_count int default 0` — LLM attempts (max 3)
- `last_llm_error text`
- `report_id text` — populated after a successful run
- `llm_output jsonb` — cached narrative used to render the email body
- `email_status text default 'not_sent'` — `not_sent | sending | sent | email_failed`
- `email_attempt_count int default 0` — max 2 retries on SMTP failure
- `last_email_error text`
- `locked_at timestamptz` / `locked_by text` — worker lease (5 min TTL)
- `created_at`, `updated_at timestamptz`

RLS: deny anon + authenticated (service role only, same pattern as `transaction_audit_logs`).

Index: `(status, created_at)` for FIFO claim.

A SQL helper `claim_next_report_job(worker_id text)` runs `UPDATE … WHERE job_id = (SELECT … FOR UPDATE SKIP LOCKED ORDER BY created_at LIMIT 1) RETURNING *` to atomically lease one job. This guarantees only one worker processes a job at a time even if two invocations race.

## 2. Edge functions

**`enqueue-report-job` (new)** — called from the browser after payment. Inputs: everything currently sent to `generate-leadership-report` PLUS the raw email. Verifies the payment token (same logic), encrypts the email with `REPORT_EMAIL_ENCRYPTION_KEY`, inserts a `pending` row, then fires off `process-report-queue` (`fetch` w/ `waitUntil`-style fire-and-forget) so the worker starts immediately. Returns `{ jobId }`.

**`process-report-queue` (new — the worker)**
1. `claim_next_report_job` — if nothing claimed, exit.
2. If `attempt_count < 3`: call the existing internal report generator helper with the cached `llm_input`. On success, persist `llm_output`, `report_id`, set `status = 'success'`. On failure, increment `attempt_count`; if still < 3, mark back to `pending` and re-invoke worker; if = 3, set `status = 'failed'`.
3. Once `status` is terminal: idempotency guard — only send if `email_status IN ('not_sent','email_failed')`. Decrypt email, build success or failure HTML, send via `denomailer` against Strato. On send success: set `email_status='sent'`, `email_encrypted=NULL`. On SMTP error: increment `email_attempt_count`, retry up to 2 times (re-invoke worker after short delay), then `email_status='email_failed'` and still null the email.
4. Recursively `fetch` itself to process the next pending job (FIFO continues until queue empty).

The existing `generate-leadership-report` logic (scoring, archetype, Gemini, audit logs, 3-attempt retry knob — bumped from 2 to 3 per spec) is refactored into a shared `_shared/report-engine.ts` so both the worker and any legacy direct call can use it. Each LLM attempt uses identical `llm_input` (already does).

**SMTP module (`_shared/smtp.ts`)** — thin wrapper around `denomailer` (Deno-native; nodemailer is Node-only and won't run in edge functions). Reads `SMTP_*` env vars, sends with `from: "Human Delta <performance@thehumandelta.com>"`.

**Email templates (`_shared/email-templates.ts`)** — two HTML templates with plain-text fallbacks:
- *Success*: navy/gold Human Delta brand, greeting by `client_name`, the rendered narrative inline (15 sections of the V12.4 report → branded HTML), report ID, signature.
- *Failure*: empathetic apology, payment-safe assurance, CTA back to `https://www.thehumandelta.com/questionnaire?reattempt=1` to re-run at no charge.

## 3. Frontend changes

- `src/pages/CheckoutReturn.tsx` — after minting the payment token, also POST to `enqueue-report-job` with the raw email + snapshot, then navigate to a new `/report-pending` confirmation page.
- New `src/pages/ReportPending.tsx` — "Your report is on its way to <email>. It typically arrives within 2–3 minutes. If it doesn't, check spam or contact support." No download button, no polling needed.
- `src/pages/Report.tsx` — keep the **free retrieval path** (`?id=…&hash=…`) so users who already have a report ID can still view it, but **remove the post-payment generation path and the Download PDF button**. The brand-new flow doesn't render the report on screen at all post-payment; it's email-only.
- Strip `handleDownload`, `renderReportPdf` import, and the Download CTA from `ReportBody`.
- Capture the raw email in sessionStorage at the questionnaire/info-capture step (it's already collected — I'll verify and pass it through `enqueue-report-job`).
- Update `App.tsx` route table for `/report-pending`.

## 4. Invariants enforced

| Rule | Enforcement |
|---|---|
| Exactly one email per generation event | `email_status` checked inside `claim_next_report_job` flow before every send |
| Raw email cleared after send | `email_encrypted = NULL` set in same UPDATE that flips `email_status` to `sent` / `email_failed` |
| Raw email never in reports tables | Only column is `report_jobs.email_encrypted`; `temr_audit_logs` / `transaction_audit_logs` unchanged |
| FIFO, one job at a time | `FOR UPDATE SKIP LOCKED ORDER BY created_at ASC LIMIT 1` in claim function |
| Next job after current completes | Worker recursively invokes itself only after current job's email step finishes |
| 3 LLM retries, identical input | Cached `llm_input` jsonb reused per attempt; `attempt_count` capped at 3 |
| SMTP creds never hardcoded | All read via `Deno.env.get` |
| Failure email includes re-submission CTA | Template links to `https://www.thehumandelta.com/questionnaire?reattempt=1` |

## 5. Out of scope / preserved

- Stripe checkout, webhook, `mint-report-token`, payment-gate, session/audit logic — untouched.
- `/my-reports` retrieval and `?id=&hash=` viewing — kept (it's free retrieval, not the new email path).
- Existing `generate-leadership-report` function stays callable for the dev-bypass QA flow; it just delegates to the shared engine.

## Open question (one)

Strato SMTP usually accepts SSL on port 465 — confirm that's correct, or tell me you use STARTTLS on 587.

After you approve I'll: request the 5 secrets, run the migration, write the two edge functions + shared helpers, gut the download UI, and add `/report-pending`.