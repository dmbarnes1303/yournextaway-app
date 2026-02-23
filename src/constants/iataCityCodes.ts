// src/constants/iataCityCodes.ts

/**
 * IATA CITY codes (not airport codes).
 *
 * Why:
 * - City codes prefill more reliably in metasearch flows than "closest airport"
 * - Avoids wrong-airport UX (e.g. Rome FCO vs CIA, Paris CDG vs ORY)
 *
 * Expand this *only* for the cities you actually surface in-app in Phase 1.
 */

function norm(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\s+/g, " ");
}

const CITY_TO_IATA_CITY: Record<string, string> = {
  // Spain
  "barcelona": "BCN",
  "madrid": "MAD",

  // Italy (CITY CODES)
  "rome": "ROM",
  "milan": "MIL",

  // France (CITY CODE)
  "paris": "PAR",

  // Portugal
  "lisbon": "LIS",
  "porto": "OPO",

  // Netherlands
  "amsterdam": "AMS",

  // Germany
  "berlin": "BER",
  "munich": "MUC",

  // Austria / Czech / Hungary
  "vienna": "VIE",
  "prague": "PRG",
  "budapest": "BUD",

  // UK (City codes)
  "london": "LON",
  "manchester": "MAN",
};

export function toIataCityCode(city: string): string | null {
  const key = norm(city);
  if (!key) return null;
  return CITY_TO_IATA_CITY[key] ?? null;
}

/** Optional helper if you want to reuse the normalization elsewhere */
export function normalizeCityName(city: string): string {
  return norm(city);
}
