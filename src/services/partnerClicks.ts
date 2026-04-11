import { AppState, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

import savedItemsStore from "@/src/state/savedItems";
import { readJson, writeJson } from "@/src/state/persist";
import {
  getCanonicalPartnerId,
  getPartner,
  type PartnerCategory,
  type PartnerId,
  type PartnerTier,
} from "@/src/constants/partners";
import type { SavedItem, SavedItemStatus, SavedItemType } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";
import {
  attachSavedItemToPartnerClick,
  buildLocalPartnerClickId,
  createPartnerClick,
  getAnalyticsHealthState,
  isPartnerTrackingAvailable,
  isTrackedPartnerClickId,
  logPartnerEvent,
  markPartnerClickConverted,
  markPartnerClickReturned,
} from "@/src/services/analytics";

export type LastPartnerClick = {
  clickId: string;
  itemId: string;
  tripId: string;
  partnerId: PartnerId;
  partnerTier: PartnerTier;
  partnerCategory: PartnerCategory;
  savedItemType: SavedItemType;
  url: string;
  sourceSurface?: string;
  sourceSection?: string;
  createdAt: number;
  openedAt: number;
  tracked: boolean;
};

export type PartnerClickHealth = {
  opening: boolean;
  subscribed: boolean;
  lastClick: LastPartnerClick | null;
  trackingAvailable: boolean;
  trackingDegraded: boolean;
  lastTrackingErrorAt: number | null;
  lastTrackingErrorMessage: string | null;
  lastTrackingOperation: string | null;
};

const STORAGE_KEY = "yna_last_partner_click_v4";
const CLICK_RETENTION_MS = 1000 * 60 * 60 * 6;
const RETURN_DEDUPE_MS = 1500;
const DEBUG_PREFIX = "[partnerClicks]";

let lastClick: LastPartnerClick | null = null;
let lastClickLoaded = false;
let watcherSubscribed = false;
let appStateSub: { remove: () => void } | null = null;
let onReturnHandler: ((click: LastPartnerClick) => void | Promise<void>) | null = null;
let openInFlight = false;
let returnInFlight = false;
let lastReturnHandledAt = 0;

const CATEGORY_TO_SAVED_ITEM_TYPE: Record<PartnerCategory, SavedItemType> = {
  tickets: "tickets",
  flights: "flight",
  hotels: "hotel",
  insurance: "insurance",
};

export function mapPartnerCategoryToSavedItemType(category: PartnerCategory): SavedItemType {
  return CATEGORY_TO_SAVED_ITEM_TYPE[category];
}

function logInfo(message: string, context?: Record<string, unknown>) {
  console.info(DEBUG_PREFIX, message, context ?? {});
}

function logWarn(message: string, context?: Record<string, unknown>) {
  console.warn(DEBUG_PREFIX, message, context ?? {});
}

function logError(message: string, error: unknown, context?: Record<string, unknown>) {
  console.error(DEBUG_PREFIX, message, {
    ...(context ?? {}),
    errorMessage: error instanceof Error ? error.message : String(error ?? "unknown_error"),
    error,
  });
}

function now(): number {
  return Date.now();
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
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

async function persistLastClick(next: LastPartnerClick | null): Promise<void> {
  lastClick = next;
  try {
    await writeJson(STORAGE_KEY, next);
  } catch (error) {
    logError("persistLastClick failed", error, {
      hasClick: Boolean(next),
      clickId: next?.clickId ?? null,
    });
  }
}

async function clearLastClickState(): Promise<void> {
  await persistLastClick(null);
}

async function loadLastClickOnce(): Promise<void> {
  if (lastClickLoaded) return;
  lastClickLoaded = true;

  try {
    const raw = await readJson<unknown>(STORAGE_KEY, null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;

    const record = raw as Record<string, unknown>;
    const clickId = cleanString(record.clickId);
    const itemId = cleanString(record.itemId);
    const tripId = cleanString(record.tripId);
    const rawPartnerId = cleanString(record.partnerId);
    const rawUrl = cleanString(record.url);
    const createdAt = Number(record.createdAt);
    const openedAt = Number(record.openedAt);
    const tracked = Boolean(record.tracked);

    if (!clickId || !itemId || !tripId || !rawPartnerId || !rawUrl) return;
    if (!Number.isFinite(createdAt) || createdAt <= 0) return;
    if (!Number.isFinite(openedAt) || openedAt <= 0) return;

    const partnerId = getCanonicalPartnerId(rawPartnerId);
    const partner = getPartner(partnerId);
    const rawSavedItemType = cleanString(record.savedItemType);

    const savedItemType = isValidSavedItemType(rawSavedItemType)
      ? rawSavedItemType
      : mapPartnerCategoryToSavedItemType(partner.primaryCategory);

    const candidate: LastPartnerClick = {
      clickId,
      itemId,
      tripId,
      partnerId,
      partnerTier: partner.tier,
      partnerCategory: partner.primaryCategory,
      savedItemType,
      url: normalizeUrl(rawUrl),
      sourceSurface: cleanString(record.sourceSurface) || undefined,
      sourceSection: cleanString(record.sourceSection) || undefined,
      createdAt,
      openedAt,
      tracked,
    };

    if (!candidate.url) return;

    if (!isRecent(candidate)) {
      await clearLastClickState();
      return;
    }

    lastClick = candidate;
  } catch (error) {
    logError("loadLastClickOnce failed", error);
  }
}

async function ensureSavedItemsLoaded(): Promise<void> {
  if (savedItemsStore.getState().loaded) return;

  try {
    await savedItemsStore.load();
  } catch (error) {
    logError("ensureSavedItemsLoaded failed", error);
  }
}

function getItemById(itemId: string): SavedItem | undefined {
  return savedItemsStore.getById(itemId);
}

async function transitionIfCurrent(
  itemId: string,
  fromStatus: SavedItemStatus,
  toStatus: SavedItemStatus
): Promise<void> {
  const id = cleanString(itemId);
  if (!id) return;

  await ensureSavedItemsLoaded();
  const current = getItemById(id);
  if (!current || current.status !== fromStatus) return;

  try {
    await savedItemsStore.transitionStatus(id, toStatus);
    logInfo("transitionIfCurrent success", {
      itemId: id,
      fromStatus,
      toStatus,
    });
  } catch (error) {
    logError("transitionIfCurrent failed", error, {
      itemId: id,
      fromStatus,
      toStatus,
    });
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
  metadata?: Record<string, unknown>;
}): string {
  const metadata = args.metadata as Record<string, unknown> | undefined;
  const city = cleanString(metadata?.city ?? metadata?.destination ?? metadata?.place) || null;
  const label = getSavedItemTypeLabel(args.type);

  switch (args.type) {
    case "hotel":
      return city ? `Stay: Hotels in ${city}` : "Stay: Hotels";
    case "flight":
      return city ? `Flights to ${city}` : "Flights";
    case "tickets":
      return city ? `Match tickets for ${city}` : "Match tickets";
    case "insurance":
      return city ? `Travel insurance for ${city}` : "Travel insurance";
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

  if (!matches.length) return null;

  return (
    matches.find((item) => item.status === "pending") ??
    matches.find((item) => item.status === "saved") ??
    matches.find((item) => item.status === "booked") ??
    null
  );
}

async function triggerReturnIfPresent(): Promise<void> {
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

    if (click.tracked && isTrackedPartnerClickId(click.clickId)) {
      await markPartnerClickReturned({
        clickId: click.clickId,
        metadata: { returnedVia: "app_active" },
      });
    }

    const handler = onReturnHandler;
    if (!handler) return;

    await clearLastClickState();

    try {
      await Promise.resolve(handler(click));
    } finally {
      lastReturnHandledAt = now();
    }
  } catch (error) {
    logError("triggerReturnIfPresent failed", error, {
      clickId: lastClick?.clickId ?? null,
    });
  } finally {
    returnInFlight = false;
  }
}

export function getPartnerClicksDebugState(): PartnerClickHealth {
  const analytics = getAnalyticsHealthState();

  return {
    opening: openInFlight,
    subscribed: watcherSubscribed,
    lastClick,
    trackingAvailable: isPartnerTrackingAvailable(),
    trackingDegraded: Boolean(analytics.lastTrackingErrorAt),
    lastTrackingErrorAt: analytics.lastTrackingErrorAt,
    lastTrackingErrorMessage: analytics.lastTrackingErrorMessage,
    lastTrackingOperation: analytics.lastTrackingOperation,
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
    void triggerReturnIfPresent();
  }) as { remove: () => void };

  return () => {
    onReturnHandler = null;
    try {
      appStateSub?.remove?.();
    } catch (error) {
      logError("ensurePartnerReturnWatcher cleanup failed", error);
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

export async function beginPartnerClick(args: {
  tripId: string;
  partnerId: PartnerId | string;
  url: string;
  savedItemType?: SavedItemType;
  title?: string;
  metadata?: Record<string, unknown>;
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
      status: "pending",
      title,
      partnerId: canonicalPartnerId,
      partnerUrl: url,
      partnerTier: partner.tier,
      partnerCategory: partner.primaryCategory,
      sourceSurface: cleanString(args.metadata?.sourceSurface),
      sourceSection: cleanString(args.metadata?.sourceSection),
      metadata: args.metadata,
    });

    createdNew = true;
  }

  const itemForOpen = getItemById(item.id) ?? item;
  const clickAt = now();
  const trackingAvailable = isPartnerTrackingAvailable();

  const trackedClick = await createPartnerClick({
    tripId,
    savedItemId: itemForOpen.id,
    partnerId: canonicalPartnerId,
    partnerCategory: partner.primaryCategory,
    partnerTier: partner.tier,
    url,
    sourceSurface: cleanString(args.metadata?.sourceSurface) || null,
    sourceSection: cleanString(args.metadata?.sourceSection) || null,
    metadata: {
      ...(args.metadata ?? {}),
      savedItemType,
      partnerTier: partner.tier,
      partnerCategory: partner.primaryCategory,
    },
  });

  const clickId = trackedClick?.id || buildLocalPartnerClickId(itemForOpen.id);
  const tracked = Boolean(trackedClick?.id);

  if (!tracked) {
    logWarn("Partner click opened without server-side tracking", {
      tripId,
      itemId: itemForOpen.id,
      partnerId: canonicalPartnerId,
      trackingAvailable,
      analyticsHealth: getAnalyticsHealthState(),
    });
  }

  if (itemForOpen.partnerClickId !== clickId) {
    await savedItemsStore.update(itemForOpen.id, {
      partnerClickId: clickId,
      partnerTier: partner.tier,
      partnerCategory: partner.primaryCategory,
      sourceSurface: cleanString(args.metadata?.sourceSurface) || undefined,
      sourceSection: cleanString(args.metadata?.sourceSection) || undefined,
    });

    if (tracked) {
      await attachSavedItemToPartnerClick({
        clickId,
        savedItemId: itemForOpen.id,
        metadata: {
          linkedBy: createdNew ? "create" : "reuse",
        },
      });
    }
  }

  if (tracked) {
    await logPartnerEvent({
      partnerClickId: clickId,
      tripId,
      savedItemId: itemForOpen.id,
      eventName: "partner_click_created",
      partnerId: canonicalPartnerId,
      sourceSurface: cleanString(args.metadata?.sourceSurface) || null,
      sourceSection: cleanString(args.metadata?.sourceSection) || null,
      metadata: {
        savedItemType,
        reusedSavedItem: !createdNew,
        promotedFromSaved,
      },
    });
  }

  await persistLastClick({
    clickId,
    itemId: itemForOpen.id,
    tripId,
    partnerId: canonicalPartnerId,
    partnerTier: partner.tier,
    partnerCategory: partner.primaryCategory,
    savedItemType,
    url,
    sourceSurface: cleanString(args.metadata?.sourceSurface) || undefined,
    sourceSection: cleanString(args.metadata?.sourceSection) || undefined,
    createdAt: clickAt,
    openedAt: clickAt,
    tracked,
  });

  try {
    const browserResult = await openBrowserGuarded(url);
    const resultType = cleanString((browserResult as { type?: unknown })?.type).toLowerCase();
    const isDismissLike = resultType === "dismiss" || resultType === "cancel";

    if (isDismissLike) {
      await triggerReturnIfPresent();
    }

    return getItemById(itemForOpen.id) ?? itemForOpen;
  } catch (error) {
    if (createdNew) {
      try {
        await savedItemsStore.remove(itemForOpen.id);
      } catch (removeError) {
        logError(
          "Failed to remove newly created pending item after browser open failure",
          removeError,
          {
            itemId: itemForOpen.id,
          }
        );
      }
    } else if (promotedFromSaved) {
      await transitionIfCurrent(itemForOpen.id, "pending", "saved");
    }

    if (tracked) {
      await logPartnerEvent({
        partnerClickId: clickId,
        tripId,
        savedItemId: itemForOpen.id,
        eventName: "partner_click_open_failed",
        partnerId: canonicalPartnerId,
        sourceSurface: cleanString(args.metadata?.sourceSurface) || null,
        sourceSection: cleanString(args.metadata?.sourceSection) || null,
        metadata: {
          message: cleanString((error as Error)?.message) || "open_failed",
        },
      });
    }

    await clearLastClickState();
    logError("beginPartnerClick browser open failed", error, {
      tripId,
      itemId: itemForOpen.id,
      clickId,
      partnerId: canonicalPartnerId,
    });

    throw error;
  }
}

export async function markBooked(
  itemId: string,
  options?: {
    sourceSurface?: string;
    sourceSection?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const id = cleanString(itemId);
  if (!id) return;

  await ensureSavedItemsLoaded();
  const current = getItemById(id);
  if (!current) return;

  if (current.status !== "booked") {
    await savedItemsStore.transitionStatus(id, "booked");
  }

  const refreshed = getItemById(id) ?? current;
  const trackedClickId =
    refreshed.partnerClickId && isTrackedPartnerClickId(refreshed.partnerClickId)
      ? refreshed.partnerClickId
      : null;

  if (trackedClickId && refreshed.tripId && refreshed.partnerId) {
    await markPartnerClickConverted({
      clickId: trackedClickId,
      tripId: refreshed.tripId,
      savedItemId: refreshed.id,
      partnerId: getCanonicalPartnerId(refreshed.partnerId),
      savedItemType: refreshed.type,
      bookingStatus: "booked",
      metadata: {
        ...(options?.metadata ?? {}),
        partnerTier: refreshed.partnerTier,
        partnerCategory: refreshed.partnerCategory,
      },
    });

    await logPartnerEvent({
      partnerClickId: trackedClickId,
      tripId: refreshed.tripId,
      savedItemId: refreshed.id,
      eventName: "partner_booking_marked_booked",
      partnerId: getCanonicalPartnerId(refreshed.partnerId),
      sourceSurface: options?.sourceSurface ?? refreshed.sourceSurface,
      sourceSection: options?.sourceSection ?? refreshed.sourceSection,
      metadata: {
        ...(options?.metadata ?? {}),
        bookingStatus: "booked",
        partnerTier: refreshed.partnerTier,
        partnerCategory: refreshed.partnerCategory,
      },
    });
  }

  if (lastClick?.itemId === id) {
    await clearLastClickState();
  }

  lastReturnHandledAt = now();

  logInfo("markBooked success", {
    itemId: refreshed.id,
    partnerClickId: refreshed.partnerClickId ?? null,
    tripId: refreshed.tripId ?? null,
    partnerId: refreshed.partnerId ?? null,
  });
}

export async function markNotBooked(itemId: string): Promise<void> {
  const id = cleanString(itemId);
  if (!id) return;

  await transitionIfCurrent(id, "pending", "saved");
  const current = getItemById(id);
  const trackedClickId =
    current?.partnerClickId && isTrackedPartnerClickId(current.partnerClickId)
      ? current.partnerClickId
      : null;

  if (current?.tripId && trackedClickId) {
    await logPartnerEvent({
      partnerClickId: trackedClickId,
      tripId: current.tripId,
      savedItemId: current.id,
      eventName: "partner_booking_not_booked",
      partnerId: current.partnerId ? getCanonicalPartnerId(current.partnerId) : null,
      sourceSurface: current.sourceSurface,
      sourceSection: current.sourceSection,
      metadata: {
        partnerTier: current.partnerTier,
        partnerCategory: current.partnerCategory,
      },
    });
  }

  if (lastClick?.itemId === id) {
    await clearLastClickState();
  }

  lastReturnHandledAt = now();

  logInfo("markNotBooked success", {
    itemId: current?.id ?? id,
    partnerClickId: current?.partnerClickId ?? null,
  });
}

export async function dismissReturnPrompt(itemId?: string): Promise<void> {
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

export function clearLastClick(itemId?: string): void {
  void dismissReturnPrompt(itemId);
}

export function getLastClick(): LastPartnerClick | null {
  return lastClick;
}

export function __unsafeResetPartnerClickStateForDevOnly(): void {
  try {
    appStateSub?.remove?.();
  } catch (error) {
    logError("__unsafeResetPartnerClickStateForDevOnly cleanup failed", error);
  }

  appStateSub = null;
  watcherSubscribed = false;
  onReturnHandler = null;
  openInFlight = false;
  returnInFlight = false;
  lastReturnHandledAt = 0;
  lastClick = null;
  lastClickLoaded = false;

  void clearLastClickState();
  }
