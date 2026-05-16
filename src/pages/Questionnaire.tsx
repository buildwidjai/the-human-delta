import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { gameSections, scaleLabels, REVERSE_SCORED_IDS, type Question } from "@/lib/questionnaire-data";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  savePendingAssessment,
  newAssessmentId,
  clearPendingAssessment,
  clearReportPaymentToken,
  loadPendingAssessment,
  loadReportPaymentToken,
} from "@/lib/temr-payload";
import { sha256Hex } from "@/lib/hash";
import { markReattempt } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import {
  computePillarScores,
  deriveArchetype,
  getAnchorSignal,
  getForensicTeaser,
} from "@/lib/archetype-preview";
import { ExecutivePreviewCard } from "@/components/ExecutivePreviewCard";

const TOTAL_QUESTIONS = gameSections.reduce(
  (sum, g) => sum + g.foundational.length + g.probes.length,
  0
);

const ALL_QUESTION_IDS: number[] = gameSections.flatMap((g) => [
  ...g.foundational.map((q) => q.id),
  ...g.probes.map((q) => q.id),
]);

const generateRandomAnswers = (): Record<number, number> => {
  const out: Record<number, number> = {};
  for (const id of ALL_QUESTION_IDS) {
    // Random integer 1–5 inclusive on the standard frequency scale
    out[id] = 1 + Math.floor(Math.random() * 5);
  }
  return out;
};

const ASSESSMENT_STORAGE_KEYS = ["user_assessment_data", "hdelta_session"] as const;

type StoredAssessmentSession = {
  userName: string;
  userRole: string;
  answers: Record<number, number>;
  archetype?: string;
  pillarScores?: Record<string, number>;
  isPaid?: boolean;
  // Optional demographic fields (added later — older sessions won't have them).
  gender?: string;
  ageRange?: string;
  experienceRange?: string;
  industry?: string;
  // SHA-256 hex digest of the user's email. Raw email is never stored.
  hashedEmail?: string;
};

const getStoredAssessmentSession = (): StoredAssessmentSession | null => {
  if (typeof window === "undefined") return null;

  for (const key of ASSESSMENT_STORAGE_KEYS) {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) continue;

    try {
      const parsed = JSON.parse(rawValue) as Partial<StoredAssessmentSession>;

      if (
        typeof parsed.userName === "string" &&
        typeof parsed.userRole === "string" &&
        parsed.answers &&
        typeof parsed.answers === "object"
      ) {
        return {
          userName: parsed.userName,
          userRole: parsed.userRole,
          answers: parsed.answers as Record<number, number>,
          archetype: typeof parsed.archetype === "string" ? parsed.archetype : undefined,
          pillarScores:
            parsed.pillarScores && typeof parsed.pillarScores === "object"
              ? (parsed.pillarScores as Record<string, number>)
              : undefined,
          isPaid: parsed.isPaid === true,
          gender: typeof parsed.gender === "string" ? parsed.gender : undefined,
          ageRange: typeof parsed.ageRange === "string" ? parsed.ageRange : undefined,
          experienceRange:
            typeof parsed.experienceRange === "string" ? parsed.experienceRange : undefined,
          industry: typeof parsed.industry === "string" ? parsed.industry : undefined,
          hashedEmail:
            typeof parsed.hashedEmail === "string" ? parsed.hashedEmail : undefined,
        };
      }
    } catch (error) {
      console.error(`Failed to parse saved assessment session from ${key}:`, error);
      window.localStorage.removeItem(key);
    }
  }

  return null;
};

const saveStoredAssessmentSession = (session: StoredAssessmentSession) => {
  if (typeof window === "undefined") return;

  const serializedSession = JSON.stringify(session);
  ASSESSMENT_STORAGE_KEYS.forEach((key) => window.localStorage.setItem(key, serializedSession));
};

const clearStoredAssessmentSession = () => {
  if (typeof window === "undefined") return;

  ASSESSMENT_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
};

const shouldTreatAsSuccessfulPaymentReturn = () => {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  const hasPaymentParam = params.has("payment");
  const paymentValue = (params.get("payment") ?? "").trim().toLowerCase();
  const successfulValues = new Set(["", "1", "true", "paid", "success", "complete", "completed"]);
  const referrer = typeof document !== "undefined" ? document.referrer.toLowerCase() : "";
  const returnedFromStripe = referrer.includes("stripe.com");

  return (hasPaymentParam && successfulValues.has(paymentValue)) || returnedFromStripe;
};

