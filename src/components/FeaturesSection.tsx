import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const YerkesDodsonIcon = () => (
  <svg viewBox="0 0 120 80" className="w-full h-20 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5">
    {/* Axes */}
    <line x1="20" y1="65" x2="110" y2="65" className="text-muted-foreground/30" />
    <line x1="20" y1="10" x2="20" y2="65" className="text-muted-foreground/30" />
    {/* Inverted-U curve */}
    <path d="M 22 62 Q 40 58, 50 40 Q 60 18, 65 15 Q 70 18, 80 40 Q 90 58, 108 62" className="text-accent" strokeWidth="2" />
    {/* Optimal zone marker */}
    <circle cx="65" cy="15" r="3" className="fill-accent text-accent" />
    {/* Labels */}
    <text x="65" y="78" textAnchor="middle" className="fill-muted-foreground" fontSize="6" fontFamily="Inter, sans-serif">Arousal →</text>
    <text x="8" y="40" textAnchor="middle" className="fill-muted-foreground" fontSize="6" fontFamily="Inter, sans-serif" transform="rotate(-90, 8, 40)">Performance</text>
  </svg>
);

const JohariWindowIcon = () => (
  <svg viewBox="0 0 120 100" className="w-full h-20 mb-4" fill="none" stroke="currentColor" strokeWidth="1">
    {/* Grid */}
    <rect x="15" y="15" width="90" height="70" className="text-muted-foreground/20" strokeWidth="1.5" />
    <line x1="55" y1="15" x2="55" y2="85" className="text-muted-foreground/30" />
    <line x1="15" y1="50" x2="105" y2="50" className="text-muted-foreground/30" />
    {/* Quadrant fills */}
    <rect x="15" y="15" width="40" height="35" className="fill-accent/10" stroke="none" />
    <rect x="55" y="15" width="50" height="35" className="fill-muted-foreground/5" stroke="none" />
    <rect x="15" y="50" width="40" height="35" className="fill-muted-foreground/5" stroke="none" />
    <rect x="55" y="50" width="50" height="35" className="fill-muted-foreground/10" stroke="none" />
    {/* Labels */}
    <text x="35" y="36" textAnchor="middle" className="fill-foreground" fontSize="6" fontWeight="700" fontFamily="Inter, sans-serif">Open</text>
    <text x="80" y="36" textAnchor="middle" className="fill-muted-foreground" fontSize="5.5" fontWeight="600" fontFamily="Inter, sans-serif">Blind Spot</text>
    <text x="35" y="70" textAnchor="middle" className="fill-muted-foreground" fontSize="5.5" fontWeight="600" fontFamily="Inter, sans-serif">Hidden</text>
    <text x="80" y="70" textAnchor="middle" className="fill-muted-foreground" fontSize="5.5" fontWeight="600" fontFamily="Inter, sans-serif">Unknown</text>
  </svg>
);

const FeaturesSection = () => {
  return (
    <section className="py-28 bg-card">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16">
          <p className="text-accent font-sans text-xs tracking-[0.25em] uppercase mb-4">
            The Science
          </p>
          <h2 className="font-sans font-extrabold text-3xl md:text-4xl text-foreground tracking-tight mb-6">
            Performance Science, Not Personality Quizzes.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto">
            The Human Delta™ framework, powered by TEMR Growth (Sweden), utilises
            established behavioural models to provide an objective snapshot of your
            professional operating system. We map your results against:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="p-8 rounded-lg bg-background border border-border">
            <YerkesDodsonIcon />
            <p className="text-xs tracking-[0.2em] uppercase text-accent mb-3 font-bold">
              The Yerkes-Dodson Law
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed font-light">
              Identifying your optimal pressure threshold to avoid diminishing returns.
              This model, grounded in Industrial-Organisational Psychology, maps the
              relationship between arousal and performance — ensuring you operate at
              peak efficiency.
            </p>
          </div>
          <div className="p-8 rounded-lg bg-background border border-border">
            <JohariWindowIcon />
            <p className="text-xs tracking-[0.2em] uppercase text-accent mb-3 font-bold">
              The Johari Window
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed font-light">
              Exposing the blind spots that limit your relational influence. Used
              extensively in professional coaching, this framework quantifies
              self-awareness and interpersonal transparency across organisational
              hierarchies.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/methodology"
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 text-sm font-semibold transition-colors duration-300"
          >
            Explore the full methodology
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
