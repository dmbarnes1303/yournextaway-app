// src/utils/flags.ts

const FALLBACK = "🏳️";

// England flag tag sequence (works on iOS and most modern Androids)
const ENGLAND_FLAG = "🏴\uE0067\uE0062\uE0065\uE006E\uE0067\uE007F";

function isIso2(cc: string) {
  return /^[A-Z]{2}$/.test(cc);
}

export function getFlagEmoji(countryCode: string): string {
  const raw = String(countryCode ?? "").trim().toUpperCase();
  if (!raw) return FALLBACK;

  // Special regional flags we support
  if (raw === "ENG") return ENGLAND_FLAG;

  // ISO2 -> regional indicator symbols
  if (!isIso2(raw)) return FALLBACK;

  const A = 0x1f1e6; // 🇦
  const chars = [...raw].map((c) => String.fromCodePoint(A + (c.charCodeAt(0) - 65)));
  return chars.join("") || FALLBACK;
}
