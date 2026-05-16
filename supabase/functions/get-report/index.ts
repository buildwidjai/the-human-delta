// Edge Function: get-report
// Free retrieval of a previously-generated report.
// Auth model: caller must present BOTH the public report ID (e.g. HD-2026-AB7K2X)
// AND the SHA-256 hash of the email used at generation time. Both must match
// the row exactly. No payment is required — the user already paid when the
// report was generated.
//
// Returns the same `{ report, meta }` shape as generate-leadership-report so
// the existing Report.tsx renderer can display it without changes.

import { z } from "https://esm.sh/zod@3.23.8";
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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const BodySchema = z.object({
  reportId: z.string().min(3).max(64),
  hashedEmail: z.string().regex(/^[a-f0-9]{64}$/, "hashedEmail must be a 64-char SHA-256 hex digest"),
});

const ListBodySchema = z.object({
  hashedEmail: z.string().regex(/^[a-f0-9]{64}$/),
  list: z.literal(true),
});

function deriveTier(overall: number): string {
  if (overall >= 80) return "Tier 1: Architect";
  if (overall >= 65) return "Tier 2: Operator";
  if (overall >= 45) return "Tier 3: Solver";
  return "Tier 4: Subsidiser";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // ── Branch A: list all reports for a hashed email ─────────────────
  const listParsed = ListBodySchema.safeParse(raw);
  if (listParsed.success) {
    const { data, error } = await sb
      .from("temr_audit_logs")
      .select("public_report_id, created_at, archetype, computed_scores, demographic_data, demographics")
      .eq("hashed_email", listParsed.data.hashedEmail)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return json({ error: "Lookup failed" }, 500);
    const reports = (data ?? []).filter((r) => r.public_report_id).map((r) => ({
      reportId: r.public_report_id as string,
      generatedAt: r.created_at as string,
      archetype: (r.archetype as string | null) ?? null,
      clientName:
        ((r.demographic_data as Record<string, unknown> | null)?.clientName as string | undefined) ??
        ((r.demographics as Record<string, unknown> | null)?.clientName as string | undefined) ??
        null,
      pillarScores: (r.computed_scores as Record<string, number> | null) ?? null,
    }));
    return json({ reports });
  }

  // ── Branch B: fetch a single report by id + hashed email ──────────
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const { reportId, hashedEmail } = parsed.data;

  const { data: rows, error } = await sb
    .from("temr_audit_logs")
    .select(
      "public_report_id, hashed_email, status, llm_output_raw, llm_input, computed_scores, trait_scores, archetype, primary_pillar, secondary_pillar, lowest_pillar, demographic_data, demographics",
    )
    .eq("public_report_id", reportId)
    .eq("hashed_email", hashedEmail)
    .eq("status", "completed")
    .limit(1);

  if (error) return json({ error: "Lookup failed" }, 500);
  // Return 404 for both "wrong id" and "wrong email" so we don't confirm
  // whether a given report ID exists for someone else.
  if (!rows || rows.length === 0) return json({ error: "Report not found" }, 404);

  const row = rows[0] as Record<string, any>;

  // Reconstruct the report JSON from llm_output_raw (the cleaned text the
  // LLM returned). Re-running the same JSON-parse path the generator uses.
  let report: Record<string, any> | null = null;
  try {
    const cleaned = String(row.llm_output_raw ?? "")
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    const body = first !== -1 && last > first ? cleaned.slice(first, last + 1) : cleaned;
    report = JSON.parse(body);
  } catch {
    return json({ error: "Stored report is corrupt" }, 500);
  }

  const scores = (row.computed_scores as Record<string, number> | null) ?? { T: 0, E: 0, M: 0, R: 0 };
  const overall = Math.round(((scores.T ?? 0) + (scores.E ?? 0) + (scores.M ?? 0) + (scores.R ?? 0)) / 4);
  const demo = (row.demographic_data ?? row.demographics ?? {}) as Record<string, any>;

  return json({
    report,
    meta: {
      pillarScores: scores,
      overall,
      archetype: row.archetype ?? "",
      primary: row.primary_pillar ?? "T",
      secondary: row.secondary_pillar ?? "T",
      lowest: row.lowest_pillar ?? "T",
      tierLevel: deriveTier(overall),
      clientName: demo.clientName ?? "",
      industry: demo.industry ?? null,
      reportId: row.public_report_id ?? reportId,
    },
  });
});