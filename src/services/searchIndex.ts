// src/services/searchIndex.ts
import { normalizeSearchText, tokenizeQuery, expandQueryTokens } from "@/src/constants/search";
import type { LeagueOption } from "@/src/constants/football";
import cityGuidesRegistry from "@/src/data/cityGuides";
import teamGuidesRegistry from "@/src/data/teamGuides";
import teamsRegistry, { normalizeTeamKey } from "@/src/data/teams";
import { normalizeCityKey } from "@/src/utils/city";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

/**
 * V1 Search Index
 * - Deterministic + in-memory
 * - Safe with partial data (never crash)
 * - Home uses:
 *    buildSearchIndex({ from, to, leagues })
 *    querySearchIndex(index, query, { limit })
 */

export type SearchEntityType = "team" | "city" | "venue" | "country" | "league";

export type SearchPayload =
  | { kind: "team"; slug: string; teamId?: number }
  | { kind: "city"; slug: string }
  | { kind: "venue"; slug: string }
  | { kind: "country"; country: string; leagueId: number; season: number }
  | { kind: "league"; leagueId: number; season: number };

export type SearchResult = {
  type: SearchEntityType;
  key: string;
  title: string;
  subtitle?: string;
  score: number;
  payload: SearchPayload;
};

type IndexEntry = {
  type: SearchEntityType;
  key: string;
  title: string;
  subtitle?: string;
  tokens: string[];
  payload: SearchPayload;
};

export type SearchIndexDebug = {
  enabled: boolean;
  counts: Record<SearchEntityType, number>;
  totalEntries: number;
  fixtureRowsScanned: number;
  unresolvedFixtureTeamNames: string[];
};

export type SearchIndex = {
  builtAt: number;
  from: string;
  to: string;
  leagues: LeagueOption[];
  entries: IndexEntry[];
  debug?: SearchIndexDebug;
};

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

function normalizeVenueKey(input: string | undefined | null): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[,/|].*$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toEntryTokens(parts: Array<string | undefined | null>): string[] {
  const joined = parts.filter(Boolean).join(" ");
  return uniq(tokenizeQuery(joined));
}

function isDebugEnabled(): boolean {
  return typeof __DEV__ !== "undefined" ? !!__DEV__ : false;
}

function tryResolveTeamKey(input: string): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("@/src/data/teams");
    const fn = mod?.resolveTeamKey;
    if (typeof fn === "function") {
      const out = fn(input);
      return typeof out === "string" && out.trim() ? out.trim() : null;
    }
  } catch {
    // ignore
  }
  return null;
}

function canonicalTeamSlug(input: string | undefined | null): { slug: string | null; resolved: boolean } {
  const s = safeStr(input);
  if (!s) return { slug: null, resolved: false };

  const resolvedKey = tryResolveTeamKey(s);
  if (resolvedKey) {
    const slug = normalizeTeamKey(resolvedKey);
    return { slug: slug || null, resolved: true };
  }

  const fallback = normalizeTeamKey(s);
  return { slug: fallback || null, resolved: false };
}

/**
 * scoreMatch MUST return 0 when there is no meaningful overlap.
 */
function scoreMatch(queryTokens: string[], entryTokens: string[]): number {
  if (!queryTokens.length || !entryTokens.length) return 0;

  let score = 0;
  let hit = 0;

  for (const qt of queryTokens) {
    if (!qt) continue;

    if (entryTokens.includes(qt)) {
      score += 6;
      hit += 1;
      continue;
    }

    const prefix = entryTokens.some((et) => et.startsWith(qt));
    if (prefix) {
      score += 2;
      hit += 1;
    }
  }

  if (hit === 0) return 0;

  if (queryTokens.length >= 2) {
    const needed = Math.max(1, Math.ceil(queryTokens.length * 0.6));
    if (hit >= needed) score += 3;
  }

  return score;
}

function typeBoost(t: SearchEntityType): number {
  if (t === "team") return 3;
  if (t === "city") return 2;
  if (t === "venue") return 1;
  return 0;
}

function upsertEntry(map: Map<string, IndexEntry>, entry: IndexEntry) {
  const existing = map.get(entry.key);
  if (!existing) {
    map.set(entry.key, entry);
    return;
  }

  const existingPayload: any = existing.payload;
  const nextPayload: any = entry.payload;

  const mergedPayload =
    existingPayload?.kind === "team" && nextPayload?.kind === "team"
      ? { ...existingPayload, ...nextPayload, teamId: existingPayload.teamId ?? nextPayload.teamId }
      : existing.payload ?? entry.payload;

  map.set(entry.key, {
    ...existing,
    title: existing.title || entry.title,
    subtitle: existing.subtitle || entry.subtitle,
    tokens: uniq([...(existing.tokens ?? []), ...(entry.tokens ?? [])]),
    payload: mergedPayload,
  });
}

