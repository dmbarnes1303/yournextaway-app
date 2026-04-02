export type TripId = string;
export type SavedItemId = string;

/**
 * Canonical saved item types.
 * Do not casually expand this union without updating:
 * - trip workspace grouping
 * - trip progress logic
 * - wallet UI
 * - saved item normalization
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
 * Legacy / loose inputs that may still appear from persistence
 * or older builds and must be normalized at boundaries.
 */
export type SavedItemTypeInput = SavedItemType | "stay" | "stays" | "hotels";

/**
 * Canonical status values.
 */
export type SavedItemStatus = "saved" | "pending" | "booked" | "archived";

/**
 * Flexible metadata payload.
 * Keep it broad, but not `any`.
 */
export type SavedItemMetadata = Record<string, unknown>;

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

export const SAVED_ITEM_STATUSES: readonly SavedItemStatus[] = [
  "saved",
  "pending",
  "booked",
  "archived",
] as const;

const TYPE_SET = new Set<string>(SAVED_ITEM_TYPES);
const STATUS_SET = new Set<string>(SAVED_ITEM_STATUSES);

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isSavedItemType(value: unknown): value is SavedItemType {
  return typeof value === "string" && TYPE_SET.has(value);
}

export function isSavedItemStatus(value: unknown): value is SavedItemStatus {
  return typeof value === "string" && STATUS_SET.has(value);
}

/**
 * Normalizes loose input into the canonical type contract.
 * This is the main anti-drift boundary for older aliases.
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
      return "Stay";
    case "flight":
      return "Flights";
    case "transport":
      return "Transport";
    case "things":
      return "Activities";
    case "insurance":
      return "Insurance";
    case "claim":
      return "Claims";
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
  name?: string;
  mimeType?: string;
  size?: number;
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

export function normalizeWalletAttachment(input: unknown): WalletAttachment | null {
  if (!input || typeof input !== "object") return null;

  const raw = input as Record<string, unknown>;
  const id = cleanString(raw.id);
  const uri = cleanString(raw.uri);
  const createdAt = Number(raw.createdAt);

  if (!id || !uri || !Number.isFinite(createdAt) || createdAt <= 0) {
    return null;
  }

  const name = cleanString(raw.name) || undefined;
  const mimeType = cleanString(raw.mimeType) || undefined;
  const size = isFinitePositiveNumber(raw.size) ? raw.size : undefined;

  return {
    id,
    kind: normalizeWalletAttachmentKind(raw.kind),
    name,
    mimeType,
    size,
    uri,
    createdAt,
  };
}

export function normalizeWalletAttachments(input: unknown): WalletAttachment[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((entry) => normalizeWalletAttachment(entry))
    .filter((entry): entry is WalletAttachment => entry !== null);
}

/* -------------------------------------------------------------------------- */
/* Saved item model                                                           */
/* -------------------------------------------------------------------------- */

/**
 * tripId remains optional at type level because legacy/orphan items may exist.
 * Trip-scoped UI should still behave as if tripId is required.
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
  metadata?: SavedItemMetadata;
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
      return "Stay";
    case "flight":
      return "Flights";
    case "train":
      return "Rail / bus";
    case "transfer":
      return "Transfers";
    case "things":
      return "Activities";
    case "insurance":
      return "Insurance";
    case "claim":
      return "Claims";
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

/* -------------------------------------------------------------------------- */
/* Saved item normalization                                                   */
/* -------------------------------------------------------------------------- */

export function isSavedItem(value: unknown): value is SavedItem {
  if (!value || typeof value !== "object") return false;

  const raw = value as Record<string, unknown>;

  return (
    typeof raw.id === "string" &&
    Boolean(raw.id.trim()) &&
    typeof raw.title === "string" &&
    Boolean(raw.title.trim()) &&
    isSavedItemType(raw.type) &&
    isSavedItemStatus(raw.status) &&
    Number.isFinite(Number(raw.createdAt)) &&
    Number(raw.createdAt) > 0 &&
    Number.isFinite(Number(raw.updatedAt)) &&
    Number(raw.updatedAt) > 0
  );
}

export function normalizeSavedItem(input: unknown): SavedItem | null {
  if (!input || typeof input !== "object") return null;

  const raw = input as Record<string, unknown>;

  const id = cleanString(raw.id);
  const title = cleanString(raw.title);
  const type = normalizeSavedItemType(raw.type);
  const status = normalizeSavedItemStatus(raw.status);
  const createdAt = Number(raw.createdAt);
  const updatedAt = Number(raw.updatedAt);

  if (
    !id ||
    !title ||
    !type ||
    !status ||
    !Number.isFinite(createdAt) ||
    createdAt <= 0 ||
    !Number.isFinite(updatedAt) ||
    updatedAt <= 0
  ) {
    return null;
  }

  const tripId = cleanString(raw.tripId) || undefined;
  const partnerId = cleanString(raw.partnerId) || undefined;
  const partnerUrl = cleanString(raw.partnerUrl) || undefined;
  const priceText = cleanString(raw.priceText) || undefined;
  const currency = cleanString(raw.currency) || undefined;
  const metadata =
    raw.metadata && typeof raw.metadata === "object"
      ? (raw.metadata as SavedItemMetadata)
      : undefined;

  const attachments = normalizeWalletAttachments(raw.attachments);

  return {
    id,
    tripId,
    type,
    status,
    title,
    partnerId,
    partnerUrl,
    priceText,
    currency,
    metadata,
    attachments: attachments.length > 0 ? attachments : undefined,
    createdAt,
    updatedAt,
  };
}

export function normalizeSavedItems(input: unknown): SavedItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((entry) => normalizeSavedItem(entry))
    .filter((entry): entry is SavedItem => entry !== null);
    }
