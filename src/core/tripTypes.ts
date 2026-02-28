// src/core/tripTypes.ts

export type Id = string;
export type TripId = string;

/**
 * Trip
 * Phase 1: "trip workspace" anchored around 1+ fixtures, with pragmatic cityId.
 *
 * IMPORTANT:
 * - We store snapshot fields to keep the UI readable offline and resilient
 *   if API responses change or fixture lookups fail.
 * - All snapshot fields are optional and may be stale; live API data can override.
 */
export type Trip = {
  id: TripId;

  /**
   * For Phase 1 we keep this pragmatic: the "destination" identifier
   * derived from venue city. Later: normalize to city registry IDs.
   */
  cityId: string;
  citySlug?: string;

  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;

  /**
   * Match IDs (API-Football fixture IDs stored as strings)
   * Phase 1: one fixture per trip, but keep as array for future.
   */
  matchIds: string[];

  notes?: string;

  /* ---------------------------------------------------------------------- */
  /* Snapshot fields (Phase 1 resilience)                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Human display city captured at trip creation time.
   * Useful when cityId is a slug or when fixture enrichment fails.
   */
  displayCity?: string;

  /**
   * Primary fixture snapshot (first/selected match).
   * These let Trip screens show real names even when offline.
   */
  fixtureIdPrimary?: string; // convenience (often matchIds[0])

  homeTeamId?: number;
  awayTeamId?: number;

  homeName?: string;
  awayName?: string;

  leagueId?: number;
  leagueName?: string;
  round?: string;

  /**
   * ISO string e.g. 2026-02-22T15:00:00+00:00
   * This is a snapshot; live fixture can override.
   */
  kickoffIso?: string;

  /**
   * Snapshot inference at time of save (or last refresh).
   * True means kickoff time not reliable / likely placeholder.
   */
  kickoffTbc?: boolean;

  venueName?: string;
  venueCity?: string;

  /**
   * Ticketing affiliate deep-link enrichment if known.
   * If missing, match screen falls back to SE365 search.
   */
  sportsevents365EventId?: number;

  /**
   * Snapshot of the best-known SE365 URL for this match (tickets/event/search).
   * Used to open the exact game page when available.
   */
  sportsevents365EventUrl?: string;

  createdAt: number;
  updatedAt: number;
};

/* -------------------------------------------------------------------------- */
/* Wallet (manual entries) - Phase 1 */
/* -------------------------------------------------------------------------- */

export type WalletCategory =
  | "tickets"
  | "stay"
  | "flight"
  | "train"
  | "transfer"
  | "things"
  | "insurance"
  | "claim"
  | "other";

export type WalletItemType = "text" | "link";

export type WalletItem = {
  id: Id;

  /**
   * Optional: if set, item appears under that Trip in Wallet.
   * If missing, it’s “Unassigned”.
   */
  tripId?: Id;

  type: WalletItemType;

  title: string;
  subtitle?: string;

  /**
   * For "text" items we use `reference` as the stored content.
   */
  reference?: string;

  /**
   * For "link" items we use `sourceUrl`.
   */
  sourceUrl?: string;

  category?: WalletCategory;

  createdAt: number;
  updatedAt: number;
};