function buildCityGuideEntries(map: Map<string, IndexEntry>) {
  Object.values(cityGuidesRegistry as any).forEach((g: any) => {
    const name = safeStr(g?.name ?? g?.cityId);
    if (!name) return;

    const slug = normalizeCityKey(g?.cityId ?? name);
    if (!slug) return;

    const country = safeStr(g?.country);

    upsertEntry(map, {
      type: "city",
      key: `city:${slug}`,
      title: name,
      subtitle: country || "City",
      tokens: toEntryTokens([name, slug, country]),
      payload: { kind: "city", slug },
    });
  });
}

function buildCountriesFromGuides(map: Map<string, IndexEntry>) {
  const countries = uniq(
    Object.values(cityGuidesRegistry as any)
      .map((g: any) => safeStr(g?.country))
      .filter(Boolean)
  );

  countries.forEach((country) => {
    const cKey = normalizeSearchText(country).replace(/\s+/g, "-");
    if (!cKey) return;

    upsertEntry(map, {
      type: "country",
      key: `country:${cKey}`,
      title: country,
      subtitle: "Country",
      tokens: toEntryTokens([country, cKey]),
      payload: { kind: "country", country, leagueId: 0, season: 0 },
    });
  });
}

function buildTeamsRegistryEntries(map: Map<string, IndexEntry>) {
  Object.values(teamsRegistry as any).forEach((t: any) => {
    const name = safeStr(t?.name);
    const teamKey = safeStr(t?.teamKey);
    if (!name || !teamKey) return;

    const { slug } = canonicalTeamSlug(teamKey);
    if (!slug) return;

    const subtitle = safeStr(t?.city || t?.country) || "Team";
    const aliases = Array.isArray(t?.aliases) ? t.aliases : [];

    upsertEntry(map, {
      type: "team",
      key: `team:${slug}`,
      title: name,
      subtitle,
      tokens: toEntryTokens([name, slug, t?.city, t?.country, ...aliases]),
      payload: { kind: "team", slug, teamId: typeof t?.teamId === "number" ? t.teamId : undefined },
    });
  });
}

function buildTeamGuideEntries(map: Map<string, IndexEntry>) {
  Object.values(teamGuidesRegistry as any).forEach((g: any) => {
    const name = safeStr(g?.name ?? g?.teamName ?? g?.teamKey ?? g?.teamId);
    if (!name) return;

    const raw = g?.teamKey ?? g?.teamId ?? name;
    const { slug } = canonicalTeamSlug(raw);
    if (!slug) return;

    upsertEntry(map, {
      type: "team",
      key: `team:${slug}`,
      title: name,
      subtitle: safeStr(g?.city ?? g?.country) || "Team",
      tokens: toEntryTokens([name, slug, g?.city, g?.country, g?.stadium]),
      payload: { kind: "team", slug },
    });
  });
}

function buildLeagueEntries(map: Map<string, IndexEntry>, leagues: LeagueOption[]) {
  leagues.forEach((l) => {
    const title = safeStr(l?.label);
    if (!title) return;

    const season = Number(l?.season) || 0;

    upsertEntry(map, {
      type: "league",
      key: `league:${String(l.leagueId)}:${String(season)}`,
      title,
      subtitle: season ? `Season ${season}` : undefined,
      tokens: toEntryTokens([title, String(l.leagueId), String(season)]),
      payload: { kind: "league", leagueId: l.leagueId, season },
    });
  });
}

function patchCountryPayloads(entries: IndexEntry[], leagues: LeagueOption[]): IndexEntry[] {
  const leagueList = Array.isArray(leagues) ? leagues : [];
  const fallback = leagueList[0];

  const pickLeagueForCountry = (country: string): LeagueOption | undefined => {
    const cn = normalizeSearchText(country);

    const match =
      leagueList.find((l) => normalizeSearchText(l.label).includes(cn)) ??
      leagueList.find((l) => {
        const label = normalizeSearchText(l.label);
        if (cn.includes("england") || cn.includes("uk") || cn.includes("britain")) return label.includes("premier");
        if (cn.includes("spain")) return label.includes("la liga") || label.includes("laliga");
        if (cn.includes("italy")) return label.includes("serie a") || label.includes("seriea");
        if (cn.includes("germany")) return label.includes("bundesliga");
        if (cn.includes("france")) return label.includes("ligue 1") || label.includes("ligue1");
        if (cn.includes("austria")) return label.includes("austrian") || label.includes("bundesliga");
        return false;
      }) ?? fallback;

    return match;
  };

  return entries.map((e) => {
    if (e.type !== "country") return e;
    if (e.payload.kind !== "country") return e;

    const chosen = pickLeagueForCountry(e.payload.country);
    const leagueId = chosen?.leagueId ?? 0;
    const season = Number(chosen?.season) || 0;

    return { ...e, payload: { kind: "country", country: e.payload.country, leagueId, season } };
  });
}

