import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Plasticity = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="container mx-auto px-6 max-w-3xl animate-fade-in-up">
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-4 font-sans">
            Legal &amp; Compliance
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2 tracking-tight font-sans">
            Notice of Plasticity
          </h1>
          <p className="text-lg text-muted-foreground font-light mb-12 font-sans">
            The Human Delta™
          </p>

          <div className="space-y-10">
            {/* Section 1 */}
            <section className="p-8 rounded-lg bg-card border border-border">
              <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-muted-foreground mb-4 font-sans">
                1. Nature of the Assessment
              </h2>
              <p className="text-foreground/80 leading-relaxed font-light font-sans">
                This Pivot Report is a professional development diagnostic based on the TEMR Growth (Sweden) framework. It utilises Industrial-Organisational (I/O) Psychology models—specifically the Yerkes-Dodson Law and the Johari Window—to provide a snapshot of your current Performance Architecture.
              </p>
            </section>

            {/* Section 2 */}
            <section className="p-8 rounded-lg bg-card border border-border">
              <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-muted-foreground mb-4 font-sans">
                2. Non-Clinical Status
              </h2>
              <p className="text-foreground/80 leading-relaxed font-light font-sans">
                This report is intended for leadership development and personal growth. It is an evidence-based behavioural assessment, not a medical or clinical psychiatric diagnosis. The findings should be used to inform career strategy and behavioural habits.
              </p>
            </section>

            {/* Section 3 */}
            <section className="p-8 rounded-lg bg-card border border-border">
              <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-muted-foreground mb-4 font-sans">
                3. The Principle of Neuroplasticity
              </h2>
              <p className="text-foreground/80 leading-relaxed font-light font-sans">
                We operate on the foundational principle that leadership behaviours are not static. Your TEMR scores represent your "As-Is" operating state. Through deliberate practice and the implementation of the 90-Day Roadmap, these neural and behavioural patterns can be rewired. Your "Delta" is a measurable gap, not a permanent ceiling.
              </p>
            </section>
          </div>

          <div className="mt-12 text-center text-xs text-muted-foreground tracking-[0.15em] uppercase font-sans border-t border-border pt-6">
            THE HUMAN DELTA™ | TEMR Growth (Sweden) | Framework v3.1
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Plasticity;
