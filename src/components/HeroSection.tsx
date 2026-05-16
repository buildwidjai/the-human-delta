import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import deltaLogo from "@/assets/delta-logo.png";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-foreground/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl">
        <div className="animate-fade-in-up">
          <p className="text-accent font-sans text-xs tracking-[0.35em] uppercase mb-6">
            Performance Architecture
          </p>
          <h1 className="font-sans font-extrabold text-4xl md:text-6xl lg:text-7xl text-primary-foreground leading-tight mb-4 tracking-tight">
            The Human Delta<span className="text-accent">™</span>
            <span className="block text-accent text-3xl md:text-5xl lg:text-6xl mt-2 font-extrabold">
              The Pivot Report
            </span>
          </h1>
          <p className="font-sans text-base md:text-lg text-primary-foreground/60 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Master your Performance Architecture. Uncover the hidden variables in your
            execution, expose critical blind spots, and secure the evidence-based strategy
            required to pivot your career velocity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/questionnaire"
              className="inline-flex items-center gap-2 bg-accent text-foreground font-semibold px-8 py-4 rounded-lg text-sm tracking-wide hover:opacity-90 transition-all duration-300 shadow-gold"
            >
              Start Assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-primary-foreground/30 text-xs mt-8 font-sans tracking-wide">
            Takes approximately 15 minutes · Evidence-based behavioural frameworks
          </p>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
