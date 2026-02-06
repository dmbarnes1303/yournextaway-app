// src/core/savedItemTypes.ts

export type TripId = string;
export type SavedItemId = string;

/**
 * IMPORTANT: These are STORAGE KEYS.
 * Do NOT rename these union values once you have real users/data.
 * If you want different wording in the UI, use the label helpers below.
 */
export type SavedItemType =
  | "tickets"   // UI: Match tickets
  | "hotel"     // UI: Stay
  | "flight"    // UI: Flights
  | "train"     // UI: Trains & buses
  | "transfer"  // UI: Transfers
  | "things"    // UI: Experiences
  | "insurance" // UI: Protect yourself
  | "claim"     // UI: Protect yourself (claims/comp)
  | "note"      // UI: Notes
  | "other";    // UI: Notes

export type SavedItemStatus = "saved" | "pending" | "booked" | "archived";

export type SavedItem = {
  id: SavedItemId;
  tripId: TripId;

  type: SavedItemType;
  status: SavedItemStatus;

  title: string;

  /** Which partner created this item (expedia/aviasales/gyg/etc) */
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

/* -------------------------------------------------------------------------- */
/* UI wording helpers (safe, because they don't change stored keys) */
/* -------------------------------------------------------------------------- */

export function getSavedItemTypeLabel(type: SavedItemType): string {
  switch (type) {
    case "tickets":
      return "Match tickets";
    case "hotel":
      return "Stay";
    case "flight":
      return "Flights";
    case "train":
      return "Trains & buses";
    case "transfer":
      return "Transfers";
    case "things":
      return "Experiences";
    case "insurance":
      return "Travel insurance";
    case "claim":
      return "Claims & compensation";
    case "note":
    case "other":
      return "Notes";
    default:
      return "Notes";
  }
}

/**
 * Higher-level grouping label used for Wallet sections.
 * (This is what you were asking for: “Tickets should be Match Tickets”, etc.)
 */
export function getSavedItemTypeGroup(
  type: SavedItemType
):
  | "Match Tickets"
  | "Stay"
  | "Flights"
  | "Trains & buses"
  | "Transfers"
  | "Experiences"
  | "Protect yourself"
  | "Notes" {
  switch (type) {
    case "tickets":
      return "Match Tickets";
    case "hotel":
      return "Stay";
    case "flight":
      return "Flights";
    case "train":
      return "Trains & buses";
    case "transfer":
      return "Transfers";
    case "things":
      return "Experiences";
    case "insurance":
    case "claim":
      return "Protect yourself";
    case "note":
    case "other":
    default:
      return "Notes";
  }
}

/* -------------------------------------------------------------------------- */
/* status transitions */
/* -------------------------------------------------------------------------- */

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
