// src/services/partnerClicks.ts
import { AppState, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

import savedItemsStore from "@/src/state/savedItems";
import { getPartner, type PartnerId, type PartnerCategory } from "@/src/core/partners";
import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";
import { readJson, writeJson } from "@/src/state/persist";

/**
 * Phase 1 partner return detection:
 * - tracked open ensures a SavedItem exists in "pending" and stores lastClick
 * - on return, UI can prompt:
 *   YES -> booked
 *   NO  -> saved
 *   NOT NOW -> keep pending
 *
 * Hardening:
 * - global opening guard
 * - rollback if open fails (only if we created a new pending item)
 * - avoid stale zombie prompts (age limit)
 * - instant-dismiss rot: if the browser session was too brief, don't prompt;
 *   instead auto-demote pending -> saved.
 *
 * De-duplication:
 * - Reuse existing matching item (pending > saved > booked)
 * - If saved is reused, promote to pending before opening
 * - If booked is reused, open untracked (no prompt)
 */

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

// Watcher lifecycle
let subscribed = false;
let appStateSub: { remove: () => void } | null = null;
let onReturnHandler: ((click: LastPartnerClick) => void | Promise<void>) | null = null;

// Prevent double-taps / concurrent opens
let opening = false;

// Return de-dupe gate (prevents double modal from AppState + browser dismiss)
let returnInFlight = false;
let lastReturnHandledAt = 0;

function now() {
  return Date.now();
}

function normalizeUrl(url: string): string {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const u = new URL(withProto);
    const host = u.hostname.toLowerCase();
    const pathname = u.pathname || "/";
    const search = u.search || "";
    const proto = (u.protocol || "https:").toLowerCase();
    // (hash intentionally dropped for dedupe)
    return `${proto}//${host}${pathname}${search}`.trim();
  } catch {
    return withProto.trim();
  }
}

function isRecent(click: LastPartnerClick) {
  return now() - click.createdAt <= 1000 * 60 * 60 * 6; // 6 hours
}

async function persistLastClick(next: LastPartnerClick | null) {
  lastClick = next;
  try {
    await writeJson(STORAGE_KEY, next);
  } catch {
    // best-effort
  }
}

