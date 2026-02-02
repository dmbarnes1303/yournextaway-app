// src/data/teams/registry.ts

export type TeamMeta = {
  teamKey: string;     // must match teamGuides keys (e.g. "real-madrid")
  name: string;
  cityKey?: string;    // optional; useful for de-dupe with city chips
  city?: string;       // display-only
  countryCode?: string; // for future use
  crestUrl?: string;   // remote image URL
};

export const POPULAR_TEAM_KEYS = [
  "real-madrid",
  "arsenal",
  "bayern-munich",
  "inter-milan",
  "borussia-dortmund",
] as const;

export type PopularTeamKey = (typeof POPULAR_TEAM_KEYS)[number];

/**
 * IMPORTANT:
 * - I am NOT going to invent crest URLs or API-Football team IDs here because if I guess wrong,
 *   you’ll ship broken images.
 * - Fill crestUrl with a stable remote PNG/SVG you trust.
 *
 * Best practical approach (since you already use API-Football):
 * - grab the team logo URL from your fixtures payload (row.teams.home.logo / away.logo)
 * - paste that into crestUrl below.
 */
export const TEAMS: Record<string, TeamMeta> = {
  "real-madrid": {
    teamKey: "real-madrid",
    name: "Real Madrid",
    cityKey: "madrid",
    city: "Madrid",
    countryCode: "ES",
    crestUrl: "", // TODO
  },

  "arsenal": {
    teamKey: "arsenal",
    name: "Arsenal",
    cityKey: "london",
    city: "London",
    countryCode: "GB",
    crestUrl: "", // TODO
  },

  "bayern-munich": {
    teamKey: "bayern-munich",
    name: "Bayern Munich",
    cityKey: "munich",
    city: "Munich",
    countryCode: "DE",
    crestUrl: "", // TODO
  },

  "inter-milan": {
    teamKey: "inter-milan",
    name: "Inter Milan",
    cityKey: "milan",
    city: "Milan",
    countryCode: "IT",
    crestUrl: "", // TODO
  },

  "borussia-dortmund": {
    teamKey: "borussia-dortmund",
    name: "Borussia Dortmund",
    cityKey: "dortmund",
    city: "Dortmund",
    countryCode: "DE",
    crestUrl: "", // TODO
  },
};

export function getTeamMeta(teamKey: string): TeamMeta | null {
  return TEAMS[teamKey] ?? null;
}

export function getTeamCrest(teamKey: string): string | null {
  const url = TEAMS[teamKey]?.crestUrl;
  if (!url) return null;
  return url;
}
