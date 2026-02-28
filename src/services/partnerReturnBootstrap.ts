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
 * - Ensure the return watcher is running (exactly once)
 * - When a return is detected, notify the UI via a registered handler
 *
 * UI decides:
 * - YES -> markItemBooked(itemId)
 * - NO  -> markItemNotBooked(itemId)
 * - NOT NOW -> dismissPartnerReturn(itemId)
 *
 * Production goals:
 * - No duplicate handlers on fast refresh / remount
 * - Can unsubscribe handler cleanly
 * - If a click arrives before handler exists, we hold it and replay once
 */

let bootstrapped = false;

// Current UI handler (set by app/_layout.tsx)
let handler: ((itemId: string, click: LastPartnerClick) => void) | null = null;

// If a partner return fires before UI registers a handler, hold latest
let pendingClick: LastPartnerClick | null = null;

// Prevent double-delivery of the same click (defensive)
let lastDeliveredKey: string | null = null;

function clickKey(c: LastPartnerClick): string {
  // itemId should be stable; add timestamp-ish if present to reduce collisions
  const t = (c as any)?.ts ?? (c as any)?.timestamp ?? "";
  const pid = (c as any)?.partnerId ?? "";
  const url = (c as any)?.url ?? "";
  return `${String(c.itemId)}|${String(pid)}|${String(t)}|${String(url)}`;
}

function deliverToHandler(c: LastPartnerClick) {
  const fn = handler;
  if (!fn) {
    pendingClick = c;
    return;
  }

  const key = clickKey(c);
  if (lastDeliveredKey && key === lastDeliveredKey) return;

  lastDeliveredKey = key;
  pendingClick = null;

  try {
    fn(String(c.itemId), c);
  } catch {
    // Never crash the app due to UI handler errors.
    // If handler throws, keep click so it can be retried on next handler set.
    pendingClick = c;
  }
}

/**
 * Register UI modal handler.
 * Returns an unsubscribe function so _layout can clean up on refresh/remount.
 */
export function registerReturnModalHandler(fn: (itemId: string, click: LastPartnerClick) => void) {
  handler = fn;

  // If we already have a pending click, replay it once.
  if (pendingClick) {
    const c = pendingClick;
    // Defer to next tick so UI has mounted fully.
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

  // Ensure watcher runs and pushes returns into this module.
  // We assume ensurePartnerReturnWatcher is itself idempotent and safe to call once.
  ensurePartnerReturnWatcher(async (click) => {
    // Always route through our delivery gate.
    deliverToHandler(click);
  });
}

/** UI action: user confirms booking */
export async function markItemBooked(itemId: string) {
  await markBooked(itemId);
  // After a decision, clear last-delivered guard so a future click can show again.
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
  // Not-now means we intentionally suppress for now; keep delivered guard cleared.
  lastDeliveredKey = null;
}
