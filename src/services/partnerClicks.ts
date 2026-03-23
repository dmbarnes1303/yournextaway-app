import { AppState, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

import savedItemsStore from "@/src/state/savedItems";
import { getPartner, type PartnerCategory, type PartnerId } from "@/src/core/partners";
import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";
import { readJson, writeJson } from "@/src/state/persist";

export type LastPartnerClick = {
  itemId: string;
  tripId: string;
  partnerId: PartnerId;
  url: string;
  createdAt: number;
  openedAt: number;
};

const STORAGE_KEY = "yna_last_partner_click_v1";

let lastClick: LastPartnerClick | null = null;
let lastClickLoaded = false;

let subscribed = false;
let appStateSub: { remove: () => void } | null = null;
let onReturnHandler: ((click: LastPartnerClick) => void | Promise<void>) | null = null;

let opening = false;
let returnInFlight = false;
let lastReturnHandledAt = 0;

function now() {
  return Date.now();
}

function cleanString(v: unknown) {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
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

function isRecent(click: LastPartnerClick) {
  return now() - click.createdAt <= 1000 * 60 * 60 * 6;
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
    const partnerId = cleanString(raw.partnerId) as PartnerId;
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
    // ignore
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

async function tryTransitionPendingToSaved(itemId: string) {
  const id = cleanString(itemId);
  if (!id) return;

  await ensureSavedItemsLoaded();

  const cur = getItemById(id);
  if (!cur || cur.status !== "pending") return;

  try {
    await savedItemsStore.transitionStatus(id, "saved");
  } catch {
    // ignore
  }
}

async function tryTransitionSavedToPending(itemId: string) {
  const id = cleanString(itemId);
  if (!id) return;

  await ensureSavedItemsLoaded();

  const cur = getItemById(id);
  if (!cur || cur.status !== "saved") return;

  try {
    await savedItemsStore.transitionStatus(id, "pending");
  } catch {
    // ignore
  }
}

function defaultTypeForCategory(category: PartnerCategory): SavedItemType {
  switch (category) {
    case "tickets":
      return "tickets";
    case "flights":
      return "flight";
    case "stays":
      return "hotel";
    case "rail":
      return "train";
    case "transfers":
      return "transfer";
    case "experiences":
      return "things";
    case "insurance":
      return "insurance";
    case "compensation":
      return "claim";
    case "utility":
    default:
      return "other";
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

async function triggerReturnIfPresent(
  _reason: "appstate" | "browser_dismiss",
  meta?: { openDurationMs?: number }
) {
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

    const explicitDur = Number(meta?.openDurationMs ?? 0);
    const fallbackDur = Math.max(0, t - Number(click.openedAt || 0));
    const dur = explicitDur > 0 ? explicitDur : fallbackDur;

    const minOpenMs = 8000;

    if (dur > 0 && dur < minOpenMs) {
      await persistLastClick(null);
      await tryTransitionPendingToSaved(click.itemId);
      lastReturnHandledAt = now();
      return;
    }

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
 * Use this only for non-commercial/simple utility opens.
 * For partner flows that should create or reuse SavedItems and support return handling,
 * use beginPartnerClick instead.
 */
export async function openPartnerUrl(url: string) {
  return await openUntrackedUrl(url);
}

function cleanCity(meta?: Record<string, any>): string | null {
  const raw = meta?.city ?? meta?.destination ?? meta?.place;
  const s = cleanString(raw);
  return s || null;
}

function buildDefaultTitle(args: {
  partnerName: string;
  type: SavedItemType;
  metadata?: Record<string, any>;
}) {
  const city = cleanCity(args.metadata);
  const label = getSavedItemTypeLabel(args.type);

  switch (args.type) {
    case "hotel":
      return city ? `Stay: Hotels in ${city}` : "Stay: Hotels";
    case "flight":
      return city ? `Flights to ${city}` : "Flights";
    case "train":
      return city ? `Trains to ${city}` : "Trains";
    case "transfer":
      return city ? `Transfers in ${city}` : "Transfers";
    case "things":
      return city ? `Experiences in ${city}` : "Experiences";
    case "tickets":
      return city ? `Match tickets for ${city}` : "Match tickets";
    case "insurance":
      return city
        ? `Protect yourself: Travel insurance for ${city}`
        : "Protect yourself: Travel insurance";
    case "claim":
      return "Claims & compensation: Compensation help";
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
    if (cleanString(x.partnerId) !== cleanString(args.partnerId)) return false;
    if (String(x.type) !== String(args.type)) return false;

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

export async function beginPartnerClick(args: {
  tripId: string;
  partnerId: PartnerId;
  url: string;
  savedItemType?: SavedItemType;
  title?: string;
  metadata?: Record<string, any>;
}): Promise<SavedItem> {
  if (opening) throw new Error("Partner open already in progress");
  opening = true;

  let createdNew = false;
  let item: SavedItem | null = null;

  try {
    const tripId = cleanString(args.tripId);
    if (!tripId) throw new Error("tripId is required");

    const partner = getPartner(args.partnerId);

    const url = normalizeUrl(args.url);
    if (!url) throw new Error("url is required");

    await ensureSavedItemsLoaded();

    const type: SavedItemType =
      args.savedItemType ?? defaultTypeForCategory(partner.category);

    const reusable = findReusableItem({
      tripId,
      partnerId: partner.id as PartnerId,
      url,
      type,
    });

    if (reusable) {
      item = reusable;

      if (item.status === "booked") {
        await openUntrackedUrl(url);
        return item;
      }

      if (item.status === "saved") {
        await tryTransitionSavedToPending(item.id);
        item = getItemById(item.id) ?? item;
      }
    }

    if (!item) {
      const title =
        cleanString(args.title) ||
        buildDefaultTitle({
          partnerName: partner.name,
          type,
          metadata: args.metadata,
        });

      item = await savedItemsStore.add({
        tripId,
        type,
        status: "pending",
        title,
        partnerId: partner.id,
        partnerUrl: url,
        metadata: args.metadata,
      });

      createdNew = true;
    }

    const openedAt = now();

    if (item.status === "pending") {
      await persistLastClick({
        itemId: item.id,
        tripId,
        partnerId: partner.id as PartnerId,
        url,
        createdAt: openedAt,
        openedAt,
      });
    } else {
      await persistLastClick(null);
    }

    try {
      const res = await openUrlInternal(url);
      const openDurationMs = now() - openedAt;

      const t = cleanString((res as any)?.type).toLowerCase();
      const isDismissLike = t === "dismiss" || t === "cancel";

      if (isDismissLike) {
        await triggerReturnIfPresent("browser_dismiss", { openDurationMs });
      }
    } catch (e) {
      if (createdNew && item) {
        try {
          await savedItemsStore.remove(item.id);
        } catch {}
      }

      await persistLastClick(null);
      throw e;
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

  await tryTransitionPendingToSaved(id);

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
