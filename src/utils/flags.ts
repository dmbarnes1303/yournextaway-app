// src/utils/flags.ts
export function flagUrl(countryCode: string, size: 24 | 32 = 24) {
  const cc = String(countryCode || "").trim().toLowerCase();
  // flagcdn sizes: w20, w40 etc. We'll approximate.
  const w = size === 32 ? 32 : 24;
  return `https://flagcdn.com/w${w}/${cc}.png`;
}
