// src/constants/football.ts

export type LeagueBrowseRegion = "featured-europe" | "central-eastern-europe" | "nordics";

export type LeagueOption = {
  /**
   * Stable internal slug for routing / config lookups.
   */
  slug: string;

  /**
   * Short UI label.
   */
  label: string;

  /**
   * API-Football league id.
   */
  leagueId: number;

  /**
   * API-Football league logo.
   */
  logo: string;

  /**
   * API-Football season.
   */
  season: number;

  /**
   * Display country name.
   */
  country: string;

  /**
   * Flag code for UI.
   * - ISO-3166-1 alpha-2 for sovereign countries (e.g. "ES", "DE")
   * - Special regional codes supported by our flag helpers (e.g. "ENG", "SCO")
   */
  countryCode: string;

  /**
   * Region used by country → league browse UI.
   * Big-5 leagues are featured separately, so this can be null for them.
   */
  browseRegion: LeagueBrowseRegion | null;

  /**
   * Whether this league should appear in the featured leagues row.
   */
  featured: boolean;

  /**
   * Whether this league should be surfaced on Home.
   */
  homeVisible: boolean;

  /**
   * Canonical team keys for country cards / featured context.
   */
  featuredClubKeys: string[];
};

type CountryLeagueSeed = Omit<LeagueOption, "country" | "countryCode" | "browseRegion">;

export type CountryFootballConfig = {
  country: string;
  countryCode: string;
  browseRegion: LeagueBrowseRegion | null;
  leagues: CountryLeagueSeed[];
};

function leagueLogo(leagueId: number): string {
  return `https://media.api-sports.io/football/leagues/${leagueId}.png`;
}

/**
 * Region labels for UI.
 */
export const LEAGUE_BROWSE_REGION_LABELS: Record<LeagueBrowseRegion, string> = {
  "featured-europe": "Featured Europe",
  "central-eastern-europe": "Central & Eastern Europe",
  nordics: "Nordics",
};

/**
 * Stable region ordering for browse UI.
 */
export const LEAGUE_BROWSE_REGION_ORDER: LeagueBrowseRegion[] = [
  "featured-europe",
  "central-eastern-europe",
  "nordics",
];

/**
 * European football seasons generally start in July/August.
 * API-Football uses the season "start year" (e.g. 2025 means 2025/26).
 */
export function currentFootballSeasonStartYear(now = new Date()): number {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0=Jan
  return m >= 6 ? y : y - 1; // July onward = new season start year
}

/**
 * Calendar-year leagues (e.g. Iceland / Norway / Sweden / Finland)
 * use the current year as the season.
 */
export function currentCalendarYear(now = new Date()): number {
  return now.getFullYear();
}

/**
 * Most leagues in the app use the European season-start convention.
 */
export const DEFAULT_SEASON = currentFootballSeasonStartYear();

/**
 * Nordic / calendar-year competitions use the current year.
 */
export const DEFAULT_CALENDAR_YEAR_SEASON = currentCalendarYear();

/**
 * Primary source of truth.
 *
 * Architecture locked:
 * Europe
 *   -> Country
 *     -> League
 *
 * LEAGUES is derived from this grouped structure.
 */
