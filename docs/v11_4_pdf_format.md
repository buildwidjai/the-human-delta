# The Human Delta™ — V11.4 Pivot Report PDF Format

This document is the **single source of truth** for the visual format of the
test-flow PDF produced by `src/lib/test-flow-pdf.ts`. If you want to change
typography, page layout, section order, or copy chrome, edit **this file
first**, then update the renderer to match.

The renderer takes a V11.2 `V6Narrative` payload (see
`supabase/functions/temr-test-report/_ai/prompt-v112.ts`) and renders it into
a **fixed 14-section booklet** modelled exactly on `Human_Delta_V11_4_Sample.pdf`.

---

## Global rules

| Property              | Value                                              |
| --------------------- | -------------------------------------------------- |
| Page size             | A4 portrait, 595.28 × 841.89 pt                    |
| Outer margin          | 56 pt                                              |
| Heading font          | **Playfair Display** (regular + italic). Used for the wordmark, every section title, large numerals, and all italic "diagnosis" lines. |
| Body font             | **Inter** (regular + italic). Used for body copy, eyebrows, labels, table cells, footer. |
| Brand colours         | **Navy `#000080`** (deep royal), **Gold `#D4AF37`** (antique), **White `#FFFFFF`**. No greys, no slate. |
| Background            | Cover page: full navy. All other pages: pure white. |
| Section per page      | **One section per page.** Never run two sections together. |
| Page chrome (top)     | Eyebrow row: `THE HUMAN DELTA™` (Inter bold, **navy**, 9 pt, tracked +1.6) on the left; `<SECTION TAG>` (Inter bold, **gold**, 9 pt, tracked +1.6) on the right. Thin gold rule beneath, 0.6 pt, full content width. |
| Page chrome (bottom)  | Footer text `Confidential · Performance Audit · V11.4` (Inter, 8.5 pt navy) on the left and 2-digit page number (Inter bold, 8.5 pt **gold**) on the right. No hairline rule. |
| Section header        | Tracked uppercase `SECTION NN` in **gold** (Inter bold, 10 pt, tracked +1.8), then large title in **navy** Playfair Display regular, 30 pt, mixed case (e.g. "Executive Profile" — never SHOUTED). |
| Section accent        | 1.5 pt **gold** underline 64 pt wide, sitting 12 pt below the title baseline. |
| Body                  | 11.5 pt navy Inter regular, 1.45 leading. No grey body copy anywhere. |
| Italic diagnosis      | 13 pt **Playfair Display Italic**, navy. Used for the single-sentence diagnoses and for the user name on the cover. |
| Tables                | Two-column grids on `#F4F1E6` (warm sand) cells, 1 pt **gold** top-rule. Cell text in navy Inter. |

---

## Page sequence (always 14 sections + 1 closing image page)

### Page 01 — Cover
- **Top half is fully navy `#000080`.** No top gold rule.
- Inside the navy block, padded by the standard 56 pt margin:
  - Tiny gold eyebrow `PERFORMANCE AUDIT · V11.4` (Inter bold, 9 pt, tracked +2)
  - Massive wordmark `THE HUMAN DELTA™` in **white Playfair Display regular**, 60 pt, two lines ("THE HUMAN" / "DELTA™").
  - Short gold underline rule (80 × 1.5 pt) beneath the wordmark.
  - "Prepared for" label in white Inter, 12 pt.
  - Pilot name in **white Playfair Display Italic**, 28 pt.
- **Bottom half is white.** Three metadata stacks laid horizontally with the standard 56 pt margin:
  - `SUBJECT` → role
  - `TIER` → fixed `Tier 2: System Architecture`
  - `DELTA SCORE` → `<NN> / 100`
  - Labels are gold Inter bold, 9 pt, tracked +1.6. Values are navy Inter (or, for the Delta Score numeral, navy Playfair Display 36 pt).
