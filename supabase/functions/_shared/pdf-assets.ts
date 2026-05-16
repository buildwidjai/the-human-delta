// Brand assets bundled as base64 TS modules so the Supabase Edge Functions
// runtime ships them with the function (binary files in _shared/ are not
// deployed; .ts files are).
import { data as logoB64 } from "./assets/delta_logo_png.ts";
import { data as regB64 } from "./assets/Inter_Regular_ttf.ts";
import { data as boldB64 } from "./assets/Inter_Bold_ttf.ts";
import { data as italicB64 } from "./assets/Inter_Italic_ttf.ts";
import { data as boldItalicB64 } from "./assets/Inter_BoldItalic_ttf.ts";

function b64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let cache: {
  logoPng: Uint8Array;
  interFonts: { regular: Uint8Array; bold: Uint8Array; italic: Uint8Array; boldItalic: Uint8Array };
} | null = null;

export function loadPdfAssets() {
  if (!cache) {
    cache = {
      logoPng: b64(logoB64),
      interFonts: {
        regular: b64(regB64),
        bold: b64(boldB64),
        italic: b64(italicB64),
        boldItalic: b64(boldItalicB64),
      },
    };
  }
  return cache;
}
