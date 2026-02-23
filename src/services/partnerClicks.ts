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
 * - on return (AppState active OR browser dismiss), UI can prompt:
 *   YES -> booked
 *   NO -> saved
 *   NOT NOW -> keep pending
 *
 * Hardening:
 * - global opening guard
 * - rollback if open fails (only if we created a new pending item)
 * - avoid stale zombie prompts (age limit)
 * - avoid instant-dismiss rot: if browser was open too briefly, don't prompt;
 *   instead auto-demote pending -> saved.
 *
 * De-duplication (CRITICAL FIX):
 * - Identity is (tripId + partnerId + type). URL changes are normal.
 * - Reuse existing matching item (pending > saved > booked), regardless of URL.
 * - When reusing, update partnerUrl to the new URL (best-effort).
 * - If booked is reused: open untracked (no prompt).
 * - Best-effort cleanup: archive duplicates with same identity.
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

let subscribed = false;
let appStateSub: { remove: () => void } | null = null;

let onReturnHandler: ((click: LastPartnerClick) => void | Promise<void>) | null = null;

/** Prevent double-taps / concurrent opens */
let opening = false;

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
    // Web: canOpenURL is unreliable; just open a new tab.
    window.open(u, "_blank", "noopener,noreferrer");
    return { type: "opened" as const };
  }

  // Native:
  return await WebBrowser.openBrowserAsync(u, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    readerMode: false,
    enableBarCollapsing: true,
    showTitle: true,
  });
}

/**
 * Consume lastClick exactly once and invoke handler.
 *
 * Instant dismiss policy:
 * - if browser dismisses too fast => do NOT prompt
 * - auto-demote pending -> saved so Pending doesn't rot
 */
async function triggerReturnIfPresent(
  reason: "appstate" | "browser_dismiss",
  meta?: { openDurationMs?: number }
) {
  await loadLastClickOnce();
  if (!lastClick) return;

  if (!isRecent(lastClick)) {
    await persistLastClick(null);
    return;
  }

  const click = lastClick;

  const minOpenMs = 8000;
  const dur = Number(meta?.openDurationMs ?? 0);

  if (reason === "browser_dismiss" && dur > 0 && dur < minOpenMs) {
    await persistLastClick(null);
    await tryTransitionPendingToSaved(click.itemId);
    return;
  }

  const handler = onReturnHandler;
  if (!handler) return; // keep lastClick persisted until handler exists

  await persistLastClick(null);

  try {
    await Promise.resolve(handler(click));
  } catch {
    // never crash app on return prompt
  }
}

/** Dev diagnostics */
export function getPartnerClicksDebugState() {
  return { opening, subscribed, lastClick };
}

/**
 * ✅ IMPORTANT: This MUST be a named export and MUST exist.
 * Root uses this via partnerReturnBootstrap.
 */
export function ensurePartnerReturnWatcher(onReturn: (click: LastPartnerClick) => void | Promise<void>) {
  onReturnHandler = onReturn;

  if (subscribed) return;
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
}

/**
 * Public: open a URL WITHOUT creating a pending item and WITHOUT prompts.
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
      return city
        ? `Protect yourself: Travel insurance for ${city}`
        : `Protect yourself: Travel insurance`;
    case "claim":
      return `Claims & compensation: Compensation help`;
    default:
      return city ? `${label}: ${city}` : `${label}: ${args.partnerName}`;
  }
}

/**
 * Identity-based match:
 * - SAME tripId + partnerId + type (ignore URL)
 * - Prefer: pending > saved > booked
 * - Ignore archived unless that's all we have
 */
