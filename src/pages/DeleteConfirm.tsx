import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

type State =
  | { kind: "loading" }
  | { kind: "ok"; deleted: { temr_audit_logs: number; transaction_audit_logs: number; report_jobs: number; storage_objects: number } }
  | { kind: "error"; message: string };

export default function DeleteConfirm() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState({ kind: "error", message: "Missing confirmation token." });
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("delete-my-data", {
          body: { action: "confirm", token },
        });
        if (error) throw new Error(error.message || "Confirmation failed");
        const d = (data as { deleted?: { temr_audit_logs: number; transaction_audit_logs: number; report_jobs: number; storage_objects: number } })?.deleted;
        if (!d) throw new Error("Unexpected response");
        setState({ kind: "ok", deleted: d });
      } catch (e) {
        setState({ kind: "error", message: (e as Error).message });
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="container mx-auto px-6 max-w-xl animate-fade-in-up">
          <p className="text-muted-foreground text-xs tracking-[0.25em] uppercase mb-2">
            Data Erasure
          </p>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-6">
            Confirming deletion
          </h1>

          {state.kind === "loading" && (
            <div className="p-6 rounded-lg bg-card border border-border flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying your link and erasing your data…
            </div>
          )}

          {state.kind === "ok" && (
            <div className="p-6 rounded-lg bg-card border border-border space-y-4">
              <div className="flex items-center gap-3 text-foreground">
                <CheckCircle2 className="w-5 h-5" />
                <h2 className="font-semibold">Your data has been permanently erased.</h2>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>{state.deleted.temr_audit_logs} audit row(s)</li>
                <li>{state.deleted.transaction_audit_logs} transaction row(s)</li>
                <li>{state.deleted.report_jobs} queued job row(s)</li>
                <li>{state.deleted.storage_objects} stored file(s)</li>
              </ul>
              <Link to="/" className="inline-block text-sm font-semibold underline">Return home</Link>
            </div>
          )}

          {state.kind === "error" && (
            <div className="p-6 rounded-lg bg-card border border-border space-y-3">
              <div className="flex items-center gap-3 text-foreground">
                <AlertCircle className="w-5 h-5" />
                <h2 className="font-semibold">We couldn't complete the deletion.</h2>
              </div>
              <p className="text-sm text-muted-foreground">{state.message}</p>
              <p className="text-sm text-muted-foreground">
                Confirmation links expire after 30 minutes. You can{" "}
                <Link to="/my-reports" className="underline font-semibold">request a new one</Link>.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
