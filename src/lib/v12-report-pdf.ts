/**
 * V12.4 Report PDF renderer.
 * Same navy/gold layout as before; field names remapped to the V12.4 schema.
 */
import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { LeadershipReportV124, ReportHabit } from "@/services/reportGenerator";

const NAVY = rgb(0x0b / 255, 0x1f / 255, 0x3a / 255);
const GOLD = rgb(0xc9 / 255, 0xa2 / 255, 0x4b / 255);
const INK = rgb(0x1b / 255, 0x1b / 255, 0x1b / 255);
const GREY = rgb(0x6b / 255, 0x6b / 255, 0x6b / 255);
const SAND = rgb(0xf4 / 255, 0xf1 / 255, 0xe6 / 255);
const SAND_BORDER = rgb(0xe6 / 255, 0xdf / 255, 0xcb / 255);
const WHITE = rgb(1, 1, 1);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 45;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_Y = PAGE_H - 32;
const HEADER_RULE_Y = PAGE_H - 38;
const FOOTER_Y = 28;
const TOP_CONTENT_Y = PAGE_H - 60;

export interface RenderInput {
  report: LeadershipReportV124;
  scores: Record<"T" | "E" | "M" | "R", number>;
  clientName: string;
  industry: string;
  /** Public-facing report identifier (e.g. "HD-2026-A4F9K2"). Falls back to a
   *  deterministic hash of the client name when omitted. */
  reportId?: string;
  /** Raw PNG bytes for the brand logo (delta-logo.png). Optional; falls back to vector mark. */
  logoPng?: Uint8Array;
  /** Optional Inter TTF bytes. When provided, the entire PDF is set in Inter. */
  interFonts?: { regular: Uint8Array; bold: Uint8Array; italic: Uint8Array; boldItalic: Uint8Array };
}

const SECTION_CONTEXT: Record<string, string> = {
  "01": "This section identifies the gap between your personal effort and the team's current processes.",
  "01.5": "This section explains why your current execution strength is the primary factor limiting your ability to scale as a leader.",
  "02": "This summary provides a high-level view of your current operating state and the pivotal shift required to reach the next level.",
  bottlenecks: "This audit identifies the specific tactical habit that is currently acting as a ceiling on your leadership growth.",
  "07": "This section outlines the specific professional trade-offs required to stop firefighting and start designing a scalable team.",
  "08": "This audit validates your elite strengths and calculates the professional cost of misapplying them to low-value tasks.",
  "09": "This section provides nine high-leverage habits designed to transition your reputation from an operator to a strategic executive.",
  "10": "This roadmap outlines the three-month neurological and professional shift required to move from fixing the work to designing the system.",
  "11": "This memo provides the business logic required to secure manager buy-in for your transition to a strategic role.",
  "12-14": "These sections define your immediate next step and the biological timeline required for these new habits to take hold.",
};

function sanitise(s: string): string {
  if (!s) return "";
  return s.replace(/[\u2018\u2019\u201A\u201B]/g, "'")
          .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
          .replace(/[\u2013\u2014]/g, "-")
          .replace(/\u2026/g, "...")
          .replace(/\u00A0/g, " ");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const clean = sanitise(text);
  const paragraphs = clean.split(/\n+/);
  const out: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) line = test;
      else { if (line) out.push(line); line = w; }
    }
    if (line) out.push(line);
  }
  return out;
}

interface Fonts { reg: PDFFont; bold: PDFFont; italic: PDFFont; boldItalic: PDFFont }
interface Ctx { page: PDFPage; y: number; fonts: Fonts }

function drawText(ctx: Ctx, text: string, opts: { size: number; font: PDFFont; color?: ReturnType<typeof rgb>; x?: number }) {
  ctx.page.drawText(sanitise(text), { x: opts.x ?? MARGIN, y: ctx.y - opts.size, size: opts.size, font: opts.font, color: opts.color ?? INK });
  ctx.y -= opts.size;
}
function drawWrapped(ctx: Ctx, text: string, opts: { size: number; font: PDFFont; color?: ReturnType<typeof rgb>; x?: number; maxWidth?: number; leading?: number }) {
  const x = opts.x ?? MARGIN;
  const maxWidth = opts.maxWidth ?? CONTENT_W;
  const leading = opts.leading ?? opts.size * 1.45;
  for (const line of wrapText(text, opts.font, opts.size, maxWidth)) {
    ctx.page.drawText(line, { x, y: ctx.y - opts.size, size: opts.size, font: opts.font, color: opts.color ?? INK });
    ctx.y -= leading;
  }
}
function moveDown(ctx: Ctx, by: number) { ctx.y -= by; }
function drawRule(ctx: Ctx, color = GOLD, width = 60, thickness = 1.5, x = MARGIN) {
  ctx.page.drawRectangle({ x, y: ctx.y - thickness, width, height: thickness, color });
  ctx.y -= thickness;
}

