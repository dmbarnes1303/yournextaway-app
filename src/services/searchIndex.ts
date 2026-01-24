// src/services/searchIndex.ts
import { normalizeSearchText, tokenizeQuery, expandQueryTokens } from "@/src/constants/search";
import type { LeagueOption } from "@/src/constants/football";
import cityGuidesRegistry from "@/src/data/cityGuides";
import teamGuidesRegistry, { normalizeTeamKey } from "@/src/data/teamGuides";
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
  | { kind: "team"; slug: string }
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

/**
 * Corrected scoring:
 * - Exact token matches are strong.
 * - Prefix matches only when query token length >= 3.
 * - NO "qt.startsWith(et)" (that causes junk matches when entryTokens include short tokens like "a", "e").
 */
function scoreMatch(queryTokens: string[], entryTokens: string[]): number {
  // +4 exact token hit
  // +2 prefix hit (query token length >= 3)
  // +2 bonus if most query tokens hit at least partially
  let score = 0;
  let hitCount = 0;

  for (const qtRaw of queryTokens) {
    const qt = String(qtRaw ?? "").trim();
    if (!qt) continue;

    // Exact match
    if (entryTokens.includes(qt)) {
      score += 4;
      hitCount += 1;
      continue;
    }

    // Prefix match (tightened)
    if (qt.length >= 3) {
      const prefix = entryTokens.some((et) => et.startsWith(qt));
      if (prefix) {
        score += 2;
        hitCount += 1;
      }
    }
  }

  if (queryTokens.length > 0 && hitCount >= Math.max(1, Math.floor(queryTokens.length))) {
    score += 2;
  }

  return score;
}

function typeBoost(t: SearchEntityType): number {
  // UX: team + city first, then venue, then country/league
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

  map.set(entry.key, {
    ...existing,
    title: existing.title || entry.title,
    subtitle: existing.subtitle || entry.subtitle,
    tokens: uniq([...(existing.tokens ?? []), ...(entry.tokens ?? [])]),
    // Keep existing payload (it’s the stable one for routing), unless missing
    payload: (existing.payload as any) ?? entry.payload,
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

  // Countries from guides (best-effort discovery list)
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
      // placeholder; patched once we know leagues
      payload: { kind: "country", country, leagueId: 0, season: 0 },
    });
  });
}

function buildTeamEntries(map: Map<string, IndexEntry>) {
  // Teams from teamGuides (may be empty in V1)
  Object.values(teamGuidesRegistry as any).forEach((g: any) => {
    const name = safeStr(g?.name ?? g?.teamName ?? g?.teamKey ?? g?.teamId);
    if (!name) return;

    const slug = normalizeTeamKey(g?.teamKey ?? g?.teamId ?? name);
    if (!slug) return;

    upsertEntry(map, {
      type: "team",
      key: `team:${slug}`,
      title: name,
      subtitle: safeStr(g?.city ?? g?.country) || undefined,
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

    // If you later add country metadata to LEAGUES, replace this with a direct mapping.
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
  args: { from: string; to: string; leagues: LeagueOption[] }
) {
  const { from, to, leagues } = args;

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
    const home = safeStr(r?.teams?.home?.name);
    const away = safeStr(r?.teams?.away?.name);

    if (home) {
      const slug = normalizeTeamKey(home);
      if (slug) {
        upsertEntry(map, {
          type: "team",
          key: `team:${slug}`,
          title: home,
          subtitle: "Team",
          tokens: toEntryTokens([home, slug]),
          payload: { kind: "team", slug },
        });
      }
    }

    if (away) {
      const slug = normalizeTeamKey(away);
      if (slug) {
        upsertEntry(map, {
          type: "team",
          key: `team:${slug}`,
          title: away,
          subtitle: "Team",
          tokens: toEntryTokens([away, slug]),
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
export async function buildSearchIndex(args: {
  from: string;
  to: string;
  leagues: LeagueOption[];
}): Promise<SearchIndex> {
  const from = safeStr(args?.from);
  const to = safeStr(args?.to);
  const leagues = Array.isArray(args?.leagues) ? args.leagues : [];

  const map = new Map<string, IndexEntry>();

  buildCityAndCountryEntries(map);
  buildTeamEntries(map);
  buildLeagueEntries(map, leagues);

  // Fixture-derived enrichment (best effort; never crash)
  try {
    await buildFixtureDerivedEntries(map, { from, to, leagues });
  } catch {
    // ignore
  }

  let entries = Array.from(map.values());
  entries = patchCountryPayloads(entries, leagues);

  return {
    builtAt: Date.now(),
    from,
    to,
    leagues,
    entries,
  };
}

/**
 * Query the index and return ranked results.
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
      const score = scoreMatch(queryTokens, e.tokens) + typeBoost(e.type);
      return {
        type: e.type,
        key: e.key,
        title: e.title,
        subtitle: e.subtitle,
        score,
        payload: e.payload,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
