// src/services/searchIndex.ts

/**
 * Central, offline search index builder.
 *
 * V1 objective:
 * - Make Home search “actually work” for city/team/country/venue even when the
 *   current rolling fixtures list doesn’t contain that text.
 * - Keep it fast, dependency-free, and robust.
 *
 * What it indexes:
 * - Teams from your LEAGUES (via fixtures API results)
 * - Cities + venues from fixtures API results
 * - Countries + league aliases (static, always available)
 *
 * What it does NOT do (yet):
 * - Fetch a full global club database (v2)
 * - Fetch city datasets (v2)
 */

import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";
import { LEAGUES, type LeagueOption, getRollingWindowIso } from "@/src/constants/football";
import { normalizeCityKey } from "@/src/utils/city";
import { COUNTRY_LEAGUE_HINTS, LEAGUE_ALIASES, SEARCH_STOPWORDS } from "@/src/constants/search";

export type SearchEntityType = "team" | "city" | "venue" | "country" | "league";

export type SearchResult = {
  type: SearchEntityType;
  key: string; // stable normalized key for dedupe
  title: string; // display title
  subtitle?: string; // small meta
  // Routing payload:
  payload:
    | { kind: "team"; slug: string; label: string }
    | { kind: "city"; slug: string; label: string }
    | { kind: "venue"; slug: string; label: string; city?: string }
    | { kind: "country"; countryKey: string; countryLabel: string; leagueId: number; season: number; leagueLabel: string }
    | { kind: "league"; leagueId: number; season: number; label: string };
  // Matching:
  tokens: string[]; // normalized tokens for fast matching
};

export type SearchIndex = {
  builtAt: number;
  window: { from: string; to: string };
  results: SearchResult[];
};

function stripDiacritics(input: string): string {
  try {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return input;
  }
}

