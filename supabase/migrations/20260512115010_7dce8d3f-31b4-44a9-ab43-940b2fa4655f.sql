
-- 1. Add new columns (nullable to preserve existing rows)
ALTER TABLE public.temr_audit_logs
  ADD COLUMN IF NOT EXISTS hashed_email TEXT,
  ADD COLUMN IF NOT EXISTS llm_input JSONB,
  ADD COLUMN IF NOT EXISTS demographic_data JSONB;

-- 2. Indexes for fast retrieval by hashed email
CREATE INDEX IF NOT EXISTS idx_temr_audit_logs_hashed_email
  ON public.temr_audit_logs (hashed_email);

CREATE INDEX IF NOT EXISTS idx_temr_audit_logs_hashed_email_created_at
  ON public.temr_audit_logs (hashed_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_temr_audit_logs_public_report_id
  ON public.temr_audit_logs (public_report_id);

-- 3. Explicit deny policies for anon + authenticated roles.
-- Service role (used by edge functions) bypasses RLS, so the backend
-- continues to work. This prevents accidental future policies from
-- exposing sensitive demographic / questionnaire data.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'temr_audit_logs'
      AND policyname = 'deny_anon_all'
  ) THEN
    CREATE POLICY deny_anon_all ON public.temr_audit_logs
      AS RESTRICTIVE FOR ALL TO anon
      USING (false) WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'temr_audit_logs'
      AND policyname = 'deny_authenticated_all'
  ) THEN
    CREATE POLICY deny_authenticated_all ON public.temr_audit_logs
      AS RESTRICTIVE FOR ALL TO authenticated
      USING (false) WITH CHECK (false);
  END IF;
END$$;

-- 4. Storage RLS for the private `pivot-reports` bucket.
-- Deny direct object access from anon / authenticated; only signed URLs
-- minted server-side via the service role can reach the files.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'pivot_reports_deny_anon'
  ) THEN
    CREATE POLICY pivot_reports_deny_anon ON storage.objects
      AS RESTRICTIVE FOR ALL TO anon
      USING (bucket_id <> 'pivot-reports')
      WITH CHECK (bucket_id <> 'pivot-reports');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'pivot_reports_deny_authenticated'
  ) THEN
    CREATE POLICY pivot_reports_deny_authenticated ON storage.objects
      AS RESTRICTIVE FOR ALL TO authenticated
      USING (bucket_id <> 'pivot-reports')
      WITH CHECK (bucket_id <> 'pivot-reports');
  END IF;
END$$;
