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

export type SavedItemTypeInput = SavedItemType | "stay" | "stays" | "hotels";
export type SavedItemStatus = "saved" | "pending" | "booked" | "archived";
export type SavedItemMetadata = Record<string, unknown>;
export type SavedItemPartnerTier = "tier1" | "tier2";
export type SavedItemPartnerCategory = "tickets" | "flights" | "hotels" | "insurance";

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
const PARTNER_TIER_SET = new Set<string>(["tier1", "tier2"]);
const PARTNER_CATEGORY_SET = new Set<string>(["tickets", "flights", "hotels", "insurance"]);

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

export function isSavedItemPartnerTier(value: unknown): value is SavedItemPartnerTier {
  return typeof value === "string" && PARTNER_TIER_SET.has(value);
}

export function isSavedItemPartnerCategory(value: unknown): value is SavedItemPartnerCategory {
  return typeof value === "string" && PARTNER_CATEGORY_SET.has(value);
}

export function normalizeSavedItemType(input: unknown): SavedItemType | null {
  const raw = cleanString(input).toLowerCase();
  if (!raw) return null;
  if (raw === "stay" || raw === "stays" || raw === "hotels") return "hotel";
  if (TYPE_SET.has(raw)) return raw as SavedItemType;
  return null;
}

export function normalizeSavedItemStatus(input: unknown): SavedItemStatus | null {
  const raw = cleanString(input).toLowerCase();
  if (!raw) return null;
  if (STATUS_SET.has(raw)) return raw as SavedItemStatus;
  return null;
}

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
    default:
      return "Other";
  }
}

export type WalletAttachmentKind = "pdf" | "image" | "file";
export const WALLET_ATTACHMENT_KINDS: readonly WalletAttachmentKind[] = ["pdf", "image", "file"] as const;
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
  if (!id || !uri || !Number.isFinite(createdAt) || createdAt <= 0) return null;
  const name = cleanString(raw.name) || undefined;
  const mimeType = cleanString(raw.mimeType) || undefined;
  const size = isFinitePositiveNumber(raw.size) ? raw.size : undefined;
  return { id, kind: normalizeWalletAttachmentKind(raw.kind), name, mimeType, size, uri, createdAt };
}

export function normalizeWalletAttachments(input: unknown): WalletAttachment[] {
  if (!Array.isArray(input)) return [];
  return input.map((entry) => normalizeWalletAttachment(entry)).filter((entry): entry is WalletAttachment => entry !== null);
}

export type SavedItem = {
  id: SavedItemId;
  tripId?: TripId;
  type: SavedItemType;
  status: SavedItemStatus;
  title: string;
  partnerId?: string;
  partnerUrl?: string;
  partnerClickId?: string;
  partnerTier?: SavedItemPartnerTier;
  partnerCategory?: SavedItemPartnerCategory;
  sourceSurface?: string;
  sourceSection?: string;
  priceText?: string;
  currency?: string;
  metadata?: SavedItemMetadata;
  attachments?: WalletAttachment[];
  bookedAt?: number;
  createdAt: number;
  updatedAt: number;
};

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
    default:
      return "Other";
  }
}

const TRANSITIONS: Record<SavedItemStatus, readonly SavedItemStatus[]> = {
  saved: ["pending", "booked", "archived"],
  pending: ["saved", "booked", "archived"],
  booked: ["saved", "archived"],
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
  if (!id || !title || !type || !status || !Number.isFinite(createdAt) || createdAt <= 0 || !Number.isFinite(updatedAt) || updatedAt <= 0) {
    return null;
  }

  return {
    id,
    tripId: cleanString(raw.tripId) || undefined,
    type,
    status,
    title,
    partnerId: cleanString(raw.partnerId) || undefined,
    partnerUrl: cleanString(raw.partnerUrl) || undefined,
    partnerClickId: cleanString(raw.partnerClickId) || undefined,
    partnerTier: isSavedItemPartnerTier(raw.partnerTier) ? raw.partnerTier : undefined,
    partnerCategory: isSavedItemPartnerCategory(raw.partnerCategory)
      ? raw.partnerCategory
      : undefined,
    sourceSurface: cleanString(raw.sourceSurface) || undefined,
    sourceSection: cleanString(raw.sourceSection) || undefined,
    priceText: cleanString(raw.priceText) || undefined,
    currency: cleanString(raw.currency) || undefined,
    metadata:
      raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
        ? (raw.metadata as SavedItemMetadata)
        : undefined,
    attachments: normalizeWalletAttachments(raw.attachments),
    bookedAt: Number.isFinite(Number(raw.bookedAt)) ? Number(raw.bookedAt) : undefined,
    createdAt,
    updatedAt,
  };
}

export function normalizeSavedItems(input: unknown): SavedItem[] {
  if (!Array.isArray(input)) return [];
  return input.map((entry) => normalizeSavedItem(entry)).filter((entry): entry is SavedItem => entry !== null);
}
