// src/core/savedItemTypes.ts

export type TripId = string;
export type SavedItemId = string;

/**
 * IMPORTANT:
 * These are STORAGE KEYS. Do NOT rename casually, or you’ll break persisted data.
 * If you want different UI names, use SAVED_ITEM_TYPE_META below.
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
 * UI taxonomy (Bible):
 * - tickets -> "Match Tickets"
 * - things  -> "Experiences"
 * - claim   -> "Protect yourself"
 * - note/other -> "Notes"
 *
 * This avoids breaking persisted data while giving you perfect UI language.
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

  // You asked to label "claim" as Protect Yourself (even though it's "claims/comp").
  // If you later split "claim" into "claims" and "protection", this is the one place to update.
  claim: { label: "Protect yourself", group: "Protect yourself" },

  // Notes bucket: both map into the same UI label/group
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
 * Status transitions:
 * saved -> pending -> booked -> archived
 * plus: saved/pending/booked can be archived; archived can be restored to saved.
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
