// src/services/partnerClicks.ts
import { AppState, Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

import savedItemsStore from "@/src/state/savedItems";
import { getPartner, type PartnerId } from "@/src/core/partners";
import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";

/**
 * We keep “return detection” deliberately simple for Phase 1.
 * Deep link/referrer detection across partners is unreliable.
 *
 * Primary path (later):
 * - platform deep link / referrer signals (where possible)
 *
 * Phase 1 fallback:
 * - always create pending
 * - when app returns to active, show a prompt: “Did you book it?”
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

  await WebBrowser.openBrowserAsync(u, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    readerMode: false,
    enableBarCollapsing: true,
    showTitle: true,
  });
}

/**
 * Call once near app startup (e.g. root layout) to enable “return prompt” detection.
 * You can safely call it multiple times; it will only subscribe once.
 */
export function ensurePartnerReturnWatcher(onReturn: (click: LastPartnerClick) => void) {
  if (subscribed) return;
  subscribed = true;

  let lastState = AppState.currentState;

  AppState.addEventListener("change", (next) => {
    const becameActive = lastState.match(/inactive|background/) && next === "active";
    lastState = next;

    if (!becameActive) return;
    if (!lastClick) return;

    // Only prompt if it’s recent (avoid zombie prompts)
    if (now() - lastClick.createdAt > 1000 * 60 * 60 * 6) {
      lastClick = null;
      return;
    }

    onReturn(lastClick);
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
   * Optional override (rare).
   * Default comes from partner registry.
   */
  savedItemType?: SavedItemType;

  /**
   * User-visible title used for the saved item.
   * Keep it short. Examples:
   * - "Hotel options in Berlin"
   * - "Flights for Rome trip"
   * - "GetYourGuide: Barcelona"
   */
  title?: string;

  metadata?: Record<string, any>;
}): Promise<SavedItem> {
  const tripId = String(args.tripId ?? "").trim();
  if (!tripId) throw new Error("tripId is required");

  const partner = getPartner(args.partnerId);
  const url = normalizeUrl(args.url);
  if (!url) throw new Error("url is required");

  const type = args.savedItemType ?? partner.defaultSavedItemType;

  const title =
    String(args.title ?? "").trim() ||
    (partner.id === "getyourguide"
      ? `GetYourGuide: ${args.metadata?.city ?? "Things to do"}`
      : `${partner.name} search`);

  // Create pending item BEFORE opening partner
  const item = await savedItemsStore.add({
    tripId,
    type,
    status: "pending",
    title,
    partnerId: partner.id,
    partnerUrl: url,
    metadata: args.metadata,
  });

  lastClick = {
    itemId: item.id,
    tripId,
    partnerId: partner.id,
    url,
    createdAt: now(),
  };

  // Open partner
  await openUrl(url);

  return item;
}

/**
 * The UI calls this after the “Did you book it?” prompt.
 */
export async function markBooked(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;
  await savedItemsStore.transitionStatus(id, "booked");
  if (lastClick?.itemId === id) lastClick = null;
}

/**
 * The UI calls this if user says “not yet”.
 * We keep it pending; optionally you can set to saved later.
 */
export async function markNotBooked(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;
  // no transition; remains pending
  if (lastClick?.itemId === id) lastClick = null;
}

/**
 * If a user dismisses the prompt, you can call this to avoid re-prompt loops.
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
