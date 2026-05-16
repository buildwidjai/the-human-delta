import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  clearPendingAssessment,
  loadPendingAssessment,
  saveReportPaymentToken,
} from "@/lib/temr-payload";
import { sha256Hex } from "@/lib/hash";
import { buildV12Answers } from "@/lib/temr-payload";
import { getOrCreateSessionId } from "@/lib/session";

/**
 * Return page hit by Stripe (or the £0 promo path) after the hosted Payment
 * Link completes. We mint a short-lived signed token gating /report, then
 * forward the user there. A 1.5-second confirmation is shown so the user
 * never sees a flicker — they always know the payment was received.
 */
export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const snapshot = loadPendingAssessment();
      // Stripe substitutes {CHECKOUT_SESSION_ID} into the `aid` query param
      // configured on the Payment Link's "After payment" redirect URL. The
      // assessmentId travels separately via `client_reference_id` on the
      // Stripe session — we read it from the local snapshot here, and the
      // edge function cross-checks it against the Stripe session.
      const sessionId =
        searchParams.get("aid") || searchParams.get("session_id");
      const assessmentId = snapshot?.assessmentId ?? null;

      if (!assessmentId || !sessionId) {
        setError(
          "We couldn't match your payment to your assessment. Please retake the audit and try again.",
        );
        return;
      }

      try {
        // Use raw fetch so we can read the JSON error body — `functions.invoke`
        // hides non-2xx response bodies behind a generic error message.
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mint-report-token`;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ assessmentId, sessionId }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          console.error("[CheckoutReturn] mint-report-token failed", { status: resp.status, data });
          throw new Error("Unable to verify payment");
        }
        const token = (data as { token?: string } | null)?.token;
        const paidEmail = (data as { email?: string | null } | null)?.email?.trim();
        if (!token) throw new Error("No token returned");
        saveReportPaymentToken(token);

        // ── Enqueue the report job ─────────────────────────────────
        // The worker generates the report server-side and emails it to
        // the address captured during the questionnaire. The browser is
        // not involved in rendering the report after this point.
        const recipientEmail = snapshot.email?.trim() || paidEmail;
        const hashedEmail = snapshot.hashedEmail ?? (recipientEmail ? await sha256Hex(recipientEmail) : undefined);

        if (!recipientEmail || !hashedEmail) {
          throw new Error("Missing email on the saved assessment");
        }
        const enqueueUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enqueue-report-job`;
        const enqueueResp = await fetch(enqueueUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            paymentToken: token,
            assessmentId,
            sessionId: getOrCreateSessionId(),
            reattempt: false,
            clientName: snapshot.userName,
            email: recipientEmail,
            position: snapshot.userRole,
            ageRange: snapshot.ageRange,
            experienceRange: snapshot.experienceRange,
            gender: snapshot.gender,
            industry: snapshot.industry,
            hashedEmail,
            answers: buildV12Answers(snapshot.answers),
          }),
        });
        const enqueueData = await enqueueResp.json().catch(() => ({}));
        if (!enqueueResp.ok) {
          console.error("[CheckoutReturn] enqueue-report-job failed", { status: enqueueResp.status, data: enqueueData });
          throw new Error("Unable to schedule your report");
        }
        clearPendingAssessment();
      } catch (e) {
        console.error("[CheckoutReturn] unlock failed", e);
        if (!cancelled) {
          setError(
            "Payment received, but we couldn't schedule your report. Please contact support if this persists.",
          );
        }
        return;
      }

      // Brief thank-you, then forward to the report.
      const t = window.setTimeout(() => {
        if (!cancelled) navigate("/report-pending", { replace: true });
      }, 1500);
      return () => window.clearTimeout(t);
    }

    void run();
    return () => {
      cancelled = true;
    };
    // searchParams + navigate are stable refs from react-router; we only
    // want this to run on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="container mx-auto px-6 max-w-xl text-center animate-fade-in">
          {error ? (
            <>
              <AlertCircle className="w-10 h-10 text-foreground mx-auto mb-6" />
              <h1 className="text-2xl font-extrabold text-foreground mb-3">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground mb-8">{error}</p>
              <a
                href="/questionnaire"
                className="inline-flex items-center gap-2 text-sm text-foreground underline underline-offset-4"
              >
                Back to the questionnaire
              </a>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-12 h-12 text-foreground mx-auto mb-6" />
              <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-2">
                Payment received
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
                Preparing your Pivot Report
              </h1>
              <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                Thank you. We're unlocking your report — you'll be redirected in a moment.
              </p>
              <Loader2 className="w-6 h-6 animate-spin text-foreground mx-auto" />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}