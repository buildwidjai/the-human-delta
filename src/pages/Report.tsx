import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import deltaLogo from "@/assets/delta-logo.png";
import {
  type GenerateReportResponse,
  type LeadershipReportV124,
  type ReportMeta,
} from "@/services/reportGenerator";
import { fetchReport } from "@/services/reportRetriever";

const PILLAR_FULL: Record<"T" | "E" | "M" | "R", string> = {
  T: "Tactical", E: "Emotional", M: "Mental", R: "Relational",
};

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  const retrieveId = searchParams.get("id");
  const retrieveHash = searchParams.get("hash");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GenerateReportResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (isDemo) {
        setData(DEMO_REPORT);
        setLoading(false);
        return;
      }
      // ── Free-retrieval path ─────────────────────────────────────────
      // /report?id=HD-2026-XXXXXX&hash=<sha256>
      // No payment is required — the row was paid for at generation time.
      if (retrieveId && retrieveHash) {
        try {
          const result = await fetchReport(retrieveId, retrieveHash);
          if (cancelled) return;
          setData(result);
        } catch (e) {
          if (!cancelled) setError((e as Error).message);
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }
      // No retrieval id → there is nothing to render here. Reports are
      // delivered by email after payment, so send the user back to the
      // questionnaire entry point.
      navigate("/", { replace: true });
    }
    run();
    return () => { cancelled = true; };
  }, [navigate, isDemo, retrieveId, retrieveHash]);

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print"><Navbar /></div>
      <main className="pt-28 pb-24 print:pt-0 print:pb-0">
        <div className="container mx-auto px-6 max-w-4xl print:max-w-none print:px-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
              <Loader2 className="w-10 h-10 animate-spin text-foreground mb-6" />
              <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-2">Calibrating your audit</p>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">The Human Delta™ Analyst is reviewing your data</h1>
              <p className="text-sm text-muted-foreground max-w-md">Building your 15-section Forensic Pivot Report. This usually takes 45-90 seconds.</p>
            </div>
          )}

          {error && !loading && (
            <div className="py-20 text-center animate-fade-in">
              <AlertCircle className="w-10 h-10 text-foreground mx-auto mb-6" />
              <h1 className="text-2xl font-extrabold text-foreground mb-3">We couldn't load this report</h1>
              <p className="text-[11px] text-muted-foreground mb-8 max-w-md mx-auto opacity-70">{error}</p>
              <Link
                to="/my-reports"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-semibold text-white bg-foreground"
              >
                Go to my reports
              </Link>
            </div>
          )}

          {!loading && !error && data && <ReportBody data={data} />}
        </div>
      </main>
      <div className="no-print"><Footer /></div>
      <ReportPrintStyles />
    </div>
  );
}

// ── v8 design tokens (navy & gold, Inter) ───────────────────────────────
const NAVY = "#0B1F3A";
const GOLD = "#C9A24B";
const INK = "#1B1B1B";
const GREY = "#6B6B6B";
const SAND = "#F4F1E6";
const SAND_BORDER = "#E6DFCB";

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

