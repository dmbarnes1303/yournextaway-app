// src/constants/iataCities.ts
import { IATA_CITY_CODES } from "@/src/data/iataCityCodes";

function normalizeCityName(input: string): string {
  let s = String(input ?? "").trim().toLowerCase();
  if (!s) return "";

  // Basic cleanup
  s = s
    .replace(/[\u2019']/g, "") // apostrophes
    .replace(/[()]/g, " ")
    .replace(/[^\p{L}\p{N}\s,-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Common noise words
  s = s
    .replace(/\bmetropolitan\b/g, "")
    .replace(/\bdistrict\b/g, "")
    .replace(/\barea\b/g, "")
    .replace(/\bregion\b/g, "")
    .replace(/\bprovince\b/g, "")
    .replace(/\bmunicipality\b/g, "")
    .replace(/\bcounty\b/g, "")
    .replace(/\bcity\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Title case keys in data are mixed; we store normalized keys in our lookup map.
  return s;
}

function buildIndex() {
  const index: Record<string, string> = {};
  for (const row of IATA_CITY_CODES) {
    const name = String(row.city ?? "").trim();
    const code = String(row.iata ?? "").trim().toUpperCase();
    if (!name || !code) continue;
    index[normalizeCityName(name)] = code;
  }
  return index;
}

const INDEX = buildIndex();

function _getIataFromData(canon: string): string | null {
  return INDEX[canon] ?? null;
}

export function getIataCityCodeForCity(city: string): string | null {
  const raw = String(city ?? "").trim();
  const canon = normalizeCityName(raw);
  if (!canon) return null;

  const tryLookup = (candidate: string): string | null => {
    const c = normalizeCityName(candidate);
    if (!c) return null;
    try {
      const code = _getIataFromData(c);
      return code ? String(code).trim().toUpperCase() : null;
    } catch {
      return null;
    }
  };

  // Direct
  const direct = tryLookup(canon);
  if (direct) return direct;

  // Fallbacks for verbose venue.city strings from API-Football.
  // Example: "West district in London" -> "London"
  const lower = raw.toLowerCase();
  const inIdx = lower.lastIndexOf(" in ");
  if (inIdx >= 0) {
    const tail = raw.slice(inIdx + 4).trim();
    const tailCode = tryLookup(tail);
    if (tailCode) return tailCode;
  }

  // Example: "Barcelona, Spain" -> "Barcelona"
  if (raw.includes(",")) {
    const head = raw.split(",")[0].trim();
    const headCode = tryLookup(head);
    if (headCode) return headCode;
  }

  return null;
}
