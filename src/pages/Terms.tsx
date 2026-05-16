import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  const updated = "13 May 2026";
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <article className="container mx-auto px-6 max-w-3xl">
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-4">Legal</p>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">Terms of Service</h1>
          <p className="text-xs text-muted-foreground mb-10">Last updated: {updated}</p>

          <Section title="1. Who you're contracting with">
            <p>The Human Delta™ is provided by TEMR Growth (Sweden). By using the service you agree to these terms.</p>
          </Section>
          <Section title="2. The service">
            <p>The Human Delta™ generates a leadership Pivot Report based on a 32-question Performance Audit. The report is a development aid produced by an automated pipeline including a large language model. It is not professional advice and is not a substitute for clinical, legal, financial, or HR judgement.</p>
          </Section>
          <Section title="3. Eligibility">
            <p>You must be at least 18 years old (or the age of majority in your jurisdiction) to use this service.</p>
          </Section>
          <Section title="4. Payment">
            <p>Reports are sold on a one-off basis through Stripe. Prices and currencies are shown at checkout. Payment unlocks one report generation, plus free re-download and one free re-attempt if generation fails for technical reasons.</p>
          </Section>
          <Section title="5. Refunds">
            <p>If we fail to deliver a report due to a technical fault on our side and the re-attempt also fails, contact <a href="mailto:support@thehumandelta.com" className="underline">support@thehumandelta.com</a> within 14 days for a full refund.</p>
          </Section>
          <Section title="6. Intellectual property">
            <p>The TEMR™ framework, the questionnaire, the archetype library, and all narrative templates are © TEMR Growth. The report we deliver to you is yours to use for personal and internal organisational development. You may not resell it, scrape the service, or use outputs to train competing models.</p>
          </Section>
          <Section title="7. Acceptable use">
            <p>Don't submit other people's data without authority, attempt to bypass payment, abuse the service to generate spam, or interfere with the operation of the platform.</p>
          </Section>
          <Section title="8. Disclaimer & liability">
            <p>The service is provided "as is". To the maximum extent permitted by law, TEMR Growth's total liability for any claim arising out of or in connection with the service is limited to the amount you paid for the report giving rise to the claim.</p>
          </Section>
          <Section title="9. Privacy">
            <p>Our processing of personal data is described in the Privacy Policy.</p>
          </Section>
          <Section title="10. Governing law">
            <p>These terms are governed by the laws of Sweden. Disputes are subject to the exclusive jurisdiction of the courts of Stockholm, except where mandatory consumer-protection law gives you the right to bring proceedings in your country of residence.</p>
          </Section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-lg font-bold text-foreground mb-3">{title}</h2>
    <div className="text-sm text-foreground/80 font-light leading-relaxed space-y-3">{children}</div>
  </section>
);

export default Terms;