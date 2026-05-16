
ALTER TABLE public.transaction_audit_logs
  ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS llm_input JSONB,
  ADD COLUMN IF NOT EXISTS is_reattempt BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_txn_audit_email_session
  ON public.transaction_audit_logs (hashed_email, session_id);

CREATE INDEX IF NOT EXISTS idx_txn_audit_email_generated_at
  ON public.transaction_audit_logs (hashed_email, report_generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_txn_audit_payment_lookup
  ON public.transaction_audit_logs (hashed_email, session_id, payment_transaction_id)
  WHERE payment_transaction_id IS NOT NULL;
