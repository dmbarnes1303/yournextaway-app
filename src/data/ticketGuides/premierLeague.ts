// src/data/ticketGuides/premierLeague.ts
// Premier League (20 teams) — HOME TICKETS ONLY guidance for neutral travellers.
// NOTE: Some clubs route ticketing via a separate ticketing subdomain/portal that can change.
// The URLs below are the usual official “tickets hub” entry points.

import type { TicketGuide, TicketDifficulty } from "./types";

type DaysRange = { min: number; max: number };

const EPL = "Premier League";

function n(s?: string) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

function guide(args: {
  clubName: string;
  officialTicketsUrl: string;
  difficulty: TicketDifficulty;
  membershipRequired: boolean;
  typicalReleaseDaysBefore?: DaysRange;
  ukCardUsuallyWorks?: boolean;
  touristFriendly?: boolean;
  summary: string;
  safetyNotes?: string[];
  notes?: string[];
  aliases?: string[];
}): TicketGuide & { aliases?: string[]; officialTicketsUrl?: string } {
  // We keep officialTicketsUrl on the object even if your shared TicketGuide type doesn’t include it yet.
  // It’s optional extra metadata that you can use later (or ignore safely).
  return {
    clubName: args.clubName,
    league: EPL,
    summary: args.summary,
    difficulty: args.difficulty,
    membershipRequired: args.membershipRequired,
    typicalReleaseDaysBefore: args.typicalReleaseDaysBefore,
    ukCardUsuallyWorks: args.ukCardUsuallyWorks ?? true,
    touristFriendly: args.touristFriendly ?? true,
    safetyNotes: args.safetyNotes ?? [
      "Only buy from official club channels or a trusted, regulated marketplace.",
      "Avoid ticket resellers that don’t show seat/section details and refund terms.",
      "Arrive early for security queues and entry checks.",
    ],
    notes: args.notes ?? [],
    // @ts-expect-error - optional metadata for your app (safe to keep; you can add to types later).
    officialTicketsUrl: args.officialTicketsUrl,
    // @ts-expect-error - optional metadata for matching aliases.
    aliases: args.aliases ?? [],
  };
}

