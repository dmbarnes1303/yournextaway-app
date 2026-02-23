// src/data/ticketGuides/bundesliga.ts
import type { TicketGuide } from "./types";

/**
 * Bundesliga (2025/26) — 18 teams
 *
 * Canonical-only keys:
 * - One guide per club under its canonical slug key.
 * - Aliases belong in src/data/ticketGuides/index.ts (normalizeClubKey), not here.
 *
 * Phase-1 expectation setters for neutral travellers:
 * - No “away end” framing.
 * - Push official channels first.
 * - “marketplace_risk” exists only to warn hard (not a recommendation).
 */
function makeGuide(g: TicketGuide): TicketGuide {
  return g;
}

const bundesligaTicketGuides: Record<string, TicketGuide> = {
  "bayern-munich": makeGuide({
    clubKey: "bayern-munich",
    clubName: "Bayern Munich",
    league: "Bundesliga",
    difficulty: "very_hard",
    summary: "High demand. Marquee fixtures are extremely competitive—plan early and buy at release.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 21, max: 90 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "official_app", "hospitality"],
    safetyNotes: ["Official/member routes first. Treat open resale as high-risk unless clearly authorized."],
    notes: ["Expect rapid sell-outs for big opponents and prime dates."],
  }),

  "borussia-dortmund": makeGuide({
    clubKey: "borussia-dortmund",
    clubName: "Borussia Dortmund",
    league: "Bundesliga",
    difficulty: "very_hard",
    summary: "Very high demand. Many matches sell fast; priority windows can matter for the biggest fixtures.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 21, max: 90 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "official_app", "hospitality"],
    safetyNotes: ["Avoid random resale sites. If you miss official windows, use hospitality/authorized routes."],
    notes: ["Buy at release for the best chance on high-demand matches."],
  }),

  "rb-leipzig": makeGuide({
    clubKey: "rb-leipzig",
    clubName: "RB Leipzig",
    league: "Bundesliga",
    difficulty: "hard",
    summary: "Often achievable with planning. Big fixtures sell faster—buy at release.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 70 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
    safetyNotes: ["Stick to official channels."],
    notes: ["Demand varies by opponent and kickoff slot."],
  }),

  "bayer-leverkusen": makeGuide({
    clubKey: "bayer-leverkusen",
    clubName: "Bayer Leverkusen",
    league: "Bundesliga",
    difficulty: "hard",
    summary: "Frequently doable with planning. Demand rises for top opponents and peak dates—buy early.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 70 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
    safetyNotes: ["Official channels first."],
    notes: ["If you’re travelling on fixed dates, don’t leave purchase late."],
  }),

  "eintracht-frankfurt": makeGuide({
    clubKey: "eintracht-frankfurt",
    clubName: "Eintracht Frankfurt",
    league: "Bundesliga",
    difficulty: "hard",
    summary: "Strong support and demand. Many fixtures require quick action when sales open.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 70 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
    safetyNotes: ["Avoid open marketplaces; use official channels or clearly authorized routes."],
    notes: ["High-profile opponents can sell very quickly."],
  }),

  "vfb-stuttgart": makeGuide({
    clubKey: "vfb-stuttgart",
    clubName: "VfB Stuttgart",
    league: "Bundesliga",
    difficulty: "hard",
    summary: "Often doable with planning. Big fixtures and weekends can sell quickly—buy at release.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 70 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
    safetyNotes: ["Stick to official channels."],
    notes: ["Demand varies sharply by opponent."],
  }),

  "borussia-monchengladbach": makeGuide({
    clubKey: "borussia-monchengladbach",
    clubName: "Borussia Mönchengladbach",
    league: "Bundesliga",
    difficulty: "medium",
    summary: "Often achievable with planning. Buy early for top opponents and peak dates.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office", "hospitality"],
    safetyNotes: ["Official channels are usually sufficient."],
    notes: ["Seat choice is best if you buy at release."],
  }),

  "sc-freiburg": makeGuide({
    clubKey: "sc-freiburg",
    clubName: "SC Freiburg",
    league: "Bundesliga",
    difficulty: "medium",
    summary: "Often achievable. Demand rises for big opponents—buy early if travelling.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Stick to official channels."],
    notes: ["If your trip is fixed, buy at release for certainty."],
  }),

  "union-berlin": makeGuide({
    clubKey: "union-berlin",
    clubName: "Union Berlin",
    league: "Bundesliga",
    difficulty: "very_hard",
    summary: "Small capacity + huge demand. Many fixtures are extremely tough without planning and fast purchase.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 21, max: 80 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "official_app", "hospitality"],
    safetyNotes: ["If you can’t buy officially, don’t gamble on resale—use authorized routes only."],
    notes: ["Assume high-demand matches disappear quickly when sales open."],
  }),

  "werder-bremen": makeGuide({
    clubKey: "werder-bremen",
    clubName: "Werder Bremen",
    league: "Bundesliga",
    difficulty: "medium",
    summary: "Often achievable with planning. Buy early for top opponents and peak weekends.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are usually sufficient."],
    notes: ["Demand spikes for marquee opponents."],
  }),

  "mainz-05": makeGuide({
    clubKey: "mainz-05",
    clubName: "Mainz 05",
    league: "Bundesliga",
    difficulty: "easy",
    summary: "Usually straightforward for many fixtures. Buy earlier for big opponents and peak weekends.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Availability is usually decent outside marquee fixtures."],
  }),

  "augsburg": makeGuide({
    clubKey: "augsburg",
    clubName: "Augsburg",
    league: "Bundesliga",
    difficulty: "easy",
    summary: "Often straightforward. Buy earlier for top opponents and peak dates.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["If you want specific seats, buy at release."],
  }),

  "wolfsburg": makeGuide({
    clubKey: "wolfsburg",
    clubName: "VfL Wolfsburg",
    league: "Bundesliga",
    difficulty: "easy",
    summary: "Usually achievable with basic planning. Buy early for marquee fixtures.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Demand rises for big opponents and peak weekends."],
  }),

  "tsg-hoffenheim": makeGuide({
    clubKey: "tsg-hoffenheim",
    clubName: "TSG Hoffenheim",
    league: "Bundesliga",
    difficulty: "easy",
    summary: "Often straightforward for many fixtures. Plan earlier for big opponents and prime dates.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Buy at release for marquee fixtures to avoid stress."],
  }),

  "fc-koln": makeGuide({
    clubKey: "fc-koln",
    clubName: "1. FC Köln",
    league: "Bundesliga",
    difficulty: "hard",
    summary: "Strong demand. Many fixtures can be tough—buy immediately when sales open.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 70 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "membership_portal", "hospitality"],
    safetyNotes: ["Avoid open marketplaces; use official channels or clearly authorized resale only."],
    notes: ["Marquee games can disappear quickly at release."],
  }),

  "hamburger-sv": makeGuide({
    clubKey: "hamburger-sv",
    clubName: "Hamburger SV",
    league: "Bundesliga",
    difficulty: "medium",
    summary: "Often achievable with planning. Demand rises for big opponents—buy early.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are usually sufficient."],
    notes: ["For marquee fixtures, buy at release for best availability."],
  }),

  "fc-heidenheim": makeGuide({
    clubKey: "fc-heidenheim",
    clubName: "1. FC Heidenheim",
    league: "Bundesliga",
    difficulty: "medium",
    summary: "Smaller capacity can mean tighter supply. Buy early for marquee fixtures and peak weekends.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Stick to official channels."],
    notes: ["Availability varies by opponent—don’t assume late tickets exist."],
  }),

  "st-pauli": makeGuide({
    clubKey: "st-pauli",
    clubName: "FC St. Pauli",
    league: "Bundesliga",
    difficulty: "hard",
    summary: "Strong demand. Tickets can go quickly—buy at release, especially for big fixtures.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 70 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "membership_portal", "hospitality"],
    safetyNotes: ["Avoid open marketplaces. If sold out, use hospitality/authorized routes only."],
    notes: ["Demand spikes for high-profile opponents and prime dates."],
  }),
};

export default bundesligaTicketGuides;
