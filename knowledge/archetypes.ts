// Canonical source lives in supabase/functions/_shared/archetype.ts
// (edge-function bundler can only reach files under supabase/functions/).
// Frontend imports via @knowledge/archetypes — keep this as a re-export
// so there is exactly one source of truth.
export * from "../supabase/functions/_shared/archetype";
