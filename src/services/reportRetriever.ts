import type { GenerateReportResponse } from "@/services/reportGenerator";

const URL_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-report`;
const HEADERS = {
  "Content-Type": "application/json",
  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
};

export interface ReportSummary {
  reportId: string;
  generatedAt: string;
  archetype: string | null;
  clientName: string | null;
  pillarScores: Record<string, number> | null;
}

export async function fetchReport(
  reportId: string,
  hashedEmail: string,
): Promise<GenerateReportResponse> {
  const resp = await fetch(URL_BASE, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ reportId, hashedEmail }),
  });
  const data: unknown = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = (data as { error?: unknown })?.error;
    throw new Error(typeof err === "string" ? err : `HTTP ${resp.status}`);
  }
  return data as GenerateReportResponse;
}

export async function listReports(hashedEmail: string): Promise<ReportSummary[]> {
  const resp = await fetch(URL_BASE, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ hashedEmail, list: true }),
  });
  const data: unknown = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = (data as { error?: unknown })?.error;
    throw new Error(typeof err === "string" ? err : `HTTP ${resp.status}`);
  }
  return (data as { reports?: ReportSummary[] }).reports ?? [];
}