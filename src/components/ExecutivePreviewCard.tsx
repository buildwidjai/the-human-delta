import type { DerivedArchetype } from "@/lib/archetype-preview";

const NAVY = "#0B1F3A";
const GOLD = "#C9A24B";
const SAND = "#F4F1E6";
const SAND_BORDER = "#E6DFCB";

interface Props {
  clientName: string;
  archetype: DerivedArchetype;
  anchorSignal: string;
  forensicTeaser: string;
}

export function ExecutivePreviewCard({
  clientName,
  archetype,
  anchorSignal,
  forensicTeaser,
}: Props) {
  return (
    <div
      className="rounded-md p-8 md:p-10 mb-6"
      style={{ background: "#FFFFFF", border: `1px solid ${SAND_BORDER}` }}
    >
      {/* Eyebrow */}
      <p
        className="text-[10px] font-bold tracking-[0.25em] mb-8"
        style={{ color: GOLD }}
      >
        PERFORMANCE AUDIT · CONFIDENTIAL
        {clientName ? ` · ${clientName.toUpperCase()}` : ""}
      </p>

      {/* Archetype */}
      <p
        className="text-[10px] font-bold tracking-[0.25em] mb-3"
        style={{ color: GOLD }}
      >
        YOUR ARCHETYPE
      </p>
      <h2
        className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4"
        style={{ color: NAVY }}
      >
        {archetype.label}
      </h2>
      <p
        className="italic text-base md:text-lg leading-relaxed mb-6"
        style={{ color: NAVY, opacity: 0.85 }}
      >
        “{anchorSignal}”
      </p>
      <div style={{ width: 40, height: 1, background: GOLD }} className="mb-8" />

      {/* Forensic teaser */}
      <p
        className="text-[10px] font-bold tracking-[0.25em] mb-3"
        style={{ color: GOLD }}
      >
        CRITICAL INSIGHT — PREVIEW
      </p>
      <p
        className="text-[13.5px] leading-relaxed mb-2"
        style={{ color: "#1B1B1B" }}
      >
        {forensicTeaser}
      </p>
      <p className="text-[11px] italic mb-10" style={{ color: "#8A8A8A" }}>
        …continued in the full audit.
      </p>

      {/* V8 stack of blurred page thumbnails */}
      <p
        className="text-[10px] font-bold tracking-[0.25em] mb-4"
        style={{ color: GOLD }}
      >
        INSIDE YOUR 20-PAGE AUDIT
      </p>
      <div className="relative h-[260px] md:h-[300px] overflow-hidden rounded">
        <div className="absolute inset-0 flex items-center justify-center">
          <ThumbCover style={{ transform: "translate(-110px, 6px) rotate(-6deg)" }} />
          <ThumbRadar style={{ transform: "translate(-36px, -10px) rotate(-2deg)" }} />
          <ThumbBottleneck style={{ transform: "translate(40px, 4px) rotate(2deg)" }} />
          <ThumbTable style={{ transform: "translate(112px, -6px) rotate(6deg)" }} />
        </div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 55%, #FFFFFF 100%)",
          }}
        />
      </div>
    </div>
  );
}

// ── Thumbnails ────────────────────────────────────────────────────────
const THUMB_BASE: React.CSSProperties = {
  position: "absolute",
  width: 150,
  height: 210,
  filter: "blur(3px)",
  boxShadow: "0 12px 32px rgba(11,31,58,0.25)",
  background: "#FFFFFF",
  borderRadius: 4,
  overflow: "hidden",
};

function ThumbCover({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ ...THUMB_BASE, ...style, background: NAVY, padding: 14 }}>
      <div
        style={{
          fontSize: 6,
          letterSpacing: 1.5,
          color: GOLD,
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        PERFORMANCE AUDIT
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: GOLD,
          margin: "32px auto 14px",
        }}
      />
      <div
        style={{
          color: "#fff",
          fontWeight: 800,
          textAlign: "center",
          fontSize: 11,
          marginBottom: 6,
        }}
      >
        The Pivot Report
      </div>
      <div
        style={{ width: 50, height: 1, background: GOLD, margin: "10px auto" }}
      />
      <div
        style={{
          fontSize: 7,
          color: GOLD,
          textAlign: "center",
          letterSpacing: 1.2,
          fontWeight: 700,
        }}
      >
        ARCHETYPE
      </div>
    </div>
  );
}

function ThumbRadar({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ ...THUMB_BASE, ...style, padding: 12 }}>
      <div
        style={{ fontSize: 6, letterSpacing: 1.2, color: GOLD, fontWeight: 700 }}
      >
        SECTION 01
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: NAVY,
          marginTop: 4,
          marginBottom: 8,
        }}
      >
        The Big Picture
      </div>
      <div
        style={{
          background: SAND,
          border: `1px solid ${SAND_BORDER}`,
          height: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="90" height="90" viewBox="0 0 100 100">
          <polygon
            points="50,8 88,30 80,82 20,82 12,30"
            fill="none"
            stroke={NAVY}
            strokeWidth="0.6"
            opacity="0.4"
          />
          <polygon
            points="50,20 78,36 70,72 30,72 22,36"
            fill={GOLD}
            fillOpacity="0.25"
            stroke={GOLD}
            strokeWidth="1"
          />
        </svg>
      </div>
      <div
        style={{
          marginTop: 8,
          height: 4,
          background: "#EEE",
          borderRadius: 2,
        }}
      />
      <div
        style={{
          marginTop: 4,
          height: 4,
          background: "#EEE",
          borderRadius: 2,
          width: "70%",
        }}
      />
    </div>
  );
}

function ThumbBottleneck({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ ...THUMB_BASE, ...style, padding: 12 }}>
      <div
        style={{ fontSize: 6, letterSpacing: 1.2, color: GOLD, fontWeight: 700 }}
      >
        SECTION 03
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: NAVY,
          marginTop: 4,
          marginBottom: 8,
        }}
      >
        Bottleneck 01 of 04
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 5.5,
              color: GOLD,
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            {["WHY", "OBSERVABLE", "REAL COST", "THE WIN"][i - 1]}
          </div>
          <div style={{ height: 3, background: "#E2E2E2", borderRadius: 1 }} />
          <div
            style={{
              height: 3,
              background: "#E2E2E2",
              borderRadius: 1,
              marginTop: 2,
              width: "85%",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ThumbTable({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ ...THUMB_BASE, ...style, padding: 12 }}>
      <div
        style={{ fontSize: 6, letterSpacing: 1.2, color: GOLD, fontWeight: 700 }}
      >
        SECTION 08
      </div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: NAVY,
          marginTop: 4,
          marginBottom: 8,
        }}
      >
        Power & the Cost
      </div>
      {[92, 88, 84].map((s) => (
        <div
          key={s}
          style={{
            background: SAND,
            borderLeft: `3px solid ${GOLD}`,
            padding: 6,
            marginBottom: 6,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: NAVY,
              width: 22,
              textAlign: "center",
            }}
          >
            {s}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{ height: 3, background: "#D8D2BD", borderRadius: 1 }}
            />
            <div
              style={{
                height: 3,
                background: "#D8D2BD",
                borderRadius: 1,
                marginTop: 2,
                width: "70%",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}