- A boxed callout sits below the metadata: thin gold border, gold `DELTA SCORE` label inside, then the italic diagnosis (`verdict.problem`) in navy Playfair Display Italic 13 pt.
- Footer line: `CONFIDENTIAL · The Swedish Mentor · <model id>` in navy Inter on the left, page number `01` in gold on the right.

### Page 02 — Section 01 · Executive Profile
- Big four pillar tiles in a 4-column grid: pillar name top, score (36 pt navy) below
- Below: `PILLAR YIELD` label, then a **4-axis radar chart** (Tactical top, Emotional right, Mental bottom, Relational left).
  - Concentric reference rings (4 rings) in light grey (`#C8C8D2`), 0.4 pt
  - Axis spokes in the same light grey
  - Score polygon: navy stroke (1.4 pt) with a light navy tint fill (`#C8CDE6`)
  - Vertex dots in gold (`#D4AF37`), radius 2.2 pt
  - Axis labels: navy Inter bold 10 pt, uppercase, tracked +1.2
  - Axis scores under each label: gold Playfair Display 14 pt
- ~2mm (~6pt) extra breathing room (plus clearance for the bottom radar label) before the `DIAGNOSIS` label
- Italic `DIAGNOSIS` block: `verdict.problem`

### Page 03 — Section 02 · 90-Second Summary
- Three labelled blocks stacked: `STATE`, `BARRIER`, `PIVOT`
  - Source: `verdict.problem` → STATE, `verdict.why_it_matters` → BARRIER, `verdict.career_consequence` → PIVOT

### Page 04 — Section 03 · The Capacity Wall
- Sub-title (italic navy, 16 pt) = `efficiencyGap.title` (fallback `narratives.timeLost.title`)
- Body paragraph = `efficiencyGap.body`

### Page 05 — Section 04 · The Fixer's Loop
- Sub-title = `blindSpotParadox.name`
- Body = `blindSpotParadox.body`
- Footer note (slate small caps): `PAYWALL BOUNDARY · Sections 05–14 follow in the unlocked report`

### Page 06 — Sections 05 + 06 (Blind Spot Paradox + Visibility Gap)
The sample places these two on a single page; we follow that exception.
- **Section 05 — The Blind Spot Paradox**
  - Two-row callout: `STRENGTH` → `profile.primaryStrength`, `ACTING AS BRAKE` → `profile.primaryGap`
  - Diagnosis below = `blindSpotParadox.body`, rendered in **regular (non-italic) navy Inter 11.5 pt** — matches the body style used in Section 04. Spacing between the bottom of the gold-bar callout block and the first line of body text is **3 mm (~8.5 pt)**.
- **Section 06 — The Visibility Gap**
  - 2-column table: `WORK DONE` / `STRATEGY SIGNALED`
    - WORK DONE = `narratives.timeLost.title`
    - STRATEGY SIGNALED = `narratives.notSeenStrategic.title`
  - Diagnosis = `visibilityGap.body`, rendered in **regular (non-italic) navy Inter 11.5 pt** — same body style as Sections 04 and 05. Spacing between the table's gold rule (under the row) and the first line of body text is **2 mm (~5.7 pt)**.

### Page 07 — Section 07 · Dynamic Calibration
- Sub-line: `To increase system leverage, specific tradeoffs are required.`
- 2-column `ABANDON` / `GAIN` table with three rows
  - Row 1 = `narratives.timeLost.body` summarised → `coreAssets[0].body`
  - Rows derived from `coreAssets[0..2]` (each asset becomes one ABANDON/GAIN pair, ABANDON = current waste, GAIN = `coreAssets[i].body`)

### Page 08 — Section 08 · The Asset Audit
- Sub-line italic: `Three traits scoring 100. Currently leaking yield.` (or actual top-3 trait scores)
- 3-column table: `Score | Trait | Wasted as:` — top 3 traits by score from forensicAudit (any group), ordered DESC

