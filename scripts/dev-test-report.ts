/**
 * DEVELOPER-ONLY TEST FLOW (Jaideep Das & Rajeev Ranjan Sinha)
 * ----------------------------------------------------------------
 * Generates random demographics + answers, mints a valid HMAC payment
 * token using SUPABASE_SERVICE_ROLE_KEY (the same secret the edge
 * function verifies against), POSTs to generate-leadership-report,
 * then renders the narrative to PDF and a simple HTML view.
 *
 * Bypasses Stripe entirely WITHOUT weakening the production payment
 * gate — the secret never leaves the server-trusted environment, and
 * no edge-function code was modified. If SUPABASE_SERVICE_ROLE_KEY is
 * not present in the environment, this script cannot run.
 *
 * Outputs land in /mnt/documents/dev-test-report/.
 *
 * Usage:  bun scripts/dev-test-report.ts
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { gameSections, REVERSE_SCORED_IDS } from "../knowledge/questionnaire";
import { renderReportPdf } from "../src/lib/v12-report-pdf";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const DEV_BYPASS   = process.env.DEV_BYPASS_SECRET;
const ANON_KEY     = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
if (!SUPABASE_URL || !DEV_BYPASS || !ANON_KEY) {
  throw new Error("Missing SUPABASE_URL / DEV_BYPASS_SECRET / publishable key in env.");
}

// ── Random fixtures ────────────────────────────────────────────────
const PILLAR_LETTER: Record<string, "T" | "E" | "M" | "R"> = {
  Tactical: "T", Emotional: "E", Mental: "M", Relational: "R",
};
function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function shortTrait(text: string): string {
  const t = text.replace(/^I\s+/i, "").replace(/[.,;:].*$/, "");
  const w = t.split(/\s+/).slice(0, 6).join(" ");
  return w.charAt(0).toUpperCase() + w.slice(1);
}

const answers: Array<{ id: number; pillar: "T"|"E"|"M"|"R"; trait: string; value: number; reverse: boolean }> = [];
for (const s of gameSections) {
  const letter = PILLAR_LETTER[s.pillar];
  if (!letter) continue;
  for (const q of [...s.foundational, ...s.probes]) {
    answers.push({
      id: q.id, pillar: letter, trait: shortTrait(q.text),
      value: 1 + Math.floor(Math.random() * 5),
      reverse: REVERSE_SCORED_IDS.includes(q.id),
    });
  }
}

const demographics = {
  clientName: rand(["Alex Carter", "Priya Menon", "Jordan Reeves", "Sam O'Neill"]),
  position:   rand(["VP Engineering", "Director of Ops", "Head of Product", "Regional Manager"]),
  ageRange:   rand(["28-35", "36-45", "46-55"]),
  experienceRange: rand(["4-7", "8-12", "13-20"]),
  gender:     rand(["Male", "Female", "Other"]),
  industry:   rand(["FinTech", "Healthcare", "SaaS", "Manufacturing"]),
};

const assessmentId = crypto.randomUUID();
const sessionId    = crypto.randomUUID();

// ── Hashed email (sha256 hex) ─────────────────────────────────────
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

const OUT_DIR = "/mnt/documents/dev-test-report";
mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const hashedEmail  = await sha256Hex(`devtest+${assessmentId}@thehumandelta.test`);

  const body = {
    assessmentId, sessionId, hashedEmail,
    ...demographics, answers,
  };

  console.log("→ POST generate-leadership-report …");
  const t0 = Date.now();
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/generate-leadership-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY!, Authorization: `Bearer ${ANON_KEY}`,
      "x-dev-bypass": DEV_BYPASS!,
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  console.log(`← ${resp.status} in ${(Date.now()-t0)/1000}s`);
  if (!resp.ok) {
    writeFileSync(`${OUT_DIR}/error.json`, text);
    throw new Error(`Edge fn failed: ${resp.status} ${text.slice(0,500)}`);
  }
  const data = JSON.parse(text);
  writeFileSync(`${OUT_DIR}/narrative.json`, JSON.stringify(data, null, 2));
  console.log("✓ saved narrative.json");

  // ── PDF ──────────────────────────────────────────────────────────
  const pdfBlob = await renderReportPdf({
    report: data.report,
    scores: data.meta.pillarScores,
    clientName: data.meta.clientName,
    industry: data.meta.industry ?? "",
    logoPng: new Uint8Array(readFileSync("src/assets/delta-logo.png")),
    interFonts: {
      regular:    new Uint8Array(readFileSync("src/assets/fonts/Inter-Regular.ttf")),
      bold:       new Uint8Array(readFileSync("src/assets/fonts/Inter-Bold.ttf")),
      italic:     new Uint8Array(readFileSync("src/assets/fonts/Inter-Italic.ttf")),
      boldItalic: new Uint8Array(readFileSync("src/assets/fonts/Inter-BoldItalic.ttf")),
    },
  });
  writeFileSync(`${OUT_DIR}/report.pdf`, Buffer.from(await pdfBlob.arrayBuffer()));
  console.log("✓ saved report.pdf");

  // ── HTML (developer view of every section) ──────────────────────
  const r = data.report as Record<string, any>;
  const m = data.meta;
  const esc = (v: unknown) =>
    String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const renderVal = (v: unknown): string => {
    if (v == null) return "<em>—</em>";
    if (Array.isArray(v)) return `<ul>${v.map((x) => `<li>${renderVal(x)}</li>`).join("")}</ul>`;
    if (typeof v === "object") {
      return `<dl>${Object.entries(v as Record<string, unknown>)
        .map(([k, x]) => `<dt><code>${esc(k)}</code></dt><dd>${renderVal(x)}</dd>`).join("")}</dl>`;
    }
    return esc(v);
  };
  const sections = Object.keys(r).filter((k) => k !== "metadata").sort();
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Dev Test Report — ${esc(m.clientName)}</title>
<style>
  body{font-family:-apple-system,Inter,Segoe UI,sans-serif;max-width:920px;margin:2rem auto;padding:0 1rem;color:#0b1d3a;line-height:1.55;}
  h1{font-size:1.8rem;margin-bottom:.25rem;} h2{margin-top:2rem;border-bottom:2px solid #b8902f;padding-bottom:.25rem;color:#0b1d3a;}
  .meta{background:#f6f3ec;padding:1rem;border-left:4px solid #b8902f;border-radius:6px;margin:1rem 0;}
  dl{margin:.25rem 0 .5rem 1rem;} dt{font-weight:600;margin-top:.5rem;color:#1a3a6e;} dd{margin:.1rem 0 .4rem 1rem;}
  code{background:#eef0f4;padding:.1rem .3rem;border-radius:3px;font-size:.9em;}
  ul{margin:.25rem 0 .5rem 1.25rem;} .banner{background:#fff7e6;border:1px solid #b8902f;color:#5a3d0a;padding:.6rem 1rem;border-radius:6px;margin-bottom:1rem;}
</style></head><body>
<div class="banner">⚠ Developer test run (random inputs, payment bypassed via service-role HMAC).</div>
<h1>${esc(m.clientName)} — ${esc(m.archetype)}</h1>
<div class="meta">
  <strong>Pillar scores:</strong> T ${m.pillarScores.T} · E ${m.pillarScores.E} · M ${m.pillarScores.M} · R ${m.pillarScores.R}<br>
  <strong>Overall:</strong> ${m.overall} · <strong>Tier:</strong> ${esc(m.tierLevel)}<br>
  <strong>Primary:</strong> ${m.primary} · <strong>Secondary:</strong> ${m.secondary} · <strong>Lowest:</strong> ${m.lowest}<br>
  <strong>Industry:</strong> ${esc(m.industry)} · <strong>Report ID:</strong> ${esc(m.reportId)}
</div>
${sections.map((k) => `<h2>${esc(k)}</h2>${renderVal(r[k])}`).join("\n")}
</body></html>`;
  writeFileSync(`${OUT_DIR}/report.html`, html);
  console.log("✓ saved report.html");
  console.log(`\nAll outputs in ${OUT_DIR}`);
})();