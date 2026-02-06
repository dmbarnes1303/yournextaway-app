// src/core/tripTypes.ts

export type Id = string;
export type TripId = string;

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
