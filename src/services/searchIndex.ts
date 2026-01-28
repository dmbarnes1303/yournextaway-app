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
  key: string; // stable key used for rendering + routing
  title: string;
  subtitle?: string;
  score: number; // higher is better
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

export type SearchIndex = {
  builtAt: number;
  from: string;
  to: string;
  leagues: LeagueOption[];
  entries: IndexEntry[];
  /**
   * DEV-only diagnostics to help identify why some teams
   * are not being marked "guide available".
   */
  debug?: {
    teamsRegistryCount: number;
    teamGuidesCount: number;
    fixtureTeamsObserved: number;
    unresolvedFixtureTeamNames: string[];
  };
};

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

function isDebugEnabled(): boolean {
  return typeof __DEV__ !== "undefined" ? !!__DEV__ : false;
}

function normalizeVenueKey(input: string | undefined | null): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, "") // remove bracketed suffixes
    .replace(/[,/|].*$/, "") // cut after punctuation separators
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toEntryTokens(parts: Array<string | undefined | null>): string[] {
  const joined = parts.filter(Boolean).join(" ");
  return uniq(tokenizeQuery(joined));
}

/**
 * Build a resolver from your teams registry:
 * - Direct key match (teamKey)
 * - Alias match (aliases[])
 *
 * This is how we make sure:
 * - "psg" resolves to "paris-saint-germain"
 * - "barca" resolves to "barcelona"
 * - diacritics / punctuation variations still land on canonical keys
 */
type TeamAny = { teamKey?: string; aliases?: string[]; teamId?: number; name?: string };

const _teamsList: TeamAny[] = Object.values(teamsRegistry as any) as TeamAny[];

const _aliasToTeamKey: Map<string, string> = (() => {
  const map = new Map<string, string>();

  for (const t of _teamsList) {
    const key = safeStr(t?.teamKey);
    if (!key) continue;

    // include teamKey itself
    map.set(normalizeTeamKey(key), key);

    const aliases = Array.isArray(t?.aliases) ? t.aliases : [];
    for (const a of aliases) {
      const n = normalizeTeamKey(a);
      if (!n) continue;
      // first win keeps the mapping stable
      if (!map.has(n)) map.set(n, key);
    }

    // include display name too (useful if you didn’t list it as an alias)
    const name = safeStr(t?.name);
    const nameNorm = normalizeTeamKey(name);
    if (nameNorm && !map.has(nameNorm)) map.set(nameNorm, key);
  }

  return map;
})();

function resolveTeamKeyLocal(input: string | undefined | null): string | null {
  const s = safeStr(input);
  if (!s) return null;

  const n = normalizeTeamKey(s);
  if (!n) return null;

  // direct key
  if ((teamsRegistry as any)[n]?.teamKey) return (teamsRegistry as any)[n].teamKey;

  // alias map
  const mapped = _aliasToTeamKey.get(n);
  return mapped ?? null;
}

/**
 * Canonical team slug resolver:
 * - Prefer registry canonical key (handles aliases/name variations)
 * - Fallback to normalized input so unknown teams still show up in search
 */
function canonicalTeamSlug(input: string | undefined | null): { slug: string | null; resolved: boolean } {
  const s = safeStr(input);
  if (!s) return { slug: null, resolved: false };

  const resolvedKey = resolveTeamKeyLocal(s);
  if (resolvedKey) {
    const slug = normalizeTeamKey(resolvedKey);
    return { slug: slug || null, resolved: true };
  }

  const fallback = normalizeTeamKey(s);
  return { slug: fallback || null, resolved: false };
}