function findReusableItemByIdentity(args: {
  tripId: string;
  partnerId: PartnerId;
  type: SavedItemType;
}): SavedItem | null {
  const tripId = String(args.tripId ?? "").trim();
  if (!tripId) return null;

  const items = savedItemsStore.getState().items;

  const matches = items.filter((x) => {
    if (String(x.tripId) !== tripId) return false;
    if (String(x.partnerId ?? "") !== String(args.partnerId)) return false;
    if (String(x.type) !== String(args.type)) return false;
    return true;
  });

  if (matches.length === 0) return null;

  const byUpdated = (a: SavedItem, b: SavedItem) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0);

  const pending = matches.filter((m) => m.status === "pending").sort(byUpdated)[0];
  if (pending) return pending;

  const saved = matches.filter((m) => m.status === "saved").sort(byUpdated)[0];
  if (saved) return saved;

  const booked = matches.filter((m) => m.status === "booked").sort(byUpdated)[0];
  if (booked) return booked;

  // last resort
  const archived = matches.filter((m) => m.status === "archived").sort(byUpdated)[0];
  return archived ?? null;
}

/**
 * Best-effort cleanup: archive duplicates sharing same (tripId, partnerId, type),
 * keeping the "winner" (usually pending/saved/booked chosen by the selector).
 */
async function archiveIdentityDuplicates(winner: SavedItem) {
  try {
    await ensureSavedItemsLoaded();
    const items = savedItemsStore.getState().items;

    const same = items.filter(
      (x) =>
        x.id !== winner.id &&
        String(x.tripId) === String(winner.tripId) &&
        String(x.partnerId ?? "") === String(winner.partnerId ?? "") &&
        String(x.type) === String(winner.type) &&
        x.status !== "archived"
    );

    // If there are duplicates, archive them. Don’t delete (safer).
    for (const dup of same) {
      try {
        await savedItemsStore.transitionStatus(dup.id, "archived");
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
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

    // ✅ FIX: reuse by identity, not URL
    const reusable = findReusableItemByIdentity({ tripId, partnerId: partner.id as PartnerId, type });

    if (reusable) {
      item = reusable;

      // Best-effort: keep the freshest URL on the item so Wallet opens the right place.
      if (normalizeUrl(String(item.partnerUrl ?? "")) !== url) {
        try {
          await savedItemsStore.update(item.id, {
            partnerUrl: url,
            metadata: args.metadata ?? item.metadata,
          });
          item = savedItemsStore.getState().items.find((x) => x.id === item!.id) ?? item;
        } catch {
          // ignore
        }
      }

      // Cleanup any existing duplicates for this identity (best-effort)
      void archiveIdentityDuplicates(item).catch(() => null);

      if (item.status === "booked") {
        // Phase-1 rule: booked stays booked. Open without prompt.
        await openUntrackedUrl(url);
        return item;
      }

      if (item.status === "saved") {
        await tryTransitionSavedToPending(item.id);
        item = savedItemsStore.getState().items.find((x) => x.id === item!.id) ?? item;
      }

      // If it was archived (rare): bring it back to pending for a fresh attempt.
      if (item.status === "archived") {
        try {
          await savedItemsStore.transitionStatus(item.id, "pending");
          item = savedItemsStore.getState().items.find((x) => x.id === item!.id) ?? item;
        } catch {
          // ignore
        }
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
        } catch {
          // ignore
        }
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

  const cur = savedItemsStore.getState().items.find((x) => x.id === id);
  await savedItemsStore.transitionStatus(id, "booked");

  // If we can, clean duplicates of same identity so “Pending” doesn’t show a twin.
  if (cur) {
    void archiveIdentityDuplicates({ ...cur, status: "booked" }).catch(() => null);
  }

  if (lastClick?.itemId === id) {
    await persistLastClick(null);
  }
}

export async function markNotBooked(itemId: string) {
  const id = String(itemId ?? "").trim();
  if (!id) return;

  await tryTransitionPendingToSaved(id);

  if (lastClick?.itemId === id) {
    await persistLastClick(null);
  }
}

export async function dismissReturnPrompt(itemId?: string) {
  if (!lastClick) return;

  if (!itemId) {
    await persistLastClick(null);
    return;
  }

  const id = String(itemId ?? "").trim();
  if (id && lastClick.itemId === id) {
    await persistLastClick(null);
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
  subscribed = false;
  onReturnHandler = null;
  void persistLastClick(null);
  opening = false;
  lastClickLoaded = false;
                                           }
