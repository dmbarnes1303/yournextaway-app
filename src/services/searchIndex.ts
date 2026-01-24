// src/services/searchIndex.ts
import { LEAGUES } from "@/src/constants/football";
import cityGuides from "@/src/data/cityGuides";
import teamGuides from "@/src/data/teamGuides";
import { normalizeCityKey } from "@/src/utils/city";
import {
  normalizeSearchText,
  tokenizeQuery,
  expandQueryTokens,
} from "@/src/constants/search";

/**
 * IMPORTANT:
 * This is V1: in-memory, deterministic, no API calls.
 *
 * We index:
 * - Teams (from teamGuides registry; later: expand to include API teams list)
 * - Cities (from cityGuides registry)
 * - Venues/Stadiums (from fixture cache, later; V1 we derive from fixtures rows if provided)
 * - Countries + Leagues (from LEAGUES + aliases in search.ts)
 *
 * Because V1 data is incomplete, we bias toward "doesn't crash" and "always returns something sensible".
 */

export type SearchEntityType = "team" | "city" | "venue" | "country" | "league";

export type SearchResult = {
  type: SearchEntityType;
  key: string; // slug/key used in route
  title: string; // display name
  subtitle?: string;
  score: number; // higher is better
  // Optional: for fixtures routing
  leagueId?: number;
  season?: number;
  country?: string;
};

type IndexEntry = {
  type: SearchEntityType;
  key: string;
  title: string;
  subtitle?: string;
  tokens: string[]; // normalized tokens
  leagueId?: number;
  season?: number;
  country?: string;
};

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function scoreMatch(queryTokens: string[], entryTokens: string[]): number {
  // Simple scoring:
  // +3 per exact token hit
  // +1 per partial token hit (prefix)
  // +2 bonus if all query tokens hit at least partially
  let score = 0;
  let hitCount = 0;

  for (const qt of queryTokens) {
    if (!qt) continue;
    if (entryTokens.includes(qt)) {
      score += 3;
      hitCount += 1;
      continue;
    }
    const partial = entryTokens.some((et) => et.startsWith(qt) || qt.startsWith(et));
    if (partial) {
      score += 1;
      hitCount += 1;
    }
  }

  if (queryTokens.length > 0 && hitCount >= Math.max(1, Math.floor(queryTokens.length))) {
    score += 2;
  }

  return score;
}

function toEntryTokens(parts: Array<string | undefined | null>): string[] {
  const joined = parts.filter(Boolean).join(" ");
  const t = tokenizeQuery(joined);
  return uniq(t);
}

function buildBaseIndex(): IndexEntry[] {
  const entries: IndexEntry[] = [];

  // Cities: from cityGuides registry
  Object.values(cityGuides).forEach((g: any) => {
    const name = String(g?.name ?? g?.cityId ?? "").trim();
    if (!name) return;

    const key = normalizeCityKey(g.cityId || name);
    const country = String(g?.country ?? "").trim();

    entries.push({
      type: "city",
      key,
      title: name,
      subtitle: country ? country : undefined,
      tokens: toEntryTokens([name, key, country]),
      country: country || undefined,
    });
  });

  // Teams: from teamGuides registry (currently empty, but safe)
  Object.values(teamGuides as any).forEach((g: any) => {
    const name = String(g?.name ?? g?.teamName ?? g?.teamId ?? "").trim();
    if (!name) return;

    const key = String(g?.teamId ?? name)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    entries.push({
      type: "team",
      key,
      title: name,
      subtitle: String(g?.city ?? g?.country ?? "").trim() || undefined,
      tokens: toEntryTokens([name, key, g?.city, g?.country]),
    });
  });

  // Leagues: from LEAGUES
  LEAGUES.forEach((l) => {
    const title = l.label;
    const key = normalizeSearchText(title).replace(/\s+/g, "-");
    entries.push({
      type: "league",
      key,
      title,
      subtitle: `Season ${String(l.season)}`,
      tokens: toEntryTokens([title, key]),
      leagueId: l.leagueId,
      season: l.season,
    });
  });

  // Countries: derived from leagues and city guides (best effort)
  const countries = uniq(
    [
      ...Object.values(cityGuides).map((g: any) => String(g?.country ?? "").trim()),
      // optional: if you later add country to LEAGUES entries, it will enrich this.
    ].filter(Boolean)
  );

  countries.forEach((c) => {
    const key = normalizeSearchText(c).replace(/\s+/g, "-");
    entries.push({
      type: "country",
      key,
      title: c,
      tokens: toEntryTokens([c, key]),
      country: c,
    });
  });

  return entries;
}

let cachedIndex: IndexEntry[] | null = null;

/**
 * Rebuild the index (call when registries change).
 * In V1 you can call this at app boot; it is cheap.
 */
export function rebuildSearchIndex() {
  cachedIndex = buildBaseIndex();
}

/**
 * Search across all indexed entities.
 * Returns sorted results; caller can group them by type.
 */
export function searchAll(query: string, limit = 20): SearchResult[] {
  const qNorm = normalizeSearchText(query);
  if (!qNorm) return [];

  const baseTokens = tokenizeQuery(qNorm);
  const queryTokens = expandQueryTokens(baseTokens);

  if (!cachedIndex) rebuildSearchIndex();

  const scored: SearchResult[] = (cachedIndex ?? [])
    .map((e) => {
      const score = scoreMatch(queryTokens, e.tokens);

      // Type weighting (your requirement: team/city first)
      const typeBoost =
        e.type === "team" ? 3 : e.type === "city" ? 2 : e.type === "venue" ? 1 : 0;

      return {
        type: e.type,
        key: e.key,
        title: e.title,
        subtitle: e.subtitle,
        score: score + typeBoost,
        leagueId: e.leagueId,
        season: e.season,
        country: e.country,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

/**
 * Convenience: group results for UI sections.
 */
export function groupSearchResults(results: SearchResult[]) {
  const groups: Record<SearchEntityType, SearchResult[]> = {
    team: [],
    city: [],
    venue: [],
    country: [],
    league: [],
  };

  results.forEach((r) => groups[r.type].push(r));

  return groups;
}