export const FOOTBALL_BY_COUNTRY: Record<string, CountryFootballConfig> = {
  england: {
    country: "England",
    countryCode: "ENG",
    browseRegion: null,
    leagues: [
      {
        slug: "premier-league",
        label: "Premier League",
        leagueId: 39,
        logo: leagueLogo(39),
        season: DEFAULT_SEASON,
        featured: true,
        homeVisible: true,
        featuredClubKeys: ["manchester-united", "liverpool", "arsenal"],
      },
    ],
  },

  spain: {
    country: "Spain",
    countryCode: "ES",
    browseRegion: null,
    leagues: [
      {
        slug: "la-liga",
        label: "La Liga",
        leagueId: 140,
        logo: leagueLogo(140),
        season: DEFAULT_SEASON,
        featured: true,
        homeVisible: true,
        featuredClubKeys: ["real-madrid", "barcelona", "atletico-madrid"],
      },
    ],
  },

  italy: {
    country: "Italy",
    countryCode: "IT",
    browseRegion: null,
    leagues: [
      {
        slug: "serie-a",
        label: "Serie A",
        leagueId: 135,
        logo: leagueLogo(135),
        season: DEFAULT_SEASON,
        featured: true,
        homeVisible: true,
        featuredClubKeys: ["inter", "juventus", "napoli"],
      },
    ],
  },

  germany: {
    country: "Germany",
    countryCode: "DE",
    browseRegion: null,
    leagues: [
      {
        slug: "bundesliga",
        label: "Bundesliga",
        leagueId: 78,
        logo: leagueLogo(78),
        season: DEFAULT_SEASON,
        featured: true,
        homeVisible: true,
        featuredClubKeys: ["bayern-munich", "borussia-dortmund", "rb-leipzig"],
      },
    ],
  },

  france: {
    country: "France",
    countryCode: "FR",
    browseRegion: null,
    leagues: [
      {
        slug: "ligue-1",
        label: "Ligue 1",
        leagueId: 61,
        logo: leagueLogo(61),
        season: DEFAULT_SEASON,
        featured: true,
        homeVisible: true,
        featuredClubKeys: ["paris-saint-germain", "marseille", "lyon"],
      },
    ],
  },

  netherlands: {
    country: "Netherlands",
    countryCode: "NL",
    browseRegion: "featured-europe",
    leagues: [
      {
        slug: "eredivisie",
        label: "Eredivisie",
        leagueId: 88,
        logo: leagueLogo(88),
        season: DEFAULT_SEASON,
        featured: true,
        homeVisible: true,
        featuredClubKeys: ["ajax", "psv", "feyenoord"],
      },
    ],
  },

  portugal: {
    country: "Portugal",
    countryCode: "PT",
    browseRegion: "featured-europe",
    leagues: [
      {
        slug: "primeira-liga",
        label: "Primeira Liga",
        leagueId: 94,
        logo: leagueLogo(94),
        season: DEFAULT_SEASON,
        featured: true,
        homeVisible: true,
        featuredClubKeys: ["benfica", "porto", "sporting-cp"],
      },
    ],
  },

  scotland: {
    country: "Scotland",
    countryCode: "SCO",
    browseRegion: "featured-europe",
    leagues: [
      {
        slug: "premiership",
        label: "Premiership",
        leagueId: 179,
        logo: leagueLogo(179),
        season: DEFAULT_SEASON,
        featured: true,
        homeVisible: true,
        featuredClubKeys: ["celtic", "rangers"],
      },
    ],
  },

  turkey: {
    country: "Turkey",
    countryCode: "TR",
    browseRegion: "featured-europe",
    leagues: [
      {
        slug: "super-lig",
        label: "Super Lig",
        leagueId: 203,
        logo: leagueLogo(203),
        season: DEFAULT_SEASON,
        featured: true,
        homeVisible: true,
        featuredClubKeys: ["galatasaray", "fenerbahce", "besiktas"],
      },
    ],
  },

  belgium: {
    country: "Belgium",
    countryCode: "BE",
    browseRegion: "featured-europe",
    leagues: [
      {
        slug: "pro-league",
        label: "Pro League",
        leagueId: 144,
        logo: leagueLogo(144),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["club-brugge", "anderlecht"],
      },
    ],
  },

  austria: {
    country: "Austria",
    countryCode: "AT",
    browseRegion: "featured-europe",
    leagues: [
      {
        slug: "austrian-bundesliga",
        label: "Bundesliga",
        leagueId: 218,
        logo: leagueLogo(218),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["salzburg", "rapid-vienna"],
      },
    ],
  },

  switzerland: {
    country: "Switzerland",
    countryCode: "CH",
    browseRegion: "featured-europe",
    leagues: [
      {
        slug: "swiss-super-league",
        label: "Super League",
        leagueId: 207,
        logo: leagueLogo(207),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["young-boys", "basel"],
      },
    ],
  },

  greece: {
    country: "Greece",
    countryCode: "GR",
    browseRegion: "featured-europe",
    leagues: [
      {
        slug: "super-league-greece",
        label: "Super League",
        leagueId: 197,
        logo: leagueLogo(197),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["olympiacos", "panathinaikos"],
      },
    ],
  },

  denmark: {
    country: "Denmark",
    countryCode: "DK",
    browseRegion: "nordics",
    leagues: [
      {
        slug: "danish-superliga",
        label: "Superliga",
        leagueId: 119,
        logo: leagueLogo(119),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["copenhagen", "brondby"],
      },
    ],
  },

  czechRepublic: {
    country: "Czech Republic",
    countryCode: "CZ",
    browseRegion: "central-eastern-europe",
    leagues: [
      {
        slug: "chance-liga",
        label: "Chance Liga",
        leagueId: 345,
        logo: leagueLogo(345),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["sparta-prague", "slavia-prague"],
      },
    ],
  },

  poland: {
    country: "Poland",
    countryCode: "PL",
    browseRegion: "central-eastern-europe",
    leagues: [
      {
        slug: "ekstraklasa",
        label: "Ekstraklasa",
        leagueId: 106,
        logo: leagueLogo(106),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["legia-warsaw", "lech-poznan"],
      },
    ],
  },

  croatia: {
    country: "Croatia",
    countryCode: "HR",
    browseRegion: "central-eastern-europe",
    leagues: [
      {
        slug: "hnl",
        label: "HNL",
        leagueId: 210,
        logo: leagueLogo(210),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["dinamo-zagreb", "hajduk-split"],
      },
    ],
  },

  serbia: {
    country: "Serbia",
    countryCode: "RS",
    browseRegion: "central-eastern-europe",
    leagues: [
      {
        slug: "superliga-serbia",
        label: "SuperLiga",
        leagueId: 286,
        logo: leagueLogo(286),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["red-star-belgrade", "partizan"],
      },
    ],
  },

  hungary: {
    country: "Hungary",
    countryCode: "HU",
    browseRegion: "central-eastern-europe",
    leagues: [
      {
        slug: "nb-i",
        label: "NB I",
        leagueId: 271,
        logo: leagueLogo(271),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["ferencvaros", "ujpest"],
      },
    ],
  },

  romania: {
    country: "Romania",
    countryCode: "RO",
    browseRegion: "central-eastern-europe",
    leagues: [
      {
        slug: "superliga-romania",
        label: "SuperLiga",
        leagueId: 283,
        logo: leagueLogo(283),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["fcsb", "cfr-cluj"],
      },
    ],
  },

  slovakia: {
    country: "Slovakia",
    countryCode: "SK",
    browseRegion: "central-eastern-europe",
    leagues: [
      {
        slug: "super-liga-slovakia",
        label: "Super Liga",
        leagueId: 332,
        logo: leagueLogo(332),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["slovan-bratislava", "spartak-trnava"],
      },
    ],
  },

  slovenia: {
    country: "Slovenia",
    countryCode: "SI",
    browseRegion: "central-eastern-europe",
    leagues: [
      {
        slug: "prvaliga",
        label: "PrvaLiga",
        leagueId: 373,
        logo: leagueLogo(373),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["maribor", "olimpija-ljubljana"],
      },
    ],
  },

  bulgaria: {
    country: "Bulgaria",
    countryCode: "BG",
    browseRegion: "central-eastern-europe",
    leagues: [
      {
        slug: "first-league-bulgaria",
        label: "First League",
        leagueId: 172,
        logo: leagueLogo(172),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["ludogorets", "levski-sofia"],
      },
    ],
  },

  cyprus: {
    country: "Cyprus",
    countryCode: "CY",
    browseRegion: "central-eastern-europe",
    leagues: [
      {
        slug: "first-division-cyprus",
        label: "First Division",
        leagueId: 318,
        logo: leagueLogo(318),
        season: DEFAULT_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["apoel", "omonia-nicosia"],
      },
    ],
  },

  sweden: {
    country: "Sweden",
    countryCode: "SE",
    browseRegion: "nordics",
    leagues: [
      {
        slug: "allsvenskan",
        label: "Allsvenskan",
        leagueId: 113,
        logo: leagueLogo(113),
        season: DEFAULT_CALENDAR_YEAR_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["malmo", "aik"],
      },
    ],
  },

  norway: {
    country: "Norway",
    countryCode: "NO",
    browseRegion: "nordics",
    leagues: [
      {
        slug: "eliteserien",
        label: "Eliteserien",
        leagueId: 103,
        logo: leagueLogo(103),
        season: DEFAULT_CALENDAR_YEAR_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["bodo-glimt", "rosenborg"],
      },
    ],
  },

  finland: {
    country: "Finland",
    countryCode: "FI",
    browseRegion: "nordics",
    leagues: [
      {
        slug: "veikkausliiga",
        label: "Veikkausliiga",
        leagueId: 244,
        logo: leagueLogo(244),
        season: DEFAULT_CALENDAR_YEAR_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["hjk", "kups"],
      },
    ],
  },

  iceland: {
    country: "Iceland",
    countryCode: "IS",
    browseRegion: "nordics",
    leagues: [
      {
        slug: "besta-deild",
        label: "Besta Deild",
        leagueId: 164,
        logo: leagueLogo(164),
        season: DEFAULT_CALENDAR_YEAR_SEASON,
        featured: false,
        homeVisible: false,
        featuredClubKeys: ["kr-reykjavik", "valur"],
      },
    ],
  },
};

