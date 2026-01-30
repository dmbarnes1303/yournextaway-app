// src/context/ProContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  getCustomerInfo,
  isProFromCustomerInfo,
  subscriptionsSupported,
} from "@/src/services/subscriptions";

type ProContextValue = {
  isPro: boolean;
  supported: boolean;
  loading: boolean;
  lastError: string | null;
  refresh: () => Promise<void>;
};

const ProContext = createContext<ProContextValue | null>(null);

export function ProProvider({ children }: { children: React.ReactNode }) {
  const supported = useMemo(() => subscriptionsSupported(), []);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLastError(null);

    // Web: always safe false, no calls.
    if (!supported) {
      setIsPro(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await getCustomerInfo();

    if (!res.ok) {
      setLastError(res.message);
      setIsPro(false);
      setLoading(false);
      return;
    }

    setIsPro(isProFromCustomerInfo(res.customerInfo));
    setLoading(false);
  }, [supported]);

  useEffect(() => {
    // Initial load
    refresh();
  }, [refresh]);

  const value = useMemo<ProContextValue>(
    () => ({
      isPro,
      supported,
      loading,
      lastError,
      refresh,
    }),
    [isPro, supported, loading, lastError, refresh]
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro() {
  const ctx = useContext(ProContext);
  if (!ctx) {
    throw new Error("usePro must be used within a ProProvider");
  }
  return ctx;
}
