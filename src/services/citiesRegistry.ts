// src/services/citiesRegistry.ts
import { getCountries, getTeams, type ApiFootballTeamRow } from "@/src/services/apiFootball";
import type { LeagueOption } from "@/src/constants/football";
import { normalizeCityName } from "@/src/constants/iataCities";

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function normalizeCityKey(input: string) {
  return safeStr(input)
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export type CityRecord = {
  slug: string;
  name: string;
  country: string;
  countryCode: string; // ISO2 for flags
  venueIds: number[];
  teams: { id: number; name: string }[];
};

type CitySnapshot = {
  builtAt: number;
  bySlug: Record<string, CityRecord>;
  list: CityRecord[];
};

const TTL_MS = 24 * 60 * 60 * 1000; // 24h (cities don't change hourly)
let cache: { ts: number; value: CitySnapshot } | null = null;
let inflight: Promise<CitySnapshot> | null = null;

function pickDisplayName(rawCity: string): string {
  const canon = normalizeCityName(rawCity);
  return canon ? canon : safeStr(rawCity);
}

function countryCodeFallback(countryName: string): string {
  // fallback is better than crashing; flags may not render until /countries fetch works
  const s = safeStr(countryName).toUpperCase();
  if (s === "ENGLAND" || s === "UNITED KINGDOM" || s === "UK") return "GB";
  if (s === "SCOTLAND") return "GB";
  if (s === "WALES") return "GB";
  if (s === "NORTHERN IRELAND") return "GB";
  return s.length >= 2 ? s.slice(0, 2) : "";
}

function mergeTeam(list: { id: number; name: string }[], t: { id: number; name: string }) {
  if (!t?.id || !t?.name) return;
  if (list.some((x) => x.id === t.id)) return;
  list.push(t);
}

export async function getCitySnapshot(leagues: LeagueOption[]): Promise<CitySnapshot> {
  const now = Date.now();

  if (cache && now - cache.ts < TTL_MS) return cache.value;
  if (inflight) return inflight;

  inflight = (async () => {
    const leagueList = Array.isArray(leagues) ? leagues : [];
    const countries = await getCountries().catch(() => []);
    const countryMap = new Map<string, string>(); // name -> code

    for (const c of countries) {
      const name = safeStr((c as any)?.name);
      const code = safeStr((c as any)?.code).toUpperCase();
      if (name && code) countryMap.set(name.toLowerCase(), code);
    }

    const cityMap = new Map<string, CityRecord>();

    // Fetch teams for each league/season; build city buckets from venue.city
    const settled = await Promise.allSettled(
      leagueList.map(async (l) => {
        const rows = await getTeams({ league: l.leagueId, season: l.season });
        return rows;
      })
    );

    const allTeams: ApiFootballTeamRow[] = [];
    for (const s of settled) {
      if (s.status !== "fulfilled") continue;
      const list = Array.isArray(s.value) ? s.value : [];
      allTeams.push(...list);
    }

    for (const row of allTeams) {
      const teamId = Number((row as any)?.team?.id);
      const teamName = safeStr((row as any)?.team?.name);
      const countryName = safeStr((row as any)?.team?.country);

      const venueId = Number((row as any)?.venue?.id);
      const venueCityRaw = safeStr((row as any)?.venue?.city);

      // We only consider teams with a known city
      if (!venueCityRaw) continue;

      const cityName = pickDisplayName(venueCityRaw);
      const slug = normalizeCityKey(cityName);
      if (!slug) continue;

      const cc =
        (countryName && countryMap.get(countryName.toLowerCase())) ||
        (countryName ? countryCodeFallback(countryName) : "");

      const existing = cityMap.get(slug);
      if (!existing) {
        cityMap.set(slug, {
          slug,
          name: cityName,
          country: countryName || "",
          countryCode: cc || "",
          venueIds: Number.isFinite(venueId) && venueId > 0 ? [venueId] : [],
          teams: teamId && teamName ? [{ id: teamId, name: teamName }] : [],
        });
      } else {
        // Prefer richer values if missing
        if (!existing.country && countryName) existing.country = countryName;
        if (!existing.countryCode && cc) existing.countryCode = cc;

        if (Number.isFinite(venueId) && venueId > 0 && !existing.venueIds.includes(venueId)) {
          existing.venueIds.push(venueId);
        }
        if (teamId && teamName) mergeTeam(existing.teams, { id: teamId, name: teamName });
      }
    }

    const list = Array.from(cityMap.values()).sort((a, b) => a.name.localeCompare(b.name, "en"));
    const bySlug: Record<string, CityRecord> = {};
    list.forEach((c) => (bySlug[c.slug] = c));

    const snapshot: CitySnapshot = { builtAt: now, bySlug, list };
    cache = { ts: now, value: snapshot };
    inflight = null;
    return snapshot;
  })().catch((e) => {
    inflight = null;
    throw e;
  });

  return inflight;
}

export async function getCityByKeyLive(cityKey: string, leagues: LeagueOption[]): Promise<CityRecord | null> {
  const key = normalizeCityKey(cityKey);
  if (!key) return null;
  const snap = await getCitySnapshot(leagues);
  return snap.bySlug[key] ?? null;
  }