/**
 * Derived flat helpers.
 * Keep these exports because the rest of the app already consumes them.
 */
export const LEAGUES: LeagueOption[] = Object.values(FOOTBALL_BY_COUNTRY).flatMap(
  (countryConfig) =>
    countryConfig.leagues.map((league) => ({
      ...league,
      country: countryConfig.country,
      countryCode: countryConfig.countryCode,
      browseRegion: countryConfig.browseRegion,
    }))
);

export const FEATURED_LEAGUES = LEAGUES.filter((l) => l.featured);
export const HOME_LEAGUES = LEAGUES.filter((l) => l.homeVisible);
export const BROWSEABLE_LEAGUES = LEAGUES.filter((l) => l.browseRegion !== null);

export function getLeagueById(leagueId: number): LeagueOption | null {
  return LEAGUES.find((l) => l.leagueId === leagueId) ?? null;
}

export function getLeagueBySlug(slug: string): LeagueOption | null {
  const s = String(slug ?? "").trim().toLowerCase();
  return LEAGUES.find((l) => l.slug.toLowerCase() === s) ?? null;
}

export function getLeaguesForBrowseRegion(region: LeagueBrowseRegion): LeagueOption[] {
  return LEAGUES.filter((l) => l.browseRegion === region);
}

export function getCountryFootballConfig(countryKey: string): CountryFootballConfig | null {
  const key = String(countryKey ?? "").trim();
  return FOOTBALL_BY_COUNTRY[key] ?? null;
}

