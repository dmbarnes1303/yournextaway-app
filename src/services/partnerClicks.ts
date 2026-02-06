// src/services/partnerClicks.ts
import { AppState, Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

import savedItemsStore from "@/src/state/savedItems";
import { getPartner, type PartnerId } from "@/src/core/partners";
import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";

/**
 * Phase 1 return detection:
 * - create pending before opening partner
 * - when app returns active, prompt user "Booked?"
 *
 * IMPORTANT HARDENING:
 * - if opening partner fails, roll back the pending item (avoid zombie items)
 * - prevent duplicate prompts by clearing lastClick before invoking onReturn
 */

type LastPartnerClick = {
  itemId: string;
  tripId: string;
  partnerId: PartnerId;
  url: string;
  createdAt: number;
};

let lastClick: LastPartnerClick | null = null;
let subscribed = false;

function now() {
  return Date.now();
}

function normalizeUrl(url: string): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

async function openUrl(url: string) {
  const u = normalizeUrl(url);
  if (!u) throw new Error("URL is required");

  if (Platform.OS === "web") {
    const can = await Linking.canOpenURL(u);
    if (!can) throw new Error("Cannot open URL");
    await Linking.openURL(u);
    return;
  }

  // Native: consistent in-app browser
  await WebBrowser.openBrowserAsync(u, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    readerMode: false,
    enableBarCollapsing: true,
    showTitle: true,
  });
}

/**
 * Call once near app startup (e.g. root layout).
 * Safe to call multiple times; subscribes only once.
 */
export function ensurePartnerReturnWatcher(onReturn: (click: LastPartnerClick) => void | Promise<void>) {
  if (subscribed) return;
  subscribed = true;

  let lastState = AppState.currentState;

  AppState.addEventListener("change", (next) => {
    const becameActive = Boolean(lastState.match(/inactive|background/)) && next === "active";
    lastState = next;

    if (!becameActive) return;
    if (!lastClick) return;

    // Only prompt if it’s recent (avoid zombie prompts)
    if (now() - lastClick.createdAt > 1000 * 60 * 60 * 6) {
      lastClick = null;
      return;
    }

    // Prevent re-entrant / duplicate prompts if app toggles active twice quickly.
    const click = lastClick;
    lastClick = null;

    Promise.resolve(onReturn(click)).catch(() => {
      // swallow: never crash app on return prompt
    });
  });
}

/**
 * Begin partner click:
 * - create pending SavedItem
 * - open partner
 * - store lastClick for fallback prompt on return
 */
export async function beginPartnerClick(args: {
  tripId: string;
  partnerId: PartnerId;
  url: string;

  /**
   * Optional override.
   * Default comes from partner registry.
   */
  savedItemType?: SavedItemType;

  /**
   * User-visible title used for the saved item.
   * Keep it short.
   */
  title?: string;

  metadata?: Record<string, any>;
}): Promise<SavedItem> {
  const tripId = String(args.tripId ?? "").trim();
  if (!tripId) throw new Error("tripId is required");

  const partner = getPartner(args.partnerId);

  const url = normalizeUrl(args.url);
  if (!url) throw new Error("url is required");

  // Ensure store is ready (cold start safety)
  if (!savedItemsStore.getState().loaded) {
    await savedItemsStore.load();
  }

  const type = args.savedItemType ?? partner.defaultSavedItemType;

  const title =
    String(args.title ?? "").trim() ||
    (partner.id === "getyourguide"
      ? `GetYourGuide: ${String(args.metadata?.city ?? "").trim() || "Things to do"}`
      : `${partner.name} search`);

  // Create pending item BEFORE opening partner (by design)
  const item = await savedItemsStore.add({
    tripId,
    type,
    status: "pending",
    title,
    partnerId: partner.id,
    partnerUrl: url,
    metadata: args.metadata,
  });

  // Stash click for return prompt (cleared by watcher when app resumes)
  lastClick = {
    itemId: item.id,
    tripId,
    partnerId: partner.id,
    url,
    createdAt: now(),
  };

  // Open partner. If this fails, rollback item to avoid “zombie pending”.
  try {
    await openUrl(url);
  } catch (e) {
    // rollback the item + click marker
    try {
      await savedItemsStore.remove(item.id);
    } catch {
      // ignore
    }
    if (lastClick?.itemId === item.id) lastClick = null;
    throw e;
  }

  return item;
}

/**
 * UI calls this after the “Did you book it?” prompt.
 */
export async function markBooked(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  // Ensure store ready (defensive)
  if (!savedItemsStore.getState().loaded) {
    await savedItemsStore.load();
  }

  await savedItemsStore.transitionStatus(id, "booked");
  if (lastClick?.itemId === id) lastClick = null;
}

/**
 * UI calls this if user says “not yet”.
 * We keep it pending for Phase 1.
 */
export async function markNotBooked(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  // no transition; remains pending
  if (lastClick?.itemId === id) lastClick = null;
}

/**
 * If a user dismisses the prompt, call this to avoid re-prompt loops.
 */
export function clearLastClick(itemId?: string) {
  if (!lastClick) return;

  if (!itemId) {
    lastClick = null;
    return;
  }

  const id = String(itemId ?? "").trim();
  if (id && lastClick.itemId === id) lastClick = null;
}

export function getLastClick(): LastPartnerClick | null {
  return lastClick;
}
