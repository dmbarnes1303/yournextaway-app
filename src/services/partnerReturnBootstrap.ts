// src/services/partnerReturnBootstrap.ts

import savedItemsStore from "@/src/state/savedItems";
import {
  ensurePartnerReturnWatcher,
  markBooked,
  markNotBooked,
  dismissReturnPrompt,
  type LastPartnerClick,
} from "@/src/services/partnerClicks";

/**
 * Root-level bootstrap:
 * - Ensure the return watcher is running
 * - When a return is detected, notify UI via a registered handler
 *
 * UI decides:
 * - YES -> markItemBooked(itemId)
 * - NO  -> markItemNotBooked(itemId)
 * - NOT NOW -> dismissPartnerReturn(itemId)
 *
 * Goals:
 * - No duplicate UI handlers on fast refresh / remount
 * - If a click arrives before handler exists, hold latest and replay once
 * - Never lose a click because UI handler throws
 * - Do not redeliver the exact same click repeatedly
 */

type ReturnModalHandler = (itemId: string, click: LastPartnerClick) => void;

let bootstrapped = false;
let watcherUnsubscribe: (() => void) | null = null;

// Current UI handler set by app/_layout.tsx
let activeHandler: ReturnModalHandler | null = null;

// Hold latest undelivered click until UI is ready
let pendingClick: LastPartnerClick | null = null;

// De-dupe successfully delivered click sessions
let lastDeliveredKey: string | null = null;

// Prevent overlapping replay/delivery loops
let deliveryInFlight = false;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function clickKey(click: LastPartnerClick): string {
  return [
    clean(click.itemId),
    clean(click.tripId),
    clean(click.partnerId),
    clean(click.url),
    String(Number(click.openedAt || 0)),
  ].join("|");
}

async function deliverClick(click: LastPartnerClick) {
  const handler = activeHandler;

  if (!handler) {
    pendingClick = click;
    return;
  }

  const key = clickKey(click);

  // Exact click already delivered successfully
  if (lastDeliveredKey && key === lastDeliveredKey) {
    pendingClick = null;
    return;
  }

  try {
    handler(clean(click.itemId), click);

    lastDeliveredKey = key;
    pendingClick = null;
  } catch {
    // Keep it pending so the UI can receive it later after remount / re-register
    pendingClick = click;
  }
}

async function flushPendingClick() {
  if (deliveryInFlight) return;
  if (!pendingClick) return;
  if (!activeHandler) return;

  deliveryInFlight = true;
  try {
    const click = pendingClick;
    if (!click) return;
    await deliverClick(click);
  } finally {
    deliveryInFlight = false;
  }
}

/**
 * Register UI modal handler.
 * Returns an unsubscribe function so _layout can clean up on refresh/remount.
 */
export function registerReturnModalHandler(fn: ReturnModalHandler) {
  activeHandler = fn;

  // Replay pending click on next tick so UI state is mounted first
  setTimeout(() => {
    void flushPendingClick();
  }, 0);

  return () => {
    if (activeHandler === fn) {
      activeHandler = null;
    }
  };
}

/**
 * Call once from app/_layout.tsx
 */
export function bootstrapPartnerReturnPrompt() {
  if (bootstrapped) return;
  bootstrapped = true;

  // Ensure store is warm; watcher itself loads click state too.
  savedItemsStore.load().catch(() => null);

  watcherUnsubscribe = ensurePartnerReturnWatcher(async (click) => {
    pendingClick = click;
    await flushPendingClick();
  });
}

/** UI action: user confirms booking */
export async function markItemBooked(itemId: string) {
  await markBooked(itemId);

  // Clear current pending state and allow future sessions to deliver normally
  pendingClick = null;
  lastDeliveredKey = null;
}

/** UI action: user says they did NOT book */
export async function markItemNotBooked(itemId: string) {
  await markNotBooked(itemId);

  pendingClick = null;
  lastDeliveredKey = null;
}

/** UI action: user dismisses ("Not now") */
export async function dismissPartnerReturn(itemId?: string) {
  await dismissReturnPrompt(itemId);

  pendingClick = null;
  lastDeliveredKey = null;
}

/**
 * Dev-only reset helper.
 * Safe to leave unused in production.
 */
export function __unsafeResetPartnerReturnBootstrapForDevOnly() {
  try {
    watcherUnsubscribe?.();
  } catch {
    // ignore
  }

  watcherUnsubscribe = null;
  bootstrapped = false;
  activeHandler = null;
  pendingClick = null;
  lastDeliveredKey = null;
  deliveryInFlight = false;
}
