# The Human Delta™

A premium "Performance Audit" assessment that scores professionals across the
four TEMR pillars — **Tactical, Emotional, Mental, Relational** — and delivers
an evidence-based Human Delta™ Pivot Report.

## What it does

- **System calibration, not a personality test.** A 32-question audit (20
  foundational + 12 probes) measures observable behaviour over the last 30 days
  on a 5-point frequency scale.
- **TEMR Radar.** Foundational answers produce a 0–100 score per pillar.
- **Archetype derivation.** Primary × secondary pillars map to one of 12
  leadership archetypes (e.g. Strategic Operator, Empathetic Driver).
- **AI-generated Pivot Report.** A 15-section V12.4 leadership report rendered
  to a locked-layout PDF, delivered after Stripe checkout.
- **Privacy-first.** Hashed-email retrieval, self-serve data deletion, and
  automatic audit-log purging.

## Tech stack

- **Frontend:** React 18, Vite 5, TypeScript 5, Tailwind CSS v3, shadcn/ui
- **Backend:** Lovable Cloud (Supabase Postgres + Edge Functions on Deno)
- **AI:** Lovable AI Gateway (Google Gemini / OpenAI GPT-5 family)
- **Payments:** Stripe (embedded checkout)
- **PDF:** `pdf-lib` with embedded Inter fonts

## Repository layout

```
knowledge/              Single source of truth for domain content
  pillars.ts            TEMR pillar definitions
  questionnaire.ts      32 questions + reverse-scored IDs + scale labels
  scoring.ts            Raw 1–5 answers → 0–100 pillar scores
  archetypes.ts         12 archetypes + derivation matrix
  prompts/              V12 / V12.4 mentor system prompts
src/                    Vite client app
  pages/                Index, Questionnaire, Report, Checkout, etc.
  components/           UI components (Hero, ArchetypeGallery, …)
  lib/v12-report-pdf.ts Locked V8 PDF layout
supabase/functions/     Edge functions (report generation, payments, email)
scripts/                One-off dev/render scripts
```

The top-level `knowledge/` folder is imported by both the Vite client
(`@knowledge/...`) and Deno edge functions (relative paths) so domain content
is never duplicated.

## Local development

```sh
bun install
bun run dev
```

Run the test suite:

```sh
bunx vitest run
```

Render a report JSON to PDF locally:

```sh
bun scripts/render-report.ts input.json output.pdf
```

