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
import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
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

let lastClick: LastPartnerClick | null = null;
let lastClickLoaded = false;

let subscribed = false;
let appStateSub: { remove: () => void } | null = null;
let onReturnHandler: ((click: LastPartnerClick) => void | Promise<void>) | null = null;

let opening = false;
let returnInFlight = false;
let lastReturnHandledAt = 0;

/* -------------------------------------------------------------------------- */
/* Canonical category -> SavedItemType mapping                                */
/* -------------------------------------------------------------------------- */

/**
 * SavedItemType remains the persistence contract for now.
 * Canonical partner categories map into it explicitly here.
 */
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

function cleanString(v: unknown) {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function isRecent(click: LastPartnerClick) {
  return now() - click.createdAt <= CLICK_RETENTION_MS;
}

function normalizeUrl(url: string): string {
  const raw = cleanString(url);
  if (!raw) return "";

  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const u = new URL(withProto);
    const host = u.hostname.toLowerCase();
    const pathname = u.pathname || "/";
    const search = u.search || "";
    const proto = (u.protocol || "https:").toLowerCase();
    return `${proto}//${host}${pathname}${search}`.trim();
  } catch {
    return withProto.trim();
  }
}

function normalizeUrlLoose(url: string): string {
  const raw = cleanString(url);
  if (!raw) return "";

  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const u = new URL(withProto);
    const host = u.hostname.toLowerCase();
    const pathname = (u.pathname || "/").replace(/\/+$/, "") || "/";
    const proto = (u.protocol || "https:").toLowerCase();
    return `${proto}//${host}${pathname}`;
  } catch {
    return withProto.trim();
  }
}

function isDeterministicallyReusable(item: SavedItem): boolean {
  return item.status === "pending" || item.status === "saved" || item.status === "booked";
}

async function persistLastClick(next: LastPartnerClick | null) {
  lastClick = next;

  try {
    await writeJson(STORAGE_KEY, next);
  } catch {
    // best-effort only
  }
}

async function loadLastClickOnce() {
  if (lastClickLoaded) return;
  lastClickLoaded = true;

  try {
    const raw = await readJson<any>(STORAGE_KEY, null);
    if (!raw || typeof raw !== "object") return;

    const itemId = cleanString(raw.itemId);
    const tripId = cleanString(raw.tripId);
    const partnerId = getCanonicalPartnerId(cleanString(raw.partnerId));
    const partnerCategory = getPartner(partnerId).primaryCategory;
    const savedItemType =
      typeof raw.savedItemType === "string" && cleanString(raw.savedItemType)
        ? (cleanString(raw.savedItemType) as SavedItemType)
        : mapPartnerCategoryToSavedItemType(partnerCategory);
    const url = normalizeUrl(cleanString(raw.url));
    const createdAt = Number(raw.createdAt);
    const openedAt = Number(raw.openedAt);

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
      await persistLastClick(null);
      return;
    }

    lastClick = candidate;
  } catch {
    // ignore corrupt or old payloads
  }
}

async function ensureSavedItemsLoaded() {
  if (savedItemsStore.getState().loaded) return;

  try {
    await savedItemsStore.load();
  } catch {
    // ignore
  }
}

function getItemById(itemId: string): SavedItem | undefined {
  return savedItemsStore.getById(itemId);
}

async function transitionIfCurrent(
  itemId: string,
  fromStatus: SavedItem["status"],
  toStatus: SavedItem["status"]
) {
  const id = cleanString(itemId);
  if (!id) return;

  await ensureSavedItemsLoaded();

  const cur = getItemById(id);
  if (!cur || cur.status !== fromStatus) return;

  try {
    await savedItemsStore.transitionStatus(id, toStatus);
  } catch {
    // ignore
  }
}

async function openUrlInternal(url: string) {
  const u = normalizeUrl(url);
  if (!u) throw new Error("URL is required");

  if (Platform.OS === "web") {
    window.open(u, "_blank", "noopener,noreferrer");
    return { type: "opened" as const };
  }

  return await WebBrowser.openBrowserAsync(u, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    readerMode: false,
    enableBarCollapsing: true,
    showTitle: true,
  });
}

