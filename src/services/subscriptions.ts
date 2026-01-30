// src/services/subscriptions.ts
import { Platform } from "react-native";

/**
 * Web-safe subscriptions wrapper.
 *
 * Key rule:
 * - NEVER top-level import native-only modules (react-native-purchases).
 * - Use dynamic import inside functions, only on iOS/Android.
 *
 * This keeps Expo Web running without crash loops.
 */

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

export function subscriptionsSupported(): boolean {
  // RevenueCat is native-only in this setup.
  return Platform.OS !== "web";
}

/**
 * RevenueCat CustomerInfo is an opaque object here (we keep it untyped to stay web-safe).
 * This helper must exist because ProContext calls it.
 */
export function isProFromCustomerInfo(customerInfo: any): boolean {
  if (!customerInfo) return false;

  // Common RevenueCat shape:
  // customerInfo.entitlements.active is a map of entitlementId -> entitlementInfo
  const entitlements = customerInfo?.entitlements;
  const active = entitlements?.active;

  if (active && typeof active === "object") {
    const keys = Object.keys(active);
    if (keys.length > 0) return true;
  }

  // Some setups store activeSubscriptions array
  const activeSubs = customerInfo?.activeSubscriptions;
  if (Array.isArray(activeSubs) && activeSubs.length > 0) return true;

  return false;
}

/**
 * Lazy-load Purchases only on native.
 */
async function loadPurchases() {
  if (!subscriptionsSupported()) return null;

  try {
    const mod: any = await import("react-native-purchases");
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

/**
 * Offerings: return packages (best-effort).
 * For now, if Purchases isn't configured, you still get a useful error not a crash.
 */
export async function getOfferings(): Promise<OfferingsResult> {
  if (!subscriptionsSupported()) {
    return { ok: false, message: "Subscriptions not supported on this platform." };
  }

  const Purchases = await loadPurchases();
  if (!Purchases) {
    return { ok: false, message: "Purchases SDK not available. (react-native-purchases missing)" };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings?.current;

    const pkgs: PurchasesPackage[] = Array.isArray(current?.availablePackages)
      ? current.availablePackages.map((p: any) => ({
          identifier: String(p?.identifier ?? p?.packageType ?? "package"),
          product: {
            identifier: String(p?.product?.identifier ?? ""),
            title: String(p?.product?.title ?? "Premium"),
            priceString: String(p?.product?.priceString ?? ""),
            currencyCode: String(p?.product?.currencyCode ?? ""),
          },
        }))
      : [];

    return { ok: true, packages: pkgs };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Failed to fetch offerings." };
  }
}

/**
 * Purchase a package. Web-safe.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  if (!subscriptionsSupported()) {
    return { ok: false, message: "Purchases aren’t available on this platform." };
  }

  const Purchases = await loadPurchases();
  if (!Purchases) {
    return { ok: false, message: "Purchases SDK not available. (react-native-purchases missing)" };
  }

  try {
    // RevenueCat expects its own package object; our minimal type won't match.
    // If you want to wire real purchases, call purchasePackageFromOfferings() using the raw package.
    // For now, return a clear message instead of crashing.
    return { ok: false, message: "Purchases not wired yet. Hook this to real RevenueCat packages." };
  } catch (e: any) {
    const msg = e?.message ?? "Purchase failed.";
    const cancelled =
      msg.toLowerCase().includes("cancel") ||
      msg.toLowerCase().includes("user cancelled") ||
      e?.userCancelled === true;

    return { ok: false, cancelled, message: msg };
  }
}

/**
 * Restore purchases. Web-safe.
 */
export async function restorePurchases(): Promise<RestoreResult> {
  if (!subscriptionsSupported()) {
    return { ok: false, message: "Restore isn’t available on this platform." };
  }

  const Purchases = await loadPurchases();
  if (!Purchases) {
    return { ok: false, message: "Purchases SDK not available. (react-native-purchases missing)" };
  }

  try {
    await Purchases.restorePurchases();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Restore failed." };
  }
}

/**
 * Optional: fetch customer info for ProContext (native only).
 */
export async function getCustomerInfo(): Promise<{ ok: true; customerInfo: any } | { ok: false; message: string }> {
  if (!subscriptionsSupported()) {
    return { ok: false, message: "Customer info not supported on this platform." };
  }

  const Purchases = await loadPurchases();
  if (!Purchases) {
    return { ok: false, message: "Purchases SDK not available. (react-native-purchases missing)" };
  }

  try {
    const info = await Purchases.getCustomerInfo();
    return { ok: true, customerInfo: info };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Failed to load customer info." };
  }
}
