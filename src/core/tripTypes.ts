// src/core/tripTypes.ts

import type { TripID } from "./id";

/**
 * Bible-locked:
 * Trip is a container only.
 * It stores metadata + matchIds + notes.
 * It NEVER stores partner results, prices, or booking URLs.
 */
export type Trip = {
  id: TripID;

  cityId: string; // existing behavior in your app
  citySlug?: string;

  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD

  matchIds: string[]; // API-Football fixture ids as strings

  notes?: string;

  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
};
