// src/services/subscriptions.ts
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";
import { Platform } from "react-native";

/**
 * RevenueCat config (LOCKED IDS)
 *
 * These MUST match:
 * - Entitlement ID in RevenueCat
 * - Offering ID in RevenueCat (if you want to lock to it)
 * - Store product IDs (App Store / Play)
 */
export const RC_ENTITLEMENT_PRO = "pro";
export const RC_OFFERING_DEFAULT = "default";

// Product IDs (must exist in App Store / Play + mapped in RevenueCat)
export const RC_PRODUCT_MONTHLY = "yna_pro_monthly";
export const RC_PRODUCT_ANNUAL = "yna_pro_annual";

/**
 * You MUST set these keys in your app config:
 * - iOS: RevenueCat Public SDK Key (appl_...)
 * - Android: RevenueCat Public SDK Key (goog_...)
 *
 * Put them into EAS secrets or env and expose via EXPO_PUBLIC_...
 */
const IOS_SDK_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
const ANDROID_SDK_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

let _configured = false;

function sdkKeyForPlatform(): string {
  if (Platform.OS === "ios") return IOS_SDK_KEY;
  if (Platform.OS === "android") return ANDROID_SDK_KEY;
  return "";
}

export function purchasesEnabled(): boolean {
  return !!sdkKeyForPlatform();
}

export async function configureRevenueCat(appUserId?: string | null) {
  if (_configured) return;

  const key = sdkKeyForPlatform();
  if (!key) {
    // No keys => do not configure; keep app stable in dev
    return;
  }

  // eslint-disable-next-line no-undef
  Purchases.setLogLevel(typeof __DEV__ !== "undefined" && __DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

  await Purchases.configure({
    apiKey: key,
    appUserID: appUserId ?? undefined,
  });

  _configured = true;
}

/**
 * Future-proofing:
 * If you later introduce user accounts, you will want to log in/out
 * without relying on "configure()" again.
 *
 * These are safe to call even if you never use accounts.
 */
export async function logInRevenueCat(appUserId: string): Promise<CustomerInfo | null> {
  try {
    if (!purchasesEnabled()) return null;
    // Some SDKs provide Purchases.logIn
    const anyP: any = Purchases as any;
    if (typeof anyP.logIn === "function") {
      const res = await anyP.logIn(appUserId);
      return res?.customerInfo ?? null;
    }
    // If logIn isn't available in your version, you’ll handle later.
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export async function logOutRevenueCat(): Promise<CustomerInfo | null> {
  try {
    if (!purchasesEnabled()) return null;
    const anyP: any = Purchases as any;
    if (typeof anyP.logOut === "function") {
      const res = await anyP.logOut();
      return res?.customerInfo ?? null;
    }
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export function isProFromCustomerInfo(info: CustomerInfo | null | undefined): boolean {
  const ent = info?.entitlements?.active?.[RC_ENTITLEMENT_PRO];
  return !!ent;
}

export async function getCustomerInfoSafe(): Promise<CustomerInfo | null> {
  try {
    if (!purchasesEnabled()) return null;
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export async function restorePurchasesSafe(): Promise<CustomerInfo | null> {
  try {
    if (!purchasesEnabled()) return null;
    return await Purchases.restorePurchases();
  } catch {
    return null;
  }
}

export async function getOfferingsSafe(): Promise<PurchasesOfferings | null> {
  try {
    if (!purchasesEnabled()) return null;
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function getDefaultOfferingSafe(): Promise<PurchasesOffering | null> {
  try {
    if (!purchasesEnabled()) return null;

    const offerings = await Purchases.getOfferings();

    // Prefer the explicitly named offering if present
    const locked = offerings?.all?.[RC_OFFERING_DEFAULT] ?? null;

    // Fallback to current if you didn't set a default offering
    const current = offerings?.current ?? null;

    return locked ?? current ?? null;
  } catch {
    return null;
  }
}

export function pickPackage(offering: PurchasesOffering | null, kind: "monthly" | "annual"): PurchasesPackage | null {
  if (!offering) return null;

  // Prefer explicit package slots if set up in RevenueCat
  if (kind === "monthly" && offering.monthly) return offering.monthly;
  if (kind === "annual" && offering.annual) return offering.annual;

  // Fallback: scan packages by product identifiers
  const packages = offering.availablePackages ?? [];
  const target = kind === "monthly" ? RC_PRODUCT_MONTHLY : RC_PRODUCT_ANNUAL;

  const found = packages.find((p) => p?.product?.identifier === target);
  return found ?? null;
}

function isUserCancelError(e: any): boolean {
  const msg = String(e?.message ?? "").toLowerCase();
  const code = String(e?.code ?? "").toLowerCase();
  // Common cancellation signals across versions/platforms
  return msg.includes("cancel") || code.includes("cancel");
}

export async function purchasePackageSafe(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  try {
    if (!purchasesEnabled()) return null;
    const res = await Purchases.purchasePackage(pkg);
    return res?.customerInfo ?? null;
  } catch (e: any) {
    // Only swallow user-cancel. Anything else is real and should be debugged.
    if (isUserCancelError(e)) return null;
    throw e;
  }
}

/**
 * Listener wrapper that works across SDK versions.
 * Some versions return a subscription object, others require remove-by-callback.
 */
export function addCustomerInfoListener(fn: (info: CustomerInfo) => void) {
  if (!purchasesEnabled()) return () => {};

  const anyP: any = Purchases as any;

  try {
    const maybeSub = anyP.addCustomerInfoUpdateListener?.(fn);

    // Version A: returns an object with remove()
    if (maybeSub && typeof maybeSub.remove === "function") {
      return () => maybeSub.remove();
    }

    // Version B: remove function exists
    if (typeof anyP.removeCustomerInfoUpdateListener === "function") {
      return () => anyP.removeCustomerInfoUpdateListener(fn);
    }

    // Version C: nothing removable; return no-op
    return () => {};
  } catch {
    return () => {};
  }
}
