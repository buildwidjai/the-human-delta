// Re-export shim. Single source of truth lives in /knowledge/archetypes.ts.
// Kept so existing `@/lib/archetype` imports across the codebase keep working.
export {
  ARCHETYPE_LABELS,
  deriveArchetype,
  type ArchetypeKey,
  type DerivedArchetype,
  type Pillar,
  type TemrScores,
} from "@knowledge/archetypes";
