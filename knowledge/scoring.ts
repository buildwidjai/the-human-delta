// Pillar scoring — 1–5 raw answers (with reverse-scoring) → 0–100 per pillar.
// Used by both the client (preview/derivation) and the report edge function.

import { gameSections, REVERSE_SCORED_IDS } from "./questionnaire.ts";
import { PILLAR_BY_NAME, type Pillar, type TemrScores } from "./pillars.ts";

export function computePillarScores(
  answers: Record<number, number>,
): TemrScores {
  const out: TemrScores = { T: 0, E: 0, M: 0, R: 0 };
  for (const section of gameSections) {
    const letter = PILLAR_BY_NAME[section.pillar];
    if (!letter) continue;
    const all = [...section.foundational, ...section.probes];
    const values = all
      .map((q) => {
        const raw = answers[q.id];
        if (typeof raw !== "number") return null;
        return REVERSE_SCORED_IDS.includes(q.id) ? 6 - raw : raw;
      })
      .filter((v): v is number => v !== null);
    if (!values.length) continue;
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    out[letter] = Math.max(0, Math.min(100, Math.round(((avg - 1) / 4) * 100)));
  }
  return out;
}

export type { Pillar, TemrScores };