function normalizeText(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  const s = stripDiacritics(raw)
    .toLowerCase()
    .replace(/[,/|].*$/, "") // strip after comma/slash/pipe
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

function tokenize(input: string): string[] {
  const s = normalizeText(input);
  if (!s) return [];
  const parts = s.split(" ").map((x) => x.trim()).filter(Boolean);

  const filtered = parts.filter((p) => !SEARCH_STOPWORDS.includes(p));
  // also include hyphen-collapsed version for terms like "real-madrid"
  const collapsed = filtered.join("-");

  const out = new Set<string>();
  for (const p of filtered) out.add(p);
  if (collapsed) out.add(collapsed);

  return Array.from(out);
}

function makeKey(type: SearchEntityType, slug: string) {
  return `${type}:${slug}`;
}

function safeSlugFromName(name: string): string {
  return normalizeText(name).replace(/\s+/g, "-");
}

function uniquePush(map: Map<string, SearchResult>, r: SearchResult) {
  if (!r.key) return;
  if (map.has(r.key)) return;
  map.set(r.key, r);
}

function teamFromRow(r: FixtureListRow) {
  const home = String(r?.teams?.home?.name ?? "").trim();
  const away = String(r?.teams?.away?.name ?? "").trim();
  return { home, away };
}

function venueFromRow(r: FixtureListRow) {
  const venue = String(r?.fixture?.venue?.name ?? "").trim();
  const city = String(r?.fixture?.venue?.city ?? "").trim();
  return { venue, city };
}

/**
 * Build a lean index from:
 * - static country+league hints (always)
 * - static league aliases (always)
 * - fixtures from each configured league (rolling window)
 *
 * Notes:
 * - This is intentionally "best-effort". If some leagues fail, we still build an index.
 */
export async function buildSearchIndex(opts?: { from?: string; to?: string; leagues?: LeagueOption[] }): Promise<SearchIndex> {
  const rolling = getRollingWindowIso();
  const from = opts?.from ?? rolling.from;
  const to = opts?.to ?? rolling.to;
  const leagues = opts?.leagues ?? LEAGUES;

  const map = new Map<string, SearchResult>();

  // 1) Static: countries -> fixtures (via league mapping)
  for (const c of COUNTRY_LEAGUE_HINTS) {
    const slug = c.countryKey;
    uniquePush(map, {
      type: "country",
      key: makeKey("country", slug),
      title: c.countryLabel,
      subtitle: c.leagueLabel,
      payload: {
        kind: "country",
        countryKey: c.countryKey,
        countryLabel: c.countryLabel,
        leagueId: c.leagueId,
        season: c.season,
        leagueLabel: c.leagueLabel,
      },
      tokens: Array.from(
        new Set([
          ...tokenize(c.countryLabel),
          ...tokenize(c.countryKey),
          ...tokenize(c.leagueLabel),
          ...(c.aliases ?? []).flatMap((a) => tokenize(a)),
        ])
      ),
    });
  }

  // 2) Static: league aliases
  for (const l of LEAGUE_ALIASES) {
    const slug = String(l.leagueId);
    uniquePush(map, {
      type: "league",
      key: makeKey("league", slug),
      title: l.label,
      subtitle: "League",
      payload: { kind: "league", leagueId: l.leagueId, season: l.season, label: l.label },
      tokens: Array.from(new Set([...tokenize(l.label), ...l.terms.flatMap((t) => tokenize(t))])),
    });
  }

  // 3) Dynamic: teams/cities/venues from fixtures
  const fixturePromises = leagues.map(async (league) => {
    try {
      const rows = await getFixtures({ league: league.leagueId, season: league.season, from, to });
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  });

  const allRows = (await Promise.all(fixturePromises)).flat();

  for (const r of allRows) {
    // Teams
    const { home, away } = teamFromRow(r);
    if (home) {
      const slug = safeSlugFromName(home);
      uniquePush(map, {
        type: "team",
        key: makeKey("team", slug),
        title: home,
        subtitle: "Team",
        payload: { kind: "team", slug, label: home },
        tokens: tokenize(home),
      });
    }
    if (away) {
      const slug = safeSlugFromName(away);
      uniquePush(map, {
        type: "team",
        key: makeKey("team", slug),
        title: away,
        subtitle: "Team",
        payload: { kind: "team", slug, label: away },
        tokens: tokenize(away),
      });
    }

    // Venue + City
    const { venue, city } = venueFromRow(r);

    if (city) {
      const citySlug = normalizeCityKey(city);
      uniquePush(map, {
        type: "city",
        key: makeKey("city", citySlug),
        title: city,
        subtitle: "City",
        payload: { kind: "city", slug: citySlug, label: city },
        tokens: Array.from(new Set([...tokenize(city), ...tokenize(citySlug)])),
      });
    }

    if (venue) {
      const venueSlug = safeSlugFromName(venue);
      uniquePush(map, {
        type: "venue",
        key: makeKey("venue", venueSlug),
        title: venue,
        subtitle: city ? `Venue • ${city}` : "Venue",
        payload: { kind: "venue", slug: venueSlug, label: venue, city: city || undefined },
        tokens: Array.from(new Set([...tokenize(venue), ...(city ? tokenize(city) : [])])),
      });
    }
  }

  return {
    builtAt: Date.now(),
    window: { from, to },
    results: Array.from(map.values()),
  };
}

/**
 * Query the index.
 * Ranking:
 * - Exact token match gets priority
 * - Starts-with match second
 * - Includes match third
 */
export function querySearchIndex(index: SearchIndex, query: string, opts?: { limit?: number; types?: SearchEntityType[] }) {
  const q = normalizeText(query);
  if (!q) return [];

  const qTokens = tokenize(q);
  const types = opts?.types?.length ? new Set(opts.types) : null;
  const limit = Math.max(1, opts?.limit ?? 20);

  const scored: Array<{ r: SearchResult; score: number }> = [];

  for (const r of index.results) {
    if (types && !types.has(r.type)) continue;

    let score = 0;

    // Exact token hits
    for (const t of qTokens) {
      if (r.tokens.includes(t)) score += 10;
    }

    // Starts-with / includes
    const joined = r.tokens.join(" ");
    if (joined.startsWith(q)) score += 6;
    if (joined.includes(q)) score += 3;

    // Slight boost for “team” and “city” as primary UX
    if (r.type === "team") score += 2;
    if (r.type === "city") score += 2;

    if (score > 0) scored.push({ r, score });
  }

  scored.sort((a, b) => b.score - a.score || a.r.title.localeCompare(b.r.title));

  return scored.slice(0, limit).map((x) => x.r);
  }
