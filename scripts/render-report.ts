/**
 * Render a Leadership Report JSON (output of the generate-leadership-report
 * edge function) into the locked V8 PDF layout used by /report.
 *
 * Usage:
 *   bun scripts/render-report.ts <input.json> <output.pdf>
 *
 * The JSON file must contain { report, meta } as returned by the edge
 * function. We feed it straight into renderReportPdf so the resulting PDF
 * is byte-comparable with what users download from the app.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { renderReportPdf } from "../src/lib/v12-report-pdf";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("Usage: bun scripts/render-report.ts <input.json> <output.pdf>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inPath, "utf8")) as {
  report: Parameters<typeof renderReportPdf>[0]["report"];
  meta: { pillarScores: { T: number; E: number; M: number; R: number }; clientName: string; industry: string | null };
};

const blob = await renderReportPdf({
  report: raw.report,
  scores: raw.meta.pillarScores,
  clientName: raw.meta.clientName,
  industry: raw.meta.industry ?? "",
  logoPng: new Uint8Array(readFileSync("src/assets/delta-logo.png")),
  interFonts: {
    regular: new Uint8Array(readFileSync("src/assets/fonts/Inter-Regular.ttf")),
    bold: new Uint8Array(readFileSync("src/assets/fonts/Inter-Bold.ttf")),
    italic: new Uint8Array(readFileSync("src/assets/fonts/Inter-Italic.ttf")),
    boldItalic: new Uint8Array(readFileSync("src/assets/fonts/Inter-BoldItalic.ttf")),
  },
});

const buf = Buffer.from(await blob.arrayBuffer());
writeFileSync(outPath, buf);
console.log(`Wrote ${outPath} (${buf.length.toLocaleString()} bytes)`);