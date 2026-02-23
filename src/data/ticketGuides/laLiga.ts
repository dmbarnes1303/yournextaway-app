// src/data/ticketGuides/laLiga.ts
import type { TicketGuide } from "./types";

/**
 * La Liga (2025/26) — 20 teams
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

const laLigaTicketGuides: Record<string, TicketGuide> = {
  "real-madrid": makeGuide({
    clubKey: "real-madrid",
    clubName: "Real Madrid",
    league: "La Liga",
    difficulty: "very_hard",
    summary: "Extremely high demand. Priority access is often the difference for big fixtures; general sale can be limited.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 21, max: 80 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "official_app", "hospitality"],
    safetyNotes: [
      "Stick to official/member channels. If sold out, hospitality or clearly authorized resale routes are the safer fallback.",
    ],
    notes: [
      "Marquee fixtures can disappear quickly once sales open.",
      "Expect account/name controls on many ticketing flows.",
    ],
  }),

  "barcelona": makeGuide({
    clubKey: "barcelona",
    clubName: "Barcelona",
    league: "La Liga",
    difficulty: "very_hard",
    summary: "Huge demand. Big matches often need membership/priority windows; general sale can be limited.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 21, max: 75 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "official_app", "hospitality"],
    safetyNotes: [
      "Official channels first. If sold out, hospitality or authorized resale routes are safer than open marketplaces.",
    ],
    notes: ["Digital ticketing is common; plan early for high-profile opponents."],
  }),

  "atletico-madrid": makeGuide({
    clubKey: "atletico-madrid",
    clubName: "Atlético Madrid",
    league: "La Liga",
    difficulty: "hard",
    summary: "Often achievable with planning. Big matches sell fast—buy immediately when sales open.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "membership_portal", "hospitality"],
    safetyNotes: ["Use official channels first; hospitality is the safer fallback if sold out."],
    notes: ["Derby/high-demand fixtures can be significantly harder than average."],
  }),

  "athletic-club": makeGuide({
    clubKey: "athletic-club",
    clubName: "Athletic Club",
    league: "La Liga",
    difficulty: "hard",
    summary: "Strong local demand. Many matches are doable if you act fast; top opponents are tougher.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office", "hospitality"],
    safetyNotes: ["Official first. For sold-out games, only use clearly authorized routes."],
    notes: ["Availability can tighten quickly depending on opponent and kickoff timing."],
  }),

  "real-sociedad": makeGuide({
    clubKey: "real-sociedad",
    clubName: "Real Sociedad",
    league: "La Liga",
    difficulty: "medium",
    summary: "Often achievable for many fixtures. Bigger opponents sell faster—buy early.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 50 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Stick to official channels."],
    notes: ["If travelling on a fixed weekend, purchase at release for best choice."],
  }),

  "real-betis": makeGuide({
    clubKey: "real-betis",
    clubName: "Real Betis",
    league: "La Liga",
    difficulty: "hard",
    summary: "Strong demand and atmosphere. Many fixtures are doable with timing; derbies/top games are tough.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 55 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
    safetyNotes: ["Official channels first; hospitality is the safer fallback for sold-out dates."],
    notes: ["High-profile opponents and peak weekends can sell quickly."],
  }),

  "sevilla": makeGuide({
    clubKey: "sevilla",
    clubName: "Sevilla",
    league: "La Liga",
    difficulty: "medium",
    summary: "Many fixtures are achievable if you buy at release; high-profile games are tighter.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 50 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office", "hospitality"],
    safetyNotes: ["Prefer official channels; avoid open marketplaces."],
    notes: ["Expect quicker sell-outs for big opponents and prime dates."],
  }),

  "valencia": makeGuide({
    clubKey: "valencia",
    clubName: "Valencia",
    league: "La Liga",
    difficulty: "medium",
    summary: "Often doable with planning. Bigger matches and peak weekends sell faster.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 50 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office", "hospitality"],
    safetyNotes: ["Official channels first; hospitality is a safe fallback if sold out."],
    notes: ["If you want specific seats, buy right when sales open."],
  }),

  "villarreal": makeGuide({
    clubKey: "villarreal",
    clubName: "Villarreal",
    league: "La Liga",
    difficulty: "medium",
    summary: "Frequently achievable for many fixtures. Top opponents are harder—act quickly at release.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Stick to official channels."],
    notes: ["Availability can tighten for marquee fixtures and holiday periods."],
  }),

  "osasuna": makeGuide({
    clubKey: "osasuna",
    clubName: "Osasuna",
    league: "La Liga",
    difficulty: "medium",
    summary: "Usually achievable with planning. Demand rises for big opponents and weekend trips.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels first."],
    notes: ["Buy early if your travel dates are fixed."],
  }),

  "celta-vigo": makeGuide({
    clubKey: "celta-vigo",
    clubName: "Celta Vigo",
    league: "La Liga",
    difficulty: "medium",
    summary: "Often doable. Buy early for top opponents and peak travel weekends.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Stick to official channels."],
    notes: ["If you’re travelling for a marquee match, plan for earlier purchase."],
  }),

  "espanyol": makeGuide({
    clubKey: "espanyol",
    clubName: "Espanyol",
    league: "La Liga",
    difficulty: "medium",
    summary: "Generally achievable with planning. Demand spikes for bigger fixtures.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Use official channels first."],
    notes: ["Derby/high-demand fixtures can sell quickly."],
  }),

  "getafe": makeGuide({
    clubKey: "getafe",
    clubName: "Getafe",
    league: "La Liga",
    difficulty: "medium",
    summary: "Often achievable for many fixtures. Expect tighter availability for top opponents.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Stick to official channels."],
    notes: ["Buy early if you’re set on a specific matchday weekend."],
  }),

  "girona": makeGuide({
    clubKey: "girona",
    clubName: "Girona",
    league: "La Liga",
    difficulty: "medium",
    summary: "Often doable with planning. Demand varies by opponent; act quickly for big games.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels first."],
    notes: ["Smaller capacity can make marquee fixtures tighter than expected."],
  }),

  "rayo-vallecano": makeGuide({
    clubKey: "rayo-vallecano",
    clubName: "Rayo Vallecano",
    league: "La Liga",
    difficulty: "hard",
    summary: "Smaller ground + Madrid demand means tickets can be tight. Buy immediately at release.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 55 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Avoid marketplaces for high-demand fixtures; stick to official channels."],
    notes: ["Availability can shift sharply depending on opponent and kickoff timing."],
  }),

  "alaves": makeGuide({
    clubKey: "alaves",
    clubName: "Alavés",
    league: "La Liga",
    difficulty: "easy",
    summary: "Often straightforward for many fixtures. Buy early for top opponents.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are usually enough."],
    notes: ["If you want specific seats, buy at release rather than late."],
  }),

  "elche": makeGuide({
    clubKey: "elche",
    clubName: "Elche",
    league: "La Liga",
    difficulty: "easy",
    summary: "Usually achievable. Plan ahead for top opponents and peak dates.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Demand rises for marquee opponents and local interest games."],
  }),

  "mallorca": makeGuide({
    clubKey: "mallorca",
    clubName: "Mallorca",
    league: "La Liga",
    difficulty: "easy",
    summary: "Often straightforward for many fixtures. Demand increases for big opponents and holiday periods.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels first."],
    notes: ["Holiday weekends can tighten availability more than expected."],
  }),

  "levante": makeGuide({
    clubKey: "levante",
    clubName: "Levante",
    league: "La Liga",
    difficulty: "easy",
    summary: "Typically achievable for many fixtures. Buy earlier for marquee games.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically enough."],
    notes: ["For big opponents, buy at release."],
  }),

  "real-oviedo": makeGuide({
    clubKey: "real-oviedo",
    clubName: "Real Oviedo",
    league: "La Liga",
    difficulty: "easy",
    summary: "Usually achievable with basic planning. Act earlier for top opponents.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 35 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Expect higher demand for marquee opponents and peak travel weekends."],
  }),
};

export default laLigaTicketGuides;
