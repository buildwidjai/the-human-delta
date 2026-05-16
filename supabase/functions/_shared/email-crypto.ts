// AES-GCM helpers for encrypting raw recipient emails inside report_jobs.
// Key is read from REPORT_EMAIL_ENCRYPTION_KEY (base64 of 32 raw bytes).

declare const Deno: { env: { get(name: string): string | undefined } };

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

async function getKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("REPORT_EMAIL_ENCRYPTION_KEY") ?? "";
  if (!raw) throw new Error("REPORT_EMAIL_ENCRYPTION_KEY not configured");
  const bytes = b64ToBytes(raw);
  if (bytes.length !== 32) throw new Error("REPORT_EMAIL_ENCRYPTION_KEY must decode to 32 bytes");
  return await crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

/** Returns base64( iv(12) || ciphertext+tag ). */
export async function encryptEmail(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  const buf = new Uint8Array(12 + ct.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ct), 12);
  return bytesToB64(buf);
}

export async function decryptEmail(b64: string): Promise<string> {
  const key = await getKey();
  const buf = b64ToBytes(b64);
  const iv = buf.slice(0, 12);
  const ct = buf.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}