// --------------------
// League slot rules (kickoff-likely heuristics)
// --------------------

/**
 * Used when a fixture kickoff is not confirmed yet.
 * This is intentionally display-first (strings) so UI can show "Likely Sat 15:00"
 * without timezone complexity.
 */
export type LeagueSlotRule = {
  leagueId: number;
  primarySlot: string;
  typicalSlots: string[];
};

export const LEAGUE_SLOT_RULES: LeagueSlotRule[] = [
  {
    leagueId: 39,
    primarySlot: "Sat 15:00",
    typicalSlots: ["Fri 20:00", "Sat 12:30", "Sat 15:00", "Sat 17:30", "Sun 14:00", "Sun 16:30", "Mon 20:00"],
  },
  {
    leagueId: 140,
    primarySlot: "Sat 18:30",
    typicalSlots: ["Fri 21:00", "Sat 14:00", "Sat 16:15", "Sat 18:30", "Sat 21:00", "Sun 14:00", "Sun 16:15", "Sun 18:30", "Sun 21:00", "Mon 21:00"],
  },
  {
    leagueId: 135,
    primarySlot: "Sun 20:45",
    typicalSlots: ["Fri 20:45", "Sat 15:00", "Sat 18:00", "Sat 20:45", "Sun 12:30", "Sun 15:00", "Sun 18:00", "Sun 20:45", "Mon 20:45"],
  },
  {
    leagueId: 78,
    primarySlot: "Sat 15:30",
    typicalSlots: ["Fri 20:30", "Sat 15:30", "Sat 18:30", "Sun 15:30", "Sun 17:30", "Sun 19:30"],
  },
  {
    leagueId: 61,
    primarySlot: "Sat 21:00",
    typicalSlots: ["Fri 21:00", "Sat 17:00", "Sat 19:00", "Sat 21:00", "Sun 13:00", "Sun 15:00", "Sun 17:00", "Sun 20:45"],
  },
  {
    leagueId: 88,
    primarySlot: "Sun 14:30",
    typicalSlots: ["Fri 20:00", "Sat 16:30", "Sat 18:45", "Sun 12:15", "Sun 14:30", "Sun 16:45"],
  },
  {
    leagueId: 94,
    primarySlot: "Sun 20:30",
    typicalSlots: ["Fri 20:15", "Sat 18:00", "Sat 20:30", "Sun 18:00", "Sun 20:30", "Mon 20:15"],
  },
  {
    leagueId: 179,
    primarySlot: "Sat 15:00",
    typicalSlots: ["Fri 19:45", "Sat 12:30", "Sat 15:00", "Sun 12:00", "Sun 15:00"],
  },
  {
    leagueId: 203,
    primarySlot: "Sun 18:00",
    typicalSlots: ["Fri 18:00", "Sat 11:30", "Sat 14:00", "Sat 17:00", "Sun 14:00", "Sun 18:00", "Mon 18:00"],
  },
  {
    leagueId: 144,
    primarySlot: "Sun 18:30",
    typicalSlots: ["Fri 19:45", "Sat 15:00", "Sat 17:15", "Sat 19:45", "Sun 13:30", "Sun 16:00", "Sun 18:30"],
  },
  {
    leagueId: 218,
    primarySlot: "Sat 17:00",
    typicalSlots: ["Fri 19:30", "Sat 17:00", "Sat 19:30", "Sun 14:30", "Sun 17:00"],
  },
  {
    leagueId: 207,
    primarySlot: "Sun 15:30",
    typicalSlots: ["Sat 17:00", "Sat 19:30", "Sun 14:15", "Sun 15:30", "Sun 17:30"],
  },
  {
    leagueId: 197,
    primarySlot: "Sun 18:30",
    typicalSlots: ["Sat 17:00", "Sat 19:30", "Sun 15:00", "Sun 18:30", "Mon 18:00"],
  },
  {
    leagueId: 119,
    primarySlot: "Sun 18:00",
    typicalSlots: ["Fri 18:00", "Sat 16:00", "Sun 14:00", "Sun 16:00", "Sun 18:00", "Mon 19:00"],
  },
  {
    leagueId: 345,
    primarySlot: "Sat 18:00",
    typicalSlots: ["Fri 18:00", "Sat 15:00", "Sat 18:00", "Sun 15:00", "Sun 18:00"],
  },
  {
    leagueId: 106,
    primarySlot: "Sun 17:30",
    typicalSlots: ["Fri 17:00", "Sat 14:45", "Sat 17:30", "Sun 14:45", "Sun 17:30", "Mon 19:00"],
  },
  {
    leagueId: 113,
    primarySlot: "Sun 15:30",
    typicalSlots: ["Sat 14:00", "Sat 16:30", "Sun 13:00", "Sun 15:30", "Mon 18:00"],
  },
  {
    leagueId: 210,
    primarySlot: "Sat 17:30",
    typicalSlots: ["Fri 18:00", "Sat 17:00", "Sat 19:30", "Sun 17:30", "Sun 20:00"],
  },
  {
    leagueId: 286,
    primarySlot: "Sun 17:00",
    typicalSlots: ["Fri 18:00", "Sat 16:00", "Sat 18:30", "Sun 15:00", "Sun 17:00", "Mon 18:00"],
  },
  {
    leagueId: 103,
    primarySlot: "Sun 16:00",
    typicalSlots: ["Sat 15:00", "Sat 17:00", "Sun 14:30", "Sun 16:00", "Sun 18:15"],
  },
  {
    leagueId: 271,
    primarySlot: "Sat 17:00",
    typicalSlots: ["Fri 19:00", "Sat 14:30", "Sat 17:00", "Sun 14:30", "Sun 17:00"],
  },
  {
    leagueId: 283,
    primarySlot: "Sun 20:00",
    typicalSlots: ["Fri 20:00", "Sat 17:00", "Sat 20:00", "Sun 17:00", "Sun 20:00", "Mon 20:00"],
  },
  {
    leagueId: 332,
    primarySlot: "Sat 18:00",
    typicalSlots: ["Fri 17:30", "Sat 15:30", "Sat 18:00", "Sun 17:30"],
  },
  {
    leagueId: 373,
    primarySlot: "Sun 17:30",
    typicalSlots: ["Sat 17:30", "Sat 20:15", "Sun 15:00", "Sun 17:30", "Sun 20:15"],
  },
  {
    leagueId: 172,
    primarySlot: "Sun 16:45",
    typicalSlots: ["Fri 17:45", "Sat 15:00", "Sat 17:30", "Sun 14:15", "Sun 16:45", "Mon 19:00"],
  },
  {
    leagueId: 318,
    primarySlot: "Sun 18:00",
    typicalSlots: ["Fri 18:00", "Sat 17:00", "Sat 19:00", "Sun 16:00", "Sun 18:00", "Mon 19:00"],
  },
  {
    leagueId: 244,
    primarySlot: "Sat 15:00",
    typicalSlots: ["Fri 17:00", "Sat 15:00", "Sat 17:00", "Sun 14:00", "Sun 16:00"],
  },
  {
    leagueId: 164,
    primarySlot: "Mon 20:15",
    typicalSlots: ["Mon 20:15", "Tue 20:15", "Wed 20:15", "Thu 20:15", "Sun 19:15"],
  },
];

