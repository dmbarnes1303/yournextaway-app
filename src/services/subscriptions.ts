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
 */
export const RC_ENTITLEMENT_PRO = "pro";
export const RC_OFFERING_DEFAULT = "default";

// Product IDs (must exist in App Store / Play + mapped in RevenueCat)
export const RC_PRODUCT_MONTHLY = "yna_pro_monthly";
export const RC_PRODUCT_ANNUAL = "yna_pro_annual";

/**
 * You MUST set these keys in your app config.
 * - iOS: RevenueCat Public SDK Key (starts with "appl_")
 * - Android: RevenueCat Public SDK Key (starts with "goog_")
 *
 * Put them into your env/secrets and read them here.
 * If keys are missing, purchases will be disabled (but app won't crash).
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

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

  await Purchases.configure({
    apiKey: key,
    appUserID: appUserId ?? undefined,
  });

  _configured = true;
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

export async function getDefaultOfferingSafe(): Promise<PurchasesOffering | null> {
  try {
    if (!purchasesEnabled()) return null;
    const offerings: PurchasesOfferings = await Purchases.getOfferings();
    const off =
      offerings?.all?.[RC_OFFERING_DEFAULT] ??
      offerings?.current ??
      null;

    return off ?? null;
  } catch {
    return null;
  }
}

export function pickPackage(offering: PurchasesOffering | null, kind: "monthly" | "annual"): PurchasesPackage | null {
  if (!offering) return null;

  // Prefer explicit RevenueCat package slots if set up
  if (kind === "monthly" && offering.monthly) return offering.monthly;
  if (kind === "annual" && offering.annual) return offering.annual;

  // Fallback: scan packages by product identifiers
  const packages = offering.availablePackages ?? [];
  const target = kind === "monthly" ? RC_PRODUCT_MONTHLY : RC_PRODUCT_ANNUAL;

  const found = packages.find((p) => p.product.identifier === target);
  return found ?? null;
}

export async function purchasePackageSafe(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  try {
    if (!purchasesEnabled()) return null;
    const res = await Purchases.purchasePackage(pkg);
    return res?.customerInfo ?? null;
  } catch (e: any) {
    // User-cancel should not be treated as fatal
    return null;
  }
}

export function addCustomerInfoListener(fn: (info: CustomerInfo) => void) {
  if (!purchasesEnabled()) return () => {};
  const sub = Purchases.addCustomerInfoUpdateListener(fn);
  return () => sub.remove();
}
