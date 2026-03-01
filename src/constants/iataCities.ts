// src/constants/iataCities.ts
// Defensive IATA city index builder.
// This module MUST NEVER throw during import (Metro loads it globally).

export type IataCity = {
  iata: string;            // e.g. "LON"
  city: string;            // e.g. "London"
  country?: string;        // e.g. "United Kingdom"
  countryCode?: string;    // e.g. "GB"
  lat?: number;
  lon?: number;
  timezone?: string;
  aliases?: string[];
};

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function normKey(v: any) {
  return safeStr(v).toLowerCase();
}

function toNumberOrUndef(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// Try load any dataset you might have. If it doesn't exist or shape differs,
// we still return empty list and NEVER crash.
function loadRawDataset(): any {
  try {
    // If you have a JSON file, this is the most common pattern.
    // Adjust path if your dataset lives elsewhere, but this TRY/CATCH prevents crashes.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@/src/data/iataCities");
    return mod?.default ?? mod?.IATA_CITIES ?? mod?.cities ?? mod;
  } catch {
    return null;
  }
}

export function normalizeIataCity(raw: any): IataCity | null {
  if (!raw) return null;

  // Support multiple shapes:
  // - { iata, city, country, ... }
  // - { code, name, country, ... }
  // - ["LON","London","United Kingdom"] etc.
  if (Array.isArray(raw)) {
    const iata = safeStr(raw[0]);
    const city = safeStr(raw[1]);
    const country = safeStr(raw[2]);
    if (!iata || !city) return null;
    return { iata, city, country: country || undefined };
  }

  const iata = safeStr(raw.iata ?? raw.code ?? raw.IATA ?? raw.airportCode);
  const city = safeStr(raw.city ?? raw.name ?? raw.cityName);
  const country = safeStr(raw.country ?? raw.countryName);
  const countryCode = safeStr(raw.countryCode ?? raw.iso2 ?? raw.iso);
  if (!iata || !city) return null;

  const lat = toNumberOrUndef(raw.lat ?? raw.latitude);
  const lon = toNumberOrUndef(raw.lon ?? raw.lng ?? raw.longitude);
  const timezone = safeStr(raw.timezone);

  const aliases = Array.isArray(raw.aliases)
    ? raw.aliases.map(safeStr).filter(Boolean)
    : undefined;

  return {
    iata,
    city,
    country: country || undefined,
    countryCode: countryCode || undefined,
    lat,
    lon,
    timezone: timezone || undefined,
    aliases,
  };
}

export function buildIndex(listInput: any): {
  byCityKey: Record<string, IataCity>;
  byIata: Record<string, IataCity>;
  all: IataCity[];
} {
  // Critical: default to an empty array if undefined/null/bad.
  const rawList = Array.isArray(listInput)
    ? listInput
    : Array.isArray(listInput?.default)
      ? listInput.default
      : Array.isArray(listInput?.cities)
        ? listInput.cities
        : [];

  const all: IataCity[] = [];
  for (const raw of rawList) {
    const c = normalizeIataCity(raw);
    if (c) all.push(c);
  }

  const byCityKey: Record<string, IataCity> = {};
  const byIata: Record<string, IataCity> = {};

  for (const c of all) {
    const iataKey = normKey(c.iata);
    if (iataKey && !byIata[iataKey]) byIata[iataKey] = c;

    // cityKey = "london" or "london-gb" style, depending on your usage.
    // Keep it simple and stable: "city" + optional countryCode.
    const cityKeyBase = normKey(c.city);
    const cc = normKey(c.countryCode);
    const cityKey = cc ? `${cityKeyBase}-${cc}` : cityKeyBase;

    if (cityKey && !byCityKey[cityKey]) byCityKey[cityKey] = c;

    // Also allow plain city name lookup (so you can match "london" even if you store "london-gb")
    if (cityKeyBase && !byCityKey[cityKeyBase]) byCityKey[cityKeyBase] = c;

    // Aliases
    const aliases = Array.isArray(c.aliases) ? c.aliases : [];
    for (const a of aliases) {
      const ak = normKey(a);
      if (ak && !byCityKey[ak]) byCityKey[ak] = c;
    }
  }

  return { byCityKey, byIata, all };
}

// Build once at import, but safely.
const RAW = loadRawDataset();
const INDEX = buildIndex(RAW);

export const IATA_CITIES: IataCity[] = INDEX.all;
export const IATA_BY_CITYKEY: Record<string, IataCity> = INDEX.byCityKey;
export const IATA_BY_CODE: Record<string, IataCity> = INDEX.byIata;

export function getIataCityByCode(code: string): IataCity | null {
  const k = normKey(code);
  return k ? IATA_BY_CODE[k] ?? null : null;
}

export function getIataCityByCityKey(cityKey: string): IataCity | null {
  const k = normKey(cityKey);
  return k ? IATA_BY_CITYKEY[k] ?? null : null;
}

export function searchIataCities(query: string, limit = 20): IataCity[] {
  const q = normKey(query);
  if (!q) return [];
  const out: IataCity[] = [];

  for (const c of IATA_CITIES) {
    const hay = [
      c.city,
      c.iata,
      c.country ?? "",
      c.countryCode ?? "",
      ...(c.aliases ?? []),
    ]
      .map(normKey)
      .join(" ");

    if (hay.includes(q)) out.push(c);
    if (out.length >= limit) break;
  }

  return out;
}
