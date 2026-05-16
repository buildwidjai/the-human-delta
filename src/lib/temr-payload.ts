import { gameSections, REVERSE_SCORED_IDS, type GameSection } from "./questionnaire-data";

// The temr-report edge function expects 20 responses ordered T, E, M, R
// (5 foundational answers per pillar). Our questionnaire collects 32 answers
// (5 foundational + 3 probes per pillar) and stores them by question id.
//
// Mapping rules:
//   1. Take ONLY the 5 foundational questions per pillar (probes are bonus
//      diagnostics, not part of the core TEMR score).
//   2. Apply reverse-scoring (6 - value) for ids in REVERSE_SCORED_IDS so the
//      raw integer can be summed directly by the engine.
//   3. Re-order pillars to TEMR (Tactical, Emotional, Mental, Relational).

const PILLAR_ORDER = ["Tactical", "Emotional", "Mental", "Relational"] as const;

function findSection(pillarName: string): GameSection {
  const section = gameSections.find((g) => g.pillar === pillarName);
  if (!section) throw new Error(`Missing pillar section: ${pillarName}`);
  return section;
}

export function buildTemrResponses(answers: Record<number, number>): number[] {
  const responses: number[] = [];
  for (const pillarName of PILLAR_ORDER) {
    const section = findSection(pillarName);
    for (const q of section.foundational) {
      const raw = answers[q.id];
      if (raw === undefined) {
        throw new Error(`Missing answer for question ${q.id} (${pillarName})`);
      }
      const scored = REVERSE_SCORED_IDS.includes(q.id) ? 6 - raw : raw;
      responses.push(scored);
    }
  }
  return responses;
}

// ── V12.2 answer payload ────────────────────────────────────────────
// The V12.2 engine wants per-answer metadata (pillar, trait, reverse flag,
// raw value) so it can compute trait-level scores and feed them to Gemini.
const PILLAR_LETTER: Record<string, "T" | "E" | "M" | "R"> = {
  Tactical: "T",
  Emotional: "E",
  Mental: "M",
  Relational: "R",
};

function shortTrait(text: string): string {
  // Take the first ~6 meaningful words, strip leading "I ", title-case-ish.
  const trimmed = text.replace(/^I\s+/i, "").replace(/[.,;:].*$/, "");
  const words = trimmed.split(/\s+/).slice(0, 6).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export interface V12Answer {
  id: number;
  pillar: "T" | "E" | "M" | "R";
  trait: string;
  value: number;
  reverse: boolean;
}

export function buildV12Answers(answers: Record<number, number>): V12Answer[] {
  const out: V12Answer[] = [];
  for (const section of gameSections) {
    const letter = PILLAR_LETTER[section.pillar];
    if (!letter) continue;
    for (const q of [...section.foundational, ...section.probes]) {
      const v = answers[q.id];
      if (typeof v !== "number") continue;
      out.push({
        id: q.id,
        pillar: letter,
        trait: shortTrait(q.text),
        value: v,
        reverse: REVERSE_SCORED_IDS.includes(q.id),
      });
    }
  }
  return out;
}

export interface AssessmentSnapshot {
  assessmentId: string;
  userName: string;
  userRole: string;
  email?: string;
  answers: Record<number, number>;
  // New demographic fields collected at the info-capture step.
  // All four are required at submission time, but kept optional in the type
  // so older snapshots (pre-rollout) still parse without crashing.
  gender?: string;            // "Male" | "Female" | "Other"
  ageRange?: string;          // e.g. "28-35"
  experienceRange?: string;   // e.g. "4-7"
  industry?: string;          // free-text industry / sector
  // SHA-256 of the user's email (lowercase hex). Computed client-side
  // before saving — the raw email is never persisted to storage or DB.
  hashedEmail?: string;
}

const STORAGE_KEY = "hdelta_pending_assessment";
const REPORT_TOKEN_KEY = "hdelta_report_payment_token";

function readStoredJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  // Tab-scoped only — see src/lib/session.ts. Reading from localStorage
  // here would let a new tab inherit another tab's pending assessment
  // and overwrite it on save.
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

export function savePendingAssessment(snapshot: AssessmentSnapshot): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function loadPendingAssessment(): AssessmentSnapshot | null {
  return readStoredJson<AssessmentSnapshot>(STORAGE_KEY);
}

export function clearPendingAssessment(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  // Sweep any legacy cross-tab value.
  window.localStorage.removeItem(STORAGE_KEY);
}

// ── Report payment token ─────────────────────────────────────────────
// After the user completes the hosted Stripe Payment Link, the
// /checkout/return page mints a short-lived signed token and stores it
// here. /report reads it and passes it to the temr-report edge function,
// which verifies the HMAC + TTL before scoring + narrating.
export function saveReportPaymentToken(token: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(REPORT_TOKEN_KEY, token);
}

export function loadReportPaymentToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(REPORT_TOKEN_KEY);
}

export function clearReportPaymentToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(REPORT_TOKEN_KEY);
  // Sweep any legacy cross-tab value.
  window.localStorage.removeItem(REPORT_TOKEN_KEY);
}

export function newAssessmentId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `a_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ── Local report locator cache ───────────────────────────────────────
// After a report is generated we stash {reportId, hashedEmail} locally
// so the user can retrieve their past reports for free from /my-reports
// without having to remember the report ID.
const REPORT_LOCATORS_KEY = "hdelta_report_locators";

export interface ReportLocator {
  reportId: string;
  hashedEmail: string;
  clientName?: string;
  generatedAt: string; // ISO
}

export function loadReportLocators(): ReportLocator[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(REPORT_LOCATORS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ReportLocator[]) : [];
  } catch {
    return [];
  }
}

export function rememberReportLocator(loc: ReportLocator): void {
  if (typeof window === "undefined") return;
  const existing = loadReportLocators().filter((l) => l.reportId !== loc.reportId);
  existing.unshift(loc);
  window.localStorage.setItem(
    REPORT_LOCATORS_KEY,
    JSON.stringify(existing.slice(0, 25)),
  );
}