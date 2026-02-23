// src/data/iataCityCodes.ts

/**
 * City -> IATA CITY CODE registry.
 *
 * Goal:
 * - Use IATA CITY codes (e.g., LON, MIL, PAR) rather than single airports.
 * - Keep this small and pragmatic: only add cities we actually surface in fixtures.
 * - Expand opportunistically when we detect unknown cities.
 *
 * Notes:
 * - This is NOT "closest airport". It's "city code" so partners can show all airports.
 * - Some cities have multiple airports; city code avoids forcing the wrong one.
 */

export type IataCityCode = string; // e.g. "LON"
export type CityKey = string;

export function isIataCityCode(s?: string): s is IataCityCode {
  return !!s && /^[A-Z]{3}$/.test(String(s).trim().toUpperCase());
}

/**
 * Normalize city strings so lookups are resilient:
 * - trim
 * - lowercase
 * - strip diacritics
 * - collapse whitespace
 * - remove punctuation that often appears in venue cities
 */
export function normalizeCityName(input: unknown): CityKey {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  const lower = raw.toLowerCase();

  // strip diacritics (e.g. Köln -> Koln)
  const noDia = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // normalize separators / punctuation
  const cleaned = noDia
    .replace(/['’`]/g, "") // apostrophes
    .replace(/[().,]/g, " ") // punctuation to spaces
    .replace(/[-/]/g, " ") // separators to spaces
    .replace(/\s+/g, " ") // collapse spaces
    .trim();

  return cleaned;
}

/**
 * Canonical map: normalized city -> IATA CITY code.
 *
 * IMPORTANT:
 * - Keys MUST be normalized (use normalizeCityName("City") to check).
 * - Values MUST be 3-letter IATA.
 *
 * Start small. Add as needed.
 */
const CITY_TO_IATA: Record<CityKey, IataCityCode> = {
  // UK
  [normalizeCityName("London")]: "LON",
  [normalizeCityName("Manchester")]: "MAN",
  [normalizeCityName("Liverpool")]: "LPL",
  [normalizeCityName("Birmingham")]: "BHX",
  [normalizeCityName("Newcastle")]: "NCL",
  [normalizeCityName("Leeds")]: "LBA",
  [normalizeCityName("Glasgow")]: "GLA",
  [normalizeCityName("Edinburgh")]: "EDI",

  // Spain
  [normalizeCityName("Madrid")]: "MAD",
  [normalizeCityName("Barcelona")]: "BCN",
  [normalizeCityName("Valencia")]: "VLC",
  [normalizeCityName("Seville")]: "SVQ",
  [normalizeCityName("Sevilla")]: "SVQ",
  [normalizeCityName("Bilbao")]: "BIO",

  // France
  [normalizeCityName("Paris")]: "PAR",
  [normalizeCityName("Marseille")]: "MRS",
  [normalizeCityName("Lyon")]: "LYS",
  [normalizeCityName("Lille")]: "LIL",
  [normalizeCityName("Nice")]: "NCE",

  // Italy
  [normalizeCityName("Rome")]: "ROM",
  [normalizeCityName("Roma")]: "ROM",
  [normalizeCityName("Milan")]: "MIL",
  [normalizeCityName("Milano")]: "MIL",
  [normalizeCityName("Naples")]: "NAP",
  [normalizeCityName("Napoli")]: "NAP",
  [normalizeCityName("Turin")]: "TRN",
  [normalizeCityName("Torino")]: "TRN",

  // Germany
  [normalizeCityName("Munich")]: "MUC",
  [normalizeCityName("München")]: "MUC",
  [normalizeCityName("Berlin")]: "BER",
  [normalizeCityName("Hamburg")]: "HAM",
  [normalizeCityName("Frankfurt")]: "FRA",
  [normalizeCityName("Cologne")]: "CGN",
  [normalizeCityName("Köln")]: "CGN",
  [normalizeCityName("Dortmund")]: "DTM",
  [normalizeCityName("Leipzig")]: "LEJ",
};

/**
 * Optional aliases for weird venue city strings you might see from API-Football.
 * Example: stadium cities can be districts or metro areas.
 */
const ALIASES: Record<CityKey, CityKey> = {
  // Common football data quirks:
  [normalizeCityName("Greater Manchester")]: normalizeCityName("Manchester"),
  [normalizeCityName("Milano (MI)")]: normalizeCityName("Milano"),
  [normalizeCityName("Roma (RM)")]: normalizeCityName("Roma"),
};

/**
 * Lookup: returns IATA city code or null.
 */
export function getIataCityCodeForCity(city: unknown): IataCityCode | null {
  const key = normalizeCityName(city);
  if (!key) return null;

  const alias = ALIASES[key];
  const finalKey = alias || key;

  const code = CITY_TO_IATA[finalKey];
  return isIataCityCode(code) ? code : null;
}

/**
 * Optional: helper for expanding opportunistically.
 * You can call this when you encounter an unknown fixture venue city.
 *
 * In Phase 1 we just return the normalized key so you can paste it into the map later.
 */
export function debugCityKey(city: unknown): string {
  return normalizeCityName(city);
}
