// src/services/partnerClicks.ts
import { AppState, Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

import savedItemsStore from "@/src/state/savedItems";
import { getPartner, type PartnerId } from "@/src/core/partners";
import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";

/**
 * Phase 1 partner return detection:
 * - A *tracked* open sets/keeps a SavedItem in "pending" and stores lastClick
 * - On return (AppState active OR browser dismiss), UI can prompt:
 *   YES  -> booked
 *   NO   -> saved
 *   NOT NOW -> keep pending
 *
 * Hardening:
 * - global opening guard
 * - rollback if open fails (only if we created a new pending item)
 * - avoid stale zombie prompts (age limit)
 * - avoid instant-dismiss rot: if browser was open too briefly, don't prompt;
 *   instead auto-demote pending -> saved.
 *
 * De-duplication (important):
 * - If an existing item already represents this same partner URL for this trip,
 *   we REUSE it (prefer pending > saved > booked) instead of creating duplicates.
 * - If reused item is "saved", we promote to "pending" before opening so the
 *   return prompt remains valid.
 * - If reused item is "booked", we do NOT promote or prompt; we just open untracked.
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
      return `Claims & compensation: Compensation help`;
    case "note":
    case "other":
      return "Notes";
    default:
      return city ? `${label}: ${city}` : `${label}: ${args.partnerName}`;
  }
}

/**
 * Reuse policy:
 * - Match by tripId + partnerId + partnerUrl (normalized) + type
 * - Prefer pending (already tracked) > saved (promote to pending) > booked (open untracked)
 */
function findReusableItem(args: {
  tripId: string;
  partnerId: PartnerId;
  url: string;
  type: SavedItemType;
}): SavedItem | null {
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

  const pending = matches.find((m) => m.status === "pending");
  if (pending) return pending;

  const saved = matches.find((m) => m.status === "saved");
  if (saved) return saved;

  const booked = matches.find((m) => m.status === "booked");
  if (booked) return booked;

  // archived (ignore for reuse here)
  return null;
}

/**
 * Public: tracked partner click
 * - reuses existing item when possible (prevents duplicates)
 * - ensures item is pending before open if we intend to prompt on return
 * - stores lastClick only when return prompting is relevant
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

  let createdNew = false;
  let item: SavedItem | null = null;

  try {
    const tripId = String(args.tripId ?? "").trim();
    if (!tripId) throw new Error("tripId is required");

    const partner = getPartner(args.partnerId);

    const url = normalizeUrl(args.url);
    if (!url) throw new Error("url is required");

    await ensureSavedItemsLoaded();

    const type = (args.savedItemType ?? partner.defaultSavedItemType) as SavedItemType;

    // 1) Reuse if possible
    const reusable = findReusableItem({ tripId, partnerId: partner.id, url, type });

    if (reusable) {
      item = reusable;

      // If it's booked, don't re-track / re-prompt.
      if (item.status === "booked") {
        await openUntrackedUrl(url);
        return item;
      }

      // If it's saved, promote to pending so the return prompt makes sense.
      if (item.status === "saved") {
        await tryTransitionSavedToPending(item.id);
        // refresh from store (title/status might have changed)
        item = savedItemsStore.getState().items.find((x) => x.id === item!.id) ?? item;
      }
    }

    // 2) If no reusable item, create a new pending one
    if (!item) {
      const title =
        String(args.title ?? "").trim() ||
        buildDefaultTitle({
          partnerId: partner.id,
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

    // 3) Track lastClick for return prompt (pending only)
    const openedAt = now();
    if (item.status === "pending") {
      lastClick = {
        itemId: item.id,
        tripId,
        partnerId: partner.id,
        url,
        createdAt: openedAt,
        openedAt,
      };
    } else {
      // if something drifted, don't keep a stale click
      lastClick = null;
    }

    // 4) Open partner
    try {
      const res = await openUrlInternal(url);

      const openDurationMs = now() - openedAt;

      const t = String((res as any)?.type ?? "").toLowerCase();
      const isDismissLike = t === "dismiss" || t === "cancel";

      if (isDismissLike) {
        await triggerReturnIfPresent("browser_dismiss", { openDurationMs });
      }
    } catch (e) {
      // Only rollback if we created a brand new item for this click.
      if (createdNew && item) {
        try {
          await savedItemsStore.remove(item.id);
        } catch {
          // ignore
        }
      }

      if (lastClick?.itemId === item?.id) lastClick = null;
      throw e;
    }

    return item;
  } finally {
    opening = false;
  }
}

/** YES flow (pending -> booked) */
export async function markBooked(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  await ensureSavedItemsLoaded();
  await savedItemsStore.transitionStatus(id, "booked");
  if (lastClick?.itemId === id) lastClick = null;
}

/** NO flow (pending -> saved) */
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