export function getLeagueSlotRule(leagueId: number): LeagueSlotRule | null {
  return LEAGUE_SLOT_RULES.find((r) => r.leagueId === leagueId) ?? null;
}

// --------------------
// Date helpers
// --------------------

/**
 * CONTRACT (locked):
 * - from/to are ISO date-only "YYYY-MM-DD"
 * - from is clamped to TOMORROW (never includes today/past)
 * - to is INCLUSIVE
 * - days means "number of included days" (days=1 => from==to)
 */

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse "YYYY-MM-DD" as a local-midnight Date.
 */
export function parseIsoDateOnly(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function addDaysIso(baseIso: string, days: number): string {
  const base = parseIsoDateOnly(baseIso) ?? new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + days);
  return toIsoDate(base);
}

export type RollingWindowIso = { from: string; to: string };

/**
 * Local "tomorrow" at 00:00:00.
 */
export function tomorrowLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

export function tomorrowIso(): string {
  return toIsoDate(tomorrowLocal());
}

/**
 * Enforce "tomorrow onwards" (excludes past + today).
 */
export function clampFromIsoToTomorrow(fromIso: string): string {
  const tmr = tomorrowIso();
  const fromDate = parseIsoDateOnly(fromIso);
  const tmrDate = parseIsoDateOnly(tmr);
  if (!fromDate || !tmrDate) return tmr;
  return fromDate.getTime() < tmrDate.getTime() ? tmr : fromIso;
}

