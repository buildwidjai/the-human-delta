-- COSTAR audit log table for The Human Delta report engine.
-- Stores one row per report-generation attempt (pre-LLM, post-LLM dispatch, post-completion).

CREATE TABLE public.temr_audit_logs (
  audit_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_audit_id       UUID NULL REFERENCES public.temr_audit_logs(audit_id) ON DELETE SET NULL,
  session_id            TEXT NULL,
  status                TEXT NOT NULL DEFAULT 'in_progress',
  system_prompt_version TEXT NOT NULL,
  system_prompt_sha256  TEXT NULL,

  -- Timing (ms since unix epoch where useful, ms durations elsewhere)
  assembler_start_ms    BIGINT NULL,
  assembler_end_ms      BIGINT NULL,
  llm_request_sent_ms   BIGINT NULL,
  llm_first_token_ms    BIGINT NULL,
  llm_response_end_ms   BIGINT NULL,
  total_duration_ms     BIGINT NULL,

  -- Inputs
  demographics          JSONB NULL,
  raw_responses         JSONB NULL,
  computed_scores       JSONB NULL,
  trait_scores          JSONB NULL,
  archetype             TEXT NULL,
  primary_pillar        TEXT NULL,
  secondary_pillar      TEXT NULL,
  lowest_pillar         TEXT NULL,
  kb_files_selected     JSONB NULL,
  kb_total_chars        INTEGER NULL,

  -- Prompt + LLM
  user_prompt_full      TEXT NULL,
  user_prompt_tokens    INTEGER NULL,
  llm_model             TEXT NULL,
  llm_output_raw        TEXT NULL,
  llm_input_tokens      INTEGER NULL,
  llm_output_tokens     INTEGER NULL,
  llm_parse_success     BOOLEAN NULL,
  llm_parse_error       TEXT NULL,

  -- Post-processing
  bias_flags            JSONB NULL,
  glossary_flags        JSONB NULL,
  output_validated      BOOLEAN NULL,
  validation_errors     JSONB NULL,

  -- Final status
  report_delivered      BOOLEAN NULL,
  error_code            TEXT NULL,
  error_message         TEXT NULL,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_temr_audit_logs_session  ON public.temr_audit_logs(session_id);
CREATE INDEX idx_temr_audit_logs_created  ON public.temr_audit_logs(created_at DESC);
CREATE INDEX idx_temr_audit_logs_archetype ON public.temr_audit_logs(archetype);
CREATE INDEX idx_temr_audit_logs_delivered ON public.temr_audit_logs(report_delivered);

ALTER TABLE public.temr_audit_logs ENABLE ROW LEVEL SECURITY;

-- No public client policies. Service-role only (edge functions).
-- An explicit deny-by-default posture is achieved by NOT creating any policies.
-- Service role bypasses RLS, so the edge function can still write.

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_temr_audit_logs_updated_at
BEFORE UPDATE ON public.temr_audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();