-- Transaction-level audit log (one row per report generation run)
CREATE TABLE public.transaction_audit_logs (
  audit_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id TEXT,
  session_id TEXT,
  hashed_email TEXT,

  report_generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- demographics WITHOUT name / email
  demographics JSONB,

  -- archetype + pillar scores combined
  archetype_scores JSONB,

  -- LLM details
  llm_model TEXT,
  llm_request_id TEXT,
  llm_transaction_status TEXT,
  llm_input_prompt JSONB,
  llm_input_tokens INTEGER,
  llm_output JSONB,
  llm_output_tokens INTEGER,
  llm_duration_ms BIGINT,

  -- Retry tracking (max 2 retries after the original attempt)
  retry_count INTEGER NOT NULL DEFAULT 0,
  successful_retry_number INTEGER,
  llm_generation_status TEXT,

  -- Overall run
  final_transaction_status TEXT,
  total_duration_ms BIGINT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  CONSTRAINT transaction_audit_logs_retry_count_chk CHECK (retry_count BETWEEN 0 AND 2),
  CONSTRAINT transaction_audit_logs_successful_retry_chk CHECK (successful_retry_number IS NULL OR successful_retry_number BETWEEN 0 AND 2)
);

CREATE INDEX idx_transaction_audit_logs_report_id ON public.transaction_audit_logs(report_id);
CREATE INDEX idx_transaction_audit_logs_session_id ON public.transaction_audit_logs(session_id);
CREATE INDEX idx_transaction_audit_logs_generated_at ON public.transaction_audit_logs(report_generated_at DESC);

ALTER TABLE public.transaction_audit_logs ENABLE ROW LEVEL SECURITY;

-- Lock down to service role only (matches temr_audit_logs posture)
CREATE POLICY "deny_anon_all" ON public.transaction_audit_logs
  AS RESTRICTIVE FOR ALL TO anon
  USING (false) WITH CHECK (false);

CREATE POLICY "deny_authenticated_all" ON public.transaction_audit_logs
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

CREATE TRIGGER update_transaction_audit_logs_updated_at
BEFORE UPDATE ON public.transaction_audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();