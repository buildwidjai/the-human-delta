import { supabase } from "@/integrations/supabase/client";
import type { V12Answer } from "@/lib/temr-payload";

export interface TemrScores { T: number; E: number; M: number; R: number }

export type ArchetypeKey =
  | "operational_strategist" | "dynamic_catalyst" | "collaborative_pilot"
  | "cultural_architect" | "strategic_diplomat" | "creative_visionary"
  | "systemic_thinker" | "empathetic_driver" | "relational_leader"
  | "resilient_fixer" | "precision_specialist" | "strategic_operator";

export const ARCHETYPE_LABELS: Record<ArchetypeKey, string> = {
  operational_strategist: "Operational Strategist",
  dynamic_catalyst: "Dynamic Catalyst",
  collaborative_pilot: "Collaborative Pilot",
  cultural_architect: "Cultural Architect",
  strategic_diplomat: "Strategic Diplomat",
  creative_visionary: "Creative Visionary",
  systemic_thinker: "Systemic Thinker",
  empathetic_driver: "Empathetic Driver",
  relational_leader: "Relational Leader",
  resilient_fixer: "Resilient Fixer",
  precision_specialist: "Precision Specialist",
  strategic_operator: "Strategic Operator",
};

// ── V12.4 Leadership Report — 15-section schema ──────────────────────
export interface ReportBottleneck {
  title: string;
  why: string;
  observable: string;
  performance_tax: string;
  the_win: string;
}

export interface ReportHabit { name: string; impact: string; script: string; why?: string }

export interface ReportTopTrait { name: string; score: number; warning: string }

export interface LeadershipReportV124 {
  metadata: {
    archetype: string;
    archetype_key: ArchetypeKey;
    delta_score: number;
    primary_pillar: "T" | "E" | "M" | "R";
    anchor_signal: string;
  };
  sec_01:   { context: string; headline: string; insight: string; hidden_cost: string; long_term_cost: string };
  sec_01_5: { context: string; headline: string; logic: string };
  sec_02:   { context: string; three_bullets: string[]; pivot_logic: string };
  sec_03: ReportBottleneck;
  sec_04: ReportBottleneck;
  sec_05: ReportBottleneck;
  sec_06: ReportBottleneck;
  sec_07:   { context: string; letting_go: string[]; gaining: string[] };
  sec_08:   { context: string; strengths: string; tax_logic: string; top_traits: ReportTopTrait[] };
  sec_09: ReportHabit[];
  sec_10:   { context: string; m1: string; m1_focus: string; m1_human_shift: string; m1_ai: string; m2: string; m2_focus: string; m2_human_shift: string; m2_ai: string; m3: string; m3_focus: string; m3_human_shift: string; m3_ai: string };
  sec_11:   { context: string; memo: string; logic: string };
  sec_12:   { context: string; metric: string; target: string };
  sec_13:   { choice: string; command: string };
  sec_14:   { context: string; gravity: string; strategy: string };
  sec_15:   { scientific_framing: string; disclaimer: string };
}

export interface ReportMeta {
  pillarScores: TemrScores;
  overall: number;
  archetype: string;
  primary: "T" | "E" | "M" | "R";
  secondary: "T" | "E" | "M" | "R";
  lowest: "T" | "E" | "M" | "R";
  tierLevel: string;
  clientName: string;
  industry: string | null;
  reportId?: string;
}

export interface GenerateReportPayload {
  paymentToken?: string;
  assessmentId: string;
  /** Browser-session UUID — used by the payment gate for free re-attempts. */
  sessionId?: string;
  /** Set true to inherit a prior payment after a failed LLM run. */
  reattempt?: boolean;
  clientName: string;
  position?: string;
  ageRange?: string;
  experienceRange?: string;
  experienceYears?: number;
  gender?: string;
  industry?: string;
  /** SHA-256 hex of the user's email. Required for free retrieval later. */
  hashedEmail?: string;
  answers: V12Answer[];
}

export interface GenerateReportResponse {
  report: LeadershipReportV124;
  meta: ReportMeta;
}

export async function generateUserReport(
  payload: GenerateReportPayload,
): Promise<GenerateReportResponse> {
  // Use raw fetch so we can surface the JSON error body — `functions.invoke`
  // hides non-2xx response bodies behind a generic
  // "Edge Function returned a non-2xx status code" message, which makes
  // billing/quota issues invisible to the user.
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-leadership-report`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  const data: unknown = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const detail =
      (data as { error?: unknown })?.error;
    const msg =
      typeof detail === "string"
        ? detail
        : detail
          ? JSON.stringify(detail)
          : `HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return data as GenerateReportResponse;
}
