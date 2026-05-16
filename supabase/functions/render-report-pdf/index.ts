// Dedicated PDF renderer. Split from process-report-queue so each call
// gets its own CPU budget — pdf-lib + font subsetting is heavy.
//
// Internal-only: requires the project SERVICE_ROLE_KEY in the
// Authorization header. Returns { pdfBase64 }.
import { renderReportPdf } from "../_shared/v12-report-pdf.ts";
import { loadPdfAssets } from "../_shared/pdf-assets.ts";

declare const Deno: {
  env: { get(n: string): string | undefined };
  serve: (h: (r: Request) => Response | Promise<Response>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Internal auth: must present the service role key.
  const auth = req.headers.get("authorization") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { report, scores, clientName, industry, reportId } = body ?? {};
  if (!report || typeof report !== "object") {
    return json({ error: "Missing report" }, 400);
  }

  try {
    const assets = loadPdfAssets();
    const blob = await renderReportPdf({
      report,
      scores: {
        T: Number(scores?.T ?? 0),
        E: Number(scores?.E ?? 0),
        M: Number(scores?.M ?? 0),
        R: Number(scores?.R ?? 0),
      },
      clientName: typeof clientName === "string" ? clientName : "",
      industry: typeof industry === "string" ? industry : "",
      reportId: typeof reportId === "string" ? reportId : undefined,
      logoPng: assets.logoPng,
      interFonts: assets.interFonts,
    });
    const buf = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < buf.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + CHUNK)));
    }
    return json({ ok: true, pdfBase64: btoa(binary), byteLength: buf.length });
  } catch (e) {
    console.error("[render-report-pdf] failed", (e as Error).message);
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
