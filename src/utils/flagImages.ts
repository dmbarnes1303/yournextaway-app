// src/utils/flagImages.ts
/**
 * Flag images by ISO-3166 alpha-2 code.
 *
 * NOTE: England (Premier League) is not a sovereign ISO country code.
 * If you want the England flag specifically, you need a separate asset source.
 * For now we use GB for Premier League.
 */
export function getFlagImageUrl(countryCode: string): string | null {
  const cc = String(countryCode ?? "").trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(cc)) return null;

  // FlagCDN: simple predictable URLs
  // Example: https://flagcdn.com/w40/de.png
  return `https://flagcdn.com/w40/${cc}.png`;
}
