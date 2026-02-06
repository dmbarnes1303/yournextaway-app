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

  /** Which partner created this item (expedia/aviasales/etc) */
  partnerId?: string;

  /** Deep link / affiliate URL that user clicked */
  partnerUrl?: string;

  /**
   * Price display policy:
   * - show exact price when known
   * - otherwise show "View live price"
   * Store whatever we have; UI decides presentation.
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

/* -------------------------------------------------------------------------- */
/* User-facing labels (Phase 1) */
/* -------------------------------------------------------------------------- */

/**
 * These are the EXACT bucket words you want in the UI.
 * Keep this as the single source of truth for display copy.
 */
export function getSavedItemTypeLabel(type: SavedItemType): string {
  switch (type) {
    case "tickets":
      return "Match tickets";
    case "things":
      return "Experiences";
    case "insurance":
    case "claim":
      return "Protect yourself";
    case "note":
    case "other":
      return "Notes";

    // Supporting buckets (still useful in Wallet)
    case "hotel":
      return "Stay";
    case "flight":
      return "Flights";
    case "train":
      return "Trains";
    case "transfer":
      return "Transfers";
    default:
      return "Notes";
  }
}

/**
 * Group key for consistent ordering + grouping.
 */
export type SavedItemGroupKey =
  | "match_tickets"
  | "stay"
  | "flights"
  | "trains"
  | "transfers"
  | "experiences"
  | "protect"
  | "notes";

export function getSavedItemGroupKey(type: SavedItemType): SavedItemGroupKey {
  switch (type) {
    case "tickets":
      return "match_tickets";
    case "hotel":
      return "stay";
    case "flight":
      return "flights";
    case "train":
      return "trains";
    case "transfer":
      return "transfers";
    case "things":
      return "experiences";
    case "insurance":
    case "claim":
      return "protect";
    case "note":
    case "other":
    default:
      return "notes";
  }
}

export function getSavedItemGroupTitle(key: SavedItemGroupKey): string {
  switch (key) {
    case "match_tickets":
      return "Match tickets";
    case "stay":
      return "Stay";
    case "flights":
      return "Flights";
    case "trains":
      return "Trains & buses";
    case "transfers":
      return "Transfers";
    case "experiences":
      return "Experiences";
    case "protect":
      return "Protect yourself";
    case "notes":
      return "Notes";
  }
}

export function groupOrder(key: SavedItemGroupKey): number {
  switch (key) {
    case "match_tickets":
      return 0;
    case "stay":
      return 1;
    case "flights":
      return 2;
    case "trains":
      return 3;
    case "transfers":
      return 4;
    case "experiences":
      return 5;
    case "protect":
      return 6;
    case "notes":
      return 7;
    default:
      return 99;
  }
}
