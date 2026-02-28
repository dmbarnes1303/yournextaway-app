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
 * Production goals:
 * - No duplicate UI handlers on fast refresh / remount
 * - If a click arrives before handler exists, hold it and replay once
 * - Never “lose” a click because a handler threw
 */

let bootstrapped = false;

// Current UI handler (set by app/_layout.tsx)
let handler: ((itemId: string, click: LastPartnerClick) => void) | null = null;

// If a return fires before UI registers a handler, hold latest
let pendingClick: LastPartnerClick | null = null;

// Defensive: prevent double-delivery of the same click
let lastDeliveredKey: string | null = null;

function clean(s: any) {
  return String(s ?? "").trim();
}

function clickKey(c: LastPartnerClick): string {
  // Deterministic key from actual fields in LastPartnerClick
  // openedAt is the best “session” discriminator
  return [
    clean(c.itemId),
    clean(c.tripId),
    clean(c.partnerId),
    clean(c.url),
    String(Number(c.openedAt || 0)),
  ].join("|");
}

function deliverToHandler(c: LastPartnerClick) {
  const fn = handler;
  if (!fn) {
    pendingClick = c;
    return;
  }

  const key = clickKey(c);

  // If we *successfully* delivered this exact click already, ignore repeats
  if (lastDeliveredKey && key === lastDeliveredKey) return;

  try {
    fn(clean(c.itemId), c);

    // Mark delivered ONLY after success
    lastDeliveredKey = key;
    pendingClick = null;
  } catch {
    // Never crash the app due to UI handler errors.
    // Keep click so it can be replayed when handler is re-registered.
    pendingClick = c;
    // IMPORTANT: do NOT set lastDeliveredKey on failure
  }
}

/**
 * Register UI modal handler.
 * Returns an unsubscribe function so _layout can clean up on refresh/remount.
 */
export function registerReturnModalHandler(fn: (itemId: string, click: LastPartnerClick) => void) {
  handler = fn;

  // If we already have a pending click, replay it once (next tick).
  if (pendingClick) {
    const c = pendingClick;
    setTimeout(() => deliverToHandler(c), 0);
  }

  return () => {
    // Only clear if the same handler is still installed
    if (handler === fn) handler = null;
  };
}

/**
 * Call once from app/_layout.tsx
 */
export function bootstrapPartnerReturnPrompt() {
  if (bootstrapped) return;
  bootstrapped = true;

  // Ensure store is available; watcher itself loads click state.
  savedItemsStore.load().catch(() => null);

  // Start watcher (partnerClicks.ts is idempotent + de-duped)
  ensurePartnerReturnWatcher((click) => {
    deliverToHandler(click);
  });
}

/** UI action: user confirms booking */
export async function markItemBooked(itemId: string) {
  await markBooked(itemId);
  // After decision, allow future clicks to deliver normally
  lastDeliveredKey = null;
}

/** UI action: user says they did NOT book */
export async function markItemNotBooked(itemId: string) {
  await markNotBooked(itemId);
  lastDeliveredKey = null;
}

/** UI action: user dismisses ("Not now") */
export async function dismissPartnerReturn(itemId?: string) {
  await dismissReturnPrompt(itemId);
  // Not-now intentionally suppresses this click; allow future clicks
  lastDeliveredKey = null;
}
