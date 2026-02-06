// src/core/tripTypes.ts

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
