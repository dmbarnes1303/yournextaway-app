// src/data/ticketGuides/premierLeague.ts

import type { TicketGuide } from "./types";

/**
 * Premier League starter pack.
 * These are “directionally correct” rules-of-thumb intended for Phase 1 UX.
 * You can tighten per-club specifics as you gather verified info.
 */
const premierLeagueTicketGuides: Record<string, TicketGuide> = {
  "arsenal": {
    clubKey: "arsenal",
    clubName: "Arsenal",
    league: "Premier League",
    difficulty: "very_hard",
    summary: "High demand. Membership often needed; general sale for big games is rare.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 21, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "hospitality"],
    safetyNotes: [
      "Avoid random resellers. If you can’t buy officially, prefer hospitality or clearly authorized sellers.",
    ],
    notes: [
      "Expect digital tickets and account-based delivery.",
      "Big fixtures can sell out at member sale stage.",
    ],
  },

  "aston-villa": {
    clubKey: "aston-villa",
    clubName: "Aston Villa",
    league: "Premier League",
    difficulty: "hard",
    summary: "Many matches are doable, but big fixtures can require priority access.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
    safetyNotes: ["Prefer official channels. If sold out, hospitality is the clean fallback."],
  },

  "brighton": {
    clubKey: "brighton",
    clubName: "Brighton & Hove Albion",
    league: "Premier League",
    difficulty: "medium",
    summary: "Often achievable with planning; tougher for top opponents.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
  },

  "chelsea": {
    clubKey: "chelsea",
    clubName: "Chelsea",
    league: "Premier League",
    difficulty: "very_hard",
    summary: "High demand. Membership strongly recommended; general sale is uncommon.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 21, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "hospitality"],
    safetyNotes: [
      "If you miss member windows, don’t gamble on sketchy resale—use hospitality or verified/authorized routes only.",
    ],
  },

  "crystal-palace": {
    clubKey: "crystal-palace",
    clubName: "Crystal Palace",
    league: "Premier League",
    difficulty: "medium",
    summary: "Many fixtures are manageable. Bigger matches can tighten quickly.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
  },

  "everton": {
    clubKey: "everton",
    clubName: "Everton",
    league: "Premier League",
    difficulty: "medium",
    summary: "Often achievable if you buy when sales open; big fixtures are harder.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
  },

  "liverpool": {
    clubKey: "liverpool",
    clubName: "Liverpool",
    league: "Premier League",
    difficulty: "very_hard",
    summary: "Extremely competitive. Membership / account priority is typically required.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 30, max: 90 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "hospitality"],
    safetyNotes: ["If you can’t access official/member routes, hospitality is the safe fallback."],
    notes: ["Expect strict account rules and limited general sale availability."],
  },

  "manchester-city": {
    clubKey: "manchester-city",
    clubName: "Manchester City",
    league: "Premier League",
    difficulty: "hard",
    summary: "Often doable for many fixtures; very big games become difficult fast.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 21, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
  },

  "manchester-united": {
    clubKey: "manchester-united",
    clubName: "Manchester United",
    league: "Premier League",
    difficulty: "very_hard",
    summary: "High demand. Membership/priority access usually needed; big fixtures sell fast.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 30, max: 90 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "hospitality"],
    safetyNotes: ["Avoid dodgy marketplaces. If you can’t buy officially, use hospitality/authorized routes only."],
  },

  "newcastle-united": {
    clubKey: "newcastle-united",
    clubName: "Newcastle United",
    league: "Premier League",
    difficulty: "hard",
    summary: "Demand is strong. Many matches are tough without priority access.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 21, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
  },

  "tottenham-hotspur": {
    clubKey: "tottenham-hotspur",
    clubName: "Tottenham Hotspur",
    league: "Premier League",
    difficulty: "very_hard",
    summary: "High demand. Membership strongly recommended; general sale for big games is limited.",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 21, max: 60 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["membership_portal", "official_site", "official_app", "hospitality"],
  },

  "west-ham-united": {
    clubKey: "west-ham-united",
    clubName: "West Ham United",
    league: "Premier League",
    difficulty: "hard",
    summary: "Often possible with planning; bigger matches can require priority access.",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 14, max: 45 },
    ukCardUsuallyWorks: true,
    touristFriendly: true,
    methods: ["official_site", "official_app", "hospitality"],
  },
};

export default premierLeagueTicketGuides;
