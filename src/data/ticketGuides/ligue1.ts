// src/data/ticketGuides/ligue1.ts
import type { TicketGuide } from "./types";

/**
 * Ligue 1 (2025/26) — 18 teams
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

const ligue1TicketGuides: Record<string, TicketGuide> = {
  "paris-saint-germain": makeGuide({
    clubKey: "paris-saint-germain",
    clubName: "Paris Saint-Germain",
    league: "Ligue 1",
    difficulty: "very_hard",
    summary: "Huge demand, especially for big fixtures. Buy at release; priority windows can matter.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 14, max: 80 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "official_app", "hospitality"],
    safetyNotes: ["Avoid random resale. If sold out, hospitality/authorized routes are the safer option."],
    notes: ["Expect rapid sell-outs for marquee fixtures and prime dates."],
  }),

  "marseille": makeGuide({
    clubKey: "marseille",
    clubName: "Marseille",
    league: "Ligue 1",
    difficulty: "hard",
    summary: "Strong demand and atmosphere. Many fixtures sell quickly—buy at release for top games.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 70 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
    safetyNotes: ["Use official channels; avoid open marketplaces."],
    notes: ["Demand spikes for big opponents and peak weekends."],
  }),

  "lyon": makeGuide({
    clubKey: "lyon",
    clubName: "Lyon",
    league: "Ligue 1",
    difficulty: "medium",
    summary: "Often achievable with planning. Big fixtures and weekends sell faster.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
    safetyNotes: ["Official channels are usually sufficient."],
    notes: ["If your trip dates are fixed, buy at release for certainty."],
  }),

  "monaco": makeGuide({
    clubKey: "monaco",
    clubName: "Monaco",
    league: "Ligue 1",
    difficulty: "easy",
    summary: "Often straightforward for many fixtures. Buy early for marquee games and peak dates.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Availability can tighten for marquee opponents."],
  }),

  "lille": makeGuide({
    clubKey: "lille",
    clubName: "Lille",
    league: "Ligue 1",
    difficulty: "medium",
    summary: "Often achievable with planning. Big opponents sell faster—buy early.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
    safetyNotes: ["Stick to official channels."],
    notes: ["Demand rises for big fixtures and prime weekends."],
  }),

  "nice": makeGuide({
    clubKey: "nice",
    clubName: "Nice",
    league: "Ligue 1",
    difficulty: "medium",
    summary: "Usually doable with planning. Demand rises for big fixtures and peak weekends.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app"],
    safetyNotes: ["Official channels are usually sufficient."],
    notes: ["Buy at release if you want specific seats."],
  }),

  "rennes": makeGuide({
    clubKey: "rennes",
    clubName: "Rennes",
    league: "Ligue 1",
    difficulty: "medium",
    summary: "Often achievable. Buy early for top opponents and peak dates.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app"],
    safetyNotes: ["Stick to official channels."],
    notes: ["If travelling on a fixed weekend, don’t leave purchase late."],
  }),

  "lens": makeGuide({
    clubKey: "lens",
    clubName: "Lens",
    league: "Ligue 1",
    difficulty: "hard",
    summary: "Strong local demand. Many fixtures can be tough—buy immediately at release.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 70 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
    safetyNotes: ["Avoid open marketplaces; if sold out, use hospitality/authorized routes only."],
    notes: ["Marquee fixtures and prime dates can disappear quickly."],
  }),

  "strasbourg": makeGuide({
    clubKey: "strasbourg",
    clubName: "Strasbourg",
    league: "Ligue 1",
    difficulty: "medium",
    summary: "Often achievable with planning. Demand rises for bigger fixtures.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 55 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app"],
    safetyNotes: ["Official channels are usually sufficient."],
    notes: ["Buy early for big opponents and key weekends."],
  }),

  "toulouse": makeGuide({
    clubKey: "toulouse",
    clubName: "Toulouse",
    league: "Ligue 1",
    difficulty: "easy",
    summary: "Usually straightforward for many fixtures. Buy earlier for top opponents and peak dates.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["If you want specific seats, buy at release."],
  }),

  "nantes": makeGuide({
    clubKey: "nantes",
    clubName: "Nantes",
    league: "Ligue 1",
    difficulty: "easy",
    summary: "Often achievable with basic planning. Bigger fixtures sell faster.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Demand rises for marquee opponents and prime weekends."],
  }),

  "brest": makeGuide({
    clubKey: "brest",
    clubName: "Brest",
    league: "Ligue 1",
    difficulty: "easy",
    summary: "Usually straightforward. Plan earlier for big opponents and peak dates.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Buy at release if your travel dates are fixed."],
  }),

  "lorient": makeGuide({
    clubKey: "lorient",
    clubName: "Lorient",
    league: "Ligue 1",
    difficulty: "easy",
    summary: "Often achievable. Buy early for marquee fixtures and peak weekends.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Demand can spike for big opponents."],
  }),

  "metz": makeGuide({
    clubKey: "metz",
    clubName: "Metz",
    league: "Ligue 1",
    difficulty: "easy",
    summary: "Usually achievable with basic planning. Bigger opponents sell faster—plan ahead.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["If you’re travelling on fixed dates, buy at release."],
  }),

  "angers": makeGuide({
    clubKey: "angers",
    clubName: "Angers",
    league: "Ligue 1",
    difficulty: "easy",
    summary: "Often straightforward for many fixtures. Plan earlier for big opponents and peak dates.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 40 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Demand rises for marquee opponents."],
  }),

  "auxerre": makeGuide({
    clubKey: "auxerre",
    clubName: "Auxerre",
    league: "Ligue 1",
    difficulty: "easy",
    summary: "Generally achievable. Demand rises for top opponents and key dates—buy early if travelling.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 40 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["Buy at release for high-profile fixtures."],
  }),

  "le-havre": makeGuide({
    clubKey: "le-havre",
    clubName: "Le Havre",
    league: "Ligue 1",
    difficulty: "easy",
    summary: "Often straightforward. Buy earlier for marquee fixtures and peak weekends.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 40 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "box_office"],
    safetyNotes: ["Official channels are typically sufficient."],
    notes: ["If your trip dates are fixed, buy at release for certainty."],
  }),

  "paris-fc": makeGuide({
    clubKey: "paris-fc",
    clubName: "Paris FC",
    league: "Ligue 1",
    difficulty: "medium",
    summary: "Paris demand can spike. Many fixtures are doable, but big games can sell faster than you expect.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 55 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app"],
    safetyNotes: ["Stick to official channels; avoid open marketplaces."],
    notes: ["Buy early for high-profile opponents."],
  }),
};

export default ligue1TicketGuides;
