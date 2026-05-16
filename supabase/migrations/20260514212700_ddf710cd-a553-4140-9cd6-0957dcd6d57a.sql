CREATE SCHEMA IF NOT EXISTS extensions;

SELECT cron.unschedule('purge-old-audit-logs-daily');

DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'purge-old-audit-logs-daily',
  '15 3 * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://pqyjjxqlbrzmcyvqzsfh.supabase.co/functions/v1/purge-old-audit-logs',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxeWpqeHFsYnJ6bWN5dnF6c2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMjkxMzcsImV4cCI6MjA5MTgwNTEzN30.WnU1h71b60ufpwDNFVjOIe2IRalav0gJ4OOSgn2OH0A"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  );
  $$
);