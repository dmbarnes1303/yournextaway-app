import * as rawIataCitiesModule from "@/src/data/iataCities";

// Defensive IATA city index builder.
// MUST NEVER throw during import (Metro loads it globally).

export type IataCity = {
  iata: string;
  city: string;
  country?: string;
  countryCode?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  aliases?: string[];
};

function safeStr(v: unknown) {
  return String(v ?? "").trim();
}

function normKey(v: unknown) {
  return safeStr(v).toLowerCase();
}

function toNumberOrUndef(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function loadRawDataset(): unknown {
  try {
    const mod = rawIataCitiesModule as {
      default?: unknown;
      IATA_CITIES?: unknown;
      cities?: unknown;
    };

    return mod.default ?? mod.IATA_CITIES ?? mod.cities ?? mod;
  } catch {
    return null;
  }
}

export function normalizeIataCity(raw: unknown): IataCity | null {
  if (!raw) return null;

  if (Array.isArray(raw)) {
    const iata = safeStr(raw[0]);
    const city = safeStr(raw[1]);
    const country = safeStr(raw[2]);
    const countryCode = safeStr(raw[3]);

    if (!iata || !city) return null;

    return {
      iata,
      city,
      country: country || undefined,
      countryCode: countryCode || undefined,
    };
  }

  if (typeof raw !== "object") return null;

  const value = raw as Record<string, unknown>;

  const iata = safeStr(value.iata ?? value.code ?? value.IATA ?? value.airportCode);
  const city = safeStr(value.city ?? value.name ?? value.cityName);
  const country = safeStr(value.country ?? value.countryName);
  const countryCode = safeStr(value.countryCode ?? value.iso2 ?? value.iso);

  if (!iata || !city) return null;

  const lat = toNumberOrUndef(value.lat ?? value.latitude);
  const lon = toNumberOrUndef(value.lon ?? value.lng ?? value.longitude);
  const timezone = safeStr(value.timezone);

  const aliases = Array.isArray(value.aliases)
    ? value.aliases.map(safeStr).filter(Boolean)
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

export function buildIndex(listInput: unknown): {
  byCityKey: Record<string, IataCity>;
  byIata: Record<string, IataCity>;
  all: IataCity[];
} {
  const input = listInput as {
    default?: unknown;
    cities?: unknown;
  } | null;

  const rawList = Array.isArray(listInput)
    ? listInput
    : Array.isArray(input?.default)
      ? input.default
      : Array.isArray(input?.cities)
        ? input.cities
        : [];

  const all: IataCity[] = [];

  for (const raw of rawList) {
    const city = normalizeIataCity(raw);
    if (city) all.push(city);
  }

  const byCityKey: Record<string, IataCity> = {};
  const byIata: Record<string, IataCity> = {};

  for (const city of all) {
    const iataKey = normKey(city.iata);
    if (iataKey && !byIata[iataKey]) byIata[iataKey] = city;

    const cityKeyBase = normKey(city.city);
    const cc = normKey(city.countryCode);
    const cityKey = cc ? `${cityKeyBase}-${cc}` : cityKeyBase;

    if (cityKey && !byCityKey[cityKey]) byCityKey[cityKey] = city;
    if (cityKeyBase && !byCityKey[cityKeyBase]) byCityKey[cityKeyBase] = city;

    const aliases = Array.isArray(city.aliases) ? city.aliases : [];
    for (const alias of aliases) {
      const aliasKey = normKey(alias);
      if (aliasKey && !byCityKey[aliasKey]) byCityKey[aliasKey] = city;
    }
  }

  return { byCityKey, byIata, all };
}

const RAW = loadRawDataset();
const INDEX = buildIndex(RAW);

export const IATA_CITIES: IataCity[] = INDEX.all;
export const IATA_BY_CITYKEY: Record<string, IataCity> = INDEX.byCityKey;
export const IATA_BY_CODE: Record<string, IataCity> = INDEX.byIata;

export function getIataCityCodeForCity(cityName: string): string {
  const key = normKey(cityName);
  if (!key) return "";

  const hit = IATA_BY_CITYKEY[key];
  return hit?.iata ? safeStr(hit.iata).toUpperCase() : "";
}

export function getIataCityCodeForCityKey(cityKey: string): string {
  const key = normKey(cityKey);
  if (!key) return "";

  const hit = IATA_BY_CITYKEY[key];
  return hit?.iata ? safeStr(hit.iata).toUpperCase() : "";
}

export function getIataCityByCode(code: string): IataCity | null {
  const key = normKey(code);
  return key ? IATA_BY_CODE[key] ?? null : null;
}

export function getIataCityByCityKey(cityKey: string): IataCity | null {
  const key = normKey(cityKey);
  return key ? IATA_BY_CITYKEY[key] ?? null : null;
}

export function searchIataCities(query: string, limit = 20): IataCity[] {
  const q = normKey(query);
  if (!q) return [];

  const out: IataCity[] = [];

  for (const city of IATA_CITIES) {
    const haystack = [
      city.city,
      city.iata,
      city.country ?? "",
      city.countryCode ?? "",
      ...(city.aliases ?? []),
    ]
      .map(normKey)
      .join(" ");

    if (haystack.includes(q)) out.push(city);
    if (out.length >= limit) break;
  }

  return out;
}
