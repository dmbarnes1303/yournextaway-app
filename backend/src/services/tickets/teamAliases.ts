/* ============================================================================
 * TEAM ALIAS REGISTRY (SCALABLE + SAFE MATCHING)
 * ========================================================================== */

export type TeamAliasEntry = {
  key: string;
  displayName: string;
  country?: string;
  competitions?: string[];

  strongAliases: string[];   // exact / high confidence
  weakAliases?: string[];    // short / risky / nickname

  blockedTokens?: string[];  // prevent bad matches (u23, women etc)

  providerAliases?: {
    footballticketnet?: string[];
    sportsevents365?: string[];
  };
};

/* ============================================================================
 * NORMALISATION
 * ========================================================================== */

export function clean(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(fc|cf|afc|sc|sk|jk|club|de|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.map(clean).filter(Boolean)));
}

/* ============================================================================
 * REGISTRY (PHASE 1 — TOP LEAGUES ONLY)
 * ========================================================================== */

export const TEAM_REGISTRY: TeamAliasEntry[] = [
  /* ========================= EPL ========================= */

  {
    key: "arsenal",
    displayName: "Arsenal",
    country: "england",
    competitions: ["premier-league"],
    strongAliases: ["arsenal", "arsenal fc"],
  },

  {
    key: "manchester-united",
    displayName: "Manchester United",
    country: "england",
    competitions: ["premier-league"],
    strongAliases: ["manchester united"],
    weakAliases: ["man utd", "man united"],
  },

  {
    key: "manchester-city",
    displayName: "Manchester City",
    country: "england",
    competitions: ["premier-league"],
    strongAliases: ["manchester city"],
    weakAliases: ["man city"],
  },

  {
    key: "tottenham",
    displayName: "Tottenham",
    country: "england",
    competitions: ["premier-league"],
    strongAliases: ["tottenham hotspur"],
    weakAliases: ["tottenham", "spurs"],
  },

  {
    key: "newcastle",
    displayName: "Newcastle United",
    country: "england",
    competitions: ["premier-league"],
    strongAliases: ["newcastle united"],
    weakAliases: ["newcastle"],
  },

  /* ========================= SERIE A ========================= */

  {
    key: "inter",
    displayName: "Inter Milan",
    country: "italy",
    competitions: ["serie-a"],
    strongAliases: [
      "inter milan",
      "internazionale",
      "fc internazionale milano",
    ],
    weakAliases: ["inter"],
    blockedTokens: ["women", "u19", "u20", "u21", "youth"],
  },

  {
    key: "ac-milan",
    displayName: "AC Milan",
    country: "italy",
    competitions: ["serie-a"],
    strongAliases: ["ac milan", "associazione calcio milan"],
    weakAliases: ["milan"],
  },

  {
    key: "juventus",
    displayName: "Juventus",
    country: "italy",
    competitions: ["serie-a"],
    strongAliases: ["juventus"],
    weakAliases: ["juve"],
  },

  {
    key: "napoli",
    displayName: "Napoli",
    country: "italy",
    competitions: ["serie-a"],
    strongAliases: ["napoli", "ssc napoli"],
  },

  {
    key: "roma",
    displayName: "AS Roma",
    country: "italy",
    competitions: ["serie-a"],
    strongAliases: ["as roma", "a s roma"],
    weakAliases: ["roma"],
  },

  /* ========================= LA LIGA ========================= */

  {
    key: "real-madrid",
    displayName: "Real Madrid",
    country: "spain",
    competitions: ["la-liga"],
    strongAliases: ["real madrid"],
  },

  {
    key: "barcelona",
    displayName: "Barcelona",
    country: "spain",
    competitions: ["la-liga"],
    strongAliases: ["fc barcelona"],
    weakAliases: ["barcelona", "barca"],
  },

  {
    key: "atletico-madrid",
    displayName: "Atletico Madrid",
    country: "spain",
    competitions: ["la-liga"],
    strongAliases: ["atletico madrid"],
    weakAliases: ["atletico"],
  },

  /* ========================= BUNDESLIGA ========================= */

  {
    key: "bayern",
    displayName: "Bayern Munich",
    country: "germany",
    competitions: ["bundesliga"],
    strongAliases: ["bayern munich", "fc bayern munich"],
    weakAliases: ["bayern"],
  },

  {
    key: "dortmund",
    displayName: "Borussia Dortmund",
    country: "germany",
    competitions: ["bundesliga"],
    strongAliases: ["borussia dortmund"],
    weakAliases: ["dortmund", "bvb"],
  },

  {
    key: "leipzig",
    displayName: "RB Leipzig",
    country: "germany",
    competitions: ["bundesliga"],
    strongAliases: ["rb leipzig"],
    weakAliases: ["leipzig"],
  },

  /* ========================= FRANCE ========================= */

  {
    key: "psg",
    displayName: "Paris Saint-Germain",
    country: "france",
    competitions: ["ligue-1"],
    strongAliases: ["paris saint germain"],
    weakAliases: ["psg"],
  },
];

/* ============================================================================
 * MATCH ENGINE
 * ========================================================================== */

export type TeamAliasMatch = {
  key: string;
  displayName: string;
  strong: string[];
  weak: string[];
  all: string[];
};

export function resolveTeamAliases(name: string): TeamAliasMatch | null {
  const input = clean(name);
  if (!input) return null;

  for (const entry of TEAM_REGISTRY) {
    const strong = uniq(entry.strongAliases);
    const weak = uniq(entry.weakAliases ?? []);

    const blocked = entry.blockedTokens ?? [];
    if (blocked.some((t) => input.includes(t))) {
      continue;
    }

    const strongMatch = strong.some((alias) => input === alias || input.includes(alias));
    if (strongMatch) {
      return {
        key: entry.key,
        displayName: entry.displayName,
        strong,
        weak,
        all: [...strong, ...weak],
      };
    }

    const weakMatch = weak.some((alias) => input === alias);
    if (weakMatch) {
      return {
        key: entry.key,
        displayName: entry.displayName,
        strong,
        weak,
        all: [...strong, ...weak],
      };
    }
  }

  return null;
}
