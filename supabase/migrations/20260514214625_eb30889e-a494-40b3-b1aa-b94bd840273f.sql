ALTER TABLE public.transaction_audit_logs
  ADD COLUMN IF NOT EXISTS test_run boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS error_details text,
  ADD COLUMN IF NOT EXISTS llm_error_details text;