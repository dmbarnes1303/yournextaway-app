// src/core/tripTypes.ts

export type Id = string;
export type TripId = string;
export type FixtureId = string;

/* -------------------------------------------------------------------------- */
/* Partner / outbound link types                                              */
/* -------------------------------------------------------------------------- */

export type Provider =
  | "aviasales"
  | "expedia"
  | "sportsevents365"
  | "footballticketnet"
  | "safetywing";

export type PartnerLinkOpenMode = "in_app_browser" | "external_browser";

export type PartnerLink = {
  id: string;
  provider: Provider;
  title: string;
  url: string;
  openMode: PartnerLinkOpenMode;
  campaign?: string;
  createdAt: number;
};

export type ISODate = string;

/* -------------------------------------------------------------------------- */
/* Trip                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Phase 1 canonical Trip model.
 *
 * Truth:
 * - A trip can contain 1+ matches.
 * - One match is the primary match for the trip.
 * - Primary-match snapshot fields are stored on the trip root on purpose so
 *   Trip Workspace and related screens remain readable and resilient offline.
 *
 * Guardrails:
 * - `matchIds` is the membership list for the trip.
 * - `fixtureIdPrimary` must refer to one of `matchIds` when both are present.
 * - snapshot fields are convenience/cache fields, not the source of truth for
 *   live fixture data.
 */
export type Trip = {
  /* ---------------------------------------------------------------------- */
  /* Core identity                                                           */
  /* ---------------------------------------------------------------------- */

  id: TripId;

  /**
   * Pragmatic destination key for Phase 1.
   * Usually derived from venue city at trip creation time.
   */
  cityId: string;

  /**
   * Optional alias kept for route/display compatibility.
   * In Phase 1 this will usually match `cityId`.
   */
  citySlug?: string;

  /**
   * Human-readable city captured at trip creation/update time.
   * Useful when `cityId` is sluggy or fixture enrichment later fails.
   */
  displayCity?: string;

  /** YYYY-MM-DD */
  startDate: string;

  /** YYYY-MM-DD */
  endDate: string;

  notes?: string;

  createdAt: number;
  updatedAt: number;

  /* ---------------------------------------------------------------------- */
  /* Match membership                                                        */
  /* ---------------------------------------------------------------------- */

  /**
   * API-Football fixture IDs stored as strings.
   * Phase 1 supports multi-match trips. Do not treat this as single-match only.
   */
  matchIds: FixtureId[];

  /**
   * The primary match controls the headline trip snapshot shown across the app.
   * This should usually be one of `matchIds`.
   */
  fixtureIdPrimary?: FixtureId;

  /* ---------------------------------------------------------------------- */
  /* Primary match snapshot (Phase 1 resilience)                             */
  /* ---------------------------------------------------------------------- */

  homeTeamId?: number;
  awayTeamId?: number;

  homeName?: string;
  awayName?: string;

  leagueId?: number;
  leagueName?: string;
  round?: string;

  /**
   * ISO datetime string, for example:
   * 2026-02-22T15:00:00+00:00
   *
   * Snapshot only. Live fixture data may override when available.
   */
  kickoffIso?: string;

  /**
   * Snapshot inference captured when the trip or primary match was saved/refreshed.
   * True means the kickoff time is unreliable, unconfirmed, or likely placeholder.
   */
  kickoffTbc?: boolean;

  venueName?: string;
  venueCity?: string;

  /* ---------------------------------------------------------------------- */
  /* Booking enrichment                                                      */
  /* ---------------------------------------------------------------------- */

  /**
   * Ticketing affiliate enrichment when a direct SportsEvents365 mapping is known.
   * This remains explicit because SE365 is the current Tier 1 monetised ticket path.
   */
  sportsevents365EventId?: number;

  /**
   * Preferred direct SportsEvents365 event URL when known.
   */
  sportsevents365EventUrl?: string;

  /**
   * Strategic / API-driven FootballTicketNet enrichment can be added later,
   * but should not be treated as equivalent monetised booking state right now.
   */
  footballticketnetEventId?: string;
  footballticketnetEventUrl?: string;
};

/* -------------------------------------------------------------------------- */
/* Wallet (manual entries only)                                               */
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

/**
 * Manual wallet/reference item.
 *
 * This is not the canonical booking/workflow entity.
 * Canonical trip-linked booking items live in SavedItem types/store.
 */
export type WalletItem = {
  id: Id;

  /**
   * Optional trip association.
   * If omitted, the item is effectively unassigned.
   */
  tripId?: Id;

  type: WalletItemType;

  title: string;
  subtitle?: string;

  /**
   * Used when `type === "text"`.
   */
  reference?: string;

  /**
   * Used when `type === "link"`.
   */
  sourceUrl?: string;

  category?: WalletCategory;

  createdAt: number;
  updatedAt: number;
};