export const PREMIER_LEAGUE_TICKET_GUIDES: (TicketGuide & { aliases?: string[]; officialTicketsUrl?: string })[] = [
  guide({
    clubName: "AFC Bournemouth",
    officialTicketsUrl: "https://www.afcb.co.uk/tickets",
    difficulty: "medium",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 28 },
    summary:
      "Home tickets are often obtainable for most fixtures. High-demand matches can sell quickly, but general sale is common.",
    notes: [
      "Create an account early so checkout is smoother on release day.",
      "For peak fixtures, expect limits per account and tighter sale windows.",
    ],
    aliases: ["bournemouth", "afc bournemouth"],
  }),

  guide({
    clubName: "Arsenal FC",
    officialTicketsUrl: "https://www.arsenal.com/tickets",
    difficulty: "very_hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 14, max: 45 },
    touristFriendly: false,
    summary:
      "One of the toughest tickets in the league. Most fixtures require membership access and still sell out fast.",
    notes: [
      "Assume membership is required for realistic access.",
      "If you’re travelling, plan the weekend first and treat the match as ‘bonus’ until secured.",
    ],
    aliases: ["arsenal"],
  }),

  guide({
    clubName: "Aston Villa",
    officialTicketsUrl: "https://www.avfc.co.uk/tickets",
    difficulty: "hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 10, max: 35 },
    summary:
      "Demand is strong. Many fixtures start with priority windows and may need membership for early access.",
    notes: [
      "Track on-sale dates and be ready at release time.",
      "Big six visits and derby-style fixtures are significantly harder.",
    ],
    aliases: ["aston villa", "villa"],
  }),

  guide({
    clubName: "Brentford FC",
    officialTicketsUrl: "https://www.brentfordfc.com/en/tickets",
    difficulty: "hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 10, max: 35 },
    summary:
      "Smaller capacity means demand spikes. Membership/priority access is common for desirable fixtures.",
    notes: [
      "For popular games, expect limited general sale or none at all.",
      "Have account/payment details saved to avoid checkout delays.",
    ],
    aliases: ["brentford"],
  }),

  guide({
    clubName: "Brighton & Hove Albion",
    officialTicketsUrl: "https://www.brightonandhovealbion.com/tickets",
    difficulty: "medium",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 28 },
    summary:
      "Generally achievable for many fixtures. High-demand matches may require earlier purchase and limited availability.",
    notes: [
      "Watch for staggered sale phases (priority → members → general).",
      "If you’re staying overnight, pick refundable hotel options until tickets are confirmed.",
    ],
    aliases: ["brighton", "brighton and hove albion", "brighton & hove albion"],
  }),

  guide({
    clubName: "Burnley FC",
    officialTicketsUrl: "https://www.burnleyfootballclub.com/tickets",
    difficulty: "medium",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 28 },
    summary:
      "Often workable for neutral travellers, with easier access than the biggest clubs except for marquee fixtures.",
    notes: [
      "Create an online account and monitor on-sale dates.",
      "Capacity constraints can make top fixtures tighter.",
    ],
    aliases: ["burnley"],
  }),

  guide({
    clubName: "Chelsea FC",
    officialTicketsUrl: "https://www.chelseafc.com/en/tickets",
    difficulty: "very_hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 14, max: 45 },
    touristFriendly: false,
    summary:
      "Extremely high demand. Membership and loyalty-style access are common, with limited general sale.",
    notes: [
      "Avoid unofficial sellers; counterfeit/touting is a known issue around big clubs.",
      "Expect strict limits and rapid sell-outs on release.",
    ],
    aliases: ["chelsea"],
  }),

  guide({
    clubName: "Crystal Palace",
    officialTicketsUrl: "https://www.cpfc.co.uk/tickets",
    difficulty: "medium",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 28 },
    summary:
      "Many fixtures are obtainable. Some high-profile matches may be restricted or sell faster.",
    notes: [
      "Check sale phases; some games may prioritise members before general sale.",
      "Arrive early if travelling across London — transport delays are common.",
    ],
    aliases: ["crystal palace", "palace"],
  }),

  guide({
    clubName: "Everton FC",
    officialTicketsUrl: "https://www.evertonfc.com/tickets",
    difficulty: "medium",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 28 },
    summary:
      "Often accessible for a wide range of fixtures, though demand increases for big opponents and late-season matches.",
    notes: [
      "Watch for ID/account limits on high-demand fixtures.",
      "If you’re visiting Liverpool for a weekend, book flexible transport in case kickoff time shifts.",
    ],
    aliases: ["everton"],
  }),

  guide({
    clubName: "Fulham FC",
    officialTicketsUrl: "https://www.fulhamfc.com/tickets",
    difficulty: "hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 10, max: 35 },
    summary:
      "Craven Cottage demand can be strong due to smaller capacity. Membership access is often useful for good fixtures.",
    notes: [
      "Expect higher difficulty for big clubs and London matchups.",
      "If general sale appears, it can still move quickly.",
    ],
    aliases: ["fulham"],
  }),

  guide({
    clubName: "Leeds United",
    officialTicketsUrl: "https://www.leedsunited.com/tickets",
    difficulty: "very_hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 14, max: 45 },
    touristFriendly: false,
    summary:
      "Very high demand relative to capacity. Membership/priority access is typically needed for a realistic chance.",
    notes: [
      "Assume limited/no general sale for popular fixtures.",
      "Plan travel flexibility; secure tickets before locking non-refundable bookings.",
    ],
    aliases: ["leeds", "leeds united"],
  }),

  guide({
    clubName: "Liverpool FC",
    officialTicketsUrl: "https://www.liverpoolfc.com/tickets",
    difficulty: "very_hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 14, max: 60 },
    touristFriendly: false,
    summary:
      "One of the hardest tickets in England. Expect membership-based access and very limited general sale.",
    notes: [
      "Ticket drops can be unpredictable; set reminders for sale phases.",
      "Use only official channels; scams are common around major clubs.",
    ],
    aliases: ["lิเวอร์พูล", "liverpool"],
  }),

  guide({
    clubName: "Manchester City",
    officialTicketsUrl: "https://www.mancity.com/tickets",
    difficulty: "hard",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 35 },
    summary:
      "Often achievable for many fixtures, but top opponents and late-season games become much harder.",
    notes: [
      "Check whether a fixture is in general sale or requires membership for earlier access.",
      "If kickoff is TBC, avoid tight same-day travel plans.",
    ],
    aliases: ["manchester city", "man city", "mancity"],
  }),

  guide({
    clubName: "Manchester United",
    officialTicketsUrl: "https://tickets.manutd.com/",
    difficulty: "very_hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 14, max: 60 },
    touristFriendly: false,
    summary:
      "Huge global demand. Membership access and limited availability are the norm for most fixtures.",
    notes: [
      "Treat ‘general sale’ as rare for bigger matches.",
      "Avoid unofficial sellers that can’t guarantee entry/refunds.",
    ],
    aliases: ["manchester united", "man united", "man utd", "muFC"],
  }),

  guide({
    clubName: "Newcastle United",
    officialTicketsUrl: "https://book.nufc.co.uk/",
    difficulty: "very_hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 14, max: 45 },
    touristFriendly: false,
    summary:
      "Demand is extremely high. Membership/priority access is often essential, with rapid sell-outs for big fixtures.",
    notes: [
      "Expect very limited general sale availability.",
      "If travelling far, keep hotel/transport flexible until tickets are secured.",
    ],
    aliases: ["newcastle", "newcastle united", "nufc"],
  }),

  guide({
    clubName: "Nottingham Forest",
    officialTicketsUrl: "https://tickets.nottinghamforest.co.uk/",
    difficulty: "hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 10, max: 35 },
    summary:
      "Smaller capacity and strong demand make many fixtures competitive. Membership is often useful.",
    notes: [
      "Check sale phases; big fixtures may not reach general sale.",
      "Have your account ready before release times.",
    ],
    aliases: ["nottingham forest", "forest"],
  }),

  guide({
    clubName: "Sunderland AFC",
    officialTicketsUrl: "https://safc.com/tickets",
    difficulty: "hard",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 10, max: 35 },
    summary:
      "Strong fanbase and demand can be high. Many fixtures are doable, but big games can tighten quickly.",
    notes: [
      "If you see a ticketing portal redirect, that’s normal — still official.",
      "For marquee fixtures, buy as early as possible.",
    ],
    aliases: ["sunderland", "sunderland afc"],
  }),

  guide({
    clubName: "Tottenham Hotspur",
    officialTicketsUrl: "https://www.tottenhamhotspur.com/tickets/",
    difficulty: "very_hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 14, max: 45 },
    touristFriendly: false,
    summary:
      "High demand, especially for derbies and big opponents. Membership access is commonly needed.",
    notes: [
      "Expect strict purchase limits and fast sell-outs on on-sale times.",
      "If kickoff is TBC, plan your day around flexibility (late/early kickoff shifts).",
    ],
    aliases: ["tottenham", "tottenham hotspur", "spurs"],
  }),

  guide({
    clubName: "West Ham United",
    officialTicketsUrl: "https://www.whufc.com/tickets",
    difficulty: "hard",
    membershipRequired: true,
    typicalReleaseDaysBefore: { min: 10, max: 35 },
    summary:
      "Demand can be high, especially for London matchups and big clubs. Membership often improves access.",
    notes: [
      "Some fixtures have priority phases; don’t assume general sale.",
      "London travel times can be deceptive — leave margin for delays.",
    ],
    aliases: ["west ham", "west ham united", "whuFC"],
  }),

  guide({
    clubName: "Wolverhampton Wanderers",
    officialTicketsUrl: "https://ticketswolves.co.uk/",
    difficulty: "medium",
    membershipRequired: false,
    typicalReleaseDaysBefore: { min: 7, max: 28 },
    summary:
      "Generally obtainable for many fixtures, with increased demand for big opponents and late-season games.",
    notes: [
      "If you’re driving, check parking/road closures near kickoff.",
      "Buy earlier for big matches to avoid limited seating choice.",
    ],
    aliases: ["wolves", "wolverhampton", "wolverhampton wanderers"],
  }),
];

const GUIDE_BY_KEY = new Map<string, TicketGuide & { aliases?: string[]; officialTicketsUrl?: string }>();

for (const g of PREMIER_LEAGUE_TICKET_GUIDES) {
  const keys = new Set<string>();
  keys.add(n(g.clubName));
  for (const a of (g as any).aliases ?? []) keys.add(n(a));
  for (const k of keys) GUIDE_BY_KEY.set(k, g);
}

/**
 * Premier League home-ticket guide lookup.
 * Match screen calls getTicketGuide(homeTeamName).
 */
export function getPremierLeagueTicketGuide(teamName?: string) {
  const key = n(teamName);
  if (!key) return null;

  if (GUIDE_BY_KEY.has(key)) return GUIDE_BY_KEY.get(key)!;

  // Loose contains matching (handles “Brighton & Hove Albion” vs “Brighton and Hove Albion” etc.)
  for (const [k, g] of GUIDE_BY_KEY.entries()) {
    if (key === k) return g;
    if (key.includes(k) || k.includes(key)) return g;
  }

  return null;
    }