const clearPaymentReturnFromUrl = () => {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (!url.searchParams.has("payment")) return;

  url.searchParams.delete("payment");
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);
};

const Questionnaire = () => {
  // ── Resume-from-Stripe guard ───────────────────────────────────────────
  // If Stripe's hosted Payment Link sends the user back here (because the
  // dashboard's "After payment" redirect URL hasn't been pointed at
  // /checkout/return yet, or because the user manually navigated back to
  // the audit URL after paying) we must NOT drop them into the intro.
  // We forward them to /checkout/return so the signed report token is
  // minted and they're sent on to /report.
  //
  // Conditions, all required:
  //   • A pending assessment snapshot exists in localStorage.
  //   • No report token exists yet (otherwise they could just visit /report).
  //   • Either the referrer is a Stripe domain, or the URL carries one of
  //     the marker query params Stripe sets on return.
  // This deliberately avoids redirecting on a normal "Start Assessment"
  // click from the homepage, which has no Stripe referrer.
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const referrer = typeof document !== "undefined" ? document.referrer.toLowerCase() : "";
    const cameFromStripe =
      referrer.includes("stripe.com") ||
      params.has("payment") ||
      params.has("session_id") ||
      params.has("aid");
    if (cameFromStripe) {
      const pending = loadPendingAssessment();
      const alreadyHasToken = !!loadReportPaymentToken();
      if (pending && !alreadyHasToken) {
        // Preserve the actual Stripe Checkout Session id (cs_...) if it
        // arrived on the URL — that's what mint-report-token verifies.
        // Only fall back to the assessmentId when no session id is present.
        const stripeSessionId =
          params.get("aid") || params.get("session_id") || "";
        const forwardId =
          stripeSessionId && /^cs_/.test(stripeSessionId)
            ? stripeSessionId
            : pending.assessmentId;
        window.location.replace(
          `/checkout/return?aid=${encodeURIComponent(forwardId)}`,
        );
      }
    }
  }

  // Only restore a previous session if:
  //   (a) the user is returning from a successful Stripe payment, OR
  //   (b) the saved session was already marked as paid.
  // Otherwise, clicking "Start Assessment" should always show the intro,
  // not jump straight to the results screen of a stale local session.
  const [restoredSession] = useState<StoredAssessmentSession | null>(() => {
    const savedSession = getStoredAssessmentSession();
    if (!savedSession) return null;

    const returningFromPayment = shouldTreatAsSuccessfulPaymentReturn();

    if (returningFromPayment) {
      const unlockedSession = { ...savedSession, isPaid: true };
      saveStoredAssessmentSession(unlockedSession);
      return unlockedSession;
    }

    if (savedSession.isPaid) {
      return savedSession;
    }

    // Stale unpaid session — ignore it so the intro renders normally.
    return null;
  });

  const [step, setStep] = useState<"intro" | "info" | number>("intro");
  const [userName, setUserName] = useState(restoredSession?.userName || "");
  const [userRole, setUserRole] = useState(restoredSession?.userRole || "");
  const [answers, setAnswers] = useState<Record<number, number>>(restoredSession?.answers || {});
  const [showResults, setShowResults] = useState(!!restoredSession);
  const [returnedFromPayment, setReturnedFromPayment] = useState(!!restoredSession?.isPaid);

  // ── New demographic fields (collected on the info-capture step) ──────────
  // All four are required to proceed to checkout. They are forwarded to the
  // edge function so the LLM narrators can tailor the report to the pilot's
  // life stage, career stage, gender, and industry context.
  const [gender, setGender] = useState<string>(restoredSession?.gender || "");
  const [ageRange, setAgeRange] = useState<string>(restoredSession?.ageRange || "");
  const [experienceRange, setExperienceRange] = useState<string>(
    restoredSession?.experienceRange || "",
  );
  const [industry, setIndustry] = useState<string>(restoredSession?.industry || "");

  // Email is collected here, hashed via SHA-256 client-side before any
  // network call, and used to let the user retrieve past reports for free
  // from /my-reports. The raw email never leaves the browser.
  const [email, setEmail] = useState<string>("");
  // GDPR Art. 6 consent + Art. 22 automated-profiling acknowledgement.
  // Both are required to proceed to checkout.
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentProfiling, setConsentProfiling] = useState(false);

  useEffect(() => {
    clearPaymentReturnFromUrl();
  }, []);

  const answeredCount = Object.keys(answers).length;
  const progress = typeof step === "number" ? (answeredCount / TOTAL_QUESTIONS) * 100 : 0;

  const currentGame = typeof step === "number" ? gameSections[step] : null;
  const allQuestions = currentGame
    ? [...currentGame.foundational, ...currentGame.probes]
    : [];

  const sectionComplete = allQuestions.every((q) => answers[q.id] !== undefined);
  const allComplete = answeredCount === TOTAL_QUESTIONS;
  const isLastSection = step === gameSections.length - 1;

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const goNext = () => {
    if (typeof step === "number" && step < gameSections.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (typeof step === "number" && step === gameSections.length - 1) {
      // Last game section → go to info capture
      setStep("info");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (typeof step === "number") {
      setStep(step === 0 ? "intro" : step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Results screen
  if (showResults) {
    return (
      <CheckoutScreen
        userName={userName}
        userRole={userRole}
        answers={answers}
        gender={gender}
        ageRange={ageRange}
        experienceRange={experienceRange}
        industry={industry}
        email={email}
        onRetake={() => {
          setShowResults(false);
          setUserName("");
          setUserRole("");
          setAnswers({});
          setGender("");
          setAgeRange("");
          setExperienceRange("");
          setIndustry("");
          setEmail("");
          setStep("intro");
          setReturnedFromPayment(false);
          clearStoredAssessmentSession();
          clearReportPaymentToken();
          clearPendingAssessment();
        }}
      />
    );
  }

  // Intro screen
  if (step === "intro") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 pb-24">
          <div className="container mx-auto px-6 max-w-3xl animate-fade-in-up">
            <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-4">
              Performance Audit
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2 tracking-tight">
              The Human Delta™
            </h1>
            <p className="text-lg text-muted-foreground font-light mb-10">Pivot Report</p>

            <div className="p-8 rounded-lg bg-card border border-border mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4">Before You Begin</h2>
              <p className="text-foreground/80 leading-relaxed mb-6 font-light">
                This is a <strong className="font-semibold">system calibration</strong>, not a personality test. Answer based on your{" "}
                <strong className="font-semibold">actual behaviour over the last 30 days</strong>, not your future intentions.
              </p>

              <h3 className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase mb-4">
                The Scale
              </h3>
              <div className="space-y-2">
                {scaleLabels.map((label) => (
                  <div key={label.value} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded bg-foreground text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
                      {label.value}
                    </span>
                    <span className="font-medium text-foreground text-sm">{label.full}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-8">
              <span>32 questions</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>~12 minutes</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>4 games</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 bg-foreground text-primary-foreground font-semibold px-8 py-4 rounded-lg text-sm hover:opacity-90 transition-all duration-300"
              >
                Begin Audit
                <ArrowRight className="w-4 h-4" />
              </button>
              {import.meta.env.DEV && (
                <button
                  onClick={() => {
                    const random = generateRandomAnswers();
                    setAnswers(random);
                    setUserName("Test User");
                    setUserRole("QA Tester");
                    setGender("Other");
                    setAgeRange("28-35");
                    setExperienceRange("4-7");
                    setIndustry("Software / SaaS");
                    setShowResults(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  title="Fills random answers and jumps to checkout — for testing the payment + report flow"
                  className="inline-flex items-center gap-2 border border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-foreground/60 font-medium px-6 py-4 rounded-lg text-xs tracking-[0.15em] uppercase transition-all duration-300"
                >
                  Test · Auto-fill
                </button>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Info capture screen
  if (step === "info") {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const canProceed =
      userName.trim().length > 0 &&
      userRole.trim().length > 0 &&
      gender.trim().length > 0 &&
      ageRange.trim().length > 0 &&
      experienceRange.trim().length > 0 &&
      industry.trim().length > 0 &&
      emailValid &&
      consentPrivacy &&
      consentProfiling &&
      allComplete;
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 pb-24">
          <div className="container mx-auto px-6 max-w-lg animate-fade-in-up">
            <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-4">
              Final Step
            </p>
            <h2 className="text-3xl font-extrabold text-foreground mb-8 tracking-tight">
              Your Details
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">
                  Current Position
                </label>
                <input
                  type="text"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  placeholder="e.g. Product Manager"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              {/* ── Gender ────────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Male", "Female", "Other"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setGender(opt)}
                      className={`py-2.5 px-3 rounded-lg text-sm border transition-all duration-200 ${
                        gender === opt
                          ? "bg-foreground text-primary-foreground border-foreground font-semibold"
                          : "bg-card text-foreground border-border hover:border-foreground/40"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Age range ─────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">
                  Age
                </label>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                >
                  <option value="">Select your age range</option>
                  <option value="17-21">17 to 21</option>
                  <option value="22-27">22 to 27</option>
                  <option value="28-35">28 to 35</option>
                  <option value="36-45">36 to 45</option>
                  <option value="46-55">46 to 55</option>
                  <option value="55+">Above 55</option>
                </select>
              </div>

              {/* ── Experience range ──────────────────────────────────── */}
              <div>
                <label className="block text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">
                  Experience (years)
                </label>
                <select
                  value={experienceRange}
                  onChange={(e) => setExperienceRange(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                >
                  <option value="">Select your experience range</option>
                  <option value="0-3">0 to 3</option>
                  <option value="4-7">4 to 7</option>
                  <option value="8-15">8 to 15</option>
                  <option value="16-25">16 to 25</option>
                  <option value="26-35">26 to 35</option>
                  <option value="35+">Above 35</option>
                </select>
              </div>

              {/* ── Industry (open text) ──────────────────────────────── */}
              <div>
                <label className="block text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Healthcare, Fintech, Manufacturing"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              {/* ── Email ─────────────────────────────────────────────── */}
              {/*
                The email is hashed (SHA-256) in the browser before any
                network call. The raw address never leaves the device or
                touches the database. We use the hash to let you retrieve
                your past reports for free from the "My Reports" page.
              */}
              <div>
                <label className="block text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                  We hash your email before it leaves your browser. The raw
                  address is never stored. Used only to let you retrieve
                  past reports without paying again.
                </p>
              </div>
            </div>

            {/* GDPR consent + Art.22 automated-profiling notice */}
            <div className="mt-8 p-5 rounded-lg border border-border bg-card/60 space-y-4">
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-muted-foreground">
                Consent
              </p>
              <label className="flex items-start gap-3 cursor-pointer text-xs text-foreground/85 leading-relaxed">
                <input
                  type="checkbox"
                  checked={consentPrivacy}
                  onChange={(e) => setConsentPrivacy(e.target.checked)}
                  className="mt-1 w-4 h-4 shrink-0 accent-foreground"
                />
                <span>
                  I have read the{" "}
                  <Link to="/privacy" target="_blank" className="underline font-medium">Privacy Policy</Link>
                  {" "}and{" "}
                  <Link to="/terms" target="_blank" className="underline font-medium">Terms of Service</Link>
                  , and I consent to my answers, demographics and hashed
                  email being processed to generate my report.
                  (<em>UK/EU GDPR Art. 6(1)(a)</em>)
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer text-xs text-foreground/85 leading-relaxed">
                <input
                  type="checkbox"
                  checked={consentProfiling}
                  onChange={(e) => setConsentProfiling(e.target.checked)}
                  className="mt-1 w-4 h-4 shrink-0 accent-foreground"
                />
                <span>
                  I understand my report is produced by an{" "}
                  <strong className="font-semibold">automated profiling pipeline</strong>{" "}
                  (deterministic scoring + a Google Gemini language model),
                  that this is a development tool and not a hiring, legal,
                  medical or financial decision, and that I may request a
                  human review at any time. (<em>GDPR Art. 22</em>)
                </span>
              </label>
            </div>

            <div className="flex justify-between mt-10">
              <button
                onClick={() => setStep(gameSections.length - 1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Questions
              </button>
              <button
                onClick={() => { handleSubmit(); }}
                disabled={!canProceed}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  canProceed
                    ? "bg-foreground text-primary-foreground hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Generate My Pivot Report
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Question sections
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Progress Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border">
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-foreground progress-bar rounded-r-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {gameSections.map((g, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className={`flex items-center gap-1.5 text-xs transition-colors duration-300 ${
                  idx === step
                    ? "text-foreground font-bold"
                    : idx < (step as number)
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full text-xs flex items-center justify-center border transition-all duration-300 ${
                    idx === step
                      ? "border-foreground bg-foreground text-primary-foreground"
                      : idx < (step as number)
                      ? "border-muted-foreground/40 bg-muted text-muted-foreground"
                      : "border-muted-foreground/20 text-muted-foreground/40"
                  }`}
                >
                  {idx < (step as number) ? <Check className="w-3 h-3" /> : idx + 1}
                </span>
                <span className="hidden md:inline">{g.pillar}</span>
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {answeredCount}/{TOTAL_QUESTIONS}
          </span>
        </div>
      </div>

      {/* Question Area */}
      <main className="pt-36 pb-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="mb-10 animate-fade-in">
            <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-1">
              {currentGame!.subtitle}
            </p>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              {currentGame!.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Pillar: {currentGame!.pillar}</p>
          </div>

          {/* Foundational Questions */}
          <div className="mb-8">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4">
              Foundational
            </p>
            <div className="space-y-5">
              {currentGame!.foundational.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  selectedValue={answers[q.id]}
                  onAnswer={(val) => handleAnswer(q.id, val)}
                />
              ))}
            </div>
          </div>

          {/* Probe Questions */}
          <div className="mb-8">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4">
              Behavioural Probes
            </p>
            <div className="space-y-5">
              {currentGame!.probes.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  selectedValue={answers[q.id]}
                  onAnswer={(val) => handleAnswer(q.id, val)}
                />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-12">
            <button
              onClick={goPrev}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 0 ? "Back" : "Previous"}
            </button>

            {isLastSection ? (
              <button
                onClick={() => { if (sectionComplete) goNext(); }}
                disabled={!sectionComplete}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  sectionComplete
                    ? "bg-foreground text-primary-foreground hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Continue to Your Details
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!sectionComplete}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  sectionComplete
                    ? "bg-foreground text-primary-foreground hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Next Game
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

function QuestionCard({
  question,
  selectedValue,
  onAnswer,
}: {
  question: Question;
  selectedValue: number | undefined;
  onAnswer: (value: number) => void;
}) {
  return (
    <div className="p-5 rounded-lg bg-card border border-border hover:border-foreground/10 transition-all duration-300">
      <div className="flex items-start gap-3 mb-4">
        {question.probeLabel && (
          <span className="shrink-0 text-[10px] font-bold tracking-wider uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded">
            {question.probeLabel}
          </span>
        )}
      </div>
      <p className="text-sm text-foreground mb-4 leading-relaxed font-light">
        {question.text}
      </p>
      <div className="flex items-center gap-2">
        {scaleLabels.map((label) => (
          <button
            key={label.value}
            onClick={() => onAnswer(label.value)}
            className={`flex-1 py-2.5 px-1 rounded text-xs transition-all duration-200 border ${
              selectedValue === label.value
                ? "bg-foreground text-primary-foreground border-foreground font-bold"
                : "bg-muted/50 text-muted-foreground border-transparent hover:border-foreground/20 hover:bg-muted"
            }`}
          >
            <span className="hidden sm:inline">{label.full}</span>
            <span className="sm:hidden">{label.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Checkout Screen — payment-gated entry to /report ─────────────────────
function CheckoutScreen({
  userName,
  userRole,
  answers,
  gender,
  ageRange,
  experienceRange,
  industry,
  email,
  onRetake,
}: {
  userName: string;
  userRole: string;
  answers: Record<number, number>;
  gender: string;
  ageRange: string;
  experienceRange: string;
  industry: string;
  email: string;
  onRetake: () => void;
}) {
  const { toast } = useToast();
  const [assessmentId] = useState(() => newAssessmentId());
  const pillarScores = computePillarScores(answers);
  const archetype = deriveArchetype(pillarScores);
  const anchorSignal = getAnchorSignal(archetype.key);
  const forensicTeaser = getForensicTeaser(archetype.key);

  // Persist the snapshot so /checkout/return can queue the report after the
  // Stripe redirect. The raw email is kept only in tab-scoped session storage
  // long enough to schedule the email, then cleared on the return page.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cleanEmail = email.trim();
      const hashedEmail = cleanEmail ? await sha256Hex(cleanEmail) : undefined;
      if (cancelled) return;
      savePendingAssessment({
        assessmentId,
        userName,
        userRole,
        email: cleanEmail,
        answers,
        gender,
        ageRange,
        experienceRange,
        industry,
        hashedEmail,
      });
    })();
    return () => { cancelled = true; };
  }, [assessmentId, userName, userRole, answers, gender, ageRange, experienceRange, industry, email]);

  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const isReattempt = sp.get("reattempt") === "1";
  const [redirecting, setRedirecting] = useState(false);
  const trimmedEmail = email.trim();

  const handleCheckout = async () => {
    setRedirecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-payment-link");
      if (error || !data?.url) throw new Error(error?.message || "No payment link");
      const url = new URL(data.url);
      url.searchParams.set("client_reference_id", assessmentId);
      if (trimmedEmail) url.searchParams.set("prefilled_email", trimmedEmail);
      window.location.href = url.toString();
    } catch (e: any) {
      setRedirecting(false);
      toast({
        title: "Could not open checkout",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="container mx-auto px-6 max-w-3xl animate-fade-in-up">
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-2">
            Performance Audit Complete
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2 tracking-tight">
            Ready to unlock your Pivot Report
          </h1>
          <p className="text-muted-foreground mb-10">{userName} · {userRole}</p>

          <ExecutivePreviewCard
            clientName={userName}
            archetype={archetype}
            anchorSignal={anchorSignal}
            forensicTeaser={forensicTeaser}
          />

          <div
            className="p-8 rounded-md mb-10"
            style={{ background: "#FFFFFF", border: "1px solid #E6DFCB" }}
          >
            <p
              className="text-[10px] font-bold tracking-[0.25em] mb-5"
              style={{ color: "#C9A24B" }}
            >
              PROFESSIONAL ASSETS YOU'LL UNLOCK
            </p>
            <ul className="space-y-3 text-[14px]" style={{ color: "#1B1B1B" }}>
              {[
                "Full 20-Page Forensic Performance Audit",
                "90-Day Strategic Pivot Roadmap",
                "Pillar-Level Power Tax & Warning Diagnostics",
                "Proprietary TEMR™ Growth Analysis",
              ].map((label) => (
                <li key={label} className="flex gap-3 items-start">
                  <Check
                    className="w-4 h-4 mt-1 shrink-0"
                    style={{ color: "#C9A24B" }}
                  />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8">
            {isReattempt ? (
              <>
                <button
                  onClick={() => { markReattempt(); navigate("/report"); }}
                  className="executive-cta inline-flex items-center justify-center gap-2 w-full md:w-auto px-8 py-4 rounded-md font-bold text-base tracking-wide transition-all"
                  style={{ background: "#0B1F3A", color: "#C9A24B", border: "1px solid #C9A24B" }}
                >
                  Regenerate my report (no charge)
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Your previous payment carries forward — we won't charge you again for this session.
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={redirecting}
                  className="executive-cta inline-flex items-center justify-center gap-2 w-full md:w-auto px-8 py-4 rounded-md font-bold text-base tracking-wide transition-all"
                  style={{ background: "#0B1F3A", color: "#C9A24B", border: "1px solid #C9A24B" }}
                >
                  {redirecting ? "Redirecting…" : "Access the Full Executive Performance Audit — €19"}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Secure checkout via Stripe. You'll be returned to your report immediately after payment.
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Start new assessment
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start a new assessment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear your saved answers and report token from this browser.
                    Your existing report link (if you saved it) will still work.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onRetake}>
                    Start new assessment
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="text-center text-xs text-muted-foreground tracking-[0.15em] uppercase border-t border-border pt-6 mt-12">
            THE HUMAN DELTA™ | TEMR Growth (Sweden) | © 2024
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Questionnaire;
