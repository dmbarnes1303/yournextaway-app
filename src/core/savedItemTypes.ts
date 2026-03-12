// src/core/savedItemTypes.ts

export type TripId = string;
export type SavedItemId = string;

/**
 * Canonical types used by the app going forward.
 * IMPORTANT: keep this list stable. If you rename a type, add a legacy alias
 * to SavedItemTypeInput + normalizeSavedItemType to preserve old persisted data.
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

/**
 * Inputs we may encounter from:
 * - old persisted storage
 * - older builds
 * - sloppy callers
 *
 * These MUST normalize into a canonical SavedItemType.
 */
export type SavedItemTypeInput = SavedItemType | "stay" | "stays" | "hotels";

/**
 * Canonical item status.
 * (archived is used by Trip workspace + Wallet hiding)
 */
export type SavedItemStatus = "saved" | "pending" | "booked" | "archived";

/* -------------------------------------------------------------------------- */
/* Constants + guards                                                          */
/* -------------------------------------------------------------------------- */

export const SAVED_ITEM_TYPES: ReadonlyArray<SavedItemType> = [
  "tickets",
  "hotel",
  "flight",
  "train",
  "transfer",
  "things",
  "insurance",
  "claim",
  "note",
  "other",
] as const;

export const SAVED_ITEM_STATUS: ReadonlyArray<SavedItemStatus> = [
  "saved",
  "pending",
  "booked",
  "archived",
] as const;

const TYPE_SET = new Set<string>(SAVED_ITEM_TYPES);
const STATUS_SET = new Set<string>(SAVED_ITEM_STATUS);

export function isSavedItemType(v: unknown): v is SavedItemType {
  return typeof v === "string" && TYPE_SET.has(v);
}

export function isSavedItemStatus(v: unknown): v is SavedItemStatus {
  return typeof v === "string" && STATUS_SET.has(v);
}

/**
 * Normalise “type” at the boundary.
 * This is what prevents “stay” vs “hotel” bugs across Trips/Wallet/Progress strips.
 */
export function normalizeSavedItemType(input: unknown): SavedItemType | null {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return null;

  if (raw === "stay" || raw === "stays" || raw === "hotels") return "hotel";
  if (TYPE_SET.has(raw)) return raw as SavedItemType;

  return null;
}

export function normalizeSavedItemStatus(input: unknown): SavedItemStatus | null {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return null;
  if (STATUS_SET.has(raw)) return raw as SavedItemStatus;
  return null;
}

/* -------------------------------------------------------------------------- */
/* Wallet Attachments (Phase 1)                                                */
/* -------------------------------------------------------------------------- */

export type WalletAttachmentKind = "pdf" | "image" | "file";

export const WALLET_ATTACHMENT_KINDS: ReadonlyArray<WalletAttachmentKind> = [
  "pdf",
  "image",
  "file",
] as const;

const ATTACHMENT_KIND_SET = new Set<string>(WALLET_ATTACHMENT_KINDS);

export function isWalletAttachmentKind(v: unknown): v is WalletAttachmentKind {
  return typeof v === "string" && ATTACHMENT_KIND_SET.has(v);
}

export function normalizeWalletAttachmentKind(input: unknown): WalletAttachmentKind {
  const raw = String(input ?? "").trim().toLowerCase();
  if (raw === "pdf") return "pdf";
  if (raw === "image") return "image";
  return "file";
}

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

export function isWalletAttachment(value: unknown): value is WalletAttachment {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.id === "string" &&
    !!v.id.trim() &&
    typeof v.uri === "string" &&
    !!v.uri.trim() &&
    isWalletAttachmentKind(v.kind) &&
    Number.isFinite(Number(v.createdAt)) &&
    Number(v.createdAt) > 0
  );
}

/**
 * SavedItem model
 *
 * NOTE: tripId is optional at type-level because:
 * - the store loader explicitly allows missing tripId (legacy/orphan items)
 * - clearOrphans keeps items with no tripId
 *
 * Screens should treat tripId as required for trip-scoped views.
 */
export type SavedItem = {
  id: SavedItemId;

  tripId?: TripId;

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
 * - claim => Claims & compensation
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

/* -------------------------------------------------------------------------- */
/* Status transitions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Option B policy:
 * - "pending": opened partner, outcome unknown
 * - user answers "No": pending -> saved
 * - user answers "Not now": stays pending
 *
 * Users can book later from a Saved shortlist, so allow saved -> booked directly.
 */
const TRANSITIONS: Record<SavedItemStatus, SavedItemStatus[]> = {
  saved: ["pending", "booked", "archived"],
  pending: ["booked", "archived", "saved"],
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
