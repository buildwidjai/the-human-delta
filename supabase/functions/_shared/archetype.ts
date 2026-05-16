// The 12 archetype variants — single source of truth shared by:
//   • Client preview (Questionnaire results screen, ExecutivePreviewCard)
//   • Edge function `generate-leadership-report` (LLM payload + final report)
//
// CONTENTS:
//   1. ArchetypeKey + labels        — the 12 IDs and display names.
//   2. ARCHETYPE_MATRIX             — primary × secondary pillar → archetype.
//   3. deriveArchetype()            — deterministic derivation from TEMR scores.
//   4. ARCHETYPE_LIBRARY            — anchor + growth_hurdle (sent to the LLM).
//   5. ANCHOR_SIGNALS               — short tagline shown in client preview.
//   6. FORENSIC_TEASERS             — paragraph teaser shown in client preview.

import { PILLAR_ORDER, type Pillar, type TemrScores } from "./pillars.ts";

export type { Pillar, TemrScores } from "./pillars.ts";

export type ArchetypeKey =
  | "operational_strategist"
  | "dynamic_catalyst"
  | "collaborative_pilot"
  | "cultural_architect"
  | "strategic_diplomat"
  | "creative_visionary"
  | "systemic_thinker"
  | "empathetic_driver"
  | "relational_leader"
  | "resilient_fixer"
  | "precision_specialist"
  | "strategic_operator";

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

// Primary pillar × secondary pillar → archetype.
// The on-screen preview and the final PDF must always agree, so this matrix
// is the only place these mappings live.
const ARCHETYPE_MATRIX: Record<Pillar, Record<Pillar, ArchetypeKey>> = {
  T: {
    T: "operational_strategist",
    E: "empathetic_driver",
    M: "systemic_thinker",
    R: "collaborative_pilot",
  },
  E: {
    T: "resilient_fixer",
    E: "empathetic_driver",
    M: "strategic_diplomat",
    R: "relational_leader",
  },
  M: {
    T: "precision_specialist",
    E: "creative_visionary",
    M: "systemic_thinker",
    R: "strategic_diplomat",
  },
  R: {
    T: "collaborative_pilot",
    E: "relational_leader",
    M: "cultural_architect",
    R: "relational_leader",
  },
};

export interface DerivedArchetype {
  key: ArchetypeKey;
  label: string;
  primary: Pillar;
  secondary: Pillar;
  lowest: Pillar;
}

export function deriveArchetype(scores: TemrScores): DerivedArchetype {
  const ranked = PILLAR_ORDER
    .map((p) => ({ p, s: scores[p] }))
    // Stable sort: ties resolved by PILLAR_ORDER position (T → E → M → R).
    .sort((a, b) => b.s - a.s);
  const primary = ranked[0].p;
  const secondary = ranked[1].p;
  const lowest = ranked[ranked.length - 1].p;
  const key = ARCHETYPE_MATRIX[primary][secondary] ?? "strategic_operator";
  return { key, label: ARCHETYPE_LABELS[key], primary, secondary, lowest };
}

// ─────────────────────────────────────────────────────────────────────
// LLM-FACING ARCHETYPE LIBRARY
// `anchor` is used VERBATIM as sec_01.headline.
// `hurdle` is used VERBATIM as the opening of sec_01_5.logic.
// ─────────────────────────────────────────────────────────────────────
export interface ArchetypeEntry {
  label: string;
  anchor: string;
  hurdle: string;
}

export const ARCHETYPE_LIBRARY: Record<ArchetypeKey, ArchetypeEntry> = {
  operational_strategist: { label: "Operational Strategist", anchor: "Translating high-level goals into tasks, but never letting go of the pen.", hurdle: "Your unique ability to translate strategy into action is currently a manual process." },
  dynamic_catalyst:       { label: "Dynamic Catalyst",       anchor: "Moving fast and breaking things, including your own boundaries.",          hurdle: "Your high-yield performance in every area is making you too valuable to be moved out of operations." },
  collaborative_pilot:    { label: "Collaborative Pilot",    anchor: "Guiding the group toward a goal that only you can see.",                    hurdle: "Your coordination skills are currently acting as a crutch that prevents team self-governance." },
  cultural_architect:     { label: "Cultural Architect",     anchor: "Designing a great place to work, but a difficult place to scale.",          hurdle: "Your unique leadership style is currently impossible to replicate without your direct involvement." },
  strategic_diplomat:     { label: "Strategic Diplomat",     anchor: "Navigating the politics perfectly while the process falls behind.",         hurdle: "Your ability to negotiate is currently acting as a substitute for a structured team process." },
  creative_visionary:     { label: "Creative Visionary",     anchor: "Seeing the future so clearly that the present feels like a distraction.",   hurdle: "Being the only source of innovation makes you a bottleneck for team progress." },
  systemic_thinker:       { label: "Systemic Thinker",       anchor: "Building complex maps for a team that only needs a compass.",               hurdle: "Your high-level logic is currently too complex for the team to execute without your constant guidance." },
  empathetic_driver:      { label: "Empathetic Driver",      anchor: "Leading with heart but paying for the team's stress with your own energy.", hurdle: "Your empathy is currently acting as a shield that prevents the team from building their own resilience." },
  relational_leader:      { label: "Relational Leader",      anchor: "Caring for the team so much that the work becomes a personal burden.",      hurdle: "Your focus on harmony is currently protecting the team from the accountability they need to grow." },
  resilient_fixer:        { label: "Resilient Fixer",        anchor: "Solving the problem today at the cost of the process tomorrow.",            hurdle: "Your ability to fix problems is masking a lack of processes that would prevent them in the first place." },
  precision_specialist:   { label: "Precision Specialist",   anchor: "Focusing on the 'How' so deeply that the 'Why' becomes invisible.",         hurdle: "Your technical brilliance is currently preventing the team from owning their own quality standards." },
  strategic_operator:     { label: "Strategic Operator",     anchor: "Doing too much of the work. Designing too little of the system.",           hurdle: "Being the best person at doing the work is now the primary obstacle to becoming a senior leader." },
};

