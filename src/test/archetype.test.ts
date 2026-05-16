import { describe, it, expect } from "vitest";
import { deriveArchetype as previewDerive } from "@/lib/archetype-preview";
import { deriveArchetype as sharedDerive, type TemrScores } from "@/lib/archetype";

const SAMPLES: TemrScores[] = [
  { T: 13, E: 0, M: 13, R: 25 },   // the HD-2026-JHK4Y5 case → R primary, T secondary
  { T: 90, E: 80, M: 70, R: 60 },  // all-high
  { T: 10, E: 5, M: 8, R: 3 },     // all-low
  { T: 60, E: 60, M: 60, R: 60 },  // perfect tie
  { T: 70, E: 30, M: 70, R: 30 },  // tie at top → primary T (stable order)
  { T: 20, E: 80, M: 40, R: 80 },  // tie at top, E and R
  { T: 88, E: 12, M: 64, R: 22 },  // T primary, M secondary
  { T: 15, E: 92, M: 50, R: 88 },  // E primary, R secondary
];

describe("deriveArchetype", () => {
  it("preview and shared derivation always agree", () => {
    for (const s of SAMPLES) {
      const a = previewDerive(s);
      const b = sharedDerive(s);
      expect(a.key).toBe(b.key);
      expect(a.primary).toBe(b.primary);
      expect(a.secondary).toBe(b.secondary);
      expect(a.lowest).toBe(b.lowest);
    }
  });

  it("HD-2026-JHK4Y5 score profile resolves to Collaborative Pilot", () => {
    const r = sharedDerive({ T: 13, E: 0, M: 13, R: 25 });
    expect(r.key).toBe("collaborative_pilot");
    expect(r.primary).toBe("R");
    expect(r.secondary).toBe("T");
  });
});