function isIsoDateOnly(s?: string): boolean {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(String(s).trim());
}

/**
 * Normalise a window so it is always valid and never includes past/today.
 */
export function normalizeWindowIso(
  input: { from: string; to: string },
  daysIfInvalidTo = 90
): RollingWindowIso {
  const from = clampFromIsoToTomorrow(String(input.from ?? "").trim());

  const fromDate = parseIsoDateOnly(from);
  const toRaw = String(input.to ?? "").trim();
  const toDate = parseIsoDateOnly(toRaw);

  const safeDays = Math.max(1, Number(daysIfInvalidTo) || 90);
  const fallbackTo = addDaysIso(from, safeDays - 1);

  if (!fromDate) {
    return { from: tomorrowIso(), to: addDaysIso(tomorrowIso(), safeDays - 1) };
  }

  if (!isIsoDateOnly(toRaw) || !toDate) {
    return { from, to: fallbackTo };
  }

  if (toDate.getTime() < fromDate.getTime()) {
    return { from, to: fallbackTo };
  }

  return { from, to: toRaw };
}

/**
 * Central fixture date window (rolling).
 * Defaults to TOMORROW onwards.
 */
export function getRollingWindowIso(opts?: { days?: number; start?: Date }): RollingWindowIso {
  const days = Math.max(1, Number(opts?.days ?? 90) || 90);
  const start = opts?.start ?? tomorrowLocal();

  const from = toIsoDate(start);
  const to = addDaysIso(from, days - 1);

  return normalizeWindowIso({ from, to }, days);
}

/**
 * Helper: window starting tomorrow for N inclusive days.
 */
export function windowFromTomorrowIso(days: number): RollingWindowIso {
  const safeDays = Math.max(1, Number(days) || 1);
  const from = tomorrowIso();
  const to = addDaysIso(from, safeDays - 1);
  return normalizeWindowIso({ from, to }, safeDays);
}

/**
 * Helper: next weekend (Sat–Sun) from tomorrow onwards.
 */
export function nextWeekendWindowIso(): RollingWindowIso {
  const d = tomorrowLocal();
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const daysUntilSat = (6 - day + 7) % 7;

  const sat = new Date(d);
  sat.setHours(0, 0, 0, 0);
  sat.setDate(sat.getDate() + daysUntilSat);

  const sun = new Date(sat);
  sun.setHours(0, 0, 0, 0);
  sun.setDate(sun.getDate() + 1);

  const from = toIsoDate(sat);
  const to = toIsoDate(sun);

  return normalizeWindowIso({ from, to }, 2);
      }
