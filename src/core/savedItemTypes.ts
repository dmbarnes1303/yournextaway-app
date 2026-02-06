// src/core/savedItemTypes.ts

export type TripId = string;
export type SavedItemId = string;

/**
 * Internal enum (stable). UI labels come from getSavedItemTypeLabel().
 */
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

  /** Which partner created this item (expedia/aviasales/gyg/etc) */
  partnerId?: string;

  /** Deep link / affiliate URL that user clicked */
  partnerUrl?: string;

  /**
   * Price display policy:
   * - show exact price when known
   * - otherwise show "View live price"
   */
  priceText?: string;
  currency?: string;

  metadata?: Record<string, any>;

  createdAt: number;
  updatedAt: number;
};

/**
 * Display labels (what users see).
 *
 * Your requested wording:
 * - tickets => Match tickets
 * - things  => Experiences
 * - insurance => Protect yourself
 * - claim => Claims & compensation (NOT "Protect yourself" — that's insurance)
 * - note/other => Notes
 */
export function getSavedItemTypeLabel(type: SavedItemType): string {
  switch (type) {
    case "tickets":
      return "Match tickets";
    case "things":
      return "Experiences";
    case "claim":
      return "Claims & compensation";
    case "insurance":
      return "Protect yourself";
    case "note":
    case "other":
      return "Notes";
    case "hotel":
      return "Hotels";
    case "flight":
      return "Flights";
    case "train":
      return "Trains & buses";
    case "transfer":
      return "Transfers";
    default:
      return "Notes";
  }
}

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
