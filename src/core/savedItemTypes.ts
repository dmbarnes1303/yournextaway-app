// src/core/savedItemTypes.ts

export type TripId = string;
export type SavedItemId = string;

export type SavedItemType =
  | "tickets"
  | "hotel"
  | "flight"
  | "train"
  | "transfer"
  | "things"
  | "insurance"
  | "claim"
  | "note"
  | "other";

export type SavedItemStatus = "saved" | "pending" | "booked" | "archived";

export type SavedItem = {
  id: SavedItemId;
  tripId: TripId;

  type: SavedItemType;
  status: SavedItemStatus;

  title: string;

  /** Which partner created this item (booking/skyscanner/omio/gyg/etc) */
  partnerId?: string;

  /** Deep link / affiliate URL that user clicked */
  partnerUrl?: string;

  /**
   * Price display policy: show exact price when known, otherwise "View live price".
   * Store whatever we have here; UI decides presentation.
   */
  priceText?: string;
  currency?: string;

  metadata?: Record<string, any>;

  createdAt: number;
  updatedAt: number;
};

const TRANSITIONS: Record<SavedItemStatus, SavedItemStatus[]> = {
  saved: ["pending", "archived"],
  pending: ["booked", "archived"],
  booked: ["archived"],
  archived: ["saved"],
};

export function canTransition(from: SavedItemStatus, to: SavedItemStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function assertTransition(from: SavedItemStatus, to: SavedItemStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} → ${to}`);
  }
}
