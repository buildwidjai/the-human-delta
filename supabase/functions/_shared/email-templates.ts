// HTML + plain-text email templates for the post-payment report delivery.
// Inline-styled (email-safe). Brand: navy + gold, Inter falling back to Arial.

const NAVY = "#0B1F3A";
const GOLD = "#C9A24B";
const INK = "#1B1B1B";
const SAND = "#F4F1E6";
const SAND_BORDER = "#E6DFCB";
const GREY = "#6B6B6B";

const PILLAR_FULL: Record<string, string> = {
  T: "Tactical", E: "Emotional", M: "Mental", R: "Relational",
};

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(inner: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Pivot Report</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,Helvetica,sans-serif;color:${INK};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background:#ffffff;border:1px solid #eaeaea;">
${inner}
<tr><td style="padding:24px 32px;background:${NAVY};color:#fff;font-size:11px;letter-spacing:0.18em;text-align:center;">
CONFIDENTIAL · THE HUMAN DELTA™ · TEMR GROWTH (SWEDEN) · © 2026
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function band(label: string, body: string): string {
  return `<tr><td style="padding:18px 32px;border-top:1px solid #efefef;">
<div style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:${GOLD};margin-bottom:6px;">${esc(label)}</div>
<div style="font-size:13px;line-height:1.55;color:${INK};">${body}</div>
</td></tr>`;
}

function callout(label: string, body: string): string {
  return `<tr><td style="padding:14px 32px;">
<div style="background:${SAND};border:1px solid ${SAND_BORDER};padding:14px 16px;">
<div style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:${GOLD};margin-bottom:6px;">${esc(label)}</div>
<div style="font-size:13px;line-height:1.55;color:${INK};">${esc(body)}</div>
</div></td></tr>`;
}

function section(kicker: string, title: string): string {
  return `<tr><td style="padding:28px 32px 4px;">
<div style="font-size:10px;font-weight:700;letter-spacing:0.22em;color:${GOLD};margin-bottom:6px;">${esc(kicker)}</div>
<div style="font-size:22px;font-weight:800;color:${NAVY};letter-spacing:-0.01em;">${esc(title)}</div>
<div style="width:48px;height:2px;background:${GOLD};margin-top:8px;"></div>
</td></tr>`;
}

function pillarYield(scores: Record<string, number>): string {
  const cells = (["T","E","M","R"] as const).map((k) => `
    <td align="center" style="padding:0 6px;width:25%;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:${GOLD};margin-bottom:6px;">${PILLAR_FULL[k].toUpperCase()}</div>
      <div style="font-size:30px;font-weight:800;color:${NAVY};line-height:1;">${esc(scores?.[k] ?? 0)}</div>
      <div style="font-size:10px;color:${GREY};margin-top:2px;">/100</div>
    </td>`).join("");
  return `<tr><td style="padding:8px 32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>
</td></tr>`;
}

function bottleneckCard(idx: number, d: any): string {
  if (!d) return "";
  const rows: string[] = [];
  if (d.why) rows.push(`<div style="margin-top:8px;"><span style="font-size:10px;font-weight:700;letter-spacing:0.18em;color:${GOLD};">WHY IT HAPPENS</span><div style="font-size:13px;line-height:1.55;margin-top:2px;">${esc(d.why)}</div></div>`);
  if (d.observable) rows.push(`<div style="margin-top:8px;"><span style="font-size:10px;font-weight:700;letter-spacing:0.18em;color:${GOLD};">WHAT IT LOOKS LIKE</span><div style="font-size:13px;line-height:1.55;margin-top:2px;">${esc(d.observable)}</div></div>`);
  if (d.performance_tax) rows.push(`<div style="margin-top:8px;"><span style="font-size:10px;font-weight:700;letter-spacing:0.18em;color:${GOLD};">THE REAL COST</span><div style="font-size:13px;line-height:1.55;margin-top:2px;">${esc(d.performance_tax)}</div></div>`);
  if (d.the_win) rows.push(`<div style="margin-top:10px;background:${SAND};border:1px solid ${SAND_BORDER};padding:10px 12px;"><span style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:${GOLD};">THE WIN</span><div style="font-size:13px;line-height:1.55;margin-top:2px;">${esc(d.the_win)}</div></div>`);
  return `<tr><td style="padding:18px 32px;border-top:1px solid #efefef;">
<div style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:${GOLD};margin-bottom:6px;">BOTTLENECK 0${idx} OF 04</div>
<div style="font-size:16px;font-weight:800;color:${NAVY};">${esc(d.title ?? "")}</div>
${rows.join("")}
</td></tr>`;
}

function topTraits(traits: any[]): string {
  if (!Array.isArray(traits) || traits.length === 0) return "";
  const items = traits.map((w) => `
    <tr><td style="padding:6px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="60" valign="top" style="font-size:24px;font-weight:800;color:${NAVY};text-align:center;">${esc(w.score)}</td>
        <td valign="top" style="background:${SAND};border-left:3px solid ${GOLD};padding:10px 12px;">
          <div style="font-size:13px;font-weight:700;color:${NAVY};margin-bottom:4px;">${esc(w.name)}</div>
          ${w.warning ? `<div style="font-size:12px;line-height:1.5;">${esc(w.warning)}</div>` : ""}
        </td>
      </tr></table>
    </td></tr>`).join("");
  return `<tr><td style="padding:8px 32px 18px;">
<div style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:${GOLD};margin-bottom:8px;">ELITE STRENGTHS · TOP THREE</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items}</table>
</td></tr>`;
}

function tradeOff(letting: string[], gaining: string[]): string {
  const rows = Math.max(letting?.length ?? 0, gaining?.length ?? 0);
  let body = "";
  for (let i = 0; i < rows; i++) {
    body += `<tr>
      <td valign="top" width="50%" style="padding:6px;background:${SAND};border-top:1px solid ${GOLD};font-size:12px;line-height:1.5;">${esc(letting?.[i] ?? "")}</td>
      <td valign="top" width="50%" style="padding:6px;background:${SAND};border-top:1px solid ${GOLD};font-size:12px;line-height:1.5;">${esc(gaining?.[i] ?? "")}</td>
    </tr>`;
  }
  return `<tr><td style="padding:8px 32px 18px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="50%" style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:${GOLD};padding:0 6px 6px;">LET GO OF</td>
<td width="50%" style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:${NAVY};padding:0 6px 6px;">YOU GAIN</td>
</tr>${body}</table>
</td></tr>`;
}

function nineHabits(items: any[]): string {
  if (!Array.isArray(items)) return "";
  return `<tr><td style="padding:8px 32px 18px;">${items.map((t) => `
    <div style="background:${SAND};border-left:3px solid ${GOLD};padding:10px 12px;margin-bottom:8px;">
      <div style="font-size:12px;font-weight:800;color:${NAVY};text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">${esc(t.name)}</div>
      ${t.why ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.16em;color:${GOLD};margin-top:6px;">WHY IT HAPPENS</div><div style="font-size:12px;line-height:1.5;">${esc(t.why)}</div>` : ""}
      <div style="font-size:10px;font-weight:700;letter-spacing:0.16em;color:${GOLD};margin-top:6px;">LEADERSHIP IMPACT</div>
      <div style="font-size:12px;line-height:1.5;">${esc(t.impact)}</div>
      <div style="font-size:10px;font-weight:700;letter-spacing:0.16em;color:${GOLD};margin-top:6px;">MONDAY SCRIPT</div>
      <div style="font-size:12px;line-height:1.5;font-style:italic;">"${esc(t.script)}"</div>
    </div>`).join("")}</td></tr>`;
}

function ninetyDay(s: any): string {
  const months = [
    { n: "Diagnose", w: "MONTH 1 · Days 1–30", s: s?.m1, f: s?.m1_focus, h: s?.m1_human_shift, ai: s?.m1_ai },
    { n: "Design",   w: "MONTH 2 · Days 31–60", s: s?.m2, f: s?.m2_focus, h: s?.m2_human_shift, ai: s?.m2_ai },
    { n: "Lead",     w: "MONTH 3 · Days 61–90", s: s?.m3, f: s?.m3_focus, h: s?.m3_human_shift, ai: s?.m3_ai },
  ];
  return `<tr><td style="padding:8px 32px 18px;">${months.map((p) => `
    <div style="margin-bottom:14px;">
      <div style="font-size:16px;font-weight:800;color:${NAVY};">${esc(p.n)} <span style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:${GOLD};margin-left:8px;">${esc(p.w)}</span></div>
      ${p.s ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.18em;color:${GOLD};margin-top:6px;">THIS MONTH</div><div style="font-size:13px;line-height:1.55;">${esc(p.s)}</div>` : ""}
      ${p.f ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.18em;color:${GOLD};margin-top:6px;">FOCUS</div><div style="font-size:13px;line-height:1.55;">${esc(p.f)}</div>` : ""}
      ${p.h ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.18em;color:${GOLD};margin-top:6px;">HUMAN SHIFT</div><div style="font-size:13px;line-height:1.55;">${esc(p.h)}</div>` : ""}
      ${p.ai ? `<div style="font-size:10px;font-weight:700;letter-spacing:0.18em;color:${GOLD};margin-top:6px;">AI AS A LEVER</div><div style="font-size:13px;line-height:1.55;">${esc(p.ai)}</div>` : ""}
    </div>`).join("")}</td></tr>`;
}

export interface SuccessEmailInput {
  clientName: string;
  reportId: string | null;
  report: any;
  scores: Record<string, number>;
}

export function renderSuccessEmail(input: SuccessEmailInput): { subject: string; html: string; text: string } {
  const { clientName, reportId, report, scores } = input;
  const r = report ?? {};
  const meta = r.metadata ?? {};
  const subject = `Your Pivot Report${reportId ? ` · ${reportId}` : ""} — The Human Delta™`;

  const cover = `<tr><td style="background:${NAVY};color:#fff;padding:36px 32px;text-align:center;">
<div style="font-size:10px;letter-spacing:0.22em;color:${GOLD};font-weight:700;">PERFORMANCE AUDIT</div>
<div style="font-size:10px;letter-spacing:0.22em;font-weight:700;margin-top:24px;">THE HUMAN DELTA™</div>
<h1 style="font-size:34px;font-weight:800;letter-spacing:-0.01em;margin:8px 0 6px;">The Pivot Report</h1>
<div style="font-size:10px;letter-spacing:0.22em;color:${GOLD};font-weight:700;margin-bottom:18px;">POWERED BY TEMR GROWTH SCIENTIFIC STANDARDS</div>
<div style="height:1px;width:120px;background:${GOLD};margin:18px auto;"></div>
<div style="font-size:10px;letter-spacing:0.25em;color:${GOLD};font-weight:700;">ARCHETYPE</div>
<div style="font-size:24px;font-weight:800;margin-top:6px;">${esc(meta.archetype ?? "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;text-align:left;">
<tr>
<td width="50%" style="padding:6px 12px;"><div style="font-size:9px;font-weight:700;letter-spacing:0.2em;color:${GOLD};">NAME</div><div style="font-size:13px;font-weight:700;">${esc(clientName || "—")}</div></td>
<td width="50%" style="padding:6px 12px;"><div style="font-size:9px;font-weight:700;letter-spacing:0.2em;color:${GOLD};">DELTA SCORE</div><div style="font-size:13px;font-weight:700;">${esc(meta.delta_score ?? "—")} / 100</div></td>
</tr></table>
${reportId ? `<div style="font-size:9px;letter-spacing:0.25em;color:${GOLD};font-weight:700;margin-top:16px;">REPORT ID · ${esc(reportId)}</div>` : ""}
</td></tr>`;

  const greeting = `<tr><td style="padding:24px 32px 4px;">
<div style="font-size:14px;line-height:1.55;color:${INK};">Hello ${esc(clientName || "")},</div>
<div style="font-size:13px;line-height:1.55;color:${INK};margin-top:8px;">Your Forensic Pivot Report is enclosed below. Save this email — your unique Report ID lets you retrieve this report at any time at <a href="https://www.thehumandelta.com" style="color:${NAVY};">thehumandelta.com</a>.</div>
</td></tr>`;

  const pillarBlock = section("EXHIBIT 01", "Pillar Yield") + pillarYield(scores) + (meta.anchor_signal ? callout("ANCHOR SIGNAL", meta.anchor_signal) : "");

  const sec01 = section("SECTION 01", "The Big Picture")
    + (r.sec_01?.headline ? band("HEADLINE", esc(r.sec_01.headline)) : "")
    + (r.sec_01?.insight ? band("CRITICAL INSIGHT", esc(r.sec_01.insight)) : "")
    + (r.sec_01?.hidden_cost ? band("THE HIDDEN COST", esc(r.sec_01.hidden_cost)) : "")
    + (r.sec_01?.long_term_cost ? band("THE LONG-TERM COST", esc(r.sec_01.long_term_cost)) : "");

  const sec015 = section("SECTION 01.5", "The Growth Hurdle")
    + (r.sec_01_5?.headline ? band("HEADLINE", esc(r.sec_01_5.headline)) : "")
    + (r.sec_01_5?.logic ? band("WHY YOUR STRENGTH IS THE BRAKE", esc(r.sec_01_5.logic)) : "");

  const sec02 = section("SECTION 02", "The Ninety-Second Summary")
    + (r.sec_02?.three_bullets?.[0] ? band("THE REALITY", esc(r.sec_02.three_bullets[0])) : "")
    + (r.sec_02?.three_bullets?.[1] ? band("THE HURDLE", esc(r.sec_02.three_bullets[1])) : "")
    + (r.sec_02?.three_bullets?.[2] ? band("THE PIVOT", esc(r.sec_02.three_bullets[2])) : "")
    + (r.sec_02?.pivot_logic ? band("WHY THIS PIVOT", esc(r.sec_02.pivot_logic)) : "");

  const bottlenecks = [r.sec_03, r.sec_04, r.sec_05, r.sec_06]
    .map((d, i) => bottleneckCard(i + 1, d)).join("");

  const sec07 = section("SECTION 07", "The Trade-Off") + tradeOff(r.sec_07?.letting_go ?? [], r.sec_07?.gaining ?? []);

  const sec08 = section("SECTION 08", "The Power and the Cost")
    + (r.sec_08?.strengths ? band("ELITE STRENGTHS", esc(r.sec_08.strengths)) : "")
    + topTraits(r.sec_08?.top_traits ?? [])
    + (r.sec_08?.tax_logic ? band("THE COST OF MISAPPLICATION", esc(r.sec_08.tax_logic)) : "");

  const sec09 = section("SECTION 09", "Nine Leadership Habits") + nineHabits(r.sec_09 ?? []);

  const sec10 = section("SECTION 10", "The Ninety-Day Journey") + ninetyDay(r.sec_10 ?? {});

  const sec11 = section("SECTION 11", "The Professional Case")
    + (r.sec_11?.memo ? band("MEMO TO YOUR MANAGER", esc(r.sec_11.memo)) : "")
    + (r.sec_11?.logic ? band("THE BUSINESS LOGIC", esc(r.sec_11.logic)) : "");

  const sec12 = section("SECTION 12", "The Weekly Command")
    + (r.sec_12?.metric ? band("VELOCITY METRIC", esc(r.sec_12.metric)) : "")
    + (r.sec_12?.target ? callout("THIS WEEK'S TARGET", r.sec_12.target) : "");

  const sec13 = section("SECTION 13", "The Choice")
    + (r.sec_13?.choice ? band("THE BINARY CHOICE", esc(r.sec_13.choice)) : "")
    + (r.sec_13?.command ? callout("YOUR COMMAND", r.sec_13.command) : "");

  const sec14 = section("SECTION 14", "The Ninety-Day Habit Warning")
    + (r.sec_14?.gravity ? band("THE NEUROLOGICAL GRAVITY", esc(r.sec_14.gravity)) : "")
    + (r.sec_14?.strategy ? band("THE STRATEGY", esc(r.sec_14.strategy)) : "");

  const sec15 = section("NOTICE OF PLASTICITY", "")
    + (r.sec_15?.scientific_framing ? band("SCIENTIFIC FRAMING", esc(r.sec_15.scientific_framing)) : "")
    + (r.sec_15?.disclaimer ? band("NON-CLINICAL STATUS & NEUROPLASTICITY", esc(r.sec_15.disclaimer)) : "");

  const html = shell(cover + greeting + pillarBlock + sec01 + sec015 + sec02 + bottlenecks + sec07 + sec08 + sec09 + sec10 + sec11 + sec12 + sec13 + sec14 + sec15);

  const text = `Hello ${clientName || ""},

Your Pivot Report is ready.

Archetype: ${meta.archetype ?? "—"}
Delta Score: ${meta.delta_score ?? "—"} / 100
${reportId ? `Report ID: ${reportId}\n` : ""}
Anchor Signal: ${meta.anchor_signal ?? "—"}

You can view your full report any time at https://www.thehumandelta.com — keep this email and your Report ID.

— The Human Delta™`;

  return { subject, html, text };
}

export function renderFailureEmail(clientName: string): { subject: string; html: string; text: string } {
  const subject = "We couldn't generate your Pivot Report — please re-submit (no charge)";
  const html = shell(`<tr><td style="background:${NAVY};color:#fff;padding:32px;text-align:center;">
<div style="font-size:10px;letter-spacing:0.22em;color:${GOLD};font-weight:700;">PERFORMANCE AUDIT</div>
<h1 style="font-size:24px;font-weight:800;margin:10px 0 0;">A small detour</h1>
</td></tr>
<tr><td style="padding:28px 32px;">
<div style="font-size:14px;line-height:1.6;color:${INK};">Hello ${esc(clientName || "")},</div>
<div style="font-size:13px;line-height:1.6;color:${INK};margin-top:10px;">Our analyst hit a temporary issue while generating your Forensic Pivot Report. Your payment is safe — and you will <strong>not</strong> be charged again.</div>
<div style="font-size:13px;line-height:1.6;color:${INK};margin-top:10px;">Please re-submit your audit using the link below. We have flagged this as a re-attempt so the system will skip the payment step.</div>
<div style="text-align:center;margin:28px 0 8px;"><a href="https://www.thehumandelta.com/questionnaire?reattempt=1" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.04em;padding:14px 24px;">Re-submit my audit (no charge)</a></div>
<div style="font-size:12px;line-height:1.6;color:${GREY};margin-top:14px;">If the issue persists, please reply to this email and we'll personally see it through.</div>
</td></tr>`);

  const text = `Hello ${clientName || ""},

Our analyst hit a temporary issue while generating your Pivot Report. Your payment is safe — you will NOT be charged again.

Please re-submit your audit at: https://www.thehumandelta.com/questionnaire?reattempt=1

If the issue persists, just reply to this email.

— The Human Delta™`;
  return { subject, html, text };
}