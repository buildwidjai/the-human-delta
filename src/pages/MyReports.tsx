import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, AlertCircle, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { sha256Hex } from "@/lib/hash";
import { loadReportLocators, type ReportLocator } from "@/lib/temr-payload";
import { listReports, type ReportSummary } from "@/services/reportRetriever";
import { supabase } from "@/integrations/supabase/client";
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

// "My Reports" — free retrieval of any past report by (report_id, email).
// The email is hashed (SHA-256) in the browser before any network call.
// Listing also works: enter email only and we'll show all reports tied to
// that hash.
export default function MyReports() {
  const [email, setEmail] = useState("");
  const [reportId, setReportId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ReportSummary[] | null>(null);
  const [cached, setCached] = useState<ReportLocator[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  useEffect(() => { setCached(loadReportLocators()); }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const openSpecific = async () => {
    setError(null);
    if (!emailValid) { setError("Please enter a valid email address."); return; }
    if (!reportId.trim()) { setError("Please enter the report ID."); return; }
    setLoading(true);
    try {
      const hash = await sha256Hex(email);
      // Navigate to /report with the locator so the renderer fetches it.
      window.location.href = `/report?id=${encodeURIComponent(reportId.trim())}&hash=${hash}`;
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  };

  const listAll = async () => {
    setError(null); setResults(null);
    if (!emailValid) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const hash = await sha256Hex(email);
      const list = await listReports(hash);
      setResults(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllMyData = async () => {
    setError(null);
    setDeleteResult(null);
    if (!emailValid) { setError("Please enter a valid email address."); return; }
    setDeleting(true);
    try {
      const { error: fnErr } = await supabase.functions.invoke("delete-my-data", {
        body: {
          action: "request",
          email: email.trim().toLowerCase(),
          returnUrl: window.location.origin,
        },
      });
      if (fnErr) throw new Error(fnErr.message || "Request failed");
      setDeleteResult(
        "Check your inbox. We've sent a confirmation link to that address — open it within 30 minutes to permanently erase your data. If no records exist for that email, nothing happens.",
      );
      setResults(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="container mx-auto px-6 max-w-2xl animate-fade-in-up">
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-2">
            Free Retrieval
          </p>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-3">
            My Reports
          </h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Retrieve any report you've previously generated — at no charge.
            Enter the email you used during the assessment. We'll hash it in
            your browser before checking; the raw email is never sent.
          </p>

          <div className="p-6 rounded-lg bg-card border border-border space-y-5">
            <div>
              <label className="block text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-[0.15em] uppercase text-muted-foreground mb-2">
                Report ID (optional)
              </label>
              <input
                type="text"
                value={reportId}
                onChange={(e) => setReportId(e.target.value.toUpperCase())}
                placeholder="HD-2026-XXXXXX"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 uppercase"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Provided on the report page after generation. Leave blank to
                list all reports tied to your email.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={openSpecific}
                disabled={loading || !emailValid || !reportId.trim()}
                className="inline-flex items-center gap-2 bg-foreground text-primary-foreground font-semibold px-6 py-3 rounded-lg text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Open Report
              </button>
              <button
                onClick={listAll}
                disabled={loading || !emailValid}
                className="inline-flex items-center gap-2 border border-border text-foreground font-semibold px-6 py-3 rounded-lg text-sm hover:border-foreground/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
              >
                List All My Reports
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* GDPR Art.17 / CCPA erasure */}
          <div className="mt-8 p-6 rounded-lg border border-destructive/30 bg-destructive/5">
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-foreground mb-2">
              Delete My Data
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Permanently erase every record we hold linked to the email
              above (assessment answers, demographics, generated narratives,
              audit rows, stored PDFs). This cannot be undone. Payment
              transaction ids may be retained in anonymised form for
              accounting compliance.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={deleting || !emailValid}
                  className="inline-flex items-center gap-2 border border-destructive text-destructive font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete all my data
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Permanently delete your data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove every assessment, narrative, PDF and
                    audit row tied to the hashed email. This action is
                    irreversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAllMyData}>
                    Yes, delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {deleteResult && (
              <p className="mt-4 text-xs text-foreground/80 leading-relaxed">{deleteResult}</p>
            )}
          </div>

          {results && (
            <div className="mt-8">
              <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4">
                {results.length === 0 ? "No reports found" : `${results.length} report${results.length === 1 ? "" : "s"} found`}
              </h2>
              <div className="space-y-3">
                {results.map((r) => (
                  <ReportRow key={r.reportId} email={email} summary={r} />
                ))}
              </div>
            </div>
          )}

          {cached.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border">
              <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-muted-foreground mb-4">
                Recently Generated On This Device
              </h2>
              <div className="space-y-3">
                {cached.map((c) => (
                  <Link
                    key={c.reportId}
                    to={`/report?id=${encodeURIComponent(c.reportId)}&hash=${c.hashedEmail}`}
                    className="block p-4 rounded-lg bg-card border border-border hover:border-foreground/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {c.clientName || "Report"} · {c.reportId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.generatedAt).toLocaleString()}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ReportRow({ email, summary }: { email: string; summary: ReportSummary }) {
  const [href, setHref] = useState<string>("#");
  useEffect(() => {
    let cancelled = false;
    sha256Hex(email).then((hash) => {
      if (!cancelled) setHref(`/report?id=${encodeURIComponent(summary.reportId)}&hash=${hash}`);
    });
    return () => { cancelled = true; };
  }, [email, summary.reportId]);
  return (
    <Link
      to={href}
      className="block p-4 rounded-lg bg-card border border-border hover:border-foreground/30 transition-colors"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {summary.clientName || "Report"} · {summary.reportId}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(summary.generatedAt).toLocaleString()}
            {summary.archetype ? ` · ${summary.archetype}` : ""}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}