function ReportBody({ data }: { data: GenerateReportResponse }) {
  const r: LeadershipReportV124 = data.report;
  const meta: ReportMeta = data.meta;
  const scores = meta.pillarScores;
  const clientName = meta.clientName ?? "";
  const industry = meta.industry ?? "";
  const bottlenecks = [r.sec_03, r.sec_04, r.sec_05, r.sec_06];

  return (
    <div className="report-root font-[Inter,sans-serif]" style={{ color: INK }}>
      {meta.reportId && (
        <div className="no-print mb-4 flex items-center justify-end">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-semibold tracking-[0.18em] uppercase"
            style={{ background: SAND, color: NAVY, border: `1px solid ${SAND_BORDER}` }}
          >
            <span style={{ color: GOLD }}>Report ID</span>
            <span>{meta.reportId}</span>
          </span>
        </div>
      )}
      <div className="no-print flex justify-end mb-6 gap-3">
        <Link to="/questionnaire" className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-semibold border" style={{ borderColor: NAVY, color: NAVY }}>
          Retake the audit
        </Link>
      </div>

      {/* COVER */}
      <PrintPage cover>
        <div className="flex flex-col items-center justify-between h-full text-center" style={{ color: "#fff" }}>
          <div className="w-full pt-2">
            <p className="text-[11px] tracking-[0.2em] font-semibold" style={{ color: GOLD }}>PERFORMANCE AUDIT</p>
          </div>
          <div className="flex flex-col items-center">
            <img src={deltaLogo} alt="The Human Delta" className="w-28 h-28 object-contain mb-10" />
            <p className="text-[11px] tracking-[0.2em] font-bold mb-6">THE HUMAN DELTA™</p>
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight">The Pivot Report</h1>
            <p className="text-[10px] tracking-[0.2em] font-semibold mb-6" style={{ color: GOLD }}>POWERED BY TEMR GROWTH SCIENTIFIC STANDARDS</p>
            <p className="text-sm max-w-xl leading-relaxed">An evidence-based snapshot of professional operating performance across Tactical, Emotional, Mental, and Relational capacity.</p>
            <div className="my-6" style={{ width: 160, height: 1, background: GOLD }} />
            <p className="text-[10px] tracking-[0.25em] font-semibold mb-4" style={{ color: GOLD }}>ARCHETYPE</p>
            <p className="text-3xl font-extrabold tracking-tight">{r.metadata.archetype}</p>
          </div>
          <div className="w-full grid grid-cols-3 gap-4 text-left mt-8">
            <CoverCell label="NAME" value={clientName || "—"} />
            <CoverCell label="INDUSTRY" value={industry || "—"} />
            <CoverCell label="OVERALL DELTA SCORE" value={`${r.metadata.delta_score} / 100`} />
          </div>
          {clientName && (
            <p className="text-[9px] tracking-[0.25em] font-semibold mt-3 self-start" style={{ color: GOLD }}>
              CONFIDENTIAL REPORT ONLY FOR {clientName.toUpperCase()}
            </p>
          )}
          <p className="text-[9px] tracking-[0.25em] font-semibold mt-4" style={{ color: GOLD }}>
            CONFIDENTIAL · THE HUMAN DELTA™ · TEMR GROWTH (SWEDEN) · © 2026
          </p>
        </div>
      </PrintPage>

      {/* PILLAR YIELD + ANCHOR */}
      <PrintPage>
        <PageHeader right="EXHIBIT 01" />
        <SectionTitle kicker="EXHIBIT 01" title="Pillar Yield" />
        <div className="grid grid-cols-4 gap-3 mb-8">
          {(["T", "E", "M", "R"] as const).map((k) => (
            <div key={k} className="text-center">
              <p className="text-[10px] tracking-[0.2em] font-bold mb-2" style={{ color: GOLD }}>{PILLAR_FULL[k].toUpperCase()}</p>
              <p className="text-4xl font-extrabold" style={{ color: NAVY }}>{scores[k]}</p>
              <p className="text-[10px]" style={{ color: GREY }}>/100</p>
            </div>
          ))}
        </div>
        <Callout label="ANCHOR SIGNAL">{r.metadata.anchor_signal}</Callout>
      </PrintPage>

      {/* SECTION 01 */}
      <PrintPage>
        <PageHeader right="SECTION 01" />
        <SectionTitle kicker="SECTION 01" title="The Big Picture" context={SECTION_CONTEXT["01"]} />
        <ExhibitLabel>EXHIBIT · TEMR PILLAR RADAR</ExhibitLabel>
        <div className="flex justify-center my-3 py-4" style={{ background: SAND, border: `1px solid ${SAND_BORDER}` }}>
          <Radar scores={scores} />
        </div>
        <p className="text-[11px] italic text-center mb-6" style={{ color: GREY }}>
          Pillar yields plotted against the 100-point ceiling. The asymmetry between Tactical and Emotional capacity is the visible Delta Gap.
        </p>
        <Para label="HEADLINE">{r.sec_01.headline}</Para>
        <Para label="CRITICAL INSIGHT">{r.sec_01.insight}</Para>
        {r.sec_01.hidden_cost && <Para label="THE HIDDEN COST">{r.sec_01.hidden_cost}</Para>}
        {r.sec_01.long_term_cost && <Para label="THE LONG-TERM COST">{r.sec_01.long_term_cost}</Para>}
      </PrintPage>

      {/* SECTION 01.5 */}
      <PrintPage>
        <PageHeader right="SECTION 01.5" />
        <SectionTitle kicker="SECTION 01.5" title="The Growth Hurdle" context={SECTION_CONTEXT["01.5"]} />
        {r.sec_01_5.headline && (
          <h3 className="text-2xl font-extrabold tracking-tight mb-4 leading-snug" style={{ color: NAVY }}>
            {r.sec_01_5.headline}
          </h3>
        )}
        <Para label="WHY YOUR STRENGTH IS THE BRAKE">{r.sec_01_5.logic}</Para>
      </PrintPage>

      {/* SECTION 02 */}
      <PrintPage>
        <PageHeader right="SECTION 02" />
        <SectionTitle kicker="SECTION 02" title="The Ninety-Second Summary" context={SECTION_CONTEXT["02"]} />
        {r.sec_02.three_bullets?.[0] && <Para label="THE REALITY">{r.sec_02.three_bullets[0]}</Para>}
        {r.sec_02.three_bullets?.[1] && <Para label="THE HURDLE">{r.sec_02.three_bullets[1]}</Para>}
        {r.sec_02.three_bullets?.[2] && <Para label="THE PIVOT">{r.sec_02.three_bullets[2]}</Para>}
        {r.sec_02.pivot_logic && <Para label="WHY THIS PIVOT">{r.sec_02.pivot_logic}</Para>}
      </PrintPage>

      {/* SECTIONS 03–06 — Bottlenecks */}
      {bottlenecks.map((d, i) => (
        <PrintPage key={`bn-${i}`}>
          <PageHeader right={`SECTION 0${i + 3}`} />
          <SectionTitle kicker={`SECTION 0${i + 3}`} title={d.title} context={SECTION_CONTEXT.bottlenecks} />
          <p className="text-[10px] font-bold tracking-[0.2em] mb-3" style={{ color: GOLD }}>BOTTLENECK 0{i + 1} OF 04</p>
          <LabelBlock label="WHY IT HAPPENS">{d.why}</LabelBlock>
          {d.observable && <LabelBlock label="WHAT IT LOOKS LIKE">{d.observable}</LabelBlock>}
          {d.performance_tax && <LabelBlock label="THE REAL COST">{d.performance_tax}</LabelBlock>}
          <Callout label="THE WIN">{d.the_win}</Callout>
        </PrintPage>
      ))}

      {/* SECTION 07 */}
      <PrintPage>
        <PageHeader right="SECTION 07" />
        <SectionTitle kicker="SECTION 07" title="The Trade-Off" context={SECTION_CONTEXT["07"]} />
        <TradeOffGrid letting_go={r.sec_07.letting_go ?? []} gaining={r.sec_07.gaining ?? []} />
      </PrintPage>

      {/* SECTION 08 */}
      <PrintPage>
        <PageHeader right="SECTION 08" />
        <SectionTitle kicker="SECTION 08" title="The Power and the Cost" context={SECTION_CONTEXT["08"]} />
        {r.sec_08.strengths && <p className="text-[12.5px] leading-relaxed mb-5">{r.sec_08.strengths}</p>}
        <p className="text-[10px] font-bold tracking-[0.2em] mb-3" style={{ color: GOLD }}>ELITE STRENGTHS · TOP THREE</p>
        {(r.sec_08.top_traits ?? []).map((w, i) => (
          <div key={i} className="flex gap-4 mb-4 p-4" style={{ background: SAND, borderLeft: `3px solid ${GOLD}` }}>
            <div className="text-3xl font-extrabold flex-shrink-0 w-14 text-center" style={{ color: NAVY }}>{w.score}</div>
            <div>
              <h4 className="font-bold text-sm mb-1" style={{ color: NAVY }}>{w.name}</h4>
              {w.warning && <p className="text-[12px] leading-snug">{w.warning}</p>}
            </div>
          </div>
        ))}
        {r.sec_08.tax_logic && <Para label="THE COST OF MISAPPLICATION">{r.sec_08.tax_logic}</Para>}
      </PrintPage>

      {/* SECTION 09 */}
      <PrintPage>
        <PageHeader right="SECTION 09" />
        <SectionTitle kicker="SECTION 09" title="Nine Leadership Habits" context={SECTION_CONTEXT["09"]} />
        <div className="grid grid-cols-1 gap-3">
          {(r.sec_09 ?? []).map((t, i) => (
            <div key={i} className="p-4" style={{ background: SAND, borderLeft: `3px solid ${GOLD}` }}>
              <h4 className="font-bold text-sm tracking-wide uppercase mb-2" style={{ color: NAVY }}>{t.name}</h4>
              {t.why && (
                <>
                  <p className="text-[10px] font-bold tracking-[0.15em] mb-1 mt-1" style={{ color: GOLD }}>WHY IT HAPPENS</p>
                  <p className="text-[12px] leading-snug mb-2">{t.why}</p>
                </>
              )}
              <p className="text-[10px] font-bold tracking-[0.15em] mb-1 mt-1" style={{ color: GOLD }}>LEADERSHIP IMPACT</p>
              <p className="text-[12px] leading-snug mb-2">{t.impact}</p>
              <div className="pt-2 border-t" style={{ borderColor: SAND_BORDER }}>
                <p className="text-[10px] font-bold tracking-[0.15em] mb-1" style={{ color: GOLD }}>MONDAY SCRIPT</p>
                <p className="text-[12px] italic">"{t.script}"</p>
              </div>
            </div>
          ))}
        </div>
      </PrintPage>

      {/* SECTION 10 */}
      <PrintPage>
        <PageHeader right="SECTION 10" />
        <SectionTitle kicker="SECTION 10" title="The Ninety-Day Journey" context={SECTION_CONTEXT["10"]} />
        {([
          { name: "Diagnose", when: "MONTH 1  ·  Days 1 to 30", summary: r.sec_10.m1, focus: r.sec_10.m1_focus, shift: r.sec_10.m1_human_shift, ai: r.sec_10.m1_ai },
          { name: "Design",   when: "MONTH 2  ·  Days 31 to 60", summary: r.sec_10.m2, focus: r.sec_10.m2_focus, shift: r.sec_10.m2_human_shift, ai: r.sec_10.m2_ai },
          { name: "Lead",     when: "MONTH 3  ·  Days 61 to 90", summary: r.sec_10.m3, focus: r.sec_10.m3_focus, shift: r.sec_10.m3_human_shift, ai: r.sec_10.m3_ai },
        ]).map((p, i) => (
          <div key={p.name}>
            {i > 0 && <hr className="my-5" style={{ borderColor: "#E5E5E5" }} />}
            <div className="flex items-baseline gap-6 mb-2">
              <h3 className="text-xl font-extrabold" style={{ color: NAVY }}>{p.name}</h3>
              <p className="text-[10px] font-bold tracking-[0.2em]" style={{ color: GOLD }}>{p.when}</p>
            </div>
            {p.summary && <LabelBlock label="THIS MONTH">{p.summary}</LabelBlock>}
            {p.focus && <LabelBlock label="FOCUS">{p.focus}</LabelBlock>}
            {p.shift && <LabelBlock label="HUMAN SHIFT">{p.shift}</LabelBlock>}
            {p.ai && <LabelBlock label="AI AS A LEVER">{p.ai}</LabelBlock>}
          </div>
        ))}
      </PrintPage>

      {/* SECTION 11 */}
      <PrintPage>
        <PageHeader right="SECTION 11" />
        <SectionTitle kicker="SECTION 11" title="The Professional Case" context={SECTION_CONTEXT["11"]} />
        <Para label="MEMO TO YOUR MANAGER">{r.sec_11.memo}</Para>
        <Para label="THE BUSINESS LOGIC">{r.sec_11.logic}</Para>
      </PrintPage>

      {/* SECTIONS 12 & 13 */}
      <PrintPage>
        <PageHeader right="SECTIONS 12 & 13" />
        <SectionTitle kicker="SECTION 12" title="The Weekly Command" context={SECTION_CONTEXT["12-14"]} />
        <Para label="VELOCITY METRIC">{r.sec_12.metric}</Para>
        <Callout label="THIS WEEK'S TARGET">{r.sec_12.target}</Callout>
        <div className="mt-8">
          <SectionTitle kicker="SECTION 13" title="The Choice" context={SECTION_CONTEXT["12-14"]} />
          <Para label="THE BINARY CHOICE">{r.sec_13.choice}</Para>
          {r.sec_13.command && <Callout label="YOUR COMMAND">{r.sec_13.command}</Callout>}
        </div>
      </PrintPage>

      {/* SECTION 14 */}
      <PrintPage>
        <PageHeader right="SECTION 14" />
        <SectionTitle kicker="SECTION 14" title="The Ninety-Day Habit Warning" context={SECTION_CONTEXT["12-14"]} />
        <Para label="THE NEUROLOGICAL GRAVITY">{r.sec_14.gravity}</Para>
        <Para label="THE STRATEGY">{r.sec_14.strategy}</Para>
      </PrintPage>

      {/* SECTION 15 */}
      <PrintPage>
        <PageHeader right="NOTICE OF PLASTICITY" />
        <div className="flex flex-col items-center mb-8 mt-4">
          <img src={deltaLogo} alt="The Human Delta" className="w-16 h-16 object-contain mb-4 opacity-90" />
          <p className="text-[10px] font-bold tracking-[0.25em] mb-2" style={{ color: GOLD }}>NOTICE OF PLASTICITY</p>
          <div style={{ width: 80, height: 1, background: GOLD }} />
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: NAVY }}>1. SCIENTIFIC FRAMING</h3>
            <p className="text-[12.5px] leading-relaxed">{r.sec_15.scientific_framing}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: NAVY }}>2. NON-CLINICAL STATUS & NEUROPLASTICITY</h3>
            <p className="text-[12.5px] leading-relaxed">{r.sec_15.disclaimer}</p>
          </div>
        </div>
        <p className="text-[10px] text-center mt-12" style={{ color: GREY }}>
          Full Notice of Plasticity: thehumandelta.com/plasticity
        </p>
      </PrintPage>
    </div>
  );
}

