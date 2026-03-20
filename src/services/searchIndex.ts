import { LEAGUES, type LeagueOption } from "@/src/constants/football";
import { expandQueryTokens, normalizeSearchText, tokenizeQuery } from "@/src/constants/search";
import cityGuidesRegistry from "@/src/data/cityGuides";
import teamGuidesRegistry from "@/src/data/teamGuides";
import teamsRegistry, { normalizeTeamKey, resolveTeamKey } from "@/src/data/teams";
import type { FixtureListRow } from "@/src/services/apiFootball";
import { getFixtures } from "@/src/services/apiFootball";
import { normalizeCityKey } from "@/src/utils/city";

/**
 * Search Index
 * - Deterministic + in-memory
 * - Safe with partial data (never crash)
 * - Uses league config as source of truth for league/country search
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

function toEntryTokens(parts: (string | undefined | null)[]): string[] {
  const joined = parts.filter(Boolean).join(" ");
  return uniq(tokenizeQuery(joined));
}

function isDebugEnabled(): boolean {
  return typeof __DEV__ !== "undefined" ? __DEV__ : false;
}

function tryResolveTeamKey(input: string): string | null {
  try {
    const out = resolveTeamKey(input);
    return typeof out === "string" && out.trim() ? out.trim() : null;
  } catch {
    return null;
  }
}

function canonicalTeamSlug(input: string | undefined | null): {
  slug: string | null;
  resolved: boolean;
} {
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

  const existingPayload = existing.payload as SearchPayload;
  const nextPayload = entry.payload as SearchPayload;

  const mergedPayload =
    existingPayload.kind === "team" && nextPayload.kind === "team"
      ? {
          ...existingPayload,
          ...nextPayload,
          teamId: existingPayload.teamId ?? nextPayload.teamId,
        }
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
  Object.values(cityGuidesRegistry as Record<string, unknown>).forEach((g) => {
    const guide = g as Record<string, unknown>;
    const name = safeStr(guide.name ?? guide.cityId);
    if (!name) return;

    const slug = normalizeCityKey(guide.cityId ?? name);
    if (!slug) return;

    const country = safeStr(guide.country);

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

function buildCountriesFromLeagues(map: Map<string, IndexEntry>, leagues: LeagueOption[]) {
  leagues.forEach((league) => {
    const country = safeStr(league.country);
    if (!country) return;

    const cKey = normalizeSearchText(country).replace(/\s+/g, "-");
    if (!cKey) return;

    upsertEntry(map, {
      type: "country",
      key: `country:${cKey}`,
      title: country,
      subtitle: league.label,
      tokens: toEntryTokens([
        country,
        cKey,
        league.label,
        league.slug,
        league.countryCode,
        ...(league.featuredClubKeys ?? []),
      ]),
      payload: {
        kind: "country",
        country,
        leagueId: league.leagueId,
        season: Number(league.season) || 0,
      },
    });
  });
}

function buildTeamsRegistryEntries(map: Map<string, IndexEntry>) {
  Object.values(teamsRegistry as Record<string, unknown>).forEach((t) => {
    const team = t as Record<string, unknown>;
    const name = safeStr(team.name);
    const teamKey = safeStr(team.teamKey);
    if (!name || !teamKey) return;

    const { slug } = canonicalTeamSlug(teamKey);
    if (!slug) return;

    const subtitle = safeStr(team.city || team.country) || "Team";
    const aliases = Array.isArray(team.aliases) ? team.aliases.map((a) => safeStr(a)) : [];

    upsertEntry(map, {
      type: "team",
      key: `team:${slug}`,
      title: name,
      subtitle,
      tokens: toEntryTokens([name, slug, team.city as string, team.country as string, ...aliases]),
      payload: {
        kind: "team",
        slug,
        teamId: typeof team.teamId === "number" ? team.teamId : undefined,
      },
    });
  });
}

function buildTeamGuideEntries(map: Map<string, IndexEntry>) {
  Object.values(teamGuidesRegistry as Record<string, unknown>).forEach((g) => {
    const guide = g as Record<string, unknown>;
    const name = safeStr(guide.name ?? guide.teamName ?? guide.teamKey ?? guide.teamId);
    if (!name) return;

    const raw = guide.teamKey ?? guide.teamId ?? name;
    const { slug } = canonicalTeamSlug(String(raw));
    if (!slug) return;

    upsertEntry(map, {
      type: "team",
      key: `team:${slug}`,
      title: name,
      subtitle: safeStr(guide.city ?? guide.country) || "Team",
      tokens: toEntryTokens([
        name,
        slug,
        guide.city as string,
        guide.country as string,
        guide.stadium as string,
      ]),
      payload: { kind: "team", slug },
    });
  });
}

function buildLeagueEntries(map: Map<string, IndexEntry>, leagues: LeagueOption[]) {
  leagues.forEach((l) => {
    const title = safeStr(l.label);
    if (!title) return;

    const season = Number(l.season) || 0;
    const country = safeStr(l.country);

    upsertEntry(map, {
      type: "league",
      key: `league:${String(l.leagueId)}:${String(season)}`,
      title,
      subtitle: country
        ? `${country}${season ? ` • ${season}` : ""}`
        : season
          ? `Season ${season}`
          : undefined,
      tokens: toEntryTokens([
        title,
        l.slug,
        country,
        l.countryCode,
        String(l.leagueId),
        String(season),
        ...(l.featuredClubKeys ?? []),
      ]),
      payload: { kind: "league", leagueId: l.leagueId, season },
    });
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

export async function buildSearchIndex(args: {
  from: string;
  to: string;
  leagues?: LeagueOption[];
}): Promise<SearchIndex> {
  const from = safeStr(args.from);
  const to = safeStr(args.to);
  const leagues =
    Array.isArray(args.leagues) && args.leagues.length > 0 ? args.leagues : LEAGUES;

  const map = new Map<string, IndexEntry>();
  const debugEnabled = isDebugEnabled();
  const unresolvedFixtureTeams = debugEnabled ? new Set<string>() : undefined;

  buildCityGuideEntries(map);
  buildCountriesFromLeagues(map, leagues);
  buildTeamsRegistryEntries(map);
  buildTeamGuideEntries(map);
  buildLeagueEntries(map, leagues);

  let fixtureRowsScanned = 0;
  try {
    fixtureRowsScanned = await buildFixtureDerivedEntries({
      map,
      from,
      to,
      leagues,
      unresolvedFixtureTeams,
    });
  } catch {
    // offline-safe
  }

  const entries = Array.from(map.values());

  if (!debugEnabled) {
    return { builtAt: Date.now(), from, to, leagues, entries };
  }

  const counts: Record<SearchEntityType, number> = {
    team: 0,
    city: 0,
    venue: 0,
    country: 0,
    league: 0,
  };

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
      unresolvedFixtureTeamNames: unresolvedFixtureTeams
        ? Array.from(unresolvedFixtureTeams).sort()
        : [],
    },
  };
}

export function querySearchIndex(
  index: SearchIndex,
  query: string,
  opts?: { limit?: number }
): SearchResult[] {
  const limit = Math.max(1, Math.min(Number(opts?.limit ?? 20), 100));
  const q = safeStr(query);
  if (!q) return [];

  const baseTokens = tokenizeQuery(q);
  const queryTokens = expandQueryTokens(baseTokens);
  if (!queryTokens.length) return [];

  const scored: SearchResult[] = (index.entries ?? [])
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
      } satisfies SearchResult;
    })
    .filter((x): x is SearchResult => x !== null)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
