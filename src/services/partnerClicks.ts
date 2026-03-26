// src/services/partnerClicks.ts
//
// Canonical partner click runtime.
//
// Responsibilities only:
// - open tracked / untracked URLs
// - create or reuse SavedItems
// - persist last-click session state
// - handle return-flow prompt state
// - perform explicit, deterministic status transitions
//
// Non-responsibilities:
// - partner registry definition
// - partner display metadata
// - outbound URL generation
// - hidden category inference heuristics

import { AppState, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

import savedItemsStore from "@/src/state/savedItems";
import { readJson, writeJson } from "@/src/state/persist";
import {
  getCanonicalPartnerId,
  getPartner,
  isUtilityPartner,
  type PartnerCategory,
  type PartnerId,
} from "@/src/constants/partners";
import type { SavedItem, SavedItemStatus, SavedItemType } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";

export type LastPartnerClick = {
  itemId: string;
  tripId: string;
  partnerId: PartnerId;
  partnerCategory: PartnerCategory;
  savedItemType: SavedItemType;
  url: string;
  createdAt: number;
  openedAt: number;
};

const STORAGE_KEY = "yna_last_partner_click_v2";
const CLICK_RETENTION_MS = 1000 * 60 * 60 * 6;
const RETURN_DEDUPE_MS = 1500;

let lastClick: LastPartnerClick | null = null;
let lastClickLoaded = false;

let watcherSubscribed = false;
let appStateSub: { remove: () => void } | null = null;
let onReturnHandler: ((click: LastPartnerClick) => void | Promise<void>) | null = null;

let openInFlight = false;
let returnInFlight = false;
let lastReturnHandledAt = 0;

/* -------------------------------------------------------------------------- */
/* Canonical category -> SavedItemType mapping                                */
/* -------------------------------------------------------------------------- */

const CATEGORY_TO_SAVED_ITEM_TYPE: Record<PartnerCategory, SavedItemType> = {
  tickets: "tickets",
  flights: "flight",
  stays: "hotel",
  trains: "train",
  buses: "train",
  transfers: "transfer",
  insurance: "insurance",
  things: "things",
  car_hire: "other",
  maps: "other",
  official_site: "other",
  claim: "claim",
  note: "note",
  other: "other",
};

export function mapPartnerCategoryToSavedItemType(category: PartnerCategory): SavedItemType {
  return CATEGORY_TO_SAVED_ITEM_TYPE[category];
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function now() {
  return Date.now();
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function isRecent(click: LastPartnerClick): boolean {
  return now() - click.createdAt <= CLICK_RETENTION_MS;
}

function normalizeUrl(url: string): string {
  const raw = cleanString(url);
  if (!raw) return "";

  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProto);
    const protocol = (parsed.protocol || "https:").toLowerCase();
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname || "/";
    const search = parsed.search || "";
    return `${protocol}//${host}${pathname}${search}`.trim();
  } catch {
    return withProto.trim();
  }
}

function normalizeUrlLoose(url: string): string {
  const raw = cleanString(url);
  if (!raw) return "";

  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProto);
    const protocol = (parsed.protocol || "https:").toLowerCase();
    const host = parsed.hostname.toLowerCase();
    const pathname = (parsed.pathname || "/").replace(/\/+$/, "") || "/";
    return `${protocol}//${host}${pathname}`;
  } catch {
    return withProto.trim();
  }
}

function isDeterministicallyReusable(item: SavedItem): boolean {
  return item.status === "pending" || item.status === "saved" || item.status === "booked";
}

function isValidSavedItemStatus(value: unknown): value is SavedItemStatus {
  return value === "saved" || value === "pending" || value === "booked" || value === "archived";
}

function isValidSavedItemType(value: unknown): value is SavedItemType {
  return (
    value === "tickets" ||
    value === "hotel" ||
    value === "flight" ||
    value === "train" ||
    value === "transfer" ||
    value === "things" ||
    value === "insurance" ||
    value === "claim" ||
    value === "note" ||
    value === "other"
  );
}

