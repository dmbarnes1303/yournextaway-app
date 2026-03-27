export type TripId = string;
export type SavedItemId = string;

/**
 * Canonical saved item types.
 * Keep this list stable.
 * If older builds used aliases, add them to SavedItemTypeInput and normalizeSavedItemType.
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
 * Inputs that may appear from:
 * - persisted legacy data
 * - older builds
 * - loose callers
 */
export type SavedItemTypeInput = SavedItemType | "stay" | "stays" | "hotels";

/**
 * Canonical status values.
 */
export type SavedItemStatus = "saved" | "pending" | "booked" | "archived";

/* -------------------------------------------------------------------------- */
/* Canonical constants + guards                                               */
/* -------------------------------------------------------------------------- */

export const SAVED_ITEM_TYPES: readonly SavedItemType[] = [
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

export const SAVED_ITEM_STATUS: readonly SavedItemStatus[] = [
  "saved",
  "pending",
  "booked",
  "archived",
] as const;

const TYPE_SET = new Set<string>(SAVED_ITEM_TYPES);
const STATUS_SET = new Set<string>(SAVED_ITEM_STATUS);

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

export function isSavedItemType(value: unknown): value is SavedItemType {
  return typeof value === "string" && TYPE_SET.has(value);
}

export function isSavedItemStatus(value: unknown): value is SavedItemStatus {
  return typeof value === "string" && STATUS_SET.has(value);
}

/**
 * Normalise type input at boundaries.
 * This is what prevents stay/stays/hotels drift from poisoning Trips/Wallet/UI.
 */
export function normalizeSavedItemType(input: unknown): SavedItemType | null {
  const raw = cleanString(input).toLowerCase();
  if (!raw) return null;

  if (raw === "stay" || raw === "stays" || raw === "hotels") {
    return "hotel";
  }

  if (TYPE_SET.has(raw)) {
    return raw as SavedItemType;
  }

  return null;
}

export function normalizeSavedItemStatus(input: unknown): SavedItemStatus | null {
  const raw = cleanString(input).toLowerCase();
  if (!raw) return null;

  if (STATUS_SET.has(raw)) {
    return raw as SavedItemStatus;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* UI grouping                                                                */
/* -------------------------------------------------------------------------- */

export type SavedItemUiGroup =
  | "tickets"
  | "hotel"
  | "flight"
  | "transport"
  | "things"
  | "insurance"
  | "claim"
  | "note"
  | "other";

export function isTransportSavedItemType(type: SavedItemType): boolean {
  return type === "train" || type === "transfer";
}

export function getSavedItemUiGroup(type: SavedItemType): SavedItemUiGroup {
  switch (type) {
    case "tickets":
      return "tickets";
    case "hotel":
      return "hotel";
    case "flight":
      return "flight";
    case "train":
    case "transfer":
      return "transport";
    case "things":
      return "things";
    case "insurance":
      return "insurance";
    case "claim":
      return "claim";
    case "note":
      return "note";
    case "other":
    default:
      return "other";
  }
}

export function getSavedItemUiGroupLabel(group: SavedItemUiGroup): string {
  switch (group) {
    case "tickets":
      return "Match tickets";
    case "hotel":
      return "Hotels";
    case "flight":
      return "Flights";
    case "transport":
      return "Transport";
    case "things":
      return "Experiences";
    case "insurance":
      return "Protect yourself";
    case "claim":
      return "Claims & compensation";
    case "note":
      return "Notes";
    case "other":
    default:
      return "Other";
  }
}

/* -------------------------------------------------------------------------- */
/* Wallet attachments                                                         */
/* -------------------------------------------------------------------------- */

export type WalletAttachmentKind = "pdf" | "image" | "file";

export const WALLET_ATTACHMENT_KINDS: readonly WalletAttachmentKind[] = [
  "pdf",
  "image",
  "file",
] as const;

const ATTACHMENT_KIND_SET = new Set<string>(WALLET_ATTACHMENT_KINDS);

export function isWalletAttachmentKind(value: unknown): value is WalletAttachmentKind {
  return typeof value === "string" && ATTACHMENT_KIND_SET.has(value);
}

export function normalizeWalletAttachmentKind(input: unknown): WalletAttachmentKind {
  const raw = cleanString(input).toLowerCase();

  if (raw === "pdf") return "pdf";
  if (raw === "image") return "image";
  return "file";
}

export type WalletAttachment = {
  id: string;
  kind: WalletAttachmentKind;

  /** Original filename when known */
  name?: string;

  /** MIME type when known */
  mimeType?: string;

  /** Byte size when known */
  size?: number;

  /**
   * App-owned local URI.
   * This is what the app opens/shares offline.
   */
  uri: string;

  createdAt: number;
};

export function isWalletAttachment(value: unknown): value is WalletAttachment {
  if (!value || typeof value !== "object") return false;

  const v = value as Record<string, unknown>;

  return (
    typeof v.id === "string" &&
    Boolean(v.id.trim()) &&
    typeof v.uri === "string" &&
    Boolean(v.uri.trim()) &&
    isWalletAttachmentKind(v.kind) &&
    Number.isFinite(Number(v.createdAt)) &&
    Number(v.createdAt) > 0
  );
}

/* -------------------------------------------------------------------------- */
/* Saved item model                                                           */
/* -------------------------------------------------------------------------- */

/**
 * tripId stays optional at type level because legacy/orphan items can still exist.
 * Trip-scoped screens should still treat tripId as effectively required.
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

  /** Offline proof / confirmations / screenshots */
  attachments?: WalletAttachment[];

  createdAt: number;
  updatedAt: number;
};

/* -------------------------------------------------------------------------- */
/* Display labels                                                             */
/* -------------------------------------------------------------------------- */

export function getSavedItemTypeLabel(type: SavedItemType): string {
  switch (type) {
    case "tickets":
      return "Match tickets";
    case "hotel":
      return "Hotels";
    case "flight":
      return "Flights";
    case "train":
      return "Trains & buses";
    case "transfer":
      return "Transfers";
    case "things":
      return "Experiences";
    case "insurance":
      return "Protect yourself";
    case "claim":
      return "Claims & compensation";
    case "note":
      return "Notes";
    case "other":
    default:
      return "Other";
  }
}

/* -------------------------------------------------------------------------- */
/* Status transitions                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Transition policy:
 * - saved: shortlisted / not opened recently
 * - pending: opened partner, outcome unknown
 * - booked: explicitly confirmed booked
 * - archived: hidden from active workspace
 *
 * Rules:
 * - saved -> pending/booked/archived
 * - pending -> saved/booked/archived
 * - booked -> archived
 * - archived -> saved
 */
const TRANSITIONS: Record<SavedItemStatus, readonly SavedItemStatus[]> = {
  saved: ["pending", "booked", "archived"],
  pending: ["saved", "booked", "archived"],
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