// Golden Delta mark — vector logo matching <GoldenDelta /> (viewBox 100x100, y-down).
// `topY` is the top edge of the glyph in PDF coords; `cx` is the horizontal centre.
function drawDeltaLogo(page: PDFPage, cx: number, topY: number, size: number, bg: ReturnType<typeof rgb>, logo?: PDFImage) {
  if (logo) {
    const dims = logo.scaleToFit(size, size);
    page.drawImage(logo, { x: cx - dims.width / 2, y: topY - dims.height, width: dims.width, height: dims.height });
    return;
  }
  // Match GoldenDelta.tsx polygon "50,8 92,85 78,85 70,72 8,85" in 100x100 viewBox.
  // pdf-lib drawSvgPath: with {x,y}, the SVG (0,0) is placed at pdf coords (x,y)
  // and SVG y increases downwards (toward smaller pdf-lib y values).
  const left = cx - size / 2;
  const s = (n: number) => ((n / 100) * size).toFixed(2);
  const opts = { x: left, y: topY };
  // Outer triangle (gold fill)
  page.drawSvgPath(`M ${s(50)} ${s(8)} L ${s(92)} ${s(85)} L ${s(8)} ${s(85)} Z`, {
    color: GOLD, borderColor: GOLD, borderWidth: 0, ...opts,
  });
  // Notch cut — overlay in the page background colour to suggest the slice.
  page.drawSvgPath(`M ${s(70)} ${s(72)} L ${s(92)} ${s(85)} L ${s(78)} ${s(85)} Z`, {
    color: bg, borderColor: bg, borderWidth: 0, ...opts,
  });
}

function chrome(page: PDFPage, fonts: Fonts, rightTag: string, pageNum: number, _total: number, dark = false) {
  const headerColor = dark ? GOLD : NAVY;
  page.drawText("THE HUMAN DELTA(TM)", { x: MARGIN, y: HEADER_Y, size: 7.5, font: fonts.bold, color: dark ? WHITE : headerColor });
  const tagW = fonts.bold.widthOfTextAtSize(rightTag, 7.5);
  page.drawText(rightTag, { x: PAGE_W - MARGIN - tagW, y: HEADER_Y, size: 7.5, font: fonts.bold, color: GOLD });
  if (!dark) page.drawRectangle({ x: MARGIN, y: HEADER_RULE_Y, width: CONTENT_W, height: 0.4, color: SAND_BORDER });
  page.drawText("Confidential  |  Performance Audit", { x: MARGIN, y: FOOTER_Y, size: 7.5, font: fonts.reg, color: dark ? WHITE : NAVY });
  const num = String(pageNum).padStart(2, "0");
  const numW = fonts.bold.widthOfTextAtSize(num, 7.5);
  page.drawText(num, { x: PAGE_W - MARGIN - numW, y: FOOTER_Y, size: 7.5, font: fonts.bold, color: GOLD });
}

function sectionTitle(ctx: Ctx, kicker: string, title: string, context?: string) {
  drawText(ctx, kicker, { size: 8, font: ctx.fonts.bold, color: GOLD }); moveDown(ctx, 8);
  drawText(ctx, title, { size: 24, font: ctx.fonts.bold, color: NAVY }); moveDown(ctx, 6);
  drawRule(ctx); moveDown(ctx, 10);
  if (context) { drawWrapped(ctx, context, { size: 9.5, font: ctx.fonts.italic, color: NAVY, leading: 13 }); moveDown(ctx, 6); }
}

function sandCallout(ctx: Ctx, label: string, body: string) {
  if (!body) return;
  const padX = 14, padY = 12;
  const innerW = CONTENT_W - padX * 2;
  const lines = wrapText(body, ctx.fonts.reg, 10.5, innerW);
  const h = padY * 2 + 14 + lines.length * 14;
  const top = ctx.y;
  ctx.page.drawRectangle({ x: MARGIN, y: top - h, width: CONTENT_W, height: h, color: SAND, borderColor: SAND_BORDER, borderWidth: 1 });
  ctx.page.drawText(label, { x: MARGIN + padX, y: top - padY - 8, size: 8, font: ctx.fonts.bold, color: GOLD });
  let ly = top - padY - 22;
  for (const ln of lines) { ctx.page.drawText(ln, { x: MARGIN + padX, y: ly - 10.5, size: 10.5, font: ctx.fonts.reg, color: INK }); ly -= 14; }
  ctx.y = top - h - 10;
}
function paraBlock(ctx: Ctx, label: string, body: string) {
  if (!body) return;
  drawText(ctx, label, { size: 8, font: ctx.fonts.bold, color: GOLD }); moveDown(ctx, 6);
  drawWrapped(ctx, body, { size: 10.5, font: ctx.fonts.reg, color: INK, leading: 14 }); moveDown(ctx, 8);
}
function labelGridBlock(ctx: Ctx, label: string, body: string) {
  if (!body) return;
  const labelX = MARGIN, bodyX = MARGIN + 110, bodyW = CONTENT_W - 110;
  const startY = ctx.y;
  ctx.page.drawText(label, { x: labelX, y: startY - 8, size: 8, font: ctx.fonts.bold, color: GOLD });
  const lines = wrapText(body, ctx.fonts.reg, 10.5, bodyW);
  let y = startY;
  for (const line of lines) { ctx.page.drawText(line, { x: bodyX, y: y - 10.5, size: 10.5, font: ctx.fonts.reg, color: INK }); y -= 14; }
  ctx.y = Math.min(startY - 14, y) - 4;
}