// ── Building blocks (unchanged design tokens) ────────────────────────
function PrintPage({ children, cover = false }: { children: React.ReactNode; cover?: boolean }) {
  return (
    <section className="report-page mb-6 print:mb-0 print:break-after-page" style={{ background: cover ? NAVY : "#fff", color: cover ? "#fff" : INK, padding: cover ? "32px 48px" : "40px 56px", border: cover ? "none" : `1px solid #EFEFEF`, borderRadius: 4 }}>
      {children}
    </section>
  );
}
function PageHeader({ right }: { right: string }) {
  return (
    <div className="flex justify-between items-center pb-2 mb-6" style={{ borderBottom: `0.5px solid #E5E5E5` }}>
      <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: NAVY }}>THE HUMAN DELTA™</span>
      <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: GOLD }}>{right}</span>
    </div>
  );
}
function SectionTitle({ kicker, title, context }: { kicker: string; title: string; context?: string }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold tracking-[0.2em] mb-3" style={{ color: GOLD }}>{kicker}</p>
      <h2 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: NAVY }}>{title}</h2>
      <div style={{ width: 60, height: 1.5, background: GOLD }} className="mb-3" />
      {context && <p className="text-[12px] italic mb-2" style={{ color: NAVY }}>{context}</p>}
    </div>
  );
}
function ExhibitLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold tracking-[0.2em] mb-2" style={{ color: GOLD }}>{children}</p>;
}
function Para({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold tracking-[0.2em] mb-2" style={{ color: GOLD }}>{label}</p>
      <p className="text-[12.5px] leading-relaxed">{children}</p>
    </div>
  );
}
function LabelBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 mb-3">
      <p className="text-[10px] font-bold tracking-[0.18em] pt-0.5" style={{ color: GOLD }}>{label}</p>
      <p className="text-[12.5px] leading-snug">{children}</p>
    </div>
  );
}
function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-4 my-3" style={{ background: SAND, border: `1px solid ${SAND_BORDER}` }}>
      <p className="text-[10px] font-bold tracking-[0.2em] mb-2" style={{ color: GOLD }}>{label}</p>
      <p className="text-[12.5px] leading-relaxed">{children}</p>
    </div>
  );
}
function CoverCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold tracking-[0.2em] mb-1" style={{ color: GOLD }}>{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
function splitHeadlineBody(raw: string): { h: string; b: string } {
  const s = (raw ?? "").trim();
  if (!s) return { h: "", b: "" };
  const m = s.match(/^([^.!?]+[.!?])\s+(.+)$/s);
  if (m) return { h: m[1].trim(), b: m[2].trim() };
  return { h: s, b: "" };
}
function TradeOffGrid({ letting_go, gaining }: { letting_go: string[]; gaining: string[] }) {
  const rows = Math.max(letting_go.length, gaining.length, 5);
  const Cell = ({ raw }: { raw: string }) => {
    const { h, b } = splitHeadlineBody(raw);
    return (
      <div className="p-3" style={{ background: SAND, borderTop: `1px solid ${GOLD}` }}>
        {h && <p className="text-[12px] font-bold leading-snug mb-1" style={{ color: NAVY }}>{h}</p>}
        {b && <p className="text-[11px] leading-snug">{b}</p>}
      </div>
    );
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-2">
        <p className="text-[10px] font-bold tracking-[0.2em]" style={{ color: GOLD }}>LET GO OF</p>
        <p className="text-[10px] font-bold tracking-[0.2em]" style={{ color: NAVY }}>YOU GAIN</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: rows }).flatMap((_, i) => [
          <Cell key={`l-${i}`} raw={letting_go[i] ?? ""} />,
          <Cell key={`r-${i}`} raw={gaining[i] ?? ""} />,
        ])}
      </div>
    </div>
  );
}
function Radar({ scores }: { scores: Record<"T" | "E" | "M" | "R", number> }) {
  const cx = 260, cy = 210, r = 140;
  const pts = [
    { x: cx, y: cy - r * (scores.T / 100) },
    { x: cx + r * (scores.E / 100), y: cy },
    { x: cx, y: cy + r * (scores.M / 100) },
    { x: cx - r * (scores.R / 100), y: cy },
  ];
  const polygon = pts.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg viewBox="0 0 520 420" width="460" height="370" xmlns="http://www.w3.org/2000/svg" aria-label="TEMR Radar">
      <g fill="none" stroke="#C8C8D2" strokeWidth="0.8">
        <polygon points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} />
        <polygon points={`${cx},${cy - r * 0.75} ${cx + r * 0.75},${cy} ${cx},${cy + r * 0.75} ${cx - r * 0.75},${cy}`} />
        <polygon points={`${cx},${cy - r * 0.5} ${cx + r * 0.5},${cy} ${cx},${cy + r * 0.5} ${cx - r * 0.5},${cy}`} />
        <polygon points={`${cx},${cy - r * 0.25} ${cx + r * 0.25},${cy} ${cx},${cy + r * 0.25} ${cx - r * 0.25},${cy}`} />
        <line x1={cx} y1={cy} x2={cx} y2={cy - r} />
        <line x1={cx} y1={cy} x2={cx + r} y2={cy} />
        <line x1={cx} y1={cy} x2={cx} y2={cy + r} />
        <line x1={cx} y1={cy} x2={cx - r} y2={cy} />
      </g>
      <polygon points={polygon} fill="#C8CDE6" fillOpacity="0.55" stroke={NAVY} strokeWidth="1.6" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill={GOLD} />)}
      <g fontFamily="Inter,sans-serif" textAnchor="middle">
        <text x={cx} y="48" fill={NAVY} fontSize="13" fontWeight="700" letterSpacing="1.6">TACTICAL</text>
        <text x={cx} y="66" fill={GOLD} fontSize="15" fontWeight="700">{scores.T}</text>
        <text x="460" y="206" fill={NAVY} fontSize="13" fontWeight="700" letterSpacing="1.6">EMOTIONAL</text>
        <text x="460" y="224" fill={GOLD} fontSize="15" fontWeight="700">{scores.E}</text>
        <text x={cx} y="372" fill={NAVY} fontSize="13" fontWeight="700" letterSpacing="1.6">MENTAL</text>
        <text x={cx} y="390" fill={GOLD} fontSize="15" fontWeight="700">{scores.M}</text>
        <text x="60" y="206" fill={NAVY} fontSize="13" fontWeight="700" letterSpacing="1.6">RELATIONAL</text>
        <text x="60" y="224" fill={GOLD} fontSize="15" fontWeight="700">{scores.R}</text>
      </g>
    </svg>
  );
}

