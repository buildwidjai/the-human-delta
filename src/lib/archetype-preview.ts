// Re-export shim. Single source of truth lives in /knowledge/.
// Kept so existing `@/lib/archetype-preview` imports keep working.

import {
  ANCHOR_SIGNALS,
  FORENSIC_TEASERS,
  deriveArchetype as sharedDeriveArchetype,
  getAnchorSignal as sharedGetAnchorSignal,
  getForensicTeaser as sharedGetForensicTeaser,
  type ArchetypeKey,
} from "@knowledge/archetypes";
import { computePillarScores as sharedComputePillarScores } from "@knowledge/scoring";

export type { Pillar, ArchetypeKey, DerivedArchetype } from "@knowledge/archetypes";

export const computePillarScores = sharedComputePillarScores;
export const deriveArchetype = sharedDeriveArchetype;
export const getAnchorSignal = sharedGetAnchorSignal;
export const getForensicTeaser = sharedGetForensicTeaser;

// Preserved for any consumer that imports the maps directly.
export const ANCHOR_SIGNALS_MAP: Record<ArchetypeKey, string> = ANCHOR_SIGNALS;
export const FORENSIC_TEASERS_MAP: Record<ArchetypeKey, string> = FORENSIC_TEASERS;
