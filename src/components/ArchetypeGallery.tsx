const archetypes = [
  {
    name: "The Operational Strategist",
    description: "Translates strategy into action so personally that the system can't yet run without you holding the pen.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="18" cy="24" r="7" />
        <circle cx="33" cy="24" r="5" />
        <line x1="25" y1="24" x2="28" y2="24" />
      </svg>
    ),
  },
  {
    name: "The Dynamic Catalyst",
    description: "Ignites momentum so quickly the team rarely learns to start the engine without you in the room.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M26 6 L16 26 L24 26 L22 42 L34 22 L26 22 Z" />
      </svg>
    ),
  },
  {
    name: "The Collaborative Pilot",
    description: "Steers every conversation so smoothly that decisions quietly default to passing through your seat first.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="24" cy="24" r="16" />
        <polygon points="24,12 28,24 24,36 20,24" />
      </svg>
    ),
  },
  {
    name: "The Cultural Architect",
    description: "Shapes the room so deliberately that the culture forgets how to calibrate itself without your standard.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="8" width="32" height="32" />
        <line x1="8" y1="18" x2="40" y2="18" />
        <line x1="8" y1="28" x2="40" y2="28" />
        <line x1="18" y1="8" x2="18" y2="40" />
        <line x1="28" y1="8" x2="28" y2="40" />
      </svg>
    ),
  },
  {
    name: "The Strategic Diplomat",
    description: "Holds competing interests in balance so carefully that the hardest calls quietly migrate onto your desk.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="24" y1="8" x2="24" y2="34" />
        <line x1="10" y1="16" x2="38" y2="16" />
        <circle cx="14" cy="26" r="5" />
        <circle cx="34" cy="26" r="5" />
        <line x1="16" y1="38" x2="32" y2="38" />
      </svg>
    ),
  },
  {
    name: "The Creative Visionary",
    description: "Sees the future so vividly that present execution runs one step behind the picture in your head.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="24,6 28,18 40,18 30,26 34,38 24,30 14,38 18,26 8,18 20,18" />
      </svg>
    ),
  },
  {
    name: "The Systemic Thinker",
    description: "Maps every second-order consequence so thoroughly that the first move becomes the slowest one to make.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="24" cy="10" r="3" />
        <circle cx="10" cy="30" r="3" />
        <circle cx="38" cy="30" r="3" />
        <circle cx="24" cy="40" r="3" />
        <line x1="24" y1="13" x2="11" y2="28" />
        <line x1="24" y1="13" x2="37" y2="28" />
        <line x1="12" y1="31" x2="36" y2="31" />
        <line x1="12" y1="32" x2="22" y2="38" />
        <line x1="36" y1="32" x2="26" y2="38" />
      </svg>
    ),
  },
  {
    name: "The Empathetic Driver",
    description: "Carries the team's emotional weight so quietly that the cost only shows in the work you redo.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M24 38 C12 30 10 20 16 16 C20 13 24 16 24 20 C24 16 28 13 32 16 C38 20 36 30 24 38 Z" />
        <path d="M14 24 L34 24" />
        <path d="M30 20 L34 24 L30 28" />
      </svg>
    ),
  },
  {
    name: "The Relational Leader",
    description: "Cares for the team so deeply that their wellbeing has fused with the work as a personal debt.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="14" cy="18" r="5" />
        <circle cx="34" cy="18" r="5" />
        <path d="M6 38 C6 30 12 26 14 26 C16 26 22 30 22 38" />
        <path d="M26 38 C26 30 32 26 34 26 C36 26 42 30 42 38" />
        <line x1="19" y1="32" x2="29" y2="32" />
      </svg>
    ),
  },
  {
    name: "The Resilient Fixer",
    description: "Resolves every fire so reliably that the organisation has stopped investing in preventing the next one.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M24 6 L38 12 V24 C38 33 32 39 24 42 C16 39 10 33 10 24 V12 Z" />
        <path d="M24 16 L20 26 L26 26 L22 34" />
      </svg>
    ),
  },
  {
    name: "The Precision Specialist",
    description: "Perfects every detail so completely that the broader strategy waits on your standard before it can ship.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="24" cy="24" r="16" />
        <circle cx="24" cy="24" r="8" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
        <line x1="24" y1="4" x2="24" y2="12" />
        <line x1="24" y1="36" x2="24" y2="44" />
        <line x1="4" y1="24" x2="12" y2="24" />
        <line x1="36" y1="24" x2="44" y2="24" />
      </svg>
    ),
  },
  {
    name: "The Strategic Operator",
    description: "The best operator in the room — which is precisely why the senior seat keeps moving sideways past you.",
    icon: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="8" y="8" width="32" height="32" />
        <line x1="24" y1="8" x2="24" y2="40" />
        <line x1="8" y1="24" x2="40" y2="24" />
      </svg>
    ),
  },
];

const ArchetypeGallery = () => {
  return (
    <section className="py-28 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <p className="text-accent font-sans text-xs tracking-[0.25em] uppercase mb-4">
            The Archetypes
          </p>
          <h2 className="font-sans font-extrabold text-3xl md:text-4xl text-foreground tracking-tight mb-4">
            Twelve Operating Profiles.
          </h2>
          <p className="text-muted-foreground text-lg font-light">
            Which one is currently running you?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {archetypes.map((archetype) => (
            <div
              key={archetype.name}
              className="group p-6 rounded-lg bg-card border border-border hover:border-accent/30 transition-all duration-500"
            >
              <div className="text-muted-foreground/40 group-hover:text-accent transition-colors duration-500 mb-5">
                {archetype.icon}
              </div>
              <h3 className="font-sans font-bold text-sm text-foreground mb-2 tracking-wide">
                {archetype.name}
              </h3>
              <p className="font-sans text-muted-foreground text-xs leading-relaxed">
                {archetype.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArchetypeGallery;
