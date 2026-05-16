import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import deltaLogo from "@/assets/delta-logo.png";

const pillars = [
  {
    name: "Tactical",
    definition:
      "The capacity to convert intention into measurable output. Tactical strength is reflected in structured prioritisation, disciplined execution rhythms, and the ability to close the gap between planning and delivery under real-world constraints.",
  },
  {
    name: "Emotional",
    definition:
      "The capacity to regulate internal state under pressure. Emotional strength manifests as composure during ambiguity, separation of self-worth from outcomes, and the presence of deliberate recovery protocols after high-intensity demands.",
  },
  {
    name: "Mental",
    definition:
      "The capacity to think clearly, adaptively, and strategically. Mental strength is characterised by root-cause analysis, comfort with incomplete data, second-order thinking, and the ability to hold competing perspectives simultaneously.",
  },
  {
    name: "Relational",
    definition:
      "The capacity to build trust, navigate organisational dynamics, and influence without authority. Relational strength includes boundary management, political fluency, psychological safety creation, and adaptive communication across hierarchies.",
  },
];

const Methodology = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-24">
        {/* Hero */}
        <section className="container mx-auto px-6 max-w-3xl mb-24 animate-fade-in-up">
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-4">
            The Framework
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            The Methodology
          </h1>
          <p className="text-lg text-muted-foreground font-light leading-relaxed max-w-2xl">
            The Human Delta™ Pivot Report is built on an evidence-based framework that measures
            operational performance across four interdependent capacities. It is a system
            calibration — not a personality test.
          </p>
        </section>

        {/* TEMR Pillars */}
        <section className="container mx-auto px-6 max-w-3xl mb-24">
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-4">
            Core Architecture
          </p>
          <h2 className="text-3xl font-extrabold text-foreground mb-10 tracking-tight">
            The TEMR Pillars
          </h2>

          <div className="space-y-8">
            {pillars.map((pillar) => (
              <div
                key={pillar.name}
                className="p-6 rounded-lg bg-card border border-border"
              >
                <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-muted-foreground mb-3">
                  {pillar.name}
                </h3>
                <p className="text-foreground/80 font-light leading-relaxed">
                  {pillar.definition}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* The Golden Delta */}
        <section className="container mx-auto px-6 max-w-3xl mb-24 text-center">
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-4">
            The Symbol
          </p>
          <h2 className="text-3xl font-extrabold text-foreground mb-6 tracking-tight">
            The Golden Delta
          </h2>
          <p className="text-muted-foreground font-light leading-relaxed max-w-xl mx-auto mb-10">
            The Delta (Δ) represents the measurable gap between your current &lsquo;As-Is&rsquo;
            operating state and your achievable &lsquo;To-Be&rsquo; state. The Pivot Report
            quantifies this gap and provides the roadmap to close it.
          </p>
          <div className="flex justify-center">
            <img
              src={deltaLogo}
              alt="The Golden Delta — symbol of the gap between As-Is and To-Be"
              className="w-40 h-40 object-contain"
              width={512}
              height={512}
            />
          </div>
        </section>

        {/* TEMR Growth Origin */}
        <section className="container mx-auto px-6 max-w-3xl mb-24">
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-4">
            Partnership
          </p>
          <h2 className="text-3xl font-extrabold text-foreground mb-6 tracking-tight">
            The TEMR Growth Origin
          </h2>
          <p className="text-muted-foreground font-light leading-relaxed max-w-2xl">
            The Human Delta™ was developed in collaboration with TEMR Growth in Sweden. This
            partnership ensures that every report is grounded in cutting-edge behavioural science,
            mapping the relationship between pressure, cognitive load, and relational capital.
          </p>
        </section>

        {/* Scientific Mirrors */}
        <section className="container mx-auto px-6 max-w-3xl mb-24">
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-4">
            Scientific Mirrors
          </p>
          <h2 className="text-3xl font-extrabold text-foreground mb-10 tracking-tight">
            The Psychological Models
          </h2>

          {/* Yerkes-Dodson */}
          <div className="p-8 rounded-lg bg-card border border-border mb-8">
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-muted-foreground mb-4">
              The Yerkes-Dodson Law
            </h3>
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground/60 mb-6">
              Performance × Arousal
            </p>

            {/* Thin-line SVG diagram */}
            <div className="flex justify-center mb-8">
              <svg viewBox="0 0 320 180" className="w-full max-w-md" fill="none" strokeWidth="1.5">
                {/* Axes */}
                <line x1="40" y1="150" x2="300" y2="150" stroke="currentColor" className="text-border" />
                <line x1="40" y1="20" x2="40" y2="150" stroke="currentColor" className="text-border" />
                {/* Grid lines */}
                <line x1="40" y1="85" x2="300" y2="85" stroke="currentColor" className="text-border" strokeDasharray="4 4" opacity="0.3" />
                {/* Inverted-U curve */}
                <path d="M 45 145 Q 90 130, 120 80 Q 150 25, 170 20 Q 190 25, 220 80 Q 250 130, 295 145" stroke="currentColor" className="text-foreground" strokeWidth="2.5" />
                {/* Optimal zone */}
                <circle cx="170" cy="20" r="5" className="fill-accent text-accent" />
                <line x1="170" y1="28" x2="170" y2="150" stroke="currentColor" className="text-accent" strokeDasharray="3 3" opacity="0.4" />
                {/* Axis labels */}
                <text x="170" y="170" textAnchor="middle" className="fill-muted-foreground" fontSize="10" fontFamily="Inter, sans-serif">Arousal →</text>
                <text x="15" y="88" textAnchor="middle" className="fill-muted-foreground" fontSize="10" fontFamily="Inter, sans-serif" transform="rotate(-90, 15, 88)">Performance</text>
                <text x="170" y="14" textAnchor="middle" className="fill-accent" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="600">Optimal</text>
                {/* Zone labels */}
                <text x="80" y="165" textAnchor="middle" className="fill-muted-foreground" fontSize="8" fontFamily="Inter, sans-serif" opacity="0.6">Under-activation</text>
                <text x="260" y="165" textAnchor="middle" className="fill-muted-foreground" fontSize="8" fontFamily="Inter, sans-serif" opacity="0.6">Over-activation</text>
              </svg>
            </div>

            <div className="space-y-4 text-foreground/80 font-light leading-relaxed">
              <p>
                The Yerkes-Dodson Law describes the empirical relationship between physiological
                arousal and cognitive performance. Widely applied in Industrial-Organisational
                Psychology and professional coaching, it demonstrates that performance increases
                with arousal up to an optimal point, after which further arousal causes
                performance to deteriorate — forming the characteristic inverted-U curve.
              </p>
              <p>
                In the Pivot Report, your <strong className="font-semibold">Emotional pillar score</strong> is
                mapped onto this curve. A score in the 40–70% range suggests you are operating
                near the optimal zone — sufficient activation to drive focus without tipping into
                burnout. Below 40% indicates potential under-activation and disengagement risk.
                Above 80% may signal over-activation and chronic stress exposure.
              </p>
              <p>
                The practical implication is straightforward: sustainable high performance requires
                deliberate arousal management — not maximum effort, but calibrated intensity.
              </p>
            </div>
          </div>

          <p className="text-muted-foreground/50 text-xs italic mt-4 text-right">
            Visualised via TEMR Growth Performance Science Frameworks.
          </p>

          {/* Johari Window */}
          <div className="p-8 rounded-lg bg-card border border-border">
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-muted-foreground mb-4">
              The Johari Window
            </h3>
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground/60 mb-6">
              Blind Spots × Transparency
            </p>

            {/* Thin-line SVG diagram */}
            <div className="flex justify-center mb-8">
              <svg viewBox="0 0 280 240" className="w-full max-w-sm" fill="none" strokeWidth="1.5">
                {/* Main grid */}
                <rect x="40" y="30" width="200" height="170" stroke="currentColor" className="text-border" strokeWidth="1.5" rx="2" />
                <line x1="130" y1="30" x2="130" y2="200" stroke="currentColor" className="text-border" />
                <line x1="40" y1="110" x2="240" y2="110" stroke="currentColor" className="text-border" />
                {/* Quadrant fills */}
                <rect x="41" y="31" width="88" height="78" className="fill-accent/8" />
                <rect x="131" y="31" width="108" height="78" className="fill-muted-foreground/5" />
                <rect x="41" y="111" width="88" height="88" className="fill-muted-foreground/5" />
                <rect x="131" y="111" width="108" height="88" className="fill-muted-foreground/8" />
                {/* Labels */}
                <text x="85" y="75" textAnchor="middle" className="fill-foreground" fontSize="12" fontWeight="700" fontFamily="Inter, sans-serif">Open / Free</text>
                <text x="185" y="75" textAnchor="middle" className="fill-muted-foreground" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">Blind Spot</text>
                <text x="85" y="160" textAnchor="middle" className="fill-muted-foreground" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">Hidden</text>
                <text x="185" y="160" textAnchor="middle" className="fill-muted-foreground" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">Unknown</text>
                {/* Axis labels */}
                <text x="140" y="222" textAnchor="middle" className="fill-muted-foreground" fontSize="9" fontFamily="Inter, sans-serif">Known to Self →</text>
                <text x="18" y="118" textAnchor="middle" className="fill-muted-foreground" fontSize="9" fontFamily="Inter, sans-serif" transform="rotate(-90, 18, 118)">Known to Others →</text>
              </svg>
            </div>

            <div className="space-y-4 text-foreground/80 font-light leading-relaxed">
              <p>
                The Johari Window, developed by psychologists Joseph Luft and Harrington Ingham,
                is a framework widely used in Industrial-Organisational Psychology and executive
                coaching to understand self-awareness and interpersonal dynamics. It divides
                personal awareness into four quadrants: Open (known to self and others), Blind
                Spot (known to others but not self), Hidden (known to self but not others), and
                Unknown (known to neither).
              </p>
              <p>
                Your <strong className="font-semibold">Relational pillar score</strong> determines the
                relative size of your Open/Free area in the report. A higher Relational score
                expands the Open quadrant — indicating greater trust, feedback flow, and
                transparency in professional relationships. A lower score enlarges the Blind Spot
                and Hidden areas, suggesting opportunities to increase self-disclosure and actively
                solicit feedback.
              </p>
              <p>
                Expanding the Open area is not about vulnerability for its own sake. It is about
                reducing the information asymmetry that creates friction in teams, decisions, and
                stakeholder relationships.
              </p>
            </div>
          </div>
          <p className="text-muted-foreground/50 text-xs italic mt-4 text-right">
            Visualised via TEMR Growth Performance Science Frameworks.
          </p>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 max-w-3xl text-center">
          <Link
            to="/questionnaire"
            className="inline-flex items-center gap-2 bg-foreground text-primary-foreground font-semibold px-8 py-4 rounded-lg text-sm hover:opacity-90 transition-all duration-300"
          >
            Begin Your Performance Audit
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Methodology;
