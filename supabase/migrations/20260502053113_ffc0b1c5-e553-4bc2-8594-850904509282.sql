
-- 1. Private storage bucket for V11.2 narrative JSON
INSERT INTO storage.buckets (id, name, public)
VALUES ('pivot-reports', 'pivot-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Service role only (no public policies). Keep bucket fully private —
-- the test flow accesses files via signed URLs minted server-side.

-- 2. Optional PDF / narrative metadata columns on the audit log
ALTER TABLE public.temr_audit_logs
  ADD COLUMN IF NOT EXISTS narrative_storage_path text,
  ADD COLUMN IF NOT EXISTS narrative_file_size_bytes integer,
  ADD COLUMN IF NOT EXISTS narrative_uploaded_at    timestamptz,
  ADD COLUMN IF NOT EXISTS pdf_download_url         text;
