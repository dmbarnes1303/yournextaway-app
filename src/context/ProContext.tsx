// src/context/ProContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CustomerInfo } from "react-native-purchases";

import {
  addCustomerInfoListener,
  configureRevenueCat,
  getCustomerInfoSafe,
  isProFromCustomerInfo,
  purchasesEnabled,
} from "@/src/services/subscriptions";

type ProState = {
  isReady: boolean;
  isPro: boolean;
  purchasesEnabled: boolean;
  customerInfo: CustomerInfo | null;
  refresh: () => Promise<void>;
};

const Ctx = createContext<ProState | null>(null);

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const isPro = useMemo(() => isProFromCustomerInfo(customerInfo), [customerInfo]);
  const enabled = useMemo(() => purchasesEnabled(), []);

  async function refresh() {
    const info = await getCustomerInfoSafe();
    if (info) setCustomerInfo(info);
  }

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;

    (async () => {
      try {
        // Anonymous user by default; you can later pass a logged-in user id.
        await configureRevenueCat(null);

        if (!mounted) return;

        const info = await getCustomerInfoSafe();
        if (info) setCustomerInfo(info);

        unsub = addCustomerInfoListener((next) => {
          setCustomerInfo(next);
        });
      } finally {
        if (mounted) setIsReady(true);
      }
    })();

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, []);

  const value: ProState = {
    isReady,
    isPro,
    purchasesEnabled: enabled,
    customerInfo,
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePro(): ProState {
  const v = useContext(Ctx);
  if (!v) {
    // Hard fail early so you wrap layout correctly.
    throw new Error("usePro() must be used inside <ProProvider>.");
  }
  return v;
}
