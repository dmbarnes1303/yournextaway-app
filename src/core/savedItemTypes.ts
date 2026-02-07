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

/* -------------------------------------------------------------------------- */
/* Wallet Attachments (Phase 1) */
/* -------------------------------------------------------------------------- */

export type WalletAttachmentKind = "pdf" | "image" | "file";

export type WalletAttachment = {
  id: string;
  kind: WalletAttachmentKind;

  /** Original filename when known (nice to show in UI) */
  name?: string;

  /** MIME type when known */
  mimeType?: string;

  /** Byte size when known */
  size?: number;

  /**
   * Local, app-owned URI (FileSystem.documentDirectory/...)
   * This is what we open/share.
   */
  uri: string;

  createdAt: number;
};

export type SavedItem = {
  id: SavedItemId;
  tripId: TripId;

  type: SavedItemType;
  status: SavedItemStatus;

  title: string;

  partnerId?: string;
  partnerUrl?: string;

  priceText?: string;
  currency?: string;

  metadata?: Record<string, any>;

  /** Phase-1: offline proof (PDF/screenshots/etc) */
  attachments?: WalletAttachment[];

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
 * - claim => Claims & compensation (NOT "Protect yourself")
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

/**
 * Status transitions
 *
 * Option B policy:
 * - "pending" means: we opened a partner and we still don't know outcome
 * - If user answers "No", we move pending -> saved (keep it as a saved link/idea, not booked)
 * - If user answers "Not now", we leave it pending
 */
const TRANSITIONS: Record<SavedItemStatus, SavedItemStatus[]> = {
  saved: ["pending", "archived"],
  pending: ["booked", "archived", "saved"], // ✅ allow pending → saved
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
