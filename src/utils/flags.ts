// src/utils/flags.ts

const FALLBACK = "🏳️";

export function getFlagEmoji(countryCode: string): string {
  const cc = String(countryCode ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return FALLBACK;

  // Regional indicator symbols: 🇦 = 0x1F1E6
  const A = 0x1f1e6;
  const chars = [...cc].map((c) => String.fromCodePoint(A + (c.charCodeAt(0) - 65)));
  return chars.join("") || FALLBACK;
}
