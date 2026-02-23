// src/data/ticketGuides/premierLeague.ts

import type { TicketGuide } from "./types";

/**
 * Premier League (2025/26) — 20 teams
 *
 * This file is an expectation-setter for neutral travellers.
 * It is NOT a promise and should stay conservative + user-first.
 *
 * Notes:
 * - No “away end” framing.
 * - Push users toward official channels first.
 * - “marketplace_risk” exists only to warn hard (don’t recommend it).
 */
function makeGuide(g: TicketGuide): TicketGuide {
  return g;
}

/** Helper: share one guide across multiple lookup keys (aliases). */
function alias(g: TicketGuide, keys: string[]) {
  const out: Record<string, TicketGuide> = {};
  for (const k of keys) out[k] = g;
  return out;
}

const arsenal = makeGuide({
  clubKey: "arsenal",
  clubName: "Arsenal",
  league: "Premier League",
  difficulty: "very_hard",
  summary: "Very high demand. Membership is usually needed; general sale for big fixtures is rare.",
  membershipRequired: true,
  typicalReleaseDaysBefore: { min: 21, max: 70 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["membership_portal", "official_site", "official_app", "hospitality"],
  safetyNotes: ["Avoid random resale/marketplaces. If you miss official/member windows, hospitality is the safest fallback."],
  notes: ["Expect account-based digital ticketing.", "Big fixtures often sell out in priority windows."],
});

const manCity = makeGuide({
  clubKey: "manchester-city",
  clubName: "Manchester City",
  league: "Premier League",
  difficulty: "hard",
  summary: "Many fixtures can be achievable with planning. Marquee games sell fast—buy at release.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 14, max: 60 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "hospitality"],
  safetyNotes: ["Stick to official channels; use hospitality if sold out."],
  notes: ["Availability varies a lot by opponent and calendar spot."],
});

const astonVilla = makeGuide({
  clubKey: "aston-villa",
  clubName: "Aston Villa",
  league: "Premier League",
  difficulty: "hard",
  summary: "Often doable with planning. Priority access can matter for the bigger games.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 14, max: 55 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "membership_portal", "hospitality"],
  safetyNotes: ["Avoid random resale. If you miss the on-sale window, hospitality is the safest fallback."],
  notes: ["Expect tighter availability for top opponents and peak dates."],
});

const chelsea = makeGuide({
  clubKey: "chelsea",
  clubName: "Chelsea",
  league: "Premier League",
  difficulty: "very_hard",
  summary: "High demand. Membership is strongly recommended; general sale is uncommon.",
  membershipRequired: true,
  typicalReleaseDaysBefore: { min: 21, max: 70 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["membership_portal", "official_site", "official_app", "hospitality"],
  safetyNotes: ["If you can’t buy officially, don’t gamble—use hospitality or verified authorized routes only."],
  notes: ["Digital ticketing/account rules can be strict for high-demand matches."],
});

const manUnited = makeGuide({
  clubKey: "manchester-united",
  clubName: "Manchester United",
  league: "Premier League",
  difficulty: "very_hard",
  summary: "Very high demand. Membership/priority access is usually required for decent availability.",
  membershipRequired: true,
  typicalReleaseDaysBefore: { min: 28, max: 90 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["membership_portal", "official_site", "official_app", "hospitality"],
  safetyNotes: ["Avoid sketchy marketplaces. If you miss official windows, hospitality is the safer route."],
  notes: ["Big fixtures can disappear quickly once sales open."],
});

const liverpool = makeGuide({
  clubKey: "liverpool",
  clubName: "Liverpool",
  league: "Premier League",
  difficulty: "very_hard",
  summary: "Extremely competitive. Priority access is usually needed; general sale opportunities are limited.",
  membershipRequired: true,
  typicalReleaseDaysBefore: { min: 30, max: 90 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["membership_portal", "official_site", "official_app", "hospitality"],
  safetyNotes: ["If you can’t buy via official/member routes, hospitality is the safe fallback."],
  notes: ["Plan early and expect strict account rules for ticketing."],
});

const brentford = makeGuide({
  clubKey: "brentford",
  clubName: "Brentford",
  league: "Premier League",
  difficulty: "hard",
  summary: "Smaller stadium means demand can be tight. Many fixtures require quick action at release.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 14, max: 50 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "membership_portal", "hospitality"],
  safetyNotes: ["Avoid marketplaces; scarcity is real for top opponents."],
  notes: ["Availability can swing sharply depending on opponent."],
});

const bournemouth = makeGuide({
  clubKey: "bournemouth",
  clubName: "Bournemouth",
  league: "Premier League",
  difficulty: "medium",
  summary: "Often achievable for many fixtures. Buy early for top opponents and peak weekends.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 10, max: 45 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "hospitality"],
  safetyNotes: ["Stick to official channels."],
  notes: ["If you want specific seats, buy right when sales open."],
});

const everton = makeGuide({
  clubKey: "everton",
  clubName: "Everton",
  league: "Premier League",
  difficulty: "medium",
  summary: "Many fixtures are doable if you buy when sales open. Bigger matches are harder.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 14, max: 50 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "membership_portal", "hospitality"],
  safetyNotes: ["Official channels first; hospitality is the safe fallback if sold out."],
  notes: ["Expect quicker sell-outs for top opponents and holiday periods."],
});

const fulham = makeGuide({
  clubKey: "fulham",
  clubName: "Fulham",
  league: "Premier League",
  difficulty: "medium",
  summary: "Often doable for many fixtures. Demand increases for top opponents and London fixtures.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 10, max: 45 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "hospitality"],
  safetyNotes: ["Use official channels; avoid marketplaces for high-demand games."],
  notes: ["Buy early if travelling on a fixed weekend."],
});

const newcastle = makeGuide({
  clubKey: "newcastle-united",
  clubName: "Newcastle United",
  league: "Premier League",
  difficulty: "hard",
  summary: "Demand can be strong. Many fixtures are tough unless you act quickly at release.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 14, max: 60 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "membership_portal", "hospitality"],
  safetyNotes: ["Avoid marketplaces; if you miss on-sale, hospitality is the safer fallback."],
  notes: ["High-profile opponents and key dates can go very quickly."],
});

const sunderland = makeGuide({
  clubKey: "sunderland",
  clubName: "Sunderland",
  league: "Premier League",
  difficulty: "medium",
  summary: "Often achievable, especially outside marquee fixtures. Plan early for local rivalry/high-profile games.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 10, max: 45 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "box_office", "hospitality"],
  safetyNotes: ["Stick to official channels; only use authorized routes if sold out."],
  notes: ["Expect higher demand for big-name visitors and local rivalries."],
});

const crystalPalace = makeGuide({
  clubKey: "crystal-palace",
  clubName: "Crystal Palace",
  league: "Premier League",
  difficulty: "medium",
  summary: "Many fixtures are manageable. Bigger matches can tighten quickly.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 10, max: 45 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "membership_portal", "hospitality"],
  safetyNotes: ["Use official channels first; avoid marketplaces."],
  notes: ["Buy early for London fixtures and top opponents."],
});

const brighton = makeGuide({
  clubKey: "brighton",
  clubName: "Brighton & Hove Albion",
  league: "Premier League",
  difficulty: "medium",
  summary: "Often achievable with planning; tougher for top opponents and prime dates.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 10, max: 45 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "membership_portal", "hospitality"],
  safetyNotes: ["Stick to official routes."],
  notes: ["If your trip is fixed, buy right at release."],
});

const leeds = makeGuide({
  clubKey: "leeds-united",
  clubName: "Leeds United",
  league: "Premier League",
  difficulty: "hard",
  summary: "Demand can be high. Act quickly at release; priority access can help for big games.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 14, max: 55 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "membership_portal", "hospitality"],
  safetyNotes: ["Avoid marketplaces; use hospitality/authorized routes if you miss official sales."],
  notes: ["Expect tighter availability for marquee fixtures."],
});

const spurs = makeGuide({
  clubKey: "tottenham-hotspur",
  clubName: "Tottenham Hotspur",
  league: "Premier League",
  difficulty: "very_hard",
  summary: "High demand. Membership strongly recommended; general sale for big games is limited.",
  membershipRequired: true,
  typicalReleaseDaysBefore: { min: 21, max: 70 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["membership_portal", "official_site", "official_app", "hospitality"],
  safetyNotes: ["If you miss official/member access, use hospitality or verified authorized routes only."],
  notes: ["Expect strict account-based digital tickets for many fixtures."],
});

const forest = makeGuide({
  clubKey: "nottingham-forest",
  clubName: "Nottingham Forest",
  league: "Premier League",
  difficulty: "medium",
  summary: "Often doable with planning. Availability tightens for bigger matches.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 10, max: 45 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "membership_portal", "hospitality"],
  safetyNotes: ["Official channels first; avoid marketplaces."],
  notes: ["Buy early if travelling on a fixed weekend."],
});

const westHam = makeGuide({
  clubKey: "west-ham-united",
  clubName: "West Ham United",
  league: "Premier League",
  difficulty: "hard",
  summary: "Often possible with planning; high-profile matches can require quick action or priority access.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 14, max: 55 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "membership_portal", "hospitality"],
  safetyNotes: ["Avoid marketplaces; use hospitality/authorized routes if sold out."],
  notes: ["London fixtures and top opponents can be significantly harder."],
});

const burnley = makeGuide({
  clubKey: "burnley",
  clubName: "Burnley",
  league: "Premier League",
  difficulty: "medium",
  summary: "Many fixtures are achievable. Bigger opponents and key dates sell quicker.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 10, max: 45 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "box_office", "hospitality"],
  safetyNotes: ["Stick to official channels; avoid marketplaces."],
  notes: ["If you want a specific stand/area, buy at release."],
});

const wolves = makeGuide({
  clubKey: "wolverhampton-wanderers",
  clubName: "Wolves",
  league: "Premier League",
  difficulty: "medium",
  summary: "Often achievable for many fixtures; buy early for top opponents and peak dates.",
  membershipRequired: false,
  typicalReleaseDaysBefore: { min: 10, max: 45 },
  ukCardUsuallyWorks: true,
  touristFriendly: true,
  methods: ["official_site", "official_app", "membership_portal", "hospitality"],
  safetyNotes: ["Use official channels first; avoid marketplaces."],
  notes: ["Availability varies by opponent; don’t assume late tickets exist."],
});

/**
 * Export registry.
 * Include common key variants so getTicketGuide(homeName) succeeds even if
 * the upstream normalizer outputs spaces or hyphens.
 */
const premierLeagueTicketGuides: Record<string, TicketGuide> = {
  ...alias(arsenal, ["arsenal"]),

  ...alias(manCity, ["manchester-city", "manchester city", "man-city", "mancity"]),

  ...alias(astonVilla, ["aston-villa", "aston villa", "villa"]),

  ...alias(chelsea, ["chelsea"]),

  ...alias(manUnited, ["manchester-united", "manchester united", "man-utd", "man utd", "manutd"]),

  ...alias(liverpool, ["liverpool"]),

  ...alias(brentford, ["brentford"]),

  ...alias(bournemouth, ["bournemouth", "afc-bournemouth", "afc bournemouth"]),

  ...alias(everton, ["everton"]),

  ...alias(fulham, ["fulham"]),

  ...alias(newcastle, ["newcastle-united", "newcastle united", "newcastle"]),

  ...alias(sunderland, ["sunderland"]),

  ...alias(crystalPalace, ["crystal-palace", "crystal palace", "palace"]),

  ...alias(brighton, ["brighton", "brighton-&-hove-albion", "brighton & hove albion", "brighton and hove albion"]),

  ...alias(leeds, ["leeds-united", "leeds united", "leeds"]),

  ...alias(spurs, ["tottenham-hotspur", "tottenham hotspur", "tottenham", "spurs"]),

  ...alias(forest, ["nottingham-forest", "nottingham forest", "forest"]),

  ...alias(westHam, ["west-ham-united", "west ham united", "west ham"]),

  ...alias(burnley, ["burnley"]),

  ...alias(wolves, ["wolverhampton-wanderers", "wolverhampton wanderers", "wolves"]),
};

export default premierLeagueTicketGuides;
