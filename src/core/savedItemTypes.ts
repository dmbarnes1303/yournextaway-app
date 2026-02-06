// src/core/savedItemTypes.ts

export type TripId = string;
export type SavedItemId = string;

/**
 * STORAGE KEYS — do not rename without a migration.
 * UI wording must come from SAVED_ITEM_TYPE_META.
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

  /** Which partner created this item (expedia/aviasales/gyg/etc). */
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

/**
 * UI group names (Phase-1 bible wording)
 */
export type SavedItemTypeGroup =
  | "Match Tickets"
  | "Stay"
  | "Flights"
  | "Trains & buses"
  | "Transfers"
  | "Experiences"
  | "Protect yourself"
  | "Notes";

/**
 * UI wording map.
 * - tickets -> Match Tickets
 * - things -> Experiences
 * - claim -> Protect yourself
 * - note/other -> Notes
 */
export const SAVED_ITEM_TYPE_META: Record<
  SavedItemType,
  { label: string; group: SavedItemTypeGroup; shortLabel?: string }
> = {
  tickets: { label: "Match Tickets", group: "Match Tickets", shortLabel: "Tickets" },
  hotel: { label: "Hotel", group: "Stay" },
  flight: { label: "Flight", group: "Flights" },
  train: { label: "Train / bus", group: "Trains & buses", shortLabel: "Train" },
  transfer: { label: "Transfer", group: "Transfers" },
  things: { label: "Experiences", group: "Experiences" },
  insurance: { label: "Travel insurance", group: "Protect yourself", shortLabel: "Insurance" },

  // AirHelp etc ends up here in Phase 1 wording
  claim: { label: "Protect yourself", group: "Protect yourself" },

  // Notes bucket
  note: { label: "Notes", group: "Notes" },
  other: { label: "Notes", group: "Notes" },
};

export function getSavedItemTypeLabel(type: SavedItemType): string {
  return SAVED_ITEM_TYPE_META[type]?.label ?? String(type);
}

export function getSavedItemTypeGroup(type: SavedItemType): SavedItemTypeGroup {
  return SAVED_ITEM_TYPE_META[type]?.group ?? "Notes";
}

/**
 * Status transitions
 */
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