### Page 09 — Section 09 · The Forensic Audit (rows 1-6)
- Sub-line italic: `Nine traits. Score, diagnosis, Monday Script.`
- For each trait row (first 6):
  - Trait name in navy small-caps bold
  - Insight body
  - Score `NN /100` right-aligned and big (24 pt navy)
  - `MONDAY SCRIPT` label tiny + script text in italic navy

### Page 10 — Section 09 cont. (rows 7-9)
- Eyebrow `THE HUMAN DELTA™ · FORENSIC AUDIT (CONT.)`
- Same row format as page 09, remaining 3 traits

### Page 11 — Section 10 · The 90-Day Pivot
- Sub-line italic: `Dual-Track. Human Shift recalibrates social signal. AI Lever buys back strategic bandwidth.`
- Three day-blocks: `30 DAYS`, `60 DAYS`, `90 DAYS`
- Each block has two stacked sub-rows: `HUMAN SHIFT` (= `ninetyDayPivot.days_X`) and `AI LEVER` (derived; if not present, omit AI LEVER row gracefully)

### Page 12 — Sections 11 + 12 + 13 (Manager's Brief + Command + Choice)
- **Section 11 — The Manager's Brief**
  - Eyebrow inside page: `SCRIPT FOR THE LINE MANAGER`
  - Italic body = `managersBrief.coreStatement` + `managersBrief.identityShift`
- **Section 12 — The 90-Day Command**
  - One-paragraph body, fixed copy
- **Section 13 — The Choice**
  - Two-column table: `STAY SMALL` / `LEAD`. Each cell has a one-line bold heading and a one-sentence consequence (derived from `pivotPoint`)

### Page 13 — Section 14 · Notice of Plasticity
- Italic body = fixed disclaimer copy from spec
- Centred Golden Delta logo at the bottom

---

## Editing tips

- **Copy chrome only**: edit the `STATIC_COPY` block in `src/lib/test-flow-pdf.ts`.
- **Layout / typography**: edit the `LAYOUT` and colour constants at the top of `src/lib/test-flow-pdf.ts`.
- **Section order or page splits**: change the `renderPage*` function calls in `generateTestFlowPdf`.
- **Add a section**: add a new `renderPageNN` function and insert it in the call sequence; update this doc.

No section may rely on values from another model — V11.2 (Claude) is the only narrator that populates the V11 fields. If a V11 field is missing the renderer falls back to the V6 equivalent so the PDF still produces 14 pages.

---

## V11.5 changelog (Master Directive V11.5)

- **Persona / vocabulary**: prompt rewritten to "The Swedish Mentor / Warm Surgeon" using the Systems Physics glossary (Thermal Limit, Signal Decay, Architectural Yield, Friction, Input Saturation, Homeostasis, Structural Brake, Force Multiplier). New banned terms: unlock, journey, empower, bridge, firefighter, "relational deficit".
- **Dynamic Seniority Governor**: prompt selects `Tier 1: Tactical Exit` (under 5 years) or `Tier 2: System Architecture` (5+ years) and emits the label in `identityHeader.tier`. Cover page TIER stack now uses this value when present, falling back to the static `Tier 2: System Architecture`.
- **New Section 01.5 — Archetype Diagnostic** (page 03): renders a STRENGTH / STRUCTURAL BRAKE callout plus a 3-sentence body from `archetypeDiagnostic`. Page numbering for every following section shifts by +1.
- **Section 10 — 90-Day Pivot (Dual-Track)**: each phase block now renders a `HUMAN SHIFT` paragraph followed by an `AI LEVER` paragraph (sourced from `ninetyDayPivot.ai_lever_*`). The AI Lever row is omitted if the field is empty so older payloads still render.
- **Document tag / footer**: bumped to `PERFORMANCE AUDIT · V11.5` and `Confidential · Performance Audit · V11.5`.
- The total page count is now **15 sections + 1 closing image page**.
