// Strato SMTP wrapper.
//
// Strato's MX is strict about RFC 5321 EOM: it rejects messages with
// `550 5.6.11 Invalid EOM: A valid EOM is CRLF.CRLF` when the SMTP client
// streams the DATA section without proper CRLF dot-stuffing. denomailer
// 1.6.0 does not handle this reliably for HTML bodies, so we switched to
// nodemailer via the Deno `npm:` specifier — it is battle-tested against
// strict MTAs like Strato.
import nodemailer from "npm:nodemailer@6.9.14";

declare const Deno: { env: { get(name: string): string | undefined } };

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Array<{
    filename: string;
    content: Uint8Array;
    contentType?: string;
  }>;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const host = Deno.env.get("SMTP_HOST") ?? "";
  const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
  const user = Deno.env.get("SMTP_USER") ?? "";
  const pass = Deno.env.get("SMTP_PASSWORD") ?? "";
  if (!host || !user || !pass) throw new Error("SMTP credentials not configured");

  // Strato: implicit TLS on 465, STARTTLS on 587.
  const secure = port === 465;

  // Normalise line endings to CRLF and dot-stuff any line that starts with
  // a single "." so Strato never sees a premature end-of-data marker.
  const normalise = (s: string): string =>
    s.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n").replace(/\r\n\./g, "\r\n..");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    // Strato is fussy about TLS; defaults are fine but be explicit.
    requireTLS: !secure,
    tls: { minVersion: "TLSv1.2" },
  });

  await transporter.sendMail({
    from: `"The Human Delta" <${user}>`,
    to: input.to,
    subject: input.subject,
    text: normalise(input.text),
    html: normalise(input.html),
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType ?? "application/octet-stream",
    })),
  });
}