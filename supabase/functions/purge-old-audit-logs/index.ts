// Edge function: purge-old-audit-logs
// GDPR Art. 5(1)(e) "storage limitation" enforcement.
// Deletes rows from temr_audit_logs and transaction_audit_logs older
// than the retention window (default: 24 months / 2 years).
// Invoked on a daily pg_cron schedule. Also callable manually with a
// shared secret header for ops.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (h: (req: Request) => Response | Promise<Response>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RETENTION_MONTHS = 24; // 2 years

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth gate: require Bearer <SERVICE_ROLE_KEY>. The pg_cron job already
  // sends this header; no other caller should be able to trigger deletion.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const presented = req.headers.get("authorization") ?? "";
  if (!serviceKey || presented !== `Bearer ${serviceKey}`) {
    return json({ error: "Forbidden" }, 403);
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
  const cutoffIso = cutoff.toISOString();

  const results: Record<string, number | string> = { cutoff: cutoffIso };

  // 1) Purge temr_audit_logs and any associated narrative storage paths.
  try {
    const { data: stale } = await sb
      .from("temr_audit_logs")
      .select("audit_id, narrative_storage_path")
      .lt("created_at", cutoffIso)
      .limit(5000);
    const paths = (stale ?? [])
      .map((r) => (r as { narrative_storage_path: string | null }).narrative_storage_path)
      .filter((p): p is string => typeof p === "string" && p.length > 0);
    if (paths.length > 0) {
      await sb.storage.from("pivot-reports").remove(paths);
      results.storage_objects_removed = paths.length;
    }
  } catch (err) {
    console.error("[purge] storage step failed:", (err as Error).message);
  }

  const { count: temrCount, error: temrErr } = await sb
    .from("temr_audit_logs")
    .delete({ count: "exact" })
    .lt("created_at", cutoffIso);
  if (temrErr) {
    console.error("[purge] temr_audit_logs delete failed:", temrErr.message);
    return json({ error: "Purge failed" }, 500);
  }
  results.temr_audit_logs = temrCount ?? 0;

  // 2) Purge transaction_audit_logs.
  const { count: txCount, error: txErr } = await sb
    .from("transaction_audit_logs")
    .delete({ count: "exact" })
    .lt("created_at", cutoffIso);
  if (txErr) {
    console.error("[purge] transaction_audit_logs delete failed:", txErr.message);
    return json({ error: "Purge failed" }, 500);
  }
  results.transaction_audit_logs = txCount ?? 0;

  // 3) Purge terminal report_jobs older than retention window.
  const { count: jobCount, error: jobErr } = await sb
    .from("report_jobs")
    .delete({ count: "exact" })
    .lt("created_at", cutoffIso);
  if (jobErr) {
    console.error("[purge] report_jobs delete failed:", jobErr.message);
  } else {
    results.report_jobs = jobCount ?? 0;
  }

  console.log("[purge] done:", JSON.stringify(results));
  return json({ ok: true, ...results });
});