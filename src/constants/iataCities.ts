// src/constants/iataCities.ts

/**
 * IATA "city codes" (NOT airports).
 * Examples:
 * - London => LON (covers LHR/LGW/STN/LTN/LCY/SEN)
 * - Milan  => MIL (covers MXP/LIN/BGY)
 * - Paris  => PAR (covers CDG/ORY/BVA)
 *
 * Goal:
 * - Prefer city codes so Aviasales can auto-scope all airports for that city.
 * - Avoid "closest airport" logic and reduce user typing errors.
 *
 * Important:
 * - API-Football city strings are not perfectly consistent.
 * - We normalize via aliases to canonical cities.
 */

export type IataCityRow = {
  city: string; // canonical
  iataCity: string; // IATA city code (3 letters)
  country?: string;
};

function upper3(s: string) {
  return String(s ?? "").trim().toUpperCase();
}

function key(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

/**
 * Canonical city -> IATA city code
 * Expand over time as you add leagues/cities.
 */
const CANONICAL_CITY_TO_IATA: Record<string, string> = {
  /* -------------------- England (EPL) -------------------- */
  London: "LON",
  Manchester: "MAN",
  Liverpool: "LPL",
  Newcastle: "NCL",
  Birmingham: "BHX",
  Wolverhampton: "BHX",
  Brighton: "LON", // (no dedicated city-code commonly used in all systems; London-area fallback not ideal but pragmatic)
  Brentford: "LON",
  "Nottingham": "NQT", // East Midlands region; some systems use EMA airport; city-code is not universal
  Leicester: "BHX",
  Leeds: "LBA",
  Sheffield: "SZD",
  Southampton: "SOU",
  Bournemouth: "BOH",
  Burnley: "MAN",
  "West Ham": "LON",
  "Crystal Palace": "LON",
  "Tottenham": "LON",
  "Arsenal": "LON",
  "Chelsea": "LON",
  Fulham: "LON",
  "Aston": "BHX", // defensive fallback
  "Aston Villa": "BHX",
  "Manchester City": "MAN",
  "Manchester United": "MAN",

  /* -------------------- Spain (La Liga) -------------------- */
  Madrid: "MAD",
  Barcelona: "BCN",
  Valencia: "VLC",
  Seville: "SVQ",
  Sevilla: "SVQ",
  "San Sebastian": "EAS",
  Bilbao: "BIO",
  Vigo: "VGO",
  Zaragoza: "ZAZ",
  Malaga: "AGP",
  Granada: "GRX",
  "Las Palmas": "LPA",
  Palma: "PMI",

  /* -------------------- Italy (Serie A) -------------------- */
  Milan: "MIL",
  Rome: "ROM",
  Torino: "TRN",
  Turin: "TRN",
  Naples: "NAP",
  Napoli: "NAP",
  Bologna: "BLQ",
  Florence: "FLR",
  Firenze: "FLR",
  Genoa: "GOA",
  "Genoa": "GOA",
  Verona: "VRN",
  Venice: "VCE",
  Venezia: "VCE",
  Bergamo: "MIL",
  Udine: "UDN",
  Cagliari: "CAG",
  Bari: "BRI",
  Parma: "PMF",

  /* -------------------- Germany (Bundesliga) -------------------- */
  Berlin: "BER",
  Munich: "MUC",
  "München": "MUC",
  Dortmund: "DTM",
  Hamburg: "HAM",
  Frankfurt: "FRA",
  Leverkusen: "CGN",
  Cologne: "CGN",
  Köln: "CGN",
  Stuttgart: "STR",
  Bremen: "BRE",
  Leipzig: "LEJ",
  Wolfsburg: "HAJ",
  Hanover: "HAJ",
  Hannover: "HAJ",
  "Gelsenkirchen": "DUS",
  "Mönchengladbach": "DUS",
  Mainz: "FRA",
  Freiburg: "BSL",

  /* -------------------- France (Ligue 1) -------------------- */
  Paris: "PAR",
  Marseille: "MRS",
  Lyon: "LYS",
  Lille: "LIL",
  Nice: "NCE",
  Nantes: "NTE",
  Rennes: "RNS",
  Toulouse: "TLS",
  Bordeaux: "BOD",
  Strasbourg: "SXB",
  Montpellier: "MPL",
  Lens: "LIL",
  Monaco: "MCM",

  /* -------------------- Netherlands / Portugal etc (handy) -------------------- */
  Amsterdam: "AMS",
  Porto: "OPO",
  Lisbon: "LIS",
  Vienna: "VIE",
  Prague: "PRG",
  Budapest: "BUD",
};

const CITY_ALIASES_TO_CANONICAL: Record<string, string> = {
  /* Common casing / diacritics / local language */
  "muenchen": "Munich",
  "munchen": "Munich",
  "münchen": "Munich",

  "roma": "Rome",
  "milano": "Milan",
  "torino": "Turin",
  "napoli": "Naples",
  "firenze": "Florence",
  "genova": "Genoa",
  "venezia": "Venice",

  "sevilla": "Seville",
  "san sebastián": "San Sebastian",
  "san sebastian": "San Sebastian",

  "köln": "Cologne",
  "koln": "Cologne",

  /* Stadium/metro quirks you’ll see from APIs */
  "greater manchester": "Manchester",
  "manchester (uk)": "Manchester",

  "london (england)": "London",
  "london, england": "London",

  /* If APIs return borough/suburb names, fold into metro */
  "islington": "London",
  "hammersmith": "London",
  "fulham": "London",
  "brentford": "London",
  "croydon": "London",
  "tottenham": "London",

  /* Some English clubs get “city” as club name */
  "manchester city": "Manchester",
  "manchester united": "Manchester",

  /* Defensive trims */
  "st. etienne": "Lyon",
};

export function normalizeCityName(raw?: string | null): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  const k = key(s);

  // direct alias
  const aliased = CITY_ALIASES_TO_CANONICAL[k];
  if (aliased) return aliased;

  // if exact canonical exists, return canonical (preserve original casing if it matches)
  // we try to match by lowercasing keys
  const canon = Object.keys(CANONICAL_CITY_TO_IATA).find((c) => key(c) === k);
  if (canon) return canon;

  // otherwise keep original string (we don't want to destroy data),
  // but upstream code may not find an IATA mapping for it.
  return s;
}

export function toIataCityCode(cityRaw?: string | null): string | null {
  const canon = normalizeCityName(cityRaw);
  if (!canon) return null;

  const code = CANONICAL_CITY_TO_IATA[canon];
  const iata = upper3(code);

  return /^[A-Z]{3}$/.test(iata) ? iata : null;
}

export function listIataCities(): IataCityRow[] {
  const rows: IataCityRow[] = [];
  for (const [city, iataCity] of Object.entries(CANONICAL_CITY_TO_IATA)) {
    rows.push({ city, iataCity: upper3(iataCity) });
  }
  rows.sort((a, b) => a.city.localeCompare(b.city));
  return rows;
  }
