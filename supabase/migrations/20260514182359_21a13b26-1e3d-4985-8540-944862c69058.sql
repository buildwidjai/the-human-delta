ALTER TABLE public.transaction_audit_logs
  ADD COLUMN IF NOT EXISTS email_request_id uuid,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS email_sent_success boolean;