// src/data/ticketGuides/types.ts

export type TicketDifficulty = "easy" | "medium" | "hard" | "very_hard";

export type TicketPurchaseMethod =
  | "official_site"
  | "official_app"
  | "membership_portal"
  | "box_office"
  | "authorized_reseller"
  | "hospitality"
  | "marketplace_risk";

/**
 * Ticket intelligence for a club/team.
 * Keep it factual and user-first. No “away end” content.
 */
export type TicketGuide = {
  /** Normalized key (e.g. "arsenal", "manchester-united") */
  clubKey: string;

  /** Display name */
  clubName: string;

  /** League label purely for grouping */
  league: string;

  /**
   * Overall difficulty for a typical traveller trying to buy a standard ticket.
   * (Not hospitality.)
   */
  difficulty: TicketDifficulty;

  /**
   * Short, blunt summary users actually care about.
   * Example: “Membership strongly recommended; general sale rare for big games.”
   */
  summary: string;

  /** Whether a membership is commonly required to access sales for most fixtures */
  membershipRequired?: boolean;

  /**
   * How far before kickoff tickets typically appear (range).
   * Use this as an “expectation setter”, not a promise.
   */
  typicalReleaseDaysBefore?: { min: number; max: number };

  /**
   * Whether UK cards commonly work (Phase 1: user asked this explicitly).
   * If unknown, omit.
   */
  ukCardUsuallyWorks?: boolean;

  /**
   * Whether non-residents / tourists are commonly able to buy without residence checks.
   * If unknown, omit.
   */
  touristFriendly?: boolean;

  /** Main method(s) users should try first */
  methods: TicketPurchaseMethod[];

  /**
   * Safety guidance: keep this strict.
   * “authorized_reseller” is okay; “marketplace_risk” means warn hard.
   */
  safetyNotes?: string[];

  /**
   * Extra bullet notes: membership tiers, ID checks, pickup rules, etc.
   */
  notes?: string[];
};