async function loadLastClickOnce() {
  if (lastClickLoaded) return;
  lastClickLoaded = true;

  try {
    const raw = await readJson<any>(STORAGE_KEY, null);
    if (!raw || typeof raw !== "object") return;

    const itemId = String(raw.itemId ?? "").trim();
    const tripId = String(raw.tripId ?? "").trim();
    const partnerId = String(raw.partnerId ?? "").trim() as PartnerId;
    const url = normalizeUrl(String(raw.url ?? ""));
    const createdAt = Number(raw.createdAt);
    const openedAt = Number(raw.openedAt);

    if (!itemId || !tripId || !partnerId || !url) return;
    if (!Number.isFinite(createdAt) || !Number.isFinite(openedAt)) return;

    const candidate: LastPartnerClick = { itemId, tripId, partnerId, url, createdAt, openedAt };
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

async function tryTransitionPendingToSaved(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  await ensureSavedItemsLoaded();
  const cur = savedItemsStore.getState().items.find((x) => x.id === id);
  if (!cur) return;
  if (cur.status !== "pending") return;

  try {
    await savedItemsStore.transitionStatus(id, "saved");
  } catch {
    // ignore
  }
}

async function tryTransitionSavedToPending(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  await ensureSavedItemsLoaded();
  const cur = savedItemsStore.getState().items.find((x) => x.id === id);
  if (!cur) return;
  if (cur.status !== "saved") return;

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
    // eslint-disable-next-line no-undef
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

/**
 * Consume lastClick and invoke handler (once).
 *
 * Instant dismiss policy:
 * - if browser session was too brief => do NOT prompt
 * - auto-demote pending -> saved so Pending doesn't rot
 *
 * IMPORTANT HARDENING:
 * - AppState and browser dismiss can both fire; we de-dupe with returnInFlight + lastReturnHandledAt.
 */
async function triggerReturnIfPresent(reason: "appstate" | "browser_dismiss", meta?: { openDurationMs?: number }) {
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
    if (!handler) {
      return;
    }

    await persistLastClick(null);

    try {
      await Promise.resolve(handler(click));
    } catch {
      // Never crash the app on return prompt
    } finally {
      lastReturnHandledAt = now();
    }
  } finally {
    returnInFlight = false;
  }
}

/** Dev diagnostics */
export function getPartnerClicksDebugState() {
  return { opening, subscribed, lastClick };
}

/**
 * Idempotent watcher.
 */
export function ensurePartnerReturnWatcher(onReturn: (click: LastPartnerClick) => void | Promise<void>) {
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
    const becameActive = Boolean(String(lastState).match(/inactive|background/)) && next === "active";
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

/** Backwards-compat alias used by Wallet */
export async function openPartnerUrl(url: string) {
  return await openUntrackedUrl(url);
}

function cleanCity(meta?: Record<string, any>): string | null {
  const raw = meta?.city ?? meta?.destination ?? meta?.place;
  const s = String(raw ?? "").trim();
  return s || null;
}

function buildDefaultTitle(args: { partnerName: string; type: SavedItemType; metadata?: Record<string, any> }): string {
  const city = cleanCity(args.metadata);
  const label = getSavedItemTypeLabel(args.type);

  switch (args.type) {
    case "hotel":
      return city ? `Stay: Hotels in ${city}` : `Stay: Hotels`;
    case "flight":
      return city ? `Flights to ${city}` : `Flights`;
    case "train":
      return city ? `Trains to ${city}` : `Trains`;
    case "transfer":
      return city ? `Transfers in ${city}` : `Transfers`;
    case "things":
      return city ? `Experiences in ${city}` : `Experiences`;
    case "tickets":
      return city ? `Match tickets for ${city}` : `Match tickets`;
    case "insurance":
      return city ? `Protect yourself: Travel insurance for ${city}` : `Protect yourself: Travel insurance`;
    case "claim":
      return `Claims & compensation: Compensation help`;
    default:
      return city ? `${label}: ${city}` : `${label}: ${args.partnerName}`;
  }
}

function findReusableItem(args: { tripId: string; partnerId: PartnerId; url: string; type: SavedItemType }): SavedItem | null {
  const tripId = String(args.tripId ?? "").trim();
  const url = normalizeUrl(args.url);
  if (!tripId || !url) return null;

  const items = savedItemsStore.getState().items;

  const matches = items.filter((x) => {
    if (String(x.tripId) !== tripId) return false;
    if (String(x.partnerId ?? "") !== String(args.partnerId)) return false;
    if (normalizeUrl(String(x.partnerUrl ?? "")) !== url) return false;
    if (String(x.type) !== String(args.type)) return false;
    return true;
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
    const tripId = String(args.tripId ?? "").trim();
    if (!tripId) throw new Error("tripId is required");

    const partner = getPartner(args.partnerId);

    const url = normalizeUrl(args.url);
    if (!url) throw new Error("url is required");

    await ensureSavedItemsLoaded();

    const type: SavedItemType = args.savedItemType ?? defaultTypeForCategory(partner.category);

    const reusable = findReusableItem({ tripId, partnerId: partner.id as PartnerId, url, type });

    if (reusable) {
      item = reusable;

      if (item.status === "booked") {
        await openUntrackedUrl(url);
        return item;
      }

      if (item.status === "saved") {
        await tryTransitionSavedToPending(item.id);
        item = savedItemsStore.getState().items.find((x) => x.id === item!.id) ?? item;
      }
    }

    if (!item) {
      const title =
        String(args.title ?? "").trim() ||
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

      const t = String((res as any)?.type ?? "").toLowerCase();
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
  const id = String(itemId ?? "").trim();
  if (!id) return;

  await ensureSavedItemsLoaded();
  await savedItemsStore.transitionStatus(id, "booked");

  if (lastClick?.itemId === id) {
    await persistLastClick(null);
  }

  lastReturnHandledAt = now();
}

export async function markNotBooked(itemId: string) {
  const id = String(itemId ?? "").trim();
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

  const id = String(itemId ?? "").trim();
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
