// The four TEMR pillars. Single source of truth.

export type Pillar = "T" | "E" | "M" | "R";

export const PILLAR_ORDER: Pillar[] = ["T", "E", "M", "R"];

export const PILLAR_FULL_NAME: Record<Pillar, string> = {
  T: "Tactical",
  E: "Emotional",
  M: "Mental",
  R: "Relational",
};

export const PILLAR_BY_NAME: Record<string, Pillar> = {
  Tactical: "T",
  Emotional: "E",
  Mental: "M",
  Relational: "R",
};

export interface TemrScores {
  T: number;
  E: number;
  M: number;
  R: number;
}