// src/core/savedItemTypes.ts

import type { PartnerID, SavedItemID, TripID } from "./id";

export type SavedItemType =
  | "ticket"
  | "hotel"
  | "flight"
  | "train"
  | "transfer"
  | "experience"
  | "insurance"
  | "claim"
  | "note";

export type SavedItemStatus = "saved" | "pending" | "booked" | "cancelled";

/**
 * Bible-locked rules:
 * - Atomic unit across all categories
 * - No totals, no conversions
 * - Prices are display text only (or "View live price")
 * - Status machine is strict (no booked->saved etc.)
 */
export type SavedItem = {
  id: SavedItemID;
  tripId: TripID;

  type: SavedItemType;
  status: SavedItemStatus;

  title: string;

  partnerId?: PartnerID; // optional for Notes/Claims etc
  partnerUrl?: string; // what the user opened/booked from

  priceText?: string; // "£123" | "€45" | "View live price"
  currency?: string; // optional; can be inferred later if you want

  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms

  /**
   * Catch-all for partner-specific details you might need later:
   * confirmation refs, flight numbers, hotel address, etc.
   * Must remain backward compatible.
   */
  metadata?: Record<string, any>;
};

export function canTransition(from: SavedItemStatus, to: SavedItemStatus): boolean {
  if (from === to) return true;

  // Allowed:
  // saved -> pending
  // pending -> booked
  // pending -> cancelled
  // saved -> cancelled
  if (from === "saved" && (to === "pending" || to === "cancelled")) return true;
  if (from === "pending" && (to === "booked" || to === "cancelled")) return true;

  return false;
}

export function assertTransition(from: SavedItemStatus, to: SavedItemStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} -> ${to}`);
  }
}
