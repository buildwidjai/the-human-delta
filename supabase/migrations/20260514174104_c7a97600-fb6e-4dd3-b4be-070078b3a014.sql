
CREATE TABLE public.report_jobs (
  job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  assessment_id text,
  payment_token text,
  payment_transaction_id text,
  is_reattempt boolean NOT NULL DEFAULT false,
  hashed_email text,
  email_encrypted text,
  client_name text,
  llm_input jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempt_count int NOT NULL DEFAULT 0,
  last_llm_error text,
  report_id text,
  llm_output jsonb,
  email_status text NOT NULL DEFAULT 'not_sent',
  email_attempt_count int NOT NULL DEFAULT 0,
  last_email_error text,
  locked_at timestamptz,
  locked_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT report_jobs_status_chk CHECK (status IN ('pending','processing','success','failed')),
  CONSTRAINT report_jobs_email_status_chk CHECK (email_status IN ('not_sent','sending','sent','email_failed'))
);

CREATE INDEX report_jobs_fifo_idx ON public.report_jobs (status, created_at) WHERE status = 'pending';
CREATE INDEX report_jobs_terminal_email_idx ON public.report_jobs (status, email_status, created_at)
  WHERE status IN ('success','failed') AND email_status IN ('not_sent','email_failed');

ALTER TABLE public.report_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY deny_anon_all ON public.report_jobs AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_all ON public.report_jobs AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE TRIGGER report_jobs_updated_at
BEFORE UPDATE ON public.report_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic FIFO claim: oldest pending OR previously processing/email-pending job
-- whose lease has expired (>5 min) OR a terminal job whose email still needs sending.
CREATE OR REPLACE FUNCTION public.claim_next_report_job(_worker_id text)
RETURNS SETOF public.report_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.report_jobs j
  SET    status = CASE WHEN j.status = 'pending' THEN 'processing' ELSE j.status END,
         locked_at = now(),
         locked_by = _worker_id
  WHERE  j.job_id = (
    SELECT job_id
    FROM   public.report_jobs
    WHERE  (
             (status = 'pending')
             OR (status = 'processing' AND (locked_at IS NULL OR locked_at < now() - interval '5 minutes'))
             OR (status IN ('success','failed') AND email_status IN ('not_sent','email_failed')
                 AND email_attempt_count < 2
                 AND (locked_at IS NULL OR locked_at < now() - interval '5 minutes'))
           )
    ORDER  BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT  1
  )
  RETURNING j.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_next_report_job(text) FROM PUBLIC, anon, authenticated;
