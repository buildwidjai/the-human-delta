# Knowledge base

Single source of truth for The Human Delta™ domain content. All other files
(client + edge functions) re-export from here. Do **not** duplicate this
content elsewhere.

| File | What it owns |
|---|---|
| `pillars.ts` | The four TEMR pillars (T/E/M/R) — codes, full names, ordering. |
| `questionnaire.ts` | The 20 questions, pillar mapping, reverse-scored IDs, 5-point scale labels. |
| `scoring.ts` | `computePillarScores()` — converts raw 1–5 answers into 0–100 pillar scores. |
| `archetypes.ts` | The 12 archetype keys, labels, the 4×4 primary×secondary matrix, `deriveArchetype()`, the LLM-facing library (anchor + growth hurdle), and the preview narratives (`ANCHOR_SIGNALS`, `FORENSIC_TEASERS`). |
| `prompts/v12-4-system.ts` | V12.4 mentor system prompt for `generate-leadership-report`. |
| `prompts/v12-system.ts` | Older v12 mentor system prompt for `human-delta-v12`. |

## Why a top-level folder

Vite (`src/`) and Deno edge functions (`supabase/functions/`) cannot share a
`src/` import. A sibling `knowledge/` folder is reachable from both:

- Client: `import ... from "@knowledge/..."` (alias defined in `vite.config.ts` and `tsconfig.app.json`).
- Edge functions: `import ... from "../../../knowledge/...ts"` (relative path).

## No vector store

There is no RAG / embedding / pgvector setup. All knowledge is plain TS
constants compiled into the bundle and the edge functions.