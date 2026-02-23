// src/data/ticketGuides/serieA.ts
import type { TicketGuide } from "./types";

/**
 * Serie A (2025/26) — 20 teams
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

const serieATicketGuides: Record<string, TicketGuide> = {
  "juventus": makeGuide({
    clubKey: "juventus",
    clubName: "Juventus",
    league: "Serie A",
    difficulty: "very_hard",
    summary: "High demand for big fixtures. Priority windows often matter; general sale can be limited for top games.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 14, max: 70 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "official_app", "hospitality"],
    safetyNotes: [
      "Official/member routes first. If sold out, hospitality or clearly authorized resale routes are the safer fallback.",
    ],
    notes: ["Expect account-based digital ticketing for many fixtures.", "Buy at release for high-profile opponents."],
  }),

  "inter": makeGuide({
    clubKey: "inter",
    clubName: "Inter",
    league: "Serie A",
    difficulty: "very_hard",
    summary: "Big matches can be extremely competitive. Buy at release; availability tightens quickly for derbies/top opponents.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 14, max: 70 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "official_app", "hospitality"],
    safetyNotes: [
      "Use official channels. Treat open marketplaces as high-risk unless explicitly authorized by the club/league.",
    ],
    notes: ["Derbies and marquee fixtures can sell out very quickly once sales open."],
  }),

  "milan": makeGuide({
    clubKey: "milan",
    clubName: "AC Milan",
    league: "Serie A",
    difficulty: "very_hard",
    summary: "High demand, especially for major fixtures. Priority windows matter; buy immediately when sales open.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 14, max: 70 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "official_app", "hospitality"],
    safetyNotes: [
      "Avoid sketchy resale. Hospitality or clearly authorized resale routes are the safer fallback when sold out.",
    ],
    notes: ["Expect strict account/name controls on high-demand matches."],
  }),

  "roma": makeGuide({
    clubKey: "roma",
    clubName: "Roma",
    league: "Serie A",
    difficulty: "hard",
    summary: "Often achievable with planning. Top opponents and derbies sell quickly—buy at release.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality", "box_office"],
    safetyNotes: ["Prefer official channels; if sold out, use hospitality/authorized routes only."],
    notes: ["For big fixtures, assume you need to buy early rather than ‘closer to the day’."],
  }),

  "lazio": makeGuide({
    clubKey: "lazio",
    clubName: "Lazio",
    league: "Serie A",
    difficulty: "hard",
    summary: "Usually doable with planning. Derby and big matches are significantly harder—buy right at release.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality", "box_office"],
    safetyNotes: ["Stick to official channels; only use authorized routes if sold out."],
    notes: ["Availability varies sharply by opponent and calendar."],
  }),

  "napoli": makeGuide({
    clubKey: "napoli",
    clubName: "Napoli",
    league: "Serie A",
    difficulty: "hard",
    summary: "Strong demand. Many fixtures are doable if you buy early; top opponents can sell fast.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality", "box_office"],
    safetyNotes: ["Official channels first. Avoid open marketplaces."],
    notes: ["Buy at release for big-name opponents and peak dates."],
  }),

  "atalanta": makeGuide({
    clubKey: "atalanta",
    clubName: "Atalanta",
    league: "Serie A",
    difficulty: "medium",
    summary: "Often achievable for many fixtures. Expect tighter availability for top opponents—buy early.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Stick to official channels."],
    notes: ["If your trip dates are fixed, don’t leave purchase late."],
  }),

  "bologna": makeGuide({
    clubKey: "bologna",
    clubName: "Bologna",
    league: "Serie A",
    difficulty: "medium",
    summary: "Generally achievable with planning. Big matches and weekends can sell faster than average.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are usually enough."],
    notes: ["For high-demand games, buy at release for best seat selection."],
  }),

  "fiorentina": makeGuide({
    clubKey: "fiorentina",
    clubName: "Fiorentina",
    league: "Serie A",
    difficulty: "medium",
    summary: "Often doable. Plan earlier for top opponents and high-demand dates.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office", "hospitality"],
    safetyNotes: ["Prefer official channels; hospitality is a safe fallback if sold out."],
    notes: ["Demand spikes for marquee opponents."],
  }),

  "torino": makeGuide({
    clubKey: "torino",
    clubName: "Torino",
    league: "Serie A",
    difficulty: "medium",
    summary: "Usually achievable. Demand increases for bigger opponents—buy early if travelling.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Stick to official channels."],
    notes: ["If you want specific seats, purchase at release."],
  }),

  "udinese": makeGuide({
    clubKey: "udinese",
    clubName: "Udinese",
    league: "Serie A",
    difficulty: "easy",
    summary: "Often straightforward for many fixtures. Buy earlier for top opponents and peak weekends.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Availability is usually decent outside marquee fixtures."],
  }),

  "verona": makeGuide({
    clubKey: "verona",
    clubName: "Hellas Verona",
    league: "Serie A",
    difficulty: "medium",
    summary: "Often achievable with planning. Big opponents can sell faster—buy early.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 40 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Stick to official channels."],
    notes: ["Demand varies by opponent and kickoff slot."],
  }),

  "cagliari": makeGuide({
    clubKey: "cagliari",
    clubName: "Cagliari",
    league: "Serie A",
    difficulty: "easy",
    summary: "Usually straightforward. Plan earlier for big opponents and peak travel dates.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["If your trip is fixed, buy at release for peace of mind."],
  }),

  "genoa": makeGuide({
    clubKey: "genoa",
    clubName: "Genoa",
    league: "Serie A",
    difficulty: "medium",
    summary: "Often achievable with planning. Demand increases for bigger fixtures—buy early if travelling.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Stick to official channels; avoid open marketplaces."],
    notes: ["Expect tighter availability for marquee opponents."],
  }),

  "lecce": makeGuide({
    clubKey: "lecce",
    clubName: "Lecce",
    league: "Serie A",
    difficulty: "easy",
    summary: "Usually achievable. Buy earlier for top opponents and holiday periods.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["If you want specific seats, buy at release."],
  }),

  "parma": makeGuide({
    clubKey: "parma",
    clubName: "Parma",
    league: "Serie A",
    difficulty: "easy",
    summary: "Often straightforward for many fixtures. Big opponents sell faster—plan ahead.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Demand rises for marquee opponents and peak weekends."],
  }),

  "como": makeGuide({
    clubKey: "como",
    clubName: "Como",
    league: "Serie A",
    difficulty: "easy",
    summary: "Generally achievable. Expect tighter demand for marquee games and prime weekends.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["For big opponents, buy at release rather than late."],
  }),

  "cremonese": makeGuide({
    clubKey: "cremonese",
    clubName: "Cremonese",
    league: "Serie A",
    difficulty: "easy",
    summary: "Usually achievable with basic planning. Buy earlier for top opponents.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Availability is usually fine outside marquee fixtures."],
  }),

  "pisa": makeGuide({
    clubKey: "pisa",
    clubName: "Pisa",
    league: "Serie A",
    difficulty: "easy",
    summary: "Often achievable. Demand rises for big opponents and key dates—buy early for certainty.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["If travelling on a fixed weekend, don’t leave purchase late."],
  }),

  "sassuolo": makeGuide({
    clubKey: "sassuolo",
    clubName: "Sassuolo",
    league: "Serie A",
    difficulty: "easy",
    summary: "Generally straightforward for many fixtures. Buy earlier for top opponents.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Marquee fixtures can still tighten quickly—buy at release."],
  }),
};

export default serieATicketGuides;