async function persistLastClick(next: LastPartnerClick | null) {
  lastClick = next;

  try {
    await writeJson(STORAGE_KEY, next);
  } catch {
    // best-effort only
  }
}

async function clearLastClickState() {
  await persistLastClick(null);
}

async function loadLastClickOnce() {
  if (lastClickLoaded) return;
  lastClickLoaded = true;

  try {
    const raw = await readJson<unknown>(STORAGE_KEY, null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;

    const record = raw as Record<string, unknown>;

    const itemId = cleanString(record.itemId);
    const tripId = cleanString(record.tripId);
    const partnerId = getCanonicalPartnerId(cleanString(record.partnerId));
    const partnerCategory = getPartner(partnerId).primaryCategory;

    const rawSavedItemType = cleanString(record.savedItemType);
    const savedItemType = isValidSavedItemType(rawSavedItemType)
      ? rawSavedItemType
      : mapPartnerCategoryToSavedItemType(partnerCategory);

    const url = normalizeUrl(cleanString(record.url));
    const createdAt = Number(record.createdAt);
    const openedAt = Number(record.openedAt);

    if (!itemId || !tripId || !partnerId || !url) return;
    if (!Number.isFinite(createdAt) || createdAt <= 0) return;
    if (!Number.isFinite(openedAt) || openedAt <= 0) return;

    const candidate: LastPartnerClick = {
      itemId,
      tripId,
      partnerId,
      partnerCategory,
      savedItemType,
      url,
      createdAt,
      openedAt,
    };

    if (!isRecent(candidate)) {
      await clearLastClickState();
      return;
    }

    lastClick = candidate;
  } catch {
    // ignore corrupt payloads
  }
}

async function ensureSavedItemsLoaded() {
  if (savedItemsStore.getState().loaded) return;

  try {
    await savedItemsStore.load();
  } catch {
    // ignore load failure here
  }
}

function getItemById(itemId: string): SavedItem | undefined {
  return savedItemsStore.getById(itemId);
}

async function transitionIfCurrent(
  itemId: string,
  fromStatus: SavedItemStatus,
  toStatus: SavedItemStatus
) {
  const id = cleanString(itemId);
  if (!id) return;

  await ensureSavedItemsLoaded();

  const current = getItemById(id);
  if (!current || current.status !== fromStatus) return;

  try {
    await savedItemsStore.transitionStatus(id, toStatus);
  } catch {
    // ignore transition failure
  }
}

async function openUrlInternal(url: string) {
  const normalized = normalizeUrl(url);
  if (!normalized) throw new Error("url is required");

  if (Platform.OS === "web") {
    window.open(normalized, "_blank", "noopener,noreferrer");
    return { type: "opened" as const };
  }

  return await WebBrowser.openBrowserAsync(normalized, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    readerMode: false,
    enableBarCollapsing: true,
    showTitle: true,
  });
}

async function openBrowserGuarded(url: string) {
  if (openInFlight) throw new Error("Partner open already in progress");

  openInFlight = true;
  try {
    return await openUrlInternal(url);
  } finally {
    openInFlight = false;
  }
}

function buildDefaultTitle(args: {
  partnerName: string;
  type: SavedItemType;
  metadata?: Record<string, any>;
}) {
  const city =
    cleanString(args.metadata?.city ?? args.metadata?.destination ?? args.metadata?.place) || null;
  const label = getSavedItemTypeLabel(args.type);

  switch (args.type) {
    case "hotel":
      return city ? `Stay: Hotels in ${city}` : "Stay: Hotels";
    case "flight":
      return city ? `Flights to ${city}` : "Flights";
    case "train":
      return city ? `Travel to ${city}` : "Travel";
    case "transfer":
      return city ? `Transfers in ${city}` : "Transfers";
    case "things":
      return city ? `Things to do in ${city}` : "Things to do";
    case "tickets":
      return city ? `Match tickets for ${city}` : "Match tickets";
    case "insurance":
      return city
        ? `Protect yourself: Travel insurance for ${city}`
        : "Protect yourself: Travel insurance";
    case "claim":
      return "Claims & compensation";
    case "note":
      return "Note";
    case "other":
    default:
      return city ? `${label}: ${city}` : `${label}: ${args.partnerName}`;
  }
}