// ─────────────────────────────────────────────────────────────────────
// CLIENT PREVIEW NARRATIVES
// ANCHOR_SIGNALS = one-line tagline shown above the locked report preview.
// FORENSIC_TEASERS = paragraph teaser shown in the preview card.
// (Distinct from ARCHETYPE_LIBRARY.anchor — these are reader-facing, while
// the library text is sent verbatim to the LLM as report content.)
// ─────────────────────────────────────────────────────────────────────
export const ANCHOR_SIGNALS: Record<ArchetypeKey, string> = {
  operational_strategist:
    "Executing so flawlessly that the system depends on you to keep running.",
  dynamic_catalyst:
    "Igniting momentum so quickly that the team never learns to start without you.",
  collaborative_pilot:
    "Steering every conversation so smoothly that no one else builds the muscle to lead it.",
  cultural_architect:
    "Shaping the room so deliberately that the culture forgets how to shape itself.",
  strategic_diplomat:
    "Holding every relationship in balance so carefully that decisions quietly stall.",
  creative_visionary:
    "Seeing the future so clearly that the present work feels too small to ship.",
  systemic_thinker:
    "Mapping every angle so thoroughly that the first move becomes the hardest one.",
  empathetic_driver:
    "Carrying the team's weight so personally that the work becomes a private burden.",
  relational_leader:
    "Caring for the team so deeply that the work becomes a personal burden.",
  resilient_fixer:
    "Solving every fire so reliably that the organisation forgets to prevent them.",
  precision_specialist:
    "Perfecting every detail so completely that the broader strategy waits on you.",
  strategic_operator:
    "Balancing every pillar so evenly that no single edge has room to compound.",
};

export const FORENSIC_TEASERS: Record<ArchetypeKey, string> = {
  operational_strategist:
    "Your tactical engine is running at elite capacity, but it is also the ceiling on your team's autonomy. Every system you tighten privately removes one more reason for others to learn to own it.",
  dynamic_catalyst:
    "You generate momentum the team cannot reproduce without you in the room. The energy that earned you the seat is the same force preventing a durable second line from forming behind you.",
  collaborative_pilot:
    "You orchestrate the operating rhythm so smoothly that decisions pass through you by default. The team reads this as competence; the system reads it as a single point of failure.",
  cultural_architect:
    "You set the cultural temperature with such precision that the room calibrates to you, not the work. The organisation is inheriting your standards but not the muscle to maintain them.",
  strategic_diplomat:
    "You hold conflicting interests in balance so carefully that hard calls quietly migrate onto your desk. The cost is not visible in any meeting — only in the decisions that never quite close.",
  creative_visionary:
    "Your forward vision is sharper than the operating cadence around you, which leaves execution running one step behind your thinking. The gap shows up as work that almost ships.",
  systemic_thinker:
    "You see the second-order consequences before the first move is made, and that clarity is now slowing your tempo. The organisation needs your judgement faster than your analysis allows.",
  empathetic_driver:
    "You absorb the team's emotional load so quietly that no one sees the cost — except in the work that you end up redoing yourself. The same instinct that builds trust is taxing your output.",
  relational_leader:
    "You carry the team's wellbeing as a personal responsibility, and the work has fused with that care. The organisation reads this as leadership; your nervous system reads it as a debt.",
  resilient_fixer:
    "You resolve incidents so reliably that the organisation has stopped investing in prevention. Your strength is now subsidising a system that should have outgrown firefighting months ago.",
  precision_specialist:
    "Your standard of detail is genuinely elite, and it is also the bottleneck on every initiative you touch. The organisation gets perfect work — it just gets it later than the strategy needs.",
  strategic_operator:
    "Your profile is unusually balanced, which makes you legible to every stakeholder but distinctive to none. The trade-off is reach without an unmistakable edge to compound.",
};

export function getAnchorSignal(key: ArchetypeKey): string {
  return ANCHOR_SIGNALS[key];
}

export function getForensicTeaser(key: ArchetypeKey): string {
  return FORENSIC_TEASERS[key];
}