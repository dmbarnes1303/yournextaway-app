// src/data/teamGuides/types.ts

/**
 * V1-safe Team Guide schema.
 *
 * Goals:
 * - Works with an empty registry (no crashes).
 * - Leaves room for V2 depth without breaking types.
 * - Keeps content neutral-traveller focused (no “away end” framing).
 */

export type TeamGuideSection = {
  title: string;
  body: string;
};

export type TeamGuideLink = {
  label: string;
  url: string;
};

export type TeamGuide = {
  /**
   * Stable key used in the teamGuides registry.
   * Example: "arsenal", "real-madrid"
   */
  teamKey: string;

  /** Display name */
  name: string;

  /**
   * Stable city key used in /city/[cityKey] and city guides registry.
   * Example: "london", "munich"
   *
   * Strongly preferred for cross-linking.
   */
  cityKey?: string;

  /** Optional metadata (display-focused) */
  city?: string;
  country?: string;
  stadium?: string;

  /**
   * V1 sections: flexible, easy to render, and future-proof.
   * Keep this neutral: travel, logistics, tickets, matchday timing, transport, food areas.
   */
  sections: TeamGuideSection[];

  /**
   * Optional helpful links (official site, tickets, stadium info, transport, etc.)
   * Keep URLs as plain strings; affiliate/deep links can come in V2.
   */
  links?: TeamGuideLink[];

  /** Optional last updated marker */
  updatedAt?: string; // ISO date string
};

export default TeamGuide;
