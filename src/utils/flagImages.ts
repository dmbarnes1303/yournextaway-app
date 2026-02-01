// src/utils/flagImages.ts

/**
 * Flag images by code.
 *
 * - ISO-3166 alpha-2 codes: served from FlagCDN (predictable URLs)
 * - Regional specials (e.g. England): served from Wikimedia PNG
 */
const ENGLAND_FLAG_PNG =
  "https://upload.wikimedia.org/wikipedia/en/thumb/b/be/Flag_of_England.svg/320px-Flag_of_England.svg.png";

function isIso2Lower(cc: string) {
  return /^[a-z]{2}$/.test(cc);
}

export function getFlagImageUrl(countryCode: string): string | null {
  const raw = String(countryCode ?? "").trim();
  if (!raw) return null;

  const ccUpper = raw.toUpperCase();
  const ccLower = raw.toLowerCase();

  // Specials
  if (ccUpper === "ENG") return ENGLAND_FLAG_PNG;

  // ISO2
  if (!isIso2Lower(ccLower)) return null;

  // FlagCDN
  return `https://flagcdn.com/w40/${ccLower}.png`;
}