/**
 * IMPORTANT:
 * We must never return "matches" purely because of typeBoost.
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

    // prefix match only (query token is prefix of entry token)
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

  // Prefer keeping richer payload (teamId etc) if present
  const existingPayload: any = existing.payload;
  const nextPayload: any = entry.payload;

  const mergedPayload =
    existingPayload?.kind === "team" && nextPayload?.kind === "team"
      ? {
          ...existingPayload,
          ...nextPayload,
          teamId: existingPayload.teamId ?? nextPayload.teamId,
        }
      : (existing.payload as any) ?? entry.payload;

  map.set(entry.key, {
    ...existing,
    title: existing.title || entry.title,
    subtitle: existing.subtitle || entry.subtitle,
    tokens: uniq([...(existing.tokens ?? []), ...(entry.tokens ?? [])]),
    payload: mergedPayload,
  });
}

function buildCityAndCountryEntries(map: Map<string, IndexEntry>) {
  // Cities from guides
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
      subtitle: country || undefined,
      tokens: toEntryTokens([name, slug, country]),
      payload: { kind: "city", slug },
    });
  });

  // Countries (derived list)
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
  // Teams from team registry (deterministic, even without fixtures)
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
  // Teams from team guides (may be partial)
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
      }) ??
      fallback;

    return match;
  };

  return entries.map((e) => {
    if (e.type !== "country") return e;
    if (e.payload.kind !== "country") return e;

    const chosen = pickLeagueForCountry(e.payload.country);
    const leagueId = chosen?.leagueId ?? 0;
    const season = Number(chosen?.season) || 0;

    return {
      ...e,
      payload: { kind: "country", country: e.payload.country, leagueId, season },
    };
  });
}

async function buildFixtureDerivedEntries(
  map: Map<string, IndexEntry>,
  args: { from: string; to: string; leagues: LeagueOption[]; unresolvedTeams?: Set<string>; observedTeamSlugs?: Set<string> }
) {
  const { from, to, leagues, unresolvedTeams, observedTeamSlugs } = args;

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
      if (slug) observedTeamSlugs?.add(slug);
      if (!resolved) unresolvedTeams?.add(homeName);

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
      if (slug) observedTeamSlugs?.add(slug);
      if (!resolved) unresolvedTeams?.add(awayName);

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
}

/**
 * Build an index (async because we optionally derive entities from fixtures in-window).
 */
export async function buildSearchIndex(args: { from: string; to: string; leagues: LeagueOption[] }): Promise<SearchIndex> {
  const from = safeStr(args?.from);
  const to = safeStr(args?.to);
  const leagues = Array.isArray(args?.leagues) ? args.leagues : [];

  const map = new Map<string, IndexEntry>();

  // DEV diagnostics
  const unresolvedFixtureTeamNames = new Set<string>();
  const observedTeamSlugs = new Set<string>();

  buildCityAndCountryEntries(map);
  buildTeamsRegistryEntries(map); // deterministic teams exist even without fixtures/guides
  buildTeamGuideEntries(map);
  buildLeagueEntries(map, leagues);

  // Fixture-derived enrichment (best effort; never crash)
  try {
    await buildFixtureDerivedEntries(map, {
      from,
      to,
      leagues,
      unresolvedTeams: isDebugEnabled() ? unresolvedFixtureTeamNames : undefined,
      observedTeamSlugs: isDebugEnabled() ? observedTeamSlugs : undefined,
    });
  } catch {
    // ignore
  }

  let entries = Array.from(map.values());
  entries = patchCountryPayloads(entries, leagues);

  const idx: SearchIndex = {
    builtAt: Date.now(),
    from,
    to,
    leagues,
    entries,
  };

  if (isDebugEnabled()) {
    idx.debug = {
      teamsRegistryCount: _teamsList.length,
      teamGuidesCount: Object.keys(teamGuidesRegistry as any).length,
      fixtureTeamsObserved: observedTeamSlugs.size,
      unresolvedFixtureTeamNames: Array.from(unresolvedFixtureTeamNames).sort().slice(0, 80),
    };

    // Loud + obvious in Metro logs so you can see it instantly.
    // This is the fastest way to find which names/aliases are missing.
    // eslint-disable-next-line no-console
    console.log("[SearchIndex debug]", idx.debug);
  }

  return idx;
}

/**
 * Query the index and return ranked results.
 *
 * CRITICAL FIX:
 * - We only apply typeBoost *after* a real match exists.
 * - This prevents queries like "emira" returning unrelated teams just because they're "team" type.
 */
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

      // No match => exclude (do NOT allow typeBoost to “create” relevance).
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
