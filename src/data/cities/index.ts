// src/data/cities/index.ts
import { normalizeCityKey as normalizeCityKeyStrict } from "@/src/utils/city";
import { LEAGUES } from "@/src/constants/football";
import { getTeams, type TeamRow } from "@/src/services/apiFootball";

export interface City {
  id: string;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  teams: string[];
  image?: string;
  venueIds?: number[];
  subtitle?: string;
}

function safeStr(v: any) {
  return String(v ?? "").trim();
}

/**
 * Use the shared normalizeCityKey() (diacritics-safe + kebab-case).
 * This MUST be the same normalization your routes/backgrounds use.
 */
function normalizeCityKey(input: string) {
  return normalizeCityKeyStrict(input);
}

/**
 * Country ISO-2 mapping for the leagues you support.
 * API-Football team.country is not reliably ISO-2.
 */
function countryToIso2(country: string) {
  const c = safeStr(country).toLowerCase();
  if (!c) return "";

  if (c === "england" || c === "united kingdom" || c === "uk" || c === "u.k." || c === "great britain") return "GB";
  if (c === "france") return "FR";
  if (c === "spain") return "ES";
  if (c === "italy") return "IT";
  if (c === "germany") return "DE";
  if (c === "monaco") return "MC";

  // fallback: unknown
  return "";
}

function titleFromKey(cityKey: string) {
  const key = safeStr(cityKey);
  if (!key) return "";
  return key
    .split("-")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

/* -------------------------------------------------------------------------- */
/* In-memory runtime registry (auto-generated) */
/* -------------------------------------------------------------------------- */

let _cities: City[] = [];
let _loaded = false;
let _inflight: Promise<City[]> | null = null;

export const cities: City[] = _cities;

/**
 * Build city list from teams for the configured leagues/seasons.
 * This is what guarantees 25/26 correctness (as long as LEAGUES season is set).
 */
async function buildCitiesFromApi(): Promise<City[]> {
  const leaguePairs = (LEAGUES ?? [])
    .map((l) => ({ league: Number(l.leagueId), season: Number(l.season) }))
    .filter((x) => Number.isFinite(x.league) && Number.isFinite(x.season));

  const settled = await Promise.allSettled(
    leaguePairs.map((p) => getTeams({ league: p.league, season: p.season }))
  );

  const allTeams: TeamRow[] = [];
  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    if (Array.isArray(s.value)) allTeams.push(...s.value);
  }

  // Group by normalized venue city (primary) else team.country + team name fallback.
  const map = new Map<string, City>();

  for (const row of allTeams) {
    const teamName = safeStr(row?.team?.name);
    const venueCityRaw = safeStr(row?.venue?.city);
    const venueId = typeof row?.venue?.id === "number" ? row.venue!.id : undefined;

    // If API doesn't provide venue city, we cannot create a real city record for it.
    // Skip rather than polluting with junk keys.
    const cityName = venueCityRaw;
    if (!cityName) continue;

    const slug = normalizeCityKey(cityName);
    if (!slug) continue;

    const countryName =
      safeStr(row?.team?.country) ||
      ""; // API-Football usually provides this per team

    const countryCode = countryToIso2(countryName) || "";

    const existing = map.get(slug);
    if (!existing) {
      map.set(slug, {
        id: slug,
        name: cityName,
        slug,
        country: countryName || "Unknown",
        countryCode: countryCode || "XX",
        teams: teamName ? [teamName] : [],
        venueIds: venueId ? [venueId] : [],
        // optional: keep this blank; your backgrounds system handles imagery
        image: undefined,
        subtitle: undefined,
      });
    } else {
      if (teamName && !existing.teams.includes(teamName)) existing.teams.push(teamName);
      if (venueId && !(existing.venueIds ?? []).includes(venueId)) {
        existing.venueIds = [...(existing.venueIds ?? []), venueId];
      }
      // Prefer a real country + ISO2 if we got it later
      if ((existing.country === "Unknown" || existing.countryCode === "XX") && countryName) {
        existing.country = countryName;
        existing.countryCode = countryToIso2(countryName) || existing.countryCode;
      }
    }
  }

  const out = Array.from(map.values());

  // Sort for determinism
  out.sort((a, b) => a.slug.localeCompare(b.slug));

  // Safety: fix display name formatting if API returns odd casing
  for (const c of out) {
    c.name = safeStr(c.name) || titleFromKey(c.slug);
    c.country = safeStr(c.country) || "Unknown";
    c.countryCode = safeStr(c.countryCode) || "XX";
  }

  return out;
}

/**
 * Ensure cities have been loaded once.
 * Safe to call from any screen; it will not throw synchronously.
 */
export function ensureCitiesLoaded(): void {
  if (_loaded || _inflight) return;

  _inflight = buildCitiesFromApi()
    .then((list) => {
      _cities = list;
      _loaded = true;
      _inflight = null;
      return list;
    })
    .catch(() => {
      // fail soft: keep empty; screens will still work via fallbacks
      _cities = _cities ?? [];
      _loaded = false;
      _inflight = null;
      return _cities;
    });
}

/**
 * Optional: await this where you WANT hard guarantees (e.g. a Cities browse screen).
 */
export async function loadCities(): Promise<City[]> {
  if (_loaded && _cities.length) return _cities;
  if (_inflight) return _inflight;

  _inflight = buildCitiesFromApi()
    .then((list) => {
      _cities = list;
      _loaded = true;
      _inflight = null;
      return list;
    })
    .catch(() => {
      _cities = _cities ?? [];
      _loaded = false;
      _inflight = null;
      return _cities;
    });

  return _inflight;
}

/* -------------------------------------------------------------------------- */
/* Lookup helpers used by screens */
/* -------------------------------------------------------------------------- */

export function getCityByKey(cityInput: string): City | null {
  ensureCitiesLoaded();

  const key = normalizeCityKey(cityInput);
  if (!key) return null;

  // 1) Exact slug match
  const direct = _cities.find((c) => normalizeCityKey(c.slug) === key);
  if (direct) return direct;

  // 2) Exact name match
  const byName = _cities.find((c) => normalizeCityKey(c.name) === key);
  if (byName) return byName;

  // 3) Team match
  const byTeam = _cities.find((c) => (c.teams ?? []).some((t) => normalizeCityKey(t) === key));
  return byTeam ?? null;
}

export function getCity(cityInput: string): City | null {
  return getCityByKey(cityInput);
}

/**
 * Expose the current snapshot (may be empty until loaded).
 */
export function getCitiesSnapshot(): City[] {
  ensureCitiesLoaded();
  return _cities;
}

export default cities;
