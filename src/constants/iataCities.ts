// src/constants/iataCities.ts

/**
 * City → IATA "city code" registry (Phase 1).
 *
 * Goal:
 * - Use IATA CITY codes where they exist (LON, PAR, MIL, ROM, NYC, etc)
 * - Where no city code exists, use the most pragmatic airport code (e.g. LPL).
 *
 * Scalable approach:
 * - Only map cities you actually surface (fixture venue cities).
 * - Expand opportunistically as new cities appear.
 * - Later swap to a dataset/API.
 */

export type IataCode = string; // typically 3 letters

function norm(input: string) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, ""); // strip diacritics
}

/**
 * IMPORTANT:
 * Keys MUST be normalized (use `norm()`).
 * Values MUST be 3-letter IATA codes (prefer CITY code; otherwise airport code).
 */
const CITY_TO_IATA: Record<string, IataCode> = {
  /* ------------------------------ ENGLAND (EPL) ------------------------------ */
  [norm("London")]: "LON",
  [norm("Manchester")]: "MAN",
  [norm("Liverpool")]: "LPL",
  [norm("Birmingham")]: "BHX",
  [norm("Newcastle")]: "NCL",
  [norm("Leeds")]: "LBA",
  [norm("Leicester")]: "EMA", // pragmatic (closest major)
  [norm("Nottingham")]: "EMA", // pragmatic
  [norm("Sheffield")]: "DSA", // Doncaster Sheffield (note: service varies) – pragmatic
  [norm("Southampton")]: "SOU",
  [norm("Brighton")]: "LGW", // pragmatic
  [norm("Bournemouth")]: "BOH",
  [norm("Brentford")]: "LON",
  [norm("Fulham")]: "LON",
  [norm("Wolverhampton")]: "BHX",

  /* ------------------------------ SPAIN (LaLiga) ----------------------------- */
  [norm("Madrid")]: "MAD",
  [norm("Barcelona")]: "BCN",
  [norm("Seville")]: "SVQ",
  [norm("Sevilla")]: "SVQ",
  [norm("Valencia")]: "VLC",
  [norm("Bilbao")]: "BIO",
  [norm("San Sebastian")]: "EAS",
  [norm("San Sebastián")]: "EAS",
  [norm("Vigo")]: "VGO",
  [norm("Malaga")]: "AGP",
  [norm("Málaga")]: "AGP",
  [norm("Palma")]: "PMI",
  [norm("Palma de Mallorca")]: "PMI",
  [norm("Las Palmas")]: "LPA",
  [norm("Gran Canaria")]: "LPA",

  /* ------------------------------ ITALY (Serie A) ---------------------------- */
  [norm("Rome")]: "ROM", // IATA city code
  [norm("Roma")]: "ROM",
  [norm("Milan")]: "MIL", // IATA city code
  [norm("Milano")]: "MIL",
  [norm("Naples")]: "NAP",
  [norm("Napoli")]: "NAP",
  [norm("Turin")]: "TRN",
  [norm("Torino")]: "TRN",
  [norm("Florence")]: "FLR",
  [norm("Firenze")]: "FLR",
  [norm("Bologna")]: "BLQ",
  [norm("Genoa")]: "GOA",
  [norm("Genova")]: "GOA",
  [norm("Verona")]: "VRN",
  [norm("Bergamo")]: "BGY",
  [norm("Udine")]: "TRS", // pragmatic (Trieste/Ronchi dei Legionari)
  [norm("Cagliari")]: "CAG",
  [norm("Lecce")]: "BDS",

  /* ---------------------------- GERMANY (Bundesliga) ------------------------- */
  [norm("Berlin")]: "BER",
  [norm("Munich")]: "MUC",
  [norm("München")]: "MUC",
  [norm("Hamburg")]: "HAM",
  [norm("Frankfurt")]: "FRA",
  [norm("Cologne")]: "CGN",
  [norm("Köln")]: "CGN",
  [norm("Dortmund")]: "DTM",
  [norm("Leipzig")]: "LEJ",
  [norm("Stuttgart")]: "STR",
  [norm("Bremen")]: "BRE",
  [norm("Dusseldorf")]: "DUS",
  [norm("Düsseldorf")]: "DUS",
  [norm("Mainz")]: "FRA", // pragmatic
  [norm("Augsburg")]: "MUC", // pragmatic

  /* ------------------------------ FRANCE (Ligue 1) --------------------------- */
  [norm("Paris")]: "PAR", // IATA city code
  [norm("Marseille")]: "MRS",
  [norm("Lyon")]: "LYS",
  [norm("Lille")]: "LIL",
  [norm("Nice")]: "NCE",
  [norm("Toulouse")]: "TLS",
  [norm("Bordeaux")]: "BOD",
  [norm("Nantes")]: "NTE",
  [norm("Rennes")]: "RNS",
  [norm("Strasbourg")]: "SXB",
  [norm("Monaco")]: "NCE", // pragmatic
};

/** Returns 3-letter IATA code (prefer city code), or null if unknown. */
export function getIataCityCodeForCity(city: string): string | null {
  const key = norm(city);
  if (!key) return null;

  const code = CITY_TO_IATA[key];
  if (!code) return null;

  const up = String(code).trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(up)) return null;
  return up;
}

/**
 * Use this for “expand opportunistically”:
 * Call this in dev when you detect an unmapped city.
 */
export function devWarnIfUnknownCity(city: string, context?: string) {
  // @ts-ignore
  const isDev = typeof __DEV__ !== "undefined" && __DEV__;
  if (!isDev) return;

  const c = String(city ?? "").trim();
  if (!c) return;

  const code = getIataCityCodeForCity(c);
  if (code) return;

  const tag = context ? ` (${context})` : "";
  // eslint-disable-next-line no-console
  console.warn(`[IATA] Missing city mapping${tag}: "${c}"`);
}

/** Helper for UI labels */
export function formatIataLabel(cityLabel: string, code: string) {
  const c = String(cityLabel ?? "").trim() || "City";
  const up = String(code ?? "").trim().toUpperCase();
  return `${c} (${up})`;
}
