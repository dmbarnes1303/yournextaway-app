// src/services/subscriptions.ts
import { Platform } from "react-native";

/**
 * Subscriptions service (SAFE STUB)
 *
 * Why this exists:
 * - Your app is currently crashing because `react-native-purchases` is not resolvable (especially on web).
 * - This stub keeps the app running until you intentionally wire RevenueCat/IAP properly.
 *
 * Rules:
 * - Never hard-import native-only modules at top-level in a project that bundles for web.
 * - Keep surface area stable so the rest of the app doesn’t need refactors later.
 */

export type PurchasesPackage = {
  identifier: string;
  product: {
    identifier: string;
    title?: string;
    description?: string;
    priceString?: string;
    price?: number;
    currencyCode?: string;
  };
};

export type PurchasesOffering = {
  identifier: string;
  availablePackages: PurchasesPackage[];
};

export type PurchasesOfferings = {
  current?: PurchasesOffering | null;
  all?: Record<string, PurchasesOffering>;
};

export type PurchaseResult = {
  ok: boolean;
  cancelled?: boolean;
  message?: string;
};

export type CustomerInfo = {
  activeEntitlements: string[];
};

/**
 * App-wide capability switch:
 * - Web: always false (RevenueCat is native-first; you can add Stripe later if you want web paywalls)
 * - Native: still false until you wire the real SDK + keys
 */
export function subscriptionsSupported(): boolean {
  return Platform.OS !== "web" && Platform.OS !== "windows" && Platform.OS !== "macos";
}

export async function configurePurchases(_opts: {
  apiKey: string;
  appUserId?: string;
}): Promise<void> {
  // Stub: no-op
  return;
}

export async function setDebugLogsEnabled(_enabled: boolean): Promise<void> {
  // Stub: no-op
  return;
}

export async function getOfferings(): Promise<PurchasesOfferings> {
  // Stub: empty offerings
  return { current: null, all: {} };
}

export async function purchasePackage(_pkg: PurchasesPackage): Promise<PurchaseResult> {
  // Stub: always fail gracefully (no crash)
  return {
    ok: false,
    message: subscriptionsSupported()
      ? "Subscriptions not configured yet."
      : "Subscriptions are not supported on this platform.",
  };
}

export async function restorePurchases(): Promise<CustomerInfo> {
  // Stub: no entitlements
  return { activeEntitlements: [] };
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  // Stub: no entitlements
  return { activeEntitlements: [] };
}

/**
 * Simple helper your UI can use for paywalls / gating.
 */
export async function hasPremiumEntitlement(_entitlementId = "premium"): Promise<boolean> {
  // Stub: always false until you wire the real system.
  return false;
}