function findReusableItem(args: {
  tripId: string;
  partnerId: PartnerId;
  url: string;
  type: SavedItemType;
}): SavedItem | null {
  const tripId = cleanString(args.tripId);
  const strictUrl = normalizeUrl(args.url);
  const looseUrl = normalizeUrlLoose(args.url);

  if (!tripId || !strictUrl) return null;

  const items = savedItemsStore.getAll();

  const matches = items.filter((item) => {
    if (cleanString(item.tripId) !== tripId) return false;
    if (cleanString(item.partnerId) !== args.partnerId) return false;
    if (String(item.type) !== String(args.type)) return false;
    if (!isDeterministicallyReusable(item)) return false;

    const itemStrict = normalizeUrl(cleanString(item.partnerUrl));
    const itemLoose = normalizeUrlLoose(cleanString(item.partnerUrl));

    return itemStrict === strictUrl || itemLoose === looseUrl;
  });

  if (matches.length === 0) return null;

  return (
    matches.find((item) => item.status === "pending") ??
    matches.find((item) => item.status === "saved") ??
    matches.find((item) => item.status === "booked") ??
    null
  );
}

async function triggerReturnIfPresent(_reason: "appstate" | "browser_dismiss") {
  const ts = now();
  if (returnInFlight) return;
  if (ts - lastReturnHandledAt < RETURN_DEDUPE_MS) return;

  returnInFlight = true;

  try {
    await loadLastClickOnce();

    const click = lastClick;
    if (!click) return;

    if (!isRecent(click)) {
      await clearLastClickState();
      return;
    }

    const handler = onReturnHandler;
    if (!handler) return;

    await clearLastClickState();

    try {
      await Promise.resolve(handler(click));
    } catch {
      // never crash app due to return handler failure
    } finally {
      lastReturnHandledAt = now();
    }
  } finally {
    returnInFlight = false;
  }
}

/* -------------------------------------------------------------------------- */
/* Public runtime API                                                         */
/* -------------------------------------------------------------------------- */

export function getPartnerClicksDebugState() {
  return {
    opening: openInFlight,
    subscribed: watcherSubscribed,
    lastClick,
  };
}

export function ensurePartnerReturnWatcher(
  onReturn: (click: LastPartnerClick) => void | Promise<void>
) {
  onReturnHandler = onReturn;

  if (watcherSubscribed) {
    return () => {
      onReturnHandler = null;
    };
  }

  watcherSubscribed = true;
  void loadLastClickOnce();

  let lastState = AppState.currentState;

  appStateSub = AppState.addEventListener("change", (nextState) => {
    const becameActive =
      Boolean(String(lastState).match(/inactive|background/)) && nextState === "active";

    lastState = nextState;

    if (!becameActive) return;
    void triggerReturnIfPresent("appstate");
  }) as any;

  return () => {
    onReturnHandler = null;

    try {
      appStateSub?.remove?.();
    } catch {
      // ignore unsubscribe failure
    }

    appStateSub = null;
    watcherSubscribed = false;
  };
}

export async function openUntrackedUrl(url: string) {
  const normalized = normalizeUrl(url);
  if (!normalized) throw new Error("url is required");
  return await openBrowserGuarded(normalized);
}

/**
 * Utility/simple opens only.
 * Tracked partner flows should go through beginPartnerClick.
 */
export async function openPartnerUrl(url: string) {
  return await openUntrackedUrl(url);
}

