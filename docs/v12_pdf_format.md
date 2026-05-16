# The Human Delta™ — V12 PDF Format (Locked to v10)

This document is the **single source of truth** for the visual layout and section
ordering of the downloadable PDF report (`Human_Delta_<Name>.pdf`). The renderer
lives at `src/lib/v12-report-pdf.ts` and is driven entirely by this spec.

The reference document is `docs/v10_reference.pdf` (the v10 Casey Smith sample).
**Do not change copy ordering, labels, or styling in the renderer without first
updating this file and the reference PDF.** This is what stops the PDF from
drifting again.

## Global rules

| Property | Value |
|---|---|
| Page size | A4 portrait, 595.28 × 841.89 pt |
| Outer margin | 48 pt |
| Body font | Helvetica (regular, bold, oblique). Standard pdf-lib font, no embed. |
| Body size | 10.5 pt, 1.45 leading |
| Label size | 8 pt bold, tracked +1.6, gold |
| Section title | 26 pt bold, navy |
| Navy | `#0B1F3A` |
| Gold | `#C9A24B` |
| Sand | `#F4F1E6` |
| Sand border | `#E6DFCB` |
| Header (every page) | `THE HUMAN DELTA™` (navy, 8 pt bold) left, `<SECTION TAG>` (gold, 8 pt bold) right, hairline rule beneath |
| Footer (every page) | `Confidential | Performance Audit` (navy, 8 pt) left, two-digit page number (gold, 8 pt bold) right |
| One section per page | Never run two sections together except sections 12 & 13 (combined) |

## Page sequence (19 pages, locked)

| # | Page | Source |
|---|---|---|
| 01 | Cover (navy top, white bottom) | `SEC_00_Metadata`, cover meta |
| 02 | Pillar Yield + Anchor Signal | `meta.pillarScores`, `Anchor_Signal` |
| 03 | Section 01 — The Big Picture (radar + 4 paras) | `SEC_01_Executive_Signal` |
| 04 | Section 01.5 — The Growth Hurdle | `SEC_01_5_Archetype_Diagnostic` |
| 05 | Section 02 — The Ninety-Second Summary | `SEC_02_90_Second_Summary` |
| 06–09 | Sections 03–06 — Bottlenecks 01–04 | `SEC_03_06_Forensic_Diagnoses[]` |
| 10 | Section 07 — The Trade-Off (5 paired cards) | `SEC_07_Dynamic_Calibration.Trade_Pairs` |
| 11 | Section 08 — Power and Tax (intro + 3 strengths) | `SEC_08_Asset_Audit` |
| 12–14 | Section 09 — Nine Leadership Traits (3-3-3 split) | `SEC_09_Behavioural_Audit.Forensic_Traits` |
| 15 | Section 10 — The Ninety-Day Journey (3 phases) | `SEC_10_90_Day_Pivot` |
| 16 | Section 11 — The Professional Case | `SEC_11_Investment_Thesis` |
| 17 | Sections 12 & 13 — Weekly Command + Choice | `SEC_12_90_Day_Command`, `SEC_13_The_Choice` |
| 18 | Section 14 — Ninety-Day Habit Warning | `SEC_14_Notice_of_Plasticity` |
| 19 | Notice of Plasticity | `SEC_15_Plasticity_Notice` |

## Cover (page 01)

- Top half: full navy background, padded by 48 pt outer margin.
  - Tiny gold eyebrow `PERFORMANCE AUDIT` (8 pt bold, tracked +1.6)
  - Wordmark `THE HUMAN DELTA™` (white, 11 pt bold, tracked +1.6)
  - Title `The Pivot Report` (white, 36 pt bold)
  - Gold sub-eyebrow `POWERED BY TEMR GROWTH SCIENTIFIC STANDARDS`
  - Body line: `An evidence-based snapshot of professional operating performance across Tactical, Emotional, Mental, and Relational capacity.`
  - Gold rule (160 × 1 pt)
  - Gold eyebrow `ARCHETYPE`, then archetype name (white, 22 pt bold)
- Bottom half: white. Three metadata cells laid horizontally:
  - `NAME` → client name
  - `INDUSTRY` → industry
  - `OVERALL DELTA SCORE` → `<NN> / 100`
  - Labels gold 8 pt bold, values navy 11 pt bold
- Footer line: `CONFIDENTIAL · THE HUMAN DELTA™ · TEMR GROWTH (SWEDEN) · © 2026` (gold, 7.5 pt bold)
- Page number: `01` gold, bottom-right

## Per-section page (pages 02–18)

1. Header strip (navy left, gold right tag)
2. Gold kicker (`SECTION 0N` or `EXHIBIT 01`)
3. Navy title (26 pt bold)
4. Gold underline rule (60 × 1.5 pt)
5. Italic context line (10.5 pt navy) — required for sections 01–14
6. Body content as listed in the page sequence
7. Footer strip

Bottleneck pages (03–06) additionally render a gold `BOTTLENECK 0N OF 04` eyebrow above the four label blocks (`WHY IT HAPPENS`, `WHAT IT LOOKS LIKE`, `THE REAL COST`, `THE WIN`).

## Section 07 trade card

Two-column card on sand background, gold top rule, repeated five times. Left column header `LET GO OF` (gold 8 pt bold), right column header `YOU GAIN` (navy 8 pt bold). Each cell: bold navy headline (11 pt) then 10 pt body.

## Section 08 strength card

Sand row, gold left border. Large navy score (24 pt bold), trait name (11 pt bold), warning paragraph (10 pt).

## Section 09 trait card

Sand row, gold left border. Header: trait name (11 pt bold uppercase) left, gold pill with score right. Body has three labelled paragraphs: `WHAT IS HAPPENING`, `LEADERSHIP IMPACT`, `MONDAY SCRIPT` (script in italic with curly quotes).

## Section 10 phase block

Three blocks separated by hairlines. Each block: phase name (18 pt bold navy) and gold time-band header on one line, then `FOCUS`, `HUMAN SHIFT`, `AI AS A LEVER` label-blocks (110 pt gold label column, body column).

## Notice of Plasticity (page 19)

Centered logo block: small "NOTICE OF PLASTICITY" eyebrow (gold), 80 pt gold rule. Three numbered headings (navy 11 pt bold) and bodies (10 pt). Footer line: `Full Notice of Plasticity: thehumandelta.com/plasticity` (grey, 8 pt centered).

## Out of scope

- Custom embedded fonts (we deliberately use built-in Helvetica to keep the bundle small and rendering deterministic across browsers).
- Server-side rendering.
- Interactive elements (links, form fields).