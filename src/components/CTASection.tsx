import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-28 bg-background">
      <div className="container mx-auto px-6 text-center max-w-3xl">
        <p className="text-accent font-sans text-xs tracking-[0.25em] uppercase mb-4">
          Begin
        </p>
        <h2 className="font-sans font-extrabold text-3xl md:text-4xl text-foreground mb-6 tracking-tight">
          Ready to Decode Your <span className="text-gradient-gold">Performance Architecture</span>?
        </h2>
        <p className="font-sans text-muted-foreground text-base mb-10 leading-relaxed font-light">
          Professionals across industries use The Human Delta™ Pivot Report
          to gain an evidence-based understanding of their operating system
          and accelerate career velocity.
        </p>
        <Link
          to="/questionnaire"
          className="inline-flex items-center gap-2 bg-accent text-foreground font-semibold px-8 py-4 rounded-lg text-sm tracking-wide hover:opacity-90 transition-all duration-300 shadow-gold"
        >
          Start Assessment
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
