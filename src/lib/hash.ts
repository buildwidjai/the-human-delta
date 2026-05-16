// SHA-256 hashing utility used to fingerprint user emails before they
// leave the browser. The raw email is NEVER persisted — only the hex
// digest is sent to edge functions and stored in the database.

function toHex(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let out = "";
  for (const b of view) out += b.toString(16).padStart(2, "0");
  return out;
}

/** SHA-256 of the input string, lowercase hex (64 chars). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

/** True if `value` looks like a SHA-256 hex digest. */
export function isSha256Hex(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}