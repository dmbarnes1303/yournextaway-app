// src/data/teams/types.ts

export type TeamRecord = {
  /** Stable lookup key, e.g. "arsenal", "real-madrid" */
  teamKey: string;

  /** Optional API-Football team id */
  teamId?: number;

  /** Display name */
  name: string;

  /** Country display name */
  country?: string;

  /** City display name */
  city?: string;

  /** Optional stable city key for guide linking */
  cityKey?: string;

  /** API-Football league id */
  leagueId?: number;

  /** Season context if stored locally */
  season?: number;

  /** Stadium registry key */
  stadiumKey?: string;

  /** Foundation year */
  founded?: number;

  /** Club colours */
  clubColors?: string[];

  /** Search aliases */
  aliases?: string[];
};

/**
 * Canonical team registry shape.
 * Key must match `teamKey`.
 */
export type TeamRegistry = Record<string, TeamRecord>;

export default TeamRecord;