export async function renderReportPdf(input: RenderInput): Promise<Blob> {
  const { report: r, scores, clientName, industry, logoPng, interFonts, reportId } = input;
  const doc = await PDFDocument.create();
  if (interFonts) doc.registerFontkit(fontkit);
  const logo: PDFImage | undefined = logoPng ? await doc.embedPng(logoPng) : undefined;
  const fonts: Fonts = interFonts
    ? {
        reg: await doc.embedFont(interFonts.regular, { subset: true }),
        bold: await doc.embedFont(interFonts.bold, { subset: true }),
        italic: await doc.embedFont(interFonts.italic, { subset: true }),
        boldItalic: await doc.embedFont(interFonts.boldItalic, { subset: true }),
      }
    : {
        reg: await doc.embedFont(StandardFonts.Helvetica),
        bold: await doc.embedFont(StandardFonts.HelveticaBold),
        italic: await doc.embedFont(StandardFonts.HelveticaOblique),
        boldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
      };
  // The cover previously used Times for the hero/archetype. Use Inter italic/regular
  // when Inter is supplied so the entire document is set in a single typeface.
  const serifReg = fonts.reg;
  const serifItalic = fonts.italic;

  const pageDrawFns: ((page: PDFPage, num: number, total: number) => void)[] = [];

  // COVER
  pageDrawFns.push((page, num) => {
    // Full-bleed navy
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: NAVY });

    const COVER_WHITE = rgb(0.96, 0.96, 0.96);
    const COVER_GREY = rgb(0.62, 0.64, 0.70);

    // Top-left wordmark
    page.drawText("THE HUMAN DELTA(TM)", {
      x: MARGIN, y: PAGE_H - MARGIN, size: 7,
      font: fonts.bold, color: COVER_WHITE,
    });
    // Top-right document number — prefer the persisted public report ID;
    // fall back to a deterministic name hash for legacy/demo renders.
    let docNo: string;
    if (reportId) {
      docNo = reportId;
    } else {
      const hash = (clientName || "anonymous").split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 5381);
      docNo = `No. 2026\u00B7${String(hash % 9000 + 1000)}`;
    }
    const docW = fonts.reg.widthOfTextAtSize(docNo, 7);
    page.drawText(docNo, {
      x: PAGE_W - MARGIN - docW, y: PAGE_H - MARGIN, size: 7,
      font: fonts.reg, color: COVER_GREY,
    });

    // Centered logo mark at 36pt
    const logoSize = 36;
    const logoTop = PAGE_H - 110;
    drawDeltaLogo(page, PAGE_W / 2, logoTop, logoSize, NAVY, logo);

    // Left-aligned column at MARGIN, ~55% page width
    const colW = PAGE_W * 0.55;
    let y = PAGE_H * 0.58;

    // Tiny gold eyebrow
    page.drawText("PERFORMANCE AUDIT", {
      x: MARGIN, y, size: 7.5, font: fonts.bold, color: GOLD,
    });
    y -= 28;

    // Hero title (serif italic? — keep serif regular for the hero, big)
    page.drawText("The Pivot Report.", {
      x: MARGIN, y: y - 64, size: 64, font: serifReg, color: COVER_WHITE,
    });
    y -= 88;

    // Single gold hairline (1pt × 40pt) — only decorative element
    page.drawRectangle({ x: MARGIN, y, width: 40, height: 1, color: GOLD });
    y -= 26;

    // Quiet abstract line in serif italic
    for (const line of wrapText(
      "An evidence-based snapshot of professional operating performance across the Tactical, Emotional, Mental, and Relational pillars.",
      serifItalic, 10.5, colW,
    )) {
      page.drawText(line, { x: MARGIN, y: y - 10.5, size: 10.5, font: serifItalic, color: COVER_WHITE });
      y -= 16;
    }

    // ── Bottom block: Prepared for + Archetype ───────────────────
    let by = 210;

    // Prepared for
    page.drawText("PREPARED FOR", { x: MARGIN, y: by, size: 7, font: fonts.bold, color: GOLD });
    by -= 18;
    page.drawText(sanitise(clientName || "—"), {
      x: MARGIN, y: by - 14, size: 14, font: serifReg, color: COVER_WHITE,
    });
    by -= 22;
    const ctxLine = [industry || null, `Overall Delta ${r.metadata.delta_score} / 100`]
      .filter(Boolean).join("  \u00B7  ");
    page.drawText(ctxLine, { x: MARGIN, y: by - 8, size: 8, font: fonts.reg, color: COVER_GREY });

    // Archetype labelled pair (italic serif, not bold sans)
    by -= 34;
    page.drawText("ARCHETYPE", { x: MARGIN, y: by, size: 7, font: fonts.bold, color: GOLD });
    by -= 22;
    page.drawText(sanitise(r.metadata.archetype), {
      x: MARGIN, y: by - 18, size: 18, font: serifItalic, color: COVER_WHITE,
    });

    // Footer: single line, 7pt grey, left-aligned; page number right
    const foot = "Confidential  \u00B7  The Human Delta(TM)  \u00B7  TEMR Growth (Sweden)  \u00B7  \u00A9 2026";
    page.drawText(foot, { x: MARGIN, y: FOOTER_Y, size: 7, font: fonts.reg, color: COVER_GREY });
    const numStr = String(num).padStart(2, "0");
    const nw = fonts.reg.widthOfTextAtSize(numStr, 7);
    page.drawText(numStr, { x: PAGE_W - MARGIN - nw, y: FOOTER_Y, size: 7, font: fonts.reg, color: COVER_GREY });
  });

  // PILLAR YIELD + ANCHOR
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "PILLAR YIELD", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
    sectionTitle(ctx, "EXHIBIT 01", "Pillar Yield");
    const colW = CONTENT_W / 4;
    const baseY = ctx.y - 30;
    const pillars: ["T" | "E" | "M" | "R", string][] = [["T", "TACTICAL"], ["E", "EMOTIONAL"], ["M", "MENTAL"], ["R", "RELATIONAL"]];
    pillars.forEach(([k, name], i) => {
      const x = MARGIN + i * colW;
      const labelW = fonts.bold.widthOfTextAtSize(name, 9);
      page.drawText(name, { x: x + (colW - labelW) / 2, y: baseY, size: 9, font: fonts.bold, color: GOLD });
      const score = String(scores[k]);
      const scoreW = fonts.bold.widthOfTextAtSize(score, 72);
      page.drawText(score, { x: x + (colW - scoreW) / 2, y: baseY - 84, size: 72, font: fonts.bold, color: NAVY });
      const dw = fonts.reg.widthOfTextAtSize("/100", 10);
      page.drawText("/100", { x: x + (colW - dw) / 2, y: baseY - 108, size: 10, font: fonts.reg, color: GREY });
    });
    ctx.y = baseY - 150;
    const calloutPad = 16;
    const anchorLines = wrapText(r.metadata.anchor_signal, fonts.reg, 11, CONTENT_W - calloutPad * 2);
    const calloutH = anchorLines.length * 16 + calloutPad * 2 + 22;
    page.drawRectangle({ x: MARGIN, y: ctx.y - calloutH, width: CONTENT_W, height: calloutH, color: SAND, borderColor: SAND_BORDER, borderWidth: 1 });
    let cy = ctx.y - calloutPad;
    page.drawText("ANCHOR SIGNAL", { x: MARGIN + calloutPad, y: cy - 8, size: 8, font: fonts.bold, color: GOLD }); cy -= 22;
    for (const line of anchorLines) { page.drawText(line, { x: MARGIN + calloutPad, y: cy - 11, size: 11, font: fonts.reg, color: INK }); cy -= 16; }
  });

  // SECTION 01
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "SECTION 01", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
    sectionTitle(ctx, "SECTION 01", "The Big Picture", SECTION_CONTEXT["01"]);
    const panelH = 170;
    page.drawRectangle({ x: MARGIN, y: ctx.y - panelH, width: CONTENT_W, height: panelH, color: SAND, borderColor: SAND_BORDER, borderWidth: 1 });
    drawRadar(page, fonts, scores, MARGIN + CONTENT_W / 2, ctx.y - panelH / 2, 60);
    ctx.y -= panelH + 14;
    paraBlock(ctx, "HEADLINE", r.sec_01.headline);
    paraBlock(ctx, "CRITICAL INSIGHT", r.sec_01.insight);
    if (r.sec_01.hidden_cost) paraBlock(ctx, "THE HIDDEN COST", r.sec_01.hidden_cost);
    if (r.sec_01.long_term_cost) paraBlock(ctx, "THE LONG-TERM COST", r.sec_01.long_term_cost);
  });

  // SECTION 01.5
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "SECTION 01.5", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
    sectionTitle(ctx, "SECTION 01.5", "The Growth Hurdle", SECTION_CONTEXT["01.5"]);
    if (r.sec_01_5.headline) {
      drawWrapped(ctx, r.sec_01_5.headline, { size: 16, font: fonts.bold, color: NAVY, leading: 22 });
      moveDown(ctx, 12);
    }
    paraBlock(ctx, "WHY YOUR STRENGTH IS THE BRAKE", r.sec_01_5.logic);
  });

  // SECTION 02
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "SECTION 02", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
    sectionTitle(ctx, "SECTION 02", "The Ninety-Second Summary", SECTION_CONTEXT["02"]);
    const b = r.sec_02.three_bullets ?? [];
    if (b[0]) paraBlock(ctx, "THE REALITY", b[0]);
    if (b[1]) paraBlock(ctx, "THE HURDLE", b[1]);
    if (b[2]) paraBlock(ctx, "THE PIVOT", b[2]);
    if (r.sec_02.pivot_logic) paraBlock(ctx, "WHY THIS PIVOT", r.sec_02.pivot_logic);
  });

  // BOTTLENECKS 03–06
  const bottlenecks = [r.sec_03, r.sec_04, r.sec_05, r.sec_06];
  bottlenecks.forEach((d, i) => {
    pageDrawFns.push((page, num, total) => {
      chrome(page, fonts, `SECTION 0${i + 3}`, num, total);
      const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
      sectionTitle(ctx, `SECTION 0${i + 3}`, d.title, SECTION_CONTEXT.bottlenecks);
      drawText(ctx, `BOTTLENECK 0${i + 1} OF 04`, { size: 8, font: fonts.bold, color: GOLD }); moveDown(ctx, 12);
      labelGridBlock(ctx, "WHY IT HAPPENS", d.why);
      labelGridBlock(ctx, "WHAT IT LOOKS LIKE", d.observable);
      labelGridBlock(ctx, "THE REAL COST", d.performance_tax);
      moveDown(ctx, 6);
      sandCallout(ctx, "THE WIN", d.the_win);
    });
  });

  // SECTION 07
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "SECTION 07", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
    sectionTitle(ctx, "SECTION 07", "The Trade-Off", SECTION_CONTEXT["07"]);

    // V8 spec: two-column card, gold top rule, repeated five times.
    // Left = LET GO OF, right = YOU GAIN. Each cell: bold navy headline (11pt) + body (10pt).
    const gap = 16;
    const colW = (CONTENT_W - gap) / 2;
    const padX = 12, padY = 10;

    // Split a single string into headline + body. If the string contains a
    // bold-friendly first sentence (ends with a period), use that as the
    // headline and the remainder as the body. Otherwise the full string is
    // the headline and body is empty.
    const splitHB = (raw: string): { h: string; b: string } => {
      const s = (raw ?? "").trim();
      if (!s) return { h: "", b: "" };
      const m = s.match(/^([^.!?]+[.!?])\s+(.+)$/s);
      if (m) return { h: m[1].trim(), b: m[2].trim() };
      return { h: s, b: "" };
    };

    const left = r.sec_07.letting_go ?? [];
    const right = r.sec_07.gaining ?? [];
    const rows = Math.max(left.length, right.length, 5);

    // Column headers (gold for LET GO OF, navy for YOU GAIN per V8 spec)
    page.drawText("LET GO OF", { x: MARGIN, y: ctx.y - 8, size: 8, font: fonts.bold, color: GOLD });
    page.drawText("YOU GAIN", { x: MARGIN + colW + gap, y: ctx.y - 8, size: 8, font: fonts.bold, color: NAVY });
    ctx.y -= 16;

    for (let i = 0; i < rows; i++) {
      const L = splitHB(left[i] ?? "");
      const R = splitHB(right[i] ?? "");
      const innerW = colW - padX * 2;
      const lH = wrapText(L.h, fonts.bold, 11, innerW);
      const lB = L.b ? wrapText(L.b, fonts.reg, 10, innerW) : [];
      const rH = wrapText(R.h, fonts.bold, 11, innerW);
      const rB = R.b ? wrapText(R.b, fonts.reg, 10, innerW) : [];
      const cellH = Math.max(
        padY * 2 + lH.length * 14 + (lB.length ? 4 + lB.length * 13 : 0),
        padY * 2 + rH.length * 14 + (rB.length ? 4 + rB.length * 13 : 0),
      );
      const top = ctx.y;
      // Sand cards
      page.drawRectangle({ x: MARGIN, y: top - cellH, width: colW, height: cellH, color: SAND });
      page.drawRectangle({ x: MARGIN + colW + gap, y: top - cellH, width: colW, height: cellH, color: SAND });
      // Gold top rule on each card
      page.drawRectangle({ x: MARGIN, y: top - 1, width: colW, height: 1, color: GOLD });
      page.drawRectangle({ x: MARGIN + colW + gap, y: top - 1, width: colW, height: 1, color: GOLD });

      const drawCell = (x: number, headLines: string[], bodyLines: string[]) => {
        let ly = top - padY;
        for (const ln of headLines) {
          page.drawText(ln, { x: x + padX, y: ly - 11, size: 11, font: fonts.bold, color: NAVY });
          ly -= 14;
        }
        if (bodyLines.length) {
          ly -= 4;
          for (const ln of bodyLines) {
            page.drawText(ln, { x: x + padX, y: ly - 10, size: 10, font: fonts.reg, color: INK });
            ly -= 13;
          }
        }
      };
      drawCell(MARGIN, lH, lB);
      drawCell(MARGIN + colW + gap, rH, rB);
      ctx.y = top - cellH - 8;
    }
  });

  // SECTION 08
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "SECTION 08", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
    sectionTitle(ctx, "SECTION 08", "The Power and the Cost", SECTION_CONTEXT["08"]);
    if (r.sec_08.strengths) { drawWrapped(ctx, r.sec_08.strengths, { size: 10.5, font: fonts.reg, color: INK, leading: 14 }); moveDown(ctx, 8); }
    drawText(ctx, "ELITE STRENGTHS  |  TOP THREE", { size: 8, font: fonts.bold, color: GOLD }); moveDown(ctx, 10);
    for (const w of r.sec_08.top_traits ?? []) {
      const padX = 14, padY = 12;
      const innerW = CONTENT_W - padX * 2 - 60;
      const lines = wrapText(w.warning ?? "", fonts.reg, 9.5, innerW);
      const rowH = Math.max(60, padY * 2 + 16 + lines.length * 13);
      const top = ctx.y;
      page.drawRectangle({ x: MARGIN, y: top - rowH, width: CONTENT_W, height: rowH, color: SAND });
      page.drawRectangle({ x: MARGIN, y: top - rowH, width: 3, height: rowH, color: GOLD });
      const scoreStr = String(w.score);
      const sw = fonts.bold.widthOfTextAtSize(scoreStr, 22);
      page.drawText(scoreStr, { x: MARGIN + 12 + (40 - sw) / 2, y: top - padY - 22, size: 22, font: fonts.bold, color: NAVY });
      const tx = MARGIN + 60 + padX;
      page.drawText(sanitise(w.name), { x: tx, y: top - padY - 10, size: 10.5, font: fonts.bold, color: NAVY });
      let ly = top - padY - 24;
      for (const ln of lines) { page.drawText(ln, { x: tx, y: ly - 9.5, size: 9.5, font: fonts.reg, color: INK }); ly -= 13; }
      ctx.y = top - rowH - 8;
    }
    if (r.sec_08.tax_logic) { moveDown(ctx, 4); sandCallout(ctx, "THE COST OF MISAPPLICATION", r.sec_08.tax_logic); }
  });

  // SECTION 09 — split 3-3-3
  const habits = r.sec_09 ?? [];
  const habitChunks: ReportHabit[][] = [habits.slice(0, 3), habits.slice(3, 6), habits.slice(6, 9)];
  habitChunks.forEach((chunk, idx) => {
    if (chunk.length === 0) return;
    pageDrawFns.push((page, num, total) => {
      const tag = idx === 0 ? "SECTION 09" : "SECTION 09 (CONTINUED)";
      chrome(page, fonts, tag, num, total);
      const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
      sectionTitle(ctx, tag, "Nine Leadership Habits", idx === 0 ? SECTION_CONTEXT["09"] : undefined);
      for (const t of chunk) {
        const padX = 14, padY = 12;
        const innerW = CONTENT_W - padX * 2;
        const wLines = t.why ? wrapText(t.why, fonts.reg, 9.5, innerW) : [];
        const yLines = wrapText(t.impact, fonts.reg, 9.5, innerW);
        const sLines = wrapText(`"${t.script}"`, fonts.italic, 9.5, innerW);
        const whyBlockH = wLines.length ? 12 + wLines.length * 13 + 6 : 0;
        const rowH = padY * 2 + 18 + whyBlockH + 12 + yLines.length * 13 + 6 + 12 + sLines.length * 13;
        const top = ctx.y;
        page.drawRectangle({ x: MARGIN, y: top - rowH, width: CONTENT_W, height: rowH, color: SAND });
        page.drawRectangle({ x: MARGIN, y: top - rowH, width: 3, height: rowH, color: GOLD });
        page.drawText(sanitise(t.name).toUpperCase(), { x: MARGIN + padX, y: top - padY - 9, size: 9.5, font: fonts.bold, color: NAVY });
        let ly = top - padY - 22;
        const writeLabelled = (label: string, lines: string[], font: PDFFont) => {
          page.drawText(label, { x: MARGIN + padX, y: ly - 7, size: 7.5, font: fonts.bold, color: GOLD }); ly -= 12;
          for (const ln of lines) { page.drawText(ln, { x: MARGIN + padX, y: ly - 9.5, size: 9.5, font, color: INK }); ly -= 13; }
          ly -= 6;
        };
        if (wLines.length) writeLabelled("WHY IT HAPPENS", wLines, fonts.reg);
        writeLabelled("LEADERSHIP IMPACT", yLines, fonts.reg);
        writeLabelled("MONDAY SCRIPT", sLines, fonts.italic);
        ctx.y = top - rowH - 8;
      }
    });
  });

  // SECTION 10
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "SECTION 10", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
    sectionTitle(ctx, "SECTION 10", "The Ninety-Day Journey", SECTION_CONTEXT["10"]);
    const phases = [
      { name: "Diagnose", when: "MONTH 1  |  Days 1 to 30", summary: r.sec_10.m1, focus: r.sec_10.m1_focus, shift: r.sec_10.m1_human_shift, ai: r.sec_10.m1_ai },
      { name: "Design",   when: "MONTH 2  |  Days 31 to 60", summary: r.sec_10.m2, focus: r.sec_10.m2_focus, shift: r.sec_10.m2_human_shift, ai: r.sec_10.m2_ai },
      { name: "Lead",     when: "MONTH 3  |  Days 61 to 90", summary: r.sec_10.m3, focus: r.sec_10.m3_focus, shift: r.sec_10.m3_human_shift, ai: r.sec_10.m3_ai },
    ];
    phases.forEach((p, i) => {
      if (i > 0) { page.drawRectangle({ x: MARGIN, y: ctx.y - 1, width: CONTENT_W, height: 0.5, color: SAND_BORDER }); ctx.y -= 12; }
      drawText(ctx, p.name, { size: 18, font: fonts.bold, color: NAVY });
      const nameW = fonts.bold.widthOfTextAtSize(p.name, 18);
      page.drawText(p.when, { x: MARGIN + nameW + 16, y: ctx.y + 4, size: 8, font: fonts.bold, color: GOLD });
      moveDown(ctx, 10);
      labelGridBlock(ctx, "THIS MONTH", p.summary);
      labelGridBlock(ctx, "FOCUS", p.focus);
      labelGridBlock(ctx, "HUMAN SHIFT", p.shift);
      if (p.ai) labelGridBlock(ctx, "AI AS A LEVER", p.ai);
      moveDown(ctx, 6);
    });
  });

  // SECTION 11
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "SECTION 11", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
    sectionTitle(ctx, "SECTION 11", "The Professional Case", SECTION_CONTEXT["11"]);
    paraBlock(ctx, "MEMO TO YOUR MANAGER", r.sec_11.memo);
    paraBlock(ctx, "THE BUSINESS LOGIC", r.sec_11.logic);
  });

  // SECTION 12
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "SECTION 12", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
    sectionTitle(ctx, "SECTION 12", "The Weekly Command", SECTION_CONTEXT["12-14"]);
    paraBlock(ctx, "VELOCITY METRIC", r.sec_12.metric);
    moveDown(ctx, 4);
    sandCallout(ctx, "THIS WEEK'S TARGET", r.sec_12.target ?? "");
  });

  // SECTION 13
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "SECTION 13", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
    sectionTitle(ctx, "SECTION 13", "The Choice", SECTION_CONTEXT["12-14"]);
    paraBlock(ctx, "THE BINARY CHOICE", r.sec_13.choice);
    if (r.sec_13.command) paraBlock(ctx, "YOUR COMMAND", r.sec_13.command);
  });

  // SECTION 14
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "SECTION 14", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y, fonts };
    sectionTitle(ctx, "SECTION 14", "The Ninety-Day Habit Warning", SECTION_CONTEXT["12-14"]);
    paraBlock(ctx, "THE NEUROLOGICAL GRAVITY", r.sec_14.gravity);
    paraBlock(ctx, "THE STRATEGY", r.sec_14.strategy);
  });

  // SECTION 15 — Notice of Plasticity
  pageDrawFns.push((page, num, total) => {
    chrome(page, fonts, "NOTICE OF PLASTICITY", num, total);
    const ctx: Ctx = { page, y: TOP_CONTENT_Y - 10, fonts };
    // Brand mark above the section eyebrow (white background)
    drawDeltaLogo(page, PAGE_W / 2, ctx.y, 48, WHITE, logo);
    ctx.y -= 50;
    const eyebrow = "NOTICE OF PLASTICITY";
    const ew = fonts.bold.widthOfTextAtSize(eyebrow, 9);
    page.drawText(eyebrow, { x: (PAGE_W - ew) / 2, y: ctx.y - 9, size: 9, font: fonts.bold, color: GOLD });
    ctx.y -= 18;
    page.drawRectangle({ x: (PAGE_W - 80) / 2, y: ctx.y - 1, width: 80, height: 1, color: GOLD });
    ctx.y -= 30;
    const blocks: [string, string][] = [
      [
        "1. NATURE OF THE ASSESSMENT",
        "This Pivot Report is a professional development diagnostic built on the TEMR Growth (Sweden) framework, drawing on established Industrial-Organisational psychology models. It is a structured snapshot of how you currently operate across Tactical, Emotional, Mental and Relational capacity — not a measure of your worth, intelligence or character.",
      ],
      [
        "2. NON-CLINICAL STATUS",
        "This report is for leadership development only. It is not a medical, psychiatric or psychological diagnosis, and it does not replace clinical assessment. The findings describe observable professional behaviours and the systems around them, not the inner state of the person.",
      ],
      [
        "3. THE PRINCIPLE OF NEUROPLASTICITY",
        "Leadership behaviour is not static. Repeated, deliberate practice across the 90-day journey physically rewires the patterns this report describes. Your delta is a measurable gap in current behaviour, not a permanent ceiling on your potential.",
      ],
    ];
    for (const [h, b] of blocks) {
      drawText(ctx, h, { size: 11, font: fonts.bold, color: NAVY }); moveDown(ctx, 8);
      drawWrapped(ctx, b, { size: 10.5, font: fonts.reg, color: INK, leading: 14 }); moveDown(ctx, 14);
    }
    const tail = "Full Notice of Plasticity: thehumandelta.com/plasticity";
    const tw = fonts.reg.widthOfTextAtSize(tail, 9);
    page.drawText(tail, { x: (PAGE_W - tw) / 2, y: 60, size: 9, font: fonts.reg, color: GREY });
  });

  const total = pageDrawFns.length;
  pageDrawFns.forEach((draw, i) => {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    draw(page, i + 1, total);
  });

  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

