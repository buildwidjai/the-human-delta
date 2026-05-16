ALTER TABLE public.transaction_audit_logs
  ADD COLUMN IF NOT EXISTS payment_error_code text,
  ADD COLUMN IF NOT EXISTS payment_error_message text,
  ADD COLUMN IF NOT EXISTS payment_request_id text,
  ADD COLUMN IF NOT EXISTS payment_success boolean,
  ADD COLUMN IF NOT EXISTS payment_completed_at timestamp with time zone;