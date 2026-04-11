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
 * Launch truth model:
 * - "booked" means user-confirmed booked
 * - it does not mean app-verified
 * - proof can be attached later for stronger wallet evidence
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

  if (lastDeliveredKey && key === lastDeliveredKey) {
    pendingClick = null;
    return;
  }

  try {
    handler(clean(click.itemId), click);
    lastDeliveredKey = key;
    pendingClick = null;
  } catch {
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

export function registerReturnModalHandler(fn: ReturnModalHandler) {
  activeHandler = fn;

  setTimeout(() => {
    void flushPendingClick();
  }, 0);

  return () => {
    if (activeHandler === fn) {
      activeHandler = null;
    }
  };
}

export function bootstrapPartnerReturnPrompt() {
  if (bootstrapped) return;
  bootstrapped = true;

  savedItemsStore.load().catch(() => null);

  watcherUnsubscribe = ensurePartnerReturnWatcher(async (click) => {
    pendingClick = click;
    await flushPendingClick();
  });
}

export async function markItemBooked(itemId: string) {
  await markBooked(itemId);
  pendingClick = null;
  lastDeliveredKey = null;
}

export async function markItemNotBooked(itemId: string) {
  await markNotBooked(itemId);
  pendingClick = null;
  lastDeliveredKey = null;
}

export async function dismissPartnerReturn(itemId?: string) {
  await dismissReturnPrompt(itemId);
  pendingClick = null;
  lastDeliveredKey = null;
}

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