function drawRadar(page: PDFPage, fonts: Fonts, scores: Record<"T" | "E" | "M" | "R", number>, cx: number, cy: number, radius: number) {
  const ring = (rr: number) => {
    const pts = [
      { x: cx, y: cy + rr }, { x: cx + rr, y: cy }, { x: cx, y: cy - rr }, { x: cx - rr, y: cy },
    ];
    drawPolygon(page, pts, undefined, rgb(0.78, 0.78, 0.82), 0.6);
  };
  [1, 0.75, 0.5, 0.25].forEach(f => ring(radius * f));
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx, y: cy + radius }, thickness: 0.5, color: rgb(0.78, 0.78, 0.82) });
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + radius, y: cy }, thickness: 0.5, color: rgb(0.78, 0.78, 0.82) });
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx, y: cy - radius }, thickness: 0.5, color: rgb(0.78, 0.78, 0.82) });
  page.drawLine({ start: { x: cx, y: cy }, end: { x: cx - radius, y: cy }, thickness: 0.5, color: rgb(0.78, 0.78, 0.82) });
  const pts = [
    { x: cx, y: cy + radius * (scores.T / 100) },
    { x: cx + radius * (scores.E / 100), y: cy },
    { x: cx, y: cy - radius * (scores.M / 100) },
    { x: cx - radius * (scores.R / 100), y: cy },
  ];
  drawPolygon(page, pts, rgb(0.78, 0.80, 0.90), NAVY, 1.4);
  for (const p of pts) page.drawCircle({ x: p.x, y: p.y, size: 2.5, color: GOLD });
  const label = (text: string, x: number, y: number, score: number) => {
    const w = fonts.bold.widthOfTextAtSize(text, 8);
    page.drawText(text, { x: x - w / 2, y, size: 8, font: fonts.bold, color: NAVY });
    const sw = fonts.bold.widthOfTextAtSize(String(score), 9);
    page.drawText(String(score), { x: x - sw / 2, y: y - 12, size: 9, font: fonts.bold, color: GOLD });
  };
  label("TACTICAL", cx, cy + radius + 14, scores.T);
  label("EMOTIONAL", cx + radius + 36, cy + 2, scores.E);
  label("MENTAL", cx, cy - radius - 18, scores.M);
  label("RELATIONAL", cx - radius - 36, cy + 2, scores.R);
}

function drawPolygon(page: PDFPage, pts: { x: number; y: number }[], _fill: ReturnType<typeof rgb> | undefined, stroke: ReturnType<typeof rgb>, thickness: number) {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]; const b = pts[(i + 1) % pts.length];
    page.drawLine({ start: a, end: b, thickness, color: stroke });
  }
}