export async function beginPartnerClick(args: {
  tripId: string;
  partnerId: PartnerId | string;
  url: string;
  savedItemType?: SavedItemType;
  title?: string;
  metadata?: Record<string, any>;
}): Promise<SavedItem> {
  const tripId = cleanString(args.tripId);
  if (!tripId) throw new Error("tripId is required");

  const canonicalPartnerId = getCanonicalPartnerId(args.partnerId);
  const partner = getPartner(canonicalPartnerId);

  const url = normalizeUrl(args.url);
  if (!url) throw new Error("url is required");

  const savedItemType =
    args.savedItemType ?? mapPartnerCategoryToSavedItemType(partner.primaryCategory);

  await ensureSavedItemsLoaded();

  let item = findReusableItem({
    tripId,
    partnerId: canonicalPartnerId,
    url,
    type: savedItemType,
  });

  let createdNew = false;
  let promotedFromSaved = false;

  if (item?.status === "saved") {
    promotedFromSaved = true;
    await transitionIfCurrent(item.id, "saved", "pending");
    item = getItemById(item.id) ?? item;
  }

  if (!item) {
    const title =
      cleanString(args.title) ||
      buildDefaultTitle({
        partnerName: partner.display.name,
        type: savedItemType,
        metadata: args.metadata,
      });

    item = await savedItemsStore.add({
      tripId,
      type: savedItemType,
      status: isUtilityPartner(canonicalPartnerId) ? "saved" : "pending",
      title,
      partnerId: canonicalPartnerId,
      partnerUrl: url,
      metadata: args.metadata,
    });

    createdNew = true;
  }

  const itemForOpen = getItemById(item.id) ?? item;
  const isTrackedPending = !isUtilityPartner(canonicalPartnerId) && itemForOpen.status === "pending";
  const clickAt = now();

  if (isTrackedPending) {
    await persistLastClick({
      itemId: itemForOpen.id,
      tripId,
      partnerId: canonicalPartnerId,
      partnerCategory: partner.primaryCategory,
      savedItemType,
      url,
      createdAt: clickAt,
      openedAt: clickAt,
    });
  } else {
    await clearLastClickState();
  }

  try {
    const browserResult = await openBrowserGuarded(url);
    const resultType = cleanString((browserResult as { type?: unknown })?.type).toLowerCase();
    const isDismissLike = resultType === "dismiss" || resultType === "cancel";

    if (isDismissLike && isTrackedPending) {
      await triggerReturnIfPresent("browser_dismiss");
    }

    return getItemById(itemForOpen.id) ?? itemForOpen;
  } catch (error) {
    if (createdNew) {
      try {
        await savedItemsStore.remove(itemForOpen.id);
      } catch {
        // ignore rollback failure
      }
    } else if (promotedFromSaved) {
      await transitionIfCurrent(itemForOpen.id, "pending", "saved");
    }

    await clearLastClickState();
    throw error;
  }
}

export async function markBooked(itemId: string) {
  const id = cleanString(itemId);
  if (!id) return;

  await ensureSavedItemsLoaded();

  const current = getItemById(id);
  if (!current) return;

  if (current.status !== "booked") {
    await savedItemsStore.transitionStatus(id, "booked");
  }

  if (lastClick?.itemId === id) {
    await clearLastClickState();
  }

  lastReturnHandledAt = now();
}

export async function markNotBooked(itemId: string) {
  const id = cleanString(itemId);
  if (!id) return;

  await transitionIfCurrent(id, "pending", "saved");

  if (lastClick?.itemId === id) {
    await clearLastClickState();
  }

  lastReturnHandledAt = now();
}

export async function dismissReturnPrompt(itemId?: string) {
  await loadLastClickOnce();

  if (!lastClick) return;

  if (!itemId) {
    await clearLastClickState();
    lastReturnHandledAt = now();
    return;
  }

  const id = cleanString(itemId);
  if (id && lastClick.itemId === id) {
    await clearLastClickState();
    lastReturnHandledAt = now();
  }
}

export function clearLastClick(itemId?: string) {
  void dismissReturnPrompt(itemId);
}

export function getLastClick(): LastPartnerClick | null {
  return lastClick;
}

export function __unsafeResetPartnerClickStateForDevOnly() {
  try {
    appStateSub?.remove?.();
  } catch {
    // ignore
  }

  appStateSub = null;
  watcherSubscribed = false;
  onReturnHandler = null;
  openInFlight = false;
  returnInFlight = false;
  lastReturnHandledAt = 0;
  lastClickLoaded = false;
  void clearLastClickState();
}