async function triggerReturnIfPresent(_reason: "appstate" | "browser_dismiss") {
  const t = now();
  if (returnInFlight) return;
  if (t - lastReturnHandledAt < 1500) return;

  returnInFlight = true;

  try {
    await loadLastClickOnce();

    if (!lastClick) return;

    if (!isRecent(lastClick)) {
      await persistLastClick(null);
      return;
    }

    const click = lastClick;
    const handler = onReturnHandler;
    if (!handler) return;

    await persistLastClick(null);

    try {
      await Promise.resolve(handler(click));
    } catch {
      // never crash return flow
    } finally {
      lastReturnHandledAt = now();
    }
  } finally {
    returnInFlight = false;
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

  const matches = items.filter((x) => {
    if (cleanString(x.tripId) !== tripId) return false;
    if (cleanString(x.partnerId) !== args.partnerId) return false;
    if (String(x.type) !== String(args.type)) return false;
    if (!isDeterministicallyReusable(x)) return false;

    const itemStrict = normalizeUrl(cleanString(x.partnerUrl));
    const itemLoose = normalizeUrlLoose(cleanString(x.partnerUrl));

    return itemStrict === strictUrl || itemLoose === looseUrl;
  });

  if (matches.length === 0) return null;

  return (
    matches.find((m) => m.status === "pending") ??
    matches.find((m) => m.status === "saved") ??
    matches.find((m) => m.status === "booked") ??
    null
  );
}

/* -------------------------------------------------------------------------- */
/* Public runtime API                                                         */
/* -------------------------------------------------------------------------- */

export function getPartnerClicksDebugState() {
  return { opening, subscribed, lastClick };
}

export function ensurePartnerReturnWatcher(
  onReturn: (click: LastPartnerClick) => void | Promise<void>
) {
  onReturnHandler = onReturn;

  if (subscribed) {
    return () => {
      try {
        appStateSub?.remove?.();
      } catch {}
      appStateSub = null;
      subscribed = false;
      onReturnHandler = null;
    };
  }

  subscribed = true;
  loadLastClickOnce().catch(() => null);

  let lastState = AppState.currentState;

  const sub = AppState.addEventListener("change", (next) => {
    const becameActive =
      Boolean(String(lastState).match(/inactive|background/)) && next === "active";
    lastState = next;

    if (!becameActive) return;

    triggerReturnIfPresent("appstate").catch(() => null);
  });

  appStateSub = sub as any;

  return () => {
    try {
      appStateSub?.remove?.();
    } catch {}
    appStateSub = null;
    subscribed = false;
    onReturnHandler = null;
  };
}

export async function openUntrackedUrl(url: string) {
  const u = normalizeUrl(url);
  if (!u) throw new Error("url is required");
  if (opening) throw new Error("Partner open already in progress");

  opening = true;

  try {
    await openUrlInternal(u);
  } finally {
    opening = false;
  }
}

/**
 * Utility/simple opens only.
 * Commercial or utility actions that need SavedItem reuse / session tracking
 * should go through beginPartnerClick.
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
  if (opening) throw new Error("Partner open already in progress");
  opening = true;

  let createdNew = false;
  let promotedFromSaved = false;
  let item: SavedItem | null = null;

  try {
    const tripId = cleanString(args.tripId);
    if (!tripId) throw new Error("tripId is required");

    const canonicalPartnerId = getCanonicalPartnerId(args.partnerId);
    const partner = getPartner(canonicalPartnerId);

    const url = normalizeUrl(args.url);
    if (!url) throw new Error("url is required");

    const savedItemType =
      args.savedItemType ?? mapPartnerCategoryToSavedItemType(partner.primaryCategory);

    await ensureSavedItemsLoaded();

    const reusable = findReusableItem({
      tripId,
      partnerId: canonicalPartnerId,
      url,
      type: savedItemType,
    });

    if (reusable) {
      item = reusable;

      if (item.status === "booked") {
        await persistLastClick(null);
        await openUntrackedUrl(url);
        return item;
      }

      if (item.status === "saved") {
        promotedFromSaved = true;
        await transitionIfCurrent(item.id, "saved", "pending");
        item = getItemById(item.id) ?? item;
      }
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

    const clickAt = now();

    if (!isUtilityPartner(canonicalPartnerId) && item.status === "pending") {
      await persistLastClick({
        itemId: item.id,
        tripId,
        partnerId: canonicalPartnerId,
        partnerCategory: partner.primaryCategory,
        savedItemType,
        url,
        createdAt: clickAt,
        openedAt: clickAt,
      });
    } else {
      await persistLastClick(null);
    }

    try {
      const res = await openUrlInternal(url);
      const resultType = cleanString((res as any)?.type).toLowerCase();
      const isDismissLike = resultType === "dismiss" || resultType === "cancel";

      if (isDismissLike && !isUtilityPartner(canonicalPartnerId)) {
        await triggerReturnIfPresent("browser_dismiss");
      }
    } catch (error) {
      if (createdNew && item) {
        try {
          await savedItemsStore.remove(item.id);
        } catch {
          // ignore
        }
      } else if (promotedFromSaved && item) {
        await transitionIfCurrent(item.id, "pending", "saved");
      }

      await persistLastClick(null);
      throw error;
    }

    return item;
  } finally {
    opening = false;
  }
}

export async function markBooked(itemId: string) {
  const id = cleanString(itemId);
  if (!id) return;

  await ensureSavedItemsLoaded();
  await savedItemsStore.transitionStatus(id, "booked");

  if (lastClick?.itemId === id) {
    await persistLastClick(null);
  }

  lastReturnHandledAt = now();
}

export async function markNotBooked(itemId: string) {
  const id = cleanString(itemId);
  if (!id) return;

  await transitionIfCurrent(id, "pending", "saved");

  if (lastClick?.itemId === id) {
    await persistLastClick(null);
  }

  lastReturnHandledAt = now();
}

export async function dismissReturnPrompt(itemId?: string) {
  if (!lastClick) return;

  if (!itemId) {
    await persistLastClick(null);
    lastReturnHandledAt = now();
    return;
  }

  const id = cleanString(itemId);
  if (id && lastClick.itemId === id) {
    await persistLastClick(null);
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
  } catch {}

  appStateSub = null;
  subscribed = false;
  onReturnHandler = null;
  void persistLastClick(null);
  opening = false;
  lastClickLoaded = false;
  returnInFlight = false;
  lastReturnHandledAt = 0;
}
