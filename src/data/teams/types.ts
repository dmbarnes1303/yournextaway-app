// src/data/teams/types.ts

export type TeamRecord = {
  /** Stable key used in routes and lookups (e.g. "arsenal", "real-madrid") */
  teamKey: string;

  /** API-Football team id (optional) */
  teamId?: number;

  /** Display name */
  name: string;

  /** Country */
  country?: string;

  /** City */
  city?: string;

  /** League ID (API-Football league id) */
  leagueId?: number;

  /** Season context */
  season?: number;

  /** Stadium registry key */
  stadiumKey?: string;

  /** Club foundation year */
  founded?: number;

  /** Primary club colours */
  clubColors?: string[];

  /** Search aliases */
  aliases?: string[];
};