function ReportPrintStyles() {
  return (
    <style>{`
      @media print {
        @page { size: A4; margin: 12mm; }
        html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
        .no-print { display: none !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        main { padding: 0 !important; }
        .container { max-width: none !important; padding: 0 !important; margin: 0 !important; }
        .report-page { break-after: page; page-break-after: always; break-inside: avoid; border: none !important; border-radius: 0 !important; margin: 0 !important; box-shadow: none !important; }
        .report-page:last-child { break-after: auto; page-break-after: auto; }
        .report-root { color: #1B1B1B !important; }
      }
      .report-root { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    `}</style>
  );
}

// ── Demo data — visible at /report?demo=1 ─────────────────────────────
const DEMO_REPORT: GenerateReportResponse = {
  meta: {
    pillarScores: { T: 78, E: 54, M: 71, R: 62 },
    overall: 66,
    archetype: "Strategic Operator",
    primary: "T", secondary: "M", lowest: "E",
    tierLevel: "Tier 2: Operator",
    clientName: "Casey Smith",
    industry: "Financial Services",
  },
  report: {
    metadata: {
      archetype: "Strategic Operator",
      archetype_key: "strategic_operator",
      delta_score: 66,
      primary_pillar: "T",
      anchor_signal: "Doing too much of the work. Designing too little of the system.",
    },
    sec_01: { context: "...", headline: "Doing too much of the work. Designing too little of the system.", insight: "You are working longer hours to cover for a lack of clear team processes. The current way of working relies on your individual effort rather than a repeatable system.", hidden_cost: "The hidden cost is the leadership work that never gets done because tactical work always wins the day.", long_term_cost: "By trading future career growth for today's tactical stability, you are quietly making yourself too essential to be promoted." },
    sec_01_5: { context: "The Growth Hurdle", headline: "Being the best person at doing the work is now the main thing holding you back from the next level of leadership.", logic: "Being the best person at doing the work is now the primary obstacle to becoming a senior leader." },
    sec_02: { context: "...", three_bullets: [
      "You are delivering at a senior level, and the engine running underneath that delivery is your personal stamina.",
      "Your fixer instinct gets the team out of trouble fast, which is why everyone leans on it.",
      "Move from solving the work to designing how the work gets done.",
    ], pivot_logic: "Your job becomes preventing the next ten problems, not fixing this one faster." },
    sec_03: { title: "Decision Fatigue", why: "You re-decide the same questions every week.", observable: "A third of your week goes on choices already made under different names.", performance_tax: "By the time you reach the bigger thinking, your energy is gone.", the_win: "You move from Manual Operator to System Designer." },
    sec_04: { title: "The Permission Trap", why: "Every difficult call comes back to you.", observable: "Your team holds questions until your next 1:1.", performance_tax: "The team grows slowly and your calendar fills up.", the_win: "You build a Team of Owners." },
    sec_05: { title: "Recurring Fires", why: "The same problems return because no process is being built.", observable: "Three familiar problems return every two weeks in slightly different language.", performance_tax: "The team puts out the same fires repeatedly.", the_win: "You earn a reputation for Root-Cause Leadership." },
    sec_06: { title: "The Visibility Gap", why: "Senior leaders see the work, not the leadership.", observable: "Your skip-level can describe outputs, not the calls behind them.", performance_tax: "Your promotion case builds slowly.", the_win: "You secure Stakeholder Alignment." },
    sec_07: { context: "...", letting_go: ["Stop answering every small question yourself.", "Stop accepting unclear briefs.", "Stop softening every no.", "Stop treating each fire as new.", "Stop carrying decisions in your head."], gaining: ["Four hours of protected thinking time.", "A written guide for who decides what.", "A weekly note to your skip-level.", "Two named owners for recurring problems.", "Clear, respectful asks of your manager."] },
    sec_08: { context: "...", strengths: "Each of these is a top-decile capability. The point is not to dim them, it is to redirect them.", tax_logic: "Spent on small fires they cap your growth; spent on design and prevention they move you to the next level.", top_traits: [
      { name: "Reliability under pressure", score: 88, warning: "Every difficult problem flows to you, which prevents the team from building a better way." },
      { name: "Speed of execution", score: 84, warning: "You fix problems before the team can learn the pattern." },
      { name: "Quality control", score: 81, warning: "When the final check sits with you the team never owns quality." },
    ] },
    sec_09: [
      { name: "Asks for help early", why: "You wait until problems escalate before flagging them.", impact: "Builds professional trust before projects go off-track.", script: "I am about 60% on this. Could you give me ten minutes of your view before I commit?" },
      { name: "Names what is going on in the room", why: "Tension goes unspoken and decisions get made around it.", impact: "Marks you as a leader who can hold a room under pressure.", script: "I can sense some tension on this one. Let us name it before we plan the next step." },
      { name: "Hands over the decision, not just the task", why: "You delegate work but keep the judgement calls.", impact: "Marks you as a leader who builds high-performing teams.", script: "You own this decision. Come back with what you decided." },
      { name: "Protects time for strategic work", why: "Your calendar fills with reactive requests by default.", impact: "Tells the organisation your judgement is a scarce resource.", script: "Tuesday morning is a hard block for thinking work. Route everything else around it." },
      { name: "Writes decisions down", why: "The same questions return because nothing is documented.", impact: "Builds a track record as a leader whose judgement scales.", script: "I will write this up as a simple guideline so we do not have to decide it again." },
      { name: "Says no clearly and respectfully", why: "You soften refusals until the message gets lost.", impact: "Reads as conviction at the senior level.", script: "No, that is not the priority for this quarter. Here is what we are focused on instead." },
      { name: "Asks your manager for what you need", why: "You absorb friction instead of escalating cleanly.", impact: "Positions you as a leader who manages upwards with clarity.", script: "To deliver this well, I need your help with one specific thing by next week." },
      { name: "Closes the loop on feedback", why: "Feedback gets received but rarely visibly acted on.", impact: "Builds a reputation as a coachable senior leader.", script: "Two weeks ago you gave me feedback. Here is what I changed and what I am seeing." },
      { name: "Disagrees openly with senior leaders", why: "You hold back dissent to keep the room comfortable.", impact: "Establishes you as a peer-level thinker in the senior room.", script: "I see this differently. Here is my reasoning. Whatever we decide, I will back it fully." },
    ],
    sec_10: { context: "...",
      m1: "Look at how your week really works, and start to remove the noise.",
      m1_focus: "Audit calendar and messages from the last 30 days for repeating questions.",
      m1_human_shift: "From Fixer to Scientist. You stop reaching for the fix on instinct.",
      m1_ai: "Use AI to audit your calendar for low-value recurring tasks and surface candidates for elimination.",
      m2: "Design how the team works, and hand the right calls to the right people.",
      m2_focus: "Write three short team guides and one decision-rights page.",
      m2_human_shift: "From Shield to Architect of Autonomy.",
      m2_ai: "Draft team guides and decision-rights documents with AI, then refine with the team.",
      m3: "Make your leadership visible, and let the new way of working compound.",
      m3_focus: "Send a one-page weekly summary to your skip-level every Friday.",
      m3_human_shift: "From Tactical Operator to Visible Strategist.",
      m3_ai: "Use AI to summarise weekly team activity into a crisp executive note for your skip-level.",
    },
    sec_11: { context: "...", memo: "A senior performer currently spending most of their week on small problems instead of the leadership work the company needs.", logic: "Protecting eight hours a week of strategic design time moves the team from a person-dependent model to a scalable system." },
    sec_12: { context: "...", metric: "Reduce reactive work by half, measured 90 days from now against this week as the baseline.", target: "Pick one recurring problem. Name a clear owner who is not you. Step back and let them lead it." },
    sec_13: { choice: "Continue working harder every year, or start building a team that can eventually run without you.", command: "Choose one decision today and hand it permanently to a named owner." },
    sec_14: { context: "...", gravity: "New leadership habits take about 90 days to feel natural. The brain physically rewires when behaviour is repeated often enough.", strategy: "If you abandon the change inside the first 30 days the old pattern wins by default. Treat the first month as the price of admission." },
    sec_15: { scientific_framing: "This Pivot Report is a professional development diagnostic based on the TEMR Growth (Sweden) framework, using Industrial-Organisational psychology models to provide a snapshot of your current performance architecture.", disclaimer: "This report is for leadership development, not a clinical diagnosis. Leadership behaviours are not static; deliberate practice across the 90-day journey can rewire these patterns. Your delta is a measurable gap, not a permanent ceiling." },
  },
};
