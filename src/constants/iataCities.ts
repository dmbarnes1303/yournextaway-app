// src/constants/iataCities.ts

/**
 * City (metropolitan) IATA codes.
 *
 * Why: Aviasales supports origin_iata/destination_iata using *city* IATA codes,
 * not only specific airports, which is what we want for usability.
 *
 * Policy:
 * - Keys are normalized city names (case-insensitive match).
 * - Values should be IATA CITY codes (3 letters). Many equal an airport code; some are metro codes.
 * - If a city is missing, resolveIataCityCode() returns null and caller should fall back gracefully.
 *
 * Maintenance:
 * - Treat this as a living map.
 * - When you add a new league, add newly encountered cities here (once per city).
 */

export type IataCityCode = string;

function norm(s: string) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isIata3(s?: string) {
  return !!s && /^[A-Z]{3}$/.test(String(s).trim().toUpperCase());
}

/**
 * Primary mapping: city name -> IATA city code.
 *
 * NOTE: This is intentionally city-level, not stadium-level.
 * For many smaller cities, Aviasales still has a 3-letter city code even if there isn't a major airport;
 * you can add those incrementally as you encounter them.
 */
export const CITY_IATA: Record<string, IataCityCode> = {
  // -------------------------
  // UK / Ireland (handy)
  // -------------------------
  "london": "LON",
  "manchester": "MAN",
  "liverpool": "LPL",
  "birmingham": "BHX",
  "newcastle": "NCL",
  "leeds": "LBA",
  "bristol": "BRS",
  "glasgow": "GLA",
  "edinburgh": "EDI",
  "cardiff": "CWL",
  "belfast": "BFS",
  "dublin": "DUB",

  // -------------------------
  // Spain (LaLiga)
  // -------------------------
  "barcelona": "BCN",
  "madrid": "MAD",
  "valencia": "VLC",
  "sevilla": "SVQ",
  "seville": "SVQ",
  "bilbao": "BIO",
  "san sebastian": "EAS",
  "donostia-san sebastian": "EAS",
  "vigo": "VGO",
  "granada": "GRX",
  "mallorca": "PMI",
  "palma": "PMI",
  "las palmas": "LPA",
  "tenerife": "TCI", // metro code used by some systems; keep if it works for you
  "vitoria-gasteiz": "VIT",
  "vitoria": "VIT",
  "pamplona": "PNA",
  "valladolid": "VLL",

  // -------------------------
  // France (Ligue 1)
  // -------------------------
  "paris": "PAR",
  "marseille": "MRS",
  "lyon": "LYS",
  "lille": "LIL",
  "nice": "NCE",
  "toulouse": "TLS",
  "nantes": "NTE",
  "rennes": "RNS",
  "strasbourg": "SXB",
  "montpellier": "MPL",
  "lens": "LIL", // served via Lille metro area for many searches; adjust if you decide otherwise
  "reims": "RHE", // if this causes issues, remove and fall back to null
  "monaco": "MCM", // some systems use NCE; keep your preference consistent

  // -------------------------
  // Germany (Bundesliga)
  // -------------------------
  "berlin": "BER",
  "munich": "MUC",
  "münchen": "MUC",
  "frankfurt": "FRA",
  "dortmund": "DTM",
  "hamburg": "HAM",
  "leipzig": "LEJ",
  "stuttgart": "STR",
  "cologne": "CGN",
  "köln": "CGN",
  "dusseldorf": "DUS",
  "düsseldorf": "DUS",
  "bremen": "BRE",
  "hannover": "HAJ",
  "freiburg": "FDH", // smaller; if it behaves badly, delete and let it fall back
  "mainz": "QFZ",    // niche; keep only if you confirm it works
  "augsburg": "AGB",

  // -------------------------
  // Italy (Serie A)
  // -------------------------
  "rome": "ROM",
  "roma": "ROM",
  "milan": "MIL",
  "milano": "MIL",
  "naples": "NAP",
  "napoli": "NAP",
  "turin": "TRN",
  "torino": "TRN",
  "florence": "FLR",
  "firenze": "FLR",
  "bologna": "BLQ",
  "genoa": "GOA",
  "genova": "GOA",
  "verona": "VRN",
  "bergamo": "BGY",
  "udine": "UDN",
  "lecce": "BDS", // Brindisi/Salento area; adjust if you prefer "LCC" if you validate it works
  "cagliari": "CAG",
  "salerno": "QSR", // niche; keep only if confirmed
  "parma": "PMF",

  // -------------------------
  // Netherlands / Portugal etc (useful expansion)
  // -------------------------
  "amsterdam": "AMS",
  "lisbon": "LIS",
  "porto": "OPO",
};

/**
 * Resolve a city name to an IATA city code.
 * - returns null if not known.
 * - if the input itself is already a 3-letter code, returns it.
 */
export function resolveIataCityCode(cityOrCode: string): IataCityCode | null {
  const raw = String(cityOrCode ?? "").trim();
  if (!raw) return null;

  if (isIata3(raw)) return raw.toUpperCase();

  const key = norm(raw);
  return CITY_IATA[key] ?? null;
}

/**
 * Add/update at runtime (optional convenience for future tooling).
 * Persisting still requires editing this file.
 */
export function __unsafeSetCityIata(city: string, code: string) {
  const c = norm(city);
  const k = String(code ?? "").trim().toUpperCase();
  if (!c || !isIata3(k)) return;
  CITY_IATA[c] = k;
}
