const steps = [
  {
    number: "01",
    title: "Complete the Assessment",
    description: "Answer carefully designed questions that measure your operating performance across Tactical, Emotional, Mental, and Relational capacities.",
  },
  {
    number: "02",
    title: "We Analyse Your Responses",
    description: "Your answers are mapped against evidence-based behavioural models by the TEMR Growth research framework to build your performance profile.",
  },
  {
    number: "03",
    title: "Receive Your Pivot Report",
    description: "Get a comprehensive, personalised report with your Archetype, scientific analysis, and a 90-Day Performance Roadmap.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-28 bg-foreground">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-accent font-sans text-xs tracking-[0.25em] uppercase mb-4">
            How It Works
          </p>
          <h2 className="font-sans font-extrabold text-3xl md:text-4xl text-primary-foreground tracking-tight">
            Three Steps to Performance Clarity
          </h2>
          <p className="text-primary-foreground/50 text-sm mt-4 font-light tracking-wide">
            Powered by the TEMR Growth (Sweden) Performance Lab.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="text-6xl font-sans font-extrabold text-accent/15 mb-4">{step.number}</div>
              <h3 className="font-sans font-bold text-lg text-primary-foreground mb-3">{step.title}</h3>
              <p className="font-sans text-primary-foreground/50 text-sm leading-relaxed font-light">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