async function buildFixtureDerivedEntries(args: {
  map: Map<string, IndexEntry>;
  from: string;
  to: string;
  leagues: LeagueOption[];
  unresolvedFixtureTeams?: Set<string>;
}): Promise<number> {
  const { map, from, to, leagues, unresolvedFixtureTeams } = args;

  const settled = await Promise.allSettled(
    (leagues ?? []).map((l) =>
      getFixtures({
        league: l.leagueId,
        season: l.season,
        from,
        to,
      })
    )
  );

  const rows: FixtureListRow[] = [];
  settled.forEach((s) => {
    if (s.status !== "fulfilled") return;
    const list = Array.isArray(s.value) ? (s.value as FixtureListRow[]) : [];
    rows.push(...list);
  });

  rows.forEach((r) => {
    const homeName = safeStr(r?.teams?.home?.name);
    const awayName = safeStr(r?.teams?.away?.name);

    if (homeName) {
      const { slug, resolved } = canonicalTeamSlug(homeName);
      if (!resolved && unresolvedFixtureTeams) unresolvedFixtureTeams.add(homeName);

      if (slug) {
        upsertEntry(map, {
          type: "team",
          key: `team:${slug}`,
          title: homeName,
          subtitle: "Team",
          tokens: toEntryTokens([homeName, slug]),
          payload: { kind: "team", slug },
        });
      }
    }

    if (awayName) {
      const { slug, resolved } = canonicalTeamSlug(awayName);
      if (!resolved && unresolvedFixtureTeams) unresolvedFixtureTeams.add(awayName);

      if (slug) {
        upsertEntry(map, {
          type: "team",
          key: `team:${slug}`,
          title: awayName,
          subtitle: "Team",
          tokens: toEntryTokens([awayName, slug]),
          payload: { kind: "team", slug },
        });
      }
    }

    const venueName = safeStr(r?.fixture?.venue?.name);
    const venueCity = safeStr(r?.fixture?.venue?.city);

    if (venueName) {
      const vSlug = normalizeVenueKey(venueName);
      if (vSlug) {
        upsertEntry(map, {
          type: "venue",
          key: `venue:${vSlug}`,
          title: venueName,
          subtitle: venueCity || "Venue",
          tokens: toEntryTokens([venueName, vSlug, venueCity]),
          payload: { kind: "venue", slug: vSlug },
        });
      }
    }

    if (venueCity) {
      const cSlug = normalizeCityKey(venueCity);
      if (cSlug) {
        upsertEntry(map, {
          type: "city",
          key: `city:${cSlug}`,
          title: venueCity,
          subtitle: "City",
          tokens: toEntryTokens([venueCity, cSlug]),
          payload: { kind: "city", slug: cSlug },
        });
      }
    }
  });

  return rows.length;
}

export async function buildSearchIndex(args: { from: string; to: string; leagues: LeagueOption[] }): Promise<SearchIndex> {
  const from = safeStr(args?.from);
  const to = safeStr(args?.to);
  const leagues = Array.isArray(args?.leagues) ? args.leagues : [];

  const map = new Map<string, IndexEntry>();
  const debugEnabled = isDebugEnabled();
  const unresolvedFixtureTeams = debugEnabled ? new Set<string>() : undefined;

  // Deterministic base
  buildCityGuideEntries(map);
  buildCountriesFromGuides(map);
  buildTeamsRegistryEntries(map);
  buildTeamGuideEntries(map);
  buildLeagueEntries(map, leagues);

  // Fixture-derived (adds missing cities/venues/teams automatically per current season)
  let fixtureRowsScanned = 0;
  try {
    fixtureRowsScanned = await buildFixtureDerivedEntries({ map, from, to, leagues, unresolvedFixtureTeams });
  } catch {
    // offline-safe
  }

  let entries = Array.from(map.values());
  entries = patchCountryPayloads(entries, leagues);

  if (!debugEnabled) {
    return { builtAt: Date.now(), from, to, leagues, entries };
  }

  const counts: Record<SearchEntityType, number> = { team: 0, city: 0, venue: 0, country: 0, league: 0 };
  for (const e of entries) counts[e.type] += 1;

  return {
    builtAt: Date.now(),
    from,
    to,
    leagues,
    entries,
    debug: {
      enabled: true,
      counts,
      totalEntries: entries.length,
      fixtureRowsScanned,
      unresolvedFixtureTeamNames: unresolvedFixtureTeams ? Array.from(unresolvedFixtureTeams).sort() : [],
    },
  };
}

export function querySearchIndex(index: SearchIndex, query: string, opts?: { limit?: number }): SearchResult[] {
  const limit = Math.max(1, Math.min(Number(opts?.limit ?? 20), 100));
  const q = safeStr(query);
  if (!q) return [];

  const baseTokens = tokenizeQuery(q);
  const queryTokens = expandQueryTokens(baseTokens);
  if (!queryTokens.length) return [];

  const scored: SearchResult[] = (index?.entries ?? [])
    .map((e) => {
      const baseScore = scoreMatch(queryTokens, e.tokens);
      if (baseScore <= 0) return null;

      const score = baseScore + typeBoost(e.type);

      return {
        type: e.type,
        key: e.key,
        title: e.title,
        subtitle: e.subtitle,
        score,
        payload: e.payload,
      } as SearchResult;
    })
    .filter((x): x is SearchResult => !!x)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
