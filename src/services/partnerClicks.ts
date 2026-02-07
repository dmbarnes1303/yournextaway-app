// src/services/partnerClicks.ts
import { AppState, Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

import savedItemsStore from "@/src/state/savedItems";
import { getPartner, type PartnerId } from "@/src/core/partners";
import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";

/**
 * Phase 1 return detection (Option B):
 * - beginPartnerClick creates a pending item, stores lastClick
 * - prompt on return (AppState OR browser dismiss)
 *
 * Option B semantics:
 * - YES  => pending -> booked
 * - NO   => pending -> saved
 * - NOT NOW => keep pending (but stop immediate re-prompt)
 *
 * HARDENING:
 * - global opening guard
 * - rollback pending item if opening fails
 * - avoid zombie prompts (age limit)
 * - avoid "instant dismiss" pending rot by auto-demoting pending->saved
 */

export type LastPartnerClick = {
  itemId: string;
  tripId: string;
  partnerId: PartnerId;
  url: string;

  createdAt: number;
  openedAt: number;
};

let lastClick: LastPartnerClick | null = null;

let subscribed = false;
let appStateSub: { remove: () => void } | null = null;

let onReturnHandler: ((click: LastPartnerClick) => void | Promise<void>) | null = null;

/** Prevent double-taps / concurrent opens */
let opening = false;

function now() {
  return Date.now();
}

function normalizeUrl(url: string): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function isRecent(click: LastPartnerClick) {
  return now() - click.createdAt <= 1000 * 60 * 60 * 6; // 6 hours
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

/**
 * Consume lastClick exactly once and invoke handler.
 *
 * Instant dismiss policy:
 * - if browser dismisses too fast => do NOT prompt
 * - BUT auto-demote pending -> saved so Pending doesn't rot
 */
async function triggerReturnIfPresent(
  reason: "appstate" | "browser_dismiss",
  meta?: { openDurationMs?: number }
) {
  if (!lastClick) return;

  if (!isRecent(lastClick)) {
    lastClick = null;
    return;
  }

  const click = lastClick;

  const minOpenMs = 8000;
  const dur = Number(meta?.openDurationMs ?? 0);
  if (reason === "browser_dismiss" && dur > 0 && dur < minOpenMs) {
    lastClick = null;
    await tryTransitionPendingToSaved(click.itemId);
    return;
  }

  const handler = onReturnHandler;

  // If handler not registered yet, keep lastClick so bootstrap can attach later.
  if (!handler) return;

  // Clear exactly once
  lastClick = null;

  try {
    await Promise.resolve(handler(click));
  } catch {
    // never crash app on return prompt
  }
}

async function openUrlInternal(url: string) {
  const u = normalizeUrl(url);
  if (!u) throw new Error("URL is required");

  if (Platform.OS === "web") {
    const can = await Linking.canOpenURL(u);
    if (!can) throw new Error("Cannot open URL");
    await Linking.openURL(u);
    return { type: "opened" as const };
  }

  const res = await WebBrowser.openBrowserAsync(u, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    readerMode: false,
    enableBarCollapsing: true,
    showTitle: true,
  });

  return res;
}

/** Dev diagnostics */
export function getPartnerClicksDebugState() {
  return { opening, subscribed, lastClick };
}

export function ensurePartnerReturnWatcher(onReturn: (click: LastPartnerClick) => void | Promise<void>) {
  onReturnHandler = onReturn;

  if (subscribed) return;
  subscribed = true;

  let lastState = AppState.currentState;

  const sub = AppState.addEventListener("change", (next) => {
    const becameActive = Boolean(String(lastState).match(/inactive|background/)) && next === "active";
    lastState = next;
    if (!becameActive) return;

    triggerReturnIfPresent("appstate").catch(() => null);
  });

  appStateSub = sub as any;
}

/**
 * Public: open a URL WITHOUT creating a pending item and WITHOUT prompts.
 * Use this for:
 * - maps
 * - opening existing saved items
 * - any “just open it” links
 */
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

function buildDefaultTitle(args: {
  partnerId: PartnerId;
  partnerName: string;
  type: SavedItemType;
  metadata?: Record<string, any>;
}): string {
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
      return `Protect yourself: Compensation help`;
    case "note":
    case "other":
      return "Notes";
    default:
      return city ? `${label}: ${city}` : `${label}: ${args.partnerName}`;
  }
}

/**
 * Public: tracked partner click
 * - creates pending SavedItem
 * - opens partner
 * - stores lastClick so return prompt can happen
 */
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

  try {
    const tripId = String(args.tripId ?? "").trim();
    if (!tripId) throw new Error("tripId is required");

    const partner = getPartner(args.partnerId);

    const url = normalizeUrl(args.url);
    if (!url) throw new Error("url is required");

    if (!savedItemsStore.getState().loaded) {
      await savedItemsStore.load();
    }

    const type = (args.savedItemType ?? partner.defaultSavedItemType) as SavedItemType;

    const title =
      String(args.title ?? "").trim() ||
      buildDefaultTitle({
        partnerId: partner.id,
        partnerName: partner.name,
        type,
        metadata: args.metadata,
      });

    const item = await savedItemsStore.add({
      tripId,
      type,
      status: "pending",
      title,
      partnerId: partner.id,
      partnerUrl: url,
      metadata: args.metadata,
    });

    const openedAt = now();
    lastClick = {
      itemId: item.id,
      tripId,
      partnerId: partner.id,
      url,
      createdAt: openedAt,
      openedAt,
    };

    try {
      const res = await openUrlInternal(url);

      const openDurationMs = now() - openedAt;

      const t = String((res as any)?.type ?? "").toLowerCase();
      const isDismissLike = t === "dismiss" || t === "cancel";

      if (isDismissLike) {
        await triggerReturnIfPresent("browser_dismiss", { openDurationMs });
      }
    } catch (e) {
      // Rollback pending item if opening fails
      try {
        await savedItemsStore.remove(item.id);
      } catch {
        // ignore
      }
      if (lastClick?.itemId === item.id) lastClick = null;
      throw e;
    }

    return item;
  } finally {
    opening = false;
  }
}

/** YES flow */
export async function markBooked(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  await ensureSavedItemsLoaded();
  await savedItemsStore.transitionStatus(id, "booked");
  if (lastClick?.itemId === id) lastClick = null;
}

/** NO flow (Option B): pending -> saved */
export async function markNotBooked(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  await tryTransitionPendingToSaved(id);
  if (lastClick?.itemId === id) lastClick = null;
}

/** NOT NOW flow: keep pending, clear lastClick so it doesn’t re-prompt instantly */
export function dismissReturnPrompt(itemId?: string) {
  if (!lastClick) return;

  if (!itemId) {
    lastClick = null;
    return;
  }

  const id = String(itemId ?? "").trim();
  if (id && lastClick.itemId === id) lastClick = null;
}

/** Backwards compat */
export function clearLastClick(itemId?: string) {
  dismissReturnPrompt(itemId);
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
  subscribed = false;
  onReturnHandler = null;
  lastClick = null;
  opening = false;
}
