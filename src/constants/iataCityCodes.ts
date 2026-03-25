// src/constants/iataCityCodes.ts

/**
 * Legacy compatibility layer only.
 *
 * IMPORTANT:
 * - Do NOT add football mapping logic here.
 * - Do NOT add nearest-airport fallback rules here.
 * - Do NOT treat this as the source of truth.
 *
 * The real resolver now lives in:
 *   src/constants/iataCities.ts
 *
 * This file only provides:
 * - text normalization helper
 * - a tiny legacy alias map for backwards compatibility
 *
 * If you need city -> IATA resolution, import from iataCities.ts instead:
 *   getIataCityCodeForCity(...)
 *   getIataCityCodeForCityKey(...)
 *   getIataCityByCityKey(...)
 */

function norm(s: string) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Minimal compatibility aliases only.
 * These are NOT intended to be comprehensive.
 * The real comprehensive football-aware mapping is handled in iataCities.ts.
 */
const LEGACY_CITY_ALIASES: Record<string, string> = {
  "sevilla": "SVQ",
  "seville": "SVQ",
  "roma": "ROM",
  "rome": "ROM",
  "milano": "MIL",
  "milan": "MIL",
  "napoli": "NAP",
  "naples": "NAP",
  "lisboa": "LIS",
  "lisbon": "LIS",
  "praha": "PRG",
  "prague": "PRG",
  "wien": "VIE",
  "vienna": "VIE",
  "munchen": "MUC",
  "muenchen": "MUC",
  "munich": "MUC",
  "zurich": "ZRH",
  "zurich ": "ZRH",
  "barcelona": "BCN",
  "madrid": "MAD",
  "paris": "PAR",
  "london": "LON",
  "istanbul": "IST",
  "athens": "ATH",
};

export function toIataCityCode(city: string): string | null {
  const key = norm(city);
  if (!key) return null;

  return LEGACY_CITY_ALIASES[key] ?? null;
}

export function normalizeCityName(city: string): string {
  return norm(city);
}
