// src/utils/flagImages.ts

/**
 * Flag images by code.
 *
 * Default behaviour:
 * - ISO-3166 alpha-2 => FlagCDN (fast + predictable)
 *
 * Special cases:
 * - England / Scotland / Wales / Northern Ireland are NOT sovereign ISO-3166 countries.
 *   Use explicit images (reliable PNGs).
 *
 * Notes:
 * - We use PNG URLs (RN Image does not handle SVG by default).
 * - Keep these URLs stable; if you want 100% control, host your own copies.
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
 * PNG URLs for UK home nations.
 * Using Wikimedia "thumb" PNGs to avoid SVG.
 */
const UK_HOME_NATIONS_PNG: Record<string, string> = {
  // England (St George’s Cross)
  ENG: "https://upload.wikimedia.org/wikipedia/en/thumb/b/be/Flag_of_England.svg/80px-Flag_of_England.svg.png",

  // Scotland (Saltire)
  SCT: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Flag_of_Scotland.svg/80px-Flag_of_Scotland.svg.png",

  // Wales (Red Dragon)
  WLS: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Flag_of_Wales.svg/80px-Flag_of_Wales.svg.png",

  // Northern Ireland (Ulster Banner)
  NIR: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Ulster_Banner.svg/80px-Ulster_Banner.svg.png",
};

/**
 * Returns a URL to a flag image.
 *
 * - ISO2 ("GB", "ES", "IT", ...) => FlagCDN
 * - ENG/SCT/WLS/NIR => fixed PNG URLs
 */
export function getFlagImageUrl(code: string, opts?: { size?: number }): string | null {
  const cc = normalizeCode(code);

  // Home nations (and any future custom codes)
  if (UK_HOME_NATIONS_PNG[cc]) return UK_HOME_NATIONS_PNG[cc];

  // ISO2 via FlagCDN
  if (/^[A-Z]{2}$/.test(cc)) {
    const token = sizeToken(opts?.size);
    return `https://flagcdn.com/${token}/${cc.toLowerCase()}.png`;
  }

  return null;
}
