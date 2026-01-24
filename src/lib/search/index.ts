// src/lib/search/index.ts
import type { LeagueOption } from "@/src/constants/football";
import type { FixtureListRow } from "@/src/services/apiFootball";

export type SearchKind = "city" | "league" | "team" | "venue" | "country";

export type SearchItem = {
  kind: SearchKind;
  id: string;
  title: string;
  subtitle?: string;
  keywords: string[];
  // v1 routes: everything goes to Fixtures with filters (guides can be added later without breaking search)
  route: { pathname: string; params?: Record<string, string> };
};

export type GroupedSearchResults = {
  cities: SearchItem[];
  leagues: SearchItem[];
  teams: SearchItem[];
  venues: SearchItem[];
  countries: SearchItem[];
};

function stripDiacritics(input: string) {
  // Safer than unicode property regex for some RN setups
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeQuery(input: string) {
  return stripDiacritics(String(input ?? ""))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(q: string, target: string) {
  // Higher is better; 0 = no match
  if (!q) return 0;
  if (!target) return 0;

  if (target === q) return 100;
  if (target.startsWith(q)) return 80;

  // Word-start match
  const words = target.split(" ");
  if (words.some((w) => w.startsWith(q))) return 65;

  if (target.includes(q)) return 45;

  return 0;
}

function scoreItem(q: string, item: SearchItem) {
  const titleN = normalizeQuery(item.title);
  const subtitleN = normalizeQuery(item.subtitle ?? "");
  const keywordsN = (item.keywords ?? []).map(normalizeQuery);

  let best = 0;
  best = Math.max(best, scoreMatch(q, titleN));
  best = Math.max(best, scoreMatch(q, subtitleN));
  for (const k of keywordsN) best = Math.max(best, scoreMatch(q, k));

  // small kind-based boost for “more user-meaningful” entities
  const kindBoost: Record<SearchKind, number> = {
    city: 6,
    team: 5,
    venue: 4,
    league: 3,
    country: 2,
  };

  return best > 0 ? best + (kindBoost[item.kind] ?? 0) : 0;
}

function uniqById(items: SearchItem[]) {
  const seen = new Set<string>();
  const out: SearchItem[] = [];
  for (const it of items) {
    const key = `${it.kind}:${it.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

export function buildSearchIndex(args: {
  leagues: LeagueOption[];
  fixtures: FixtureListRow[];
  cityGuidesIndex: Record<string, { name?: string; country?: string }>;
  // Context for routing to Fixtures window
  context: { leagueId: number; season: number; from: string; to: string };
}): SearchItem[] {
  const { leagues, fixtures, cityGuidesIndex, context } = args;

  const baseFixturesRoute = (extraParams: Record<string, string>) => ({
    pathname: "/(tabs)/fixtures",
    params: {
      leagueId: String(context.leagueId),
      season: String(context.season),
      from: context.from,
      to: context.to,
      ...extraParams,
    },
  });

  const items: SearchItem[] = [];

  // Cities from curated guides
  for (const [cityKey, guide] of Object.entries(cityGuidesIndex ?? {})) {
    const title = guide?.name ? String(guide.name) : cityKey;
    const country = guide?.country ? String(guide.country) : undefined;

    items.push({
      kind: "city",
      id: cityKey,
      title,
      subtitle: country ? country : "City",
      keywords: [cityKey, title, country ?? ""].filter(Boolean),
      route: baseFixturesRoute({ city: cityKey }),
    });
  }

  // Leagues
  for (const l of leagues ?? []) {
    items.push({
      kind: "league",
      id: String(l.leagueId),
      title: l.label,
      subtitle: "League",
      keywords: [l.label, String(l.leagueId)],
      route: {
        pathname: "/(tabs)/fixtures",
        params: {
          leagueId: String(l.leagueId),
          season: String(l.season),
          from: context.from,
          to: context.to,
        },
      },
    });
  }

  // Derive teams / venues / fixture cities from loaded fixtures
  const teamNames = new Set<string>();
  const venueNames = new Set<string>();
  const fixtureCities = new Set<string>();

  for (const r of fixtures ?? []) {
    const home = r?.teams?.home?.name;
    const away = r?.teams?.away?.name;
    const venue = r?.fixture?.venue?.name;
    const city = r?.fixture?.venue?.city;

    if (home) teamNames.add(String(home));
    if (away) teamNames.add(String(away));
    if (venue) venueNames.add(String(venue));
    if (city) fixtureCities.add(String(city));
  }

  for (const name of Array.from(teamNames)) {
    items.push({
      kind: "team",
      id: normalizeQuery(name).replace(/\s+/g, "-"),
      title: name,
      subtitle: "Team",
      keywords: [name],
      route: baseFixturesRoute({ team: name }),
    });
  }

  for (const name of Array.from(venueNames)) {
    items.push({
      kind: "venue",
      id: normalizeQuery(name).replace(/\s+/g, "-"),
      title: name,
      subtitle: "Stadium / venue",
      keywords: [name],
      route: baseFixturesRoute({ venue: name }),
    });
  }

  for (const name of Array.from(fixtureCities)) {
    const key = normalizeQuery(name).replace(/\s+/g, "-");
    items.push({
      kind: "city",
      id: key,
      title: name,
      subtitle: "City",
      keywords: [name],
      route: baseFixturesRoute({ cityName: name }),
    });
  }

  return uniqById(items);
}

export function searchIndex(index: SearchItem[], query: string, limits?: Partial<Record<SearchKind, number>>) {
  const q = normalizeQuery(query);
  const lim: Record<SearchKind, number> = {
    city: limits?.city ?? 6,
    league: limits?.league ?? 5,
    team: limits?.team ?? 6,
    venue: limits?.venue ?? 6,
    country: limits?.country ?? 4,
  };

  const scored = index
    .map((it) => ({ it, s: scoreItem(q, it) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);

  const groups: GroupedSearchResults = {
    cities: [],
    leagues: [],
    teams: [],
    venues: [],
    countries: [],
  };

  for (const { it } of scored) {
    const bucket =
      it.kind === "city"
        ? groups.cities
        : it.kind === "league"
          ? groups.leagues
          : it.kind === "team"
            ? groups.teams
            : it.kind === "venue"
              ? groups.venues
              : groups.countries;

    if (bucket.length >= lim[it.kind]) continue;
    bucket.push(it);
  }

  return groups;
      }
