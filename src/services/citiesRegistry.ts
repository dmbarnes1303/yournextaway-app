// src/services/citiesRegistry.ts
import { getCountries, getTeams, type ApiFootballTeamRow } from "@/src/services/apiFootball";
import type { LeagueOption } from "@/src/constants/football";
import { normalizeCityName } from "@/src/constants/iataCities";

function safeStr(v: any) {
  return String(v ?? "").trim();
}

/**
 * IMPORTANT:
 * This must match your route slugging behavior.
 * Do NOT slug from "pretty" names (Roma) if routes are built from user input (Rome).
 */
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
  slug: string; // canonical slug (built from raw venue city)
  name: string; // display name (pretty/canonical)
  country: string;
  countryCode: string; // ISO2 for flags
  venueIds: number[];
  teams: { id: number; name: string }[];
};

type CitySnapshot = {
  builtAt: number;
  bySlug: Record<string, CityRecord>; // includes alias slugs too
  list: CityRecord[];
};

const TTL_MS = 24 * 60 * 60 * 1000; // 24h
let cache: { ts: number; value: CitySnapshot } | null = null;
let inflight: Promise<CitySnapshot> | null = null;

function pickDisplayName(rawCity: string): string {
  // Pretty name for UI (may differ from raw; e.g. Rome -> Roma)
  const canon = safeStr(normalizeCityName(rawCity));
  return canon || safeStr(rawCity);
}

function countryCodeFallback(countryName: string): string {
  // Better than nothing. Never throw.
  const s = safeStr(countryName).toUpperCase();

  // UK home nations (display as GB flag in your UI system)
  if (s === "ENGLAND" || s === "UNITED KINGDOM" || s === "UK") return "GB";
  if (s === "SCOTLAND" || s === "WALES" || s === "NORTHERN IRELAND") return "GB";

  // Common full names where first 2 letters are NOT the ISO2:
  if (s === "UNITED STATES" || s === "USA") return "US";
  if (s === "UNITED ARAB EMIRATES") return "AE";

  // Default: first 2 letters (works for Italy -> IT, Spain -> ES, etc.)
  return s.length >= 2 ? s.slice(0, 2) : "";
}

function mergeTeam(list: { id: number; name: string }[], t: { id: number; name: string }) {
  if (!t?.id || !t?.name) return;
  if (list.some((x) => x.id === t.id)) return;
  list.push(t);
}

function mergeVenueId(list: number[], venueId: number) {
  if (!Number.isFinite(venueId) || venueId <= 0) return;
  if (!list.includes(venueId)) list.push(venueId);
}

export async function getCitySnapshot(leagues: LeagueOption[]): Promise<CitySnapshot> {
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) return cache.value;
  if (inflight) return inflight;

  inflight = (async () => {
    const leagueList = Array.isArray(leagues) ? leagues : [];

    // Countries map (name -> code)
    const countries = await getCountries().catch(() => []);
    const countryMap = new Map<string, string>();

    for (const c of countries) {
      const name = safeStr((c as any)?.name).toLowerCase();
      const code = safeStr((c as any)?.code).toUpperCase();
      if (name && code) countryMap.set(name, code);
    }

    // Primary records keyed by canonical slug (raw venue city)
    const cityMap = new Map<string, CityRecord>();

    // Alias mapping: any extra slug -> canonical slug
    const aliasToCanonical = new Map<string, string>();

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

      if (!venueCityRaw) continue;

      // ✅ Canonical slug is from RAW city value (stable vs route)
      const slugRaw = normalizeCityKey(venueCityRaw);
      if (!slugRaw) continue;

      // Display name can differ (Roma), but should not drive canonical slug
      const displayName = pickDisplayName(venueCityRaw);
      const slugDisplay = displayName ? normalizeCityKey(displayName) : "";

      const cc =
        (countryName && countryMap.get(countryName.toLowerCase())) ||
        (countryName ? countryCodeFallback(countryName) : "");

      const existing = cityMap.get(slugRaw);
      if (!existing) {
        cityMap.set(slugRaw, {
          slug: slugRaw,
          name: displayName || venueCityRaw,
          country: countryName || "",
          countryCode: cc || "",
          venueIds: Number.isFinite(venueId) && venueId > 0 ? [venueId] : [],
          teams: teamId && teamName ? [{ id: teamId, name: teamName }] : [],
        });
      } else {
        // Prefer richer values if missing
        if (!existing.name && (displayName || venueCityRaw)) existing.name = displayName || venueCityRaw;
        if (!existing.country && countryName) existing.country = countryName;
        if (!existing.countryCode && cc) existing.countryCode = cc;

        mergeVenueId(existing.venueIds, venueId);
        if (teamId && teamName) mergeTeam(existing.teams, { id: teamId, name: teamName });
      }

      // ✅ Add alias mapping if display slug differs (rome <-> roma case)
      if (slugDisplay && slugDisplay !== slugRaw) {
        // Point alias slug to the canonical record
        if (!aliasToCanonical.has(slugDisplay)) aliasToCanonical.set(slugDisplay, slugRaw);
      }
    }

    // Build list
    const list = Array.from(cityMap.values()).sort((a, b) => a.name.localeCompare(b.name, "en"));

    // Build bySlug including aliases
    const bySlug: Record<string, CityRecord> = {};
    for (const c of list) {
      bySlug[c.slug] = c;
    }
    for (const [alias, canonical] of aliasToCanonical.entries()) {
      const rec = cityMap.get(canonical);
      if (rec) bySlug[alias] = rec;
    }

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
  const keyRaw = normalizeCityKey(cityKey);
  if (!keyRaw) return null;

  const snap = await getCitySnapshot(leagues);

  // Direct match (preferred)
  if (snap.bySlug[keyRaw]) return snap.bySlug[keyRaw];

  // Fallback: try normalised display name version (rare)
  const pretty = safeStr(normalizeCityName(cityKey));
  const keyPretty = pretty ? normalizeCityKey(pretty) : "";
  if (keyPretty && snap.bySlug[keyPretty]) return snap.bySlug[keyPretty];

  return null;
}
