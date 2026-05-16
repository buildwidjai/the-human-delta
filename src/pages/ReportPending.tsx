import { Link } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Confirmation page shown after the report job has been enqueued.
 * The report is generated server-side and emailed to the address captured
 * at payment time — there is no on-screen render and no download here.
 */
export default function ReportPending() {
  // Hint of the recipient — we don't know it on this page (raw email is
  // never persisted in the browser past the enqueue call), so we keep
  // the message generic but warm.
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="container mx-auto px-6 max-w-xl text-center animate-fade-in">
          <CheckCircle2 className="w-12 h-12 text-foreground mx-auto mb-6" />
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-2">
            Payment received
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
            Your Pivot Report is on its way
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <Mail className="w-4 h-4" />
            <span>We'll email it to you within 2&ndash;3 minutes.</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-2">
            The Human Delta&trade; Analyst is reviewing your audit and writing
            your 15-section Forensic Pivot Report. It typically arrives within
            two to three minutes &mdash; sometimes a little longer at peak times.
          </p>
          <p className="text-xs text-muted-foreground/80 max-w-md mx-auto mb-10">
            If it hasn't reached you within fifteen minutes, please check your
            spam folder. If it's not there either, contact us at{" "}
            <a
              href="mailto:performance@thehumandelta.com"
              className="underline underline-offset-4"
            >
              performance@thehumandelta.com
            </a>{" "}
            and we'll personally see it through.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-semibold border border-foreground text-foreground"
          >
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}