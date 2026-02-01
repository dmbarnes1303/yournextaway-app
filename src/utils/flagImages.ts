// src/utils/flagImages.ts

/**
 * Flag images by code.
 *
 * Supported inputs:
 * - ISO-3166-1 alpha-2: "ES", "DE", "IT", etc.
 * - Special UK home nations:
 *   - "ENG" => England (St George’s Cross)
 *   - "SCT" => Scotland
 *   - "WLS" => Wales
 *   - "NIR" => Northern Ireland
 *
 * Implementation:
 * - Uses FlagCDN PNGs (predictable, fast, consistent with the rest of your flags).
 * - For UK home nations we map to FlagCDN subdivision-style codes (gb-eng, gb-sct, gb-wls, gb-nir).
 *
 * Notes:
 * - RN <Image> handles PNG well; avoids SVG entirely.
 * - If you want 100% control, host your own copies later.
 */

const FLAGCDN_SIZES = new Set([20, 40, 80, 160]);
const DEFAULT_SIZE = 40;

function normalizeCode(input: string): string {
  return String(input ?? "").trim().toUpperCase();
}

function sizeToken(size?: number): string {
  const s = typeof size === "number" ? size : DEFAULT_SIZE;
  const picked = FLAGCDN_SIZES.has(s) ? s : DEFAULT_SIZE;
  return `w${picked}`;
}

/**
 * Map our special codes to FlagCDN subdivision flag codes.
 * These are PNGs just like regular country flags.
 */
const SPECIAL_TO_FLAGCDN_CODE: Record<string, string> = {
  ENG: "gb-eng",
  SCT: "gb-sct",
  WLS: "gb-wls",
  NIR: "gb-nir",
};

export function getFlagImageUrl(code: string, opts?: { size?: number }): string | null {
  const cc = normalizeCode(code);
  const token = sizeToken(opts?.size);

  // Special UK home nations
  const special = SPECIAL_TO_FLAGCDN_CODE[cc];
  if (special) {
    return `https://flagcdn.com/${token}/${special}.png`;
  }

  // ISO2 via FlagCDN
  if (/^[A-Z]{2}$/.test(cc)) {
    return `https://flagcdn.com/${token}/${cc.toLowerCase()}.png`;
  }

  return null;
}
