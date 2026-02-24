// app/_layout.tsx
import "@/src/utils/errorLogger";
import React, { useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { AppState, type AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";

import { ProProvider } from "@/src/context/ProContext";
import { bootstrapPartnerReturnPrompt } from "@/src/services/partnerReturnBootstrap";
import { refreshFollowedMatches } from "@/src/services/followedMatchesRefresh";

// ✅ Load persisted preferences early (origin IATA, etc.)
import preferencesStore from "@/src/state/preferences";

// ✅ DEV ONLY: validate club keys once at app bootstrap (avoid Fast Refresh spam)
if (__DEV__) {
  import("@/src/data/_dev/validateClubKeys").then((m) => {
    try {
      m.validateAllClubKeys();
    } catch {
      // ignore - never crash dev boot
    }
  });
}

export default function RootLayout() {
  const router = useRouter();

  // Guards against stacked listeners / intervals during Fast Refresh
  const startedRef = useRef(false);

  const appStateSubRef = useRef<{ remove: () => void } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lastRefreshAtRef = useRef<number>(0);
  const refreshInFlightRef = useRef(false);

  const notifSubRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Phase-1 spine: partner click → return → “Booked?” prompt
    bootstrapPartnerReturnPrompt();

    // ✅ Rehydrate preferences early so affiliateLinks can use saved origin from first use
    // Do NOT block render; best-effort only.
    preferencesStore.load().catch(() => null);

    // Notification tap → open match
    try {
      notifSubRef.current = Notifications.addNotificationResponseReceivedListener((resp) => {
        const data: any = resp?.notification?.request?.content?.data ?? {};
        const kind = String(data?.kind ?? "").trim();
        const fixtureId = String(data?.fixtureId ?? "").trim();

        if (kind === "kickoff_update" && fixtureId) {
          router.push({ pathname: "/match/[id]", params: { id: fixtureId } } as any);
        }
      });
    } catch {
      // ignore
    }

    // NOTE:
    // Do NOT request notification permissions here.
    // Request them only when the user enables kickoffConfirmed in the UI.
    const minMinutesBetweenRefreshes = 10;
    const intervalMinutes = 15;

    const canRun = (reason: "startup" | "foreground" | "interval") => {
      if (reason === "startup") return true;
      const now = Date.now();
      const minMs = minMinutesBetweenRefreshes * 60 * 1000;
      return now - lastRefreshAtRef.current >= minMs;
    };

    const runRefresh = async (reason: "startup" | "foreground" | "interval") => {
      if (refreshInFlightRef.current) return;
      if (!canRun(reason)) return;

      refreshInFlightRef.current = true;
      lastRefreshAtRef.current = Date.now();

      try {
        await refreshFollowedMatches({ limit: 25, concurrency: 3 });
      } catch {
        // Never crash root on refresh failures
      } finally {
        refreshInFlightRef.current = false;
      }
    };

    const startInterval = () => {
      if (intervalMinutes <= 0) return;
      if (intervalRef.current) return;

      intervalRef.current = setInterval(() => {
        runRefresh("interval").catch(() => null);
      }, intervalMinutes * 60 * 1000);
    };

    const stopInterval = () => {
      if (!intervalRef.current) return;
      try {
        clearInterval(intervalRef.current);
      } catch {
        // ignore
      } finally {
        intervalRef.current = null;
      }
    };

    // Startup refresh (delay so persisted stores rehydrate)
    const startupTimer = setTimeout(() => {
      runRefresh("startup").catch(() => null);
    }, 900);

    // Foreground/background management
    let lastState: AppStateStatus = AppState.currentState;

    const onAppState = (next: AppStateStatus) => {
      const becameActive = Boolean(String(lastState).match(/inactive|background/)) && next === "active";
      const becameInactive = lastState === "active" && next !== "active";
      lastState = next;

      if (becameActive) {
        // ✅ Safety: ensure prefs are loaded if app was killed/fast-refreshed oddly
        preferencesStore.load().catch(() => null);

        runRefresh("foreground").catch(() => null);
        startInterval();
      }

      if (becameInactive) {
        stopInterval();
      }
    };

    appStateSubRef.current = AppState.addEventListener("change", onAppState) as any;

    // If we mount while already active, start interval
    if (AppState.currentState === "active") startInterval();

    return () => {
      clearTimeout(startupTimer);

      try {
        appStateSubRef.current?.remove?.();
      } catch {
        // ignore
      } finally {
        appStateSubRef.current = null;
      }

      stopInterval();

      try {
        notifSubRef.current?.remove?.();
      } catch {
        // ignore
      } finally {
        notifSubRef.current = null;
      }

      startedRef.current = false;
    };
  }, [router]);

  return (
    <ProProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />

        {/* Core flows */}
        <Stack.Screen name="match/[id]" />
        <Stack.Screen name="trip/[id]" />
        <Stack.Screen name="trip/build" />

        {/* Guides */}
        <Stack.Screen name="city/[slug]" />
        <Stack.Screen name="team/[teamKey]" />

        {/* Monetisation */}
        <Stack.Screen name="paywall" />

        {/* Modal */}
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ProProvider>
  );
}
