import { Platform } from "react-native";

export type PurchasesProduct = {
  identifier: string;
  title: string;
  priceString: string;
  currencyCode?: string;
};

export type PurchasesPackage = {
  identifier: string;
  product: PurchasesProduct;
};

export type OfferingsResult =
  | { ok: true; packages: PurchasesPackage[] }
  | { ok: false; message: string };

export type PurchaseResult =
  | { ok: true }
  | { ok: false; cancelled?: boolean; message: string };

export type RestoreResult =
  | { ok: true }
  | { ok: false; message: string };

export type CustomerInfoResult =
  | { ok: true; customerInfo: unknown }
  | { ok: false; message: string };

function nativeSubscriptionsMessage(): string {
  return "RevenueCat is not installed or wired yet.";
}

export function subscriptionsSupported(): boolean {
  return Platform.OS !== "web";
}

export function isProFromCustomerInfo(customerInfo: unknown): boolean {
  if (!customerInfo || typeof customerInfo !== "object") return false;

  const candidate = customerInfo as {
    entitlements?: { active?: Record<string, unknown> };
    activeSubscriptions?: unknown;
  };

  const activeEntitlements = candidate.entitlements?.active;
  if (activeEntitlements && Object.keys(activeEntitlements).length > 0) {
    return true;
  }

  if (
    Array.isArray(candidate.activeSubscriptions) &&
    candidate.activeSubscriptions.length > 0
  ) {
    return true;
  }

  return false;
}

export async function getOfferings(): Promise<OfferingsResult> {
  if (!subscriptionsSupported()) {
    return { ok: false, message: "Subscriptions not supported on this platform." };
  }

  return { ok: false, message: nativeSubscriptionsMessage() };
}

export async function purchasePackage(
  _pkg: PurchasesPackage
): Promise<PurchaseResult> {
  if (!subscriptionsSupported()) {
    return { ok: false, message: "Purchases aren’t available on this platform." };
  }

  return { ok: false, message: nativeSubscriptionsMessage() };
}

export async function restorePurchases(): Promise<RestoreResult> {
  if (!subscriptionsSupported()) {
    return { ok: false, message: "Restore isn’t available on this platform." };
  }

  return { ok: false, message: nativeSubscriptionsMessage() };
}

export async function getCustomerInfo(): Promise<CustomerInfoResult> {
  if (!subscriptionsSupported()) {
    return { ok: false, message: "Customer info not supported on this platform." };
  }

  return { ok: false, message: nativeSubscriptionsMessage() };
}
