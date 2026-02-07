// app/_layout.tsx
import "@/src/utils/errorLogger";
import React, { useEffect, useRef } from "react";
import { Stack } from "expo-router";
import { AppState, type AppStateStatus } from "react-native";

import { ProProvider } from "@/src/context/ProContext";
import { bootstrapPartnerReturnPrompt } from "@/src/services/partnerReturnBootstrap";

import { refreshFollowedMatches } from "@/src/services/followedMatchesRefresh";
import { ensureNotificationsReady } from "@/src/services/followKickoffNotifications";

export default function RootLayout() {
  // Guards against stacked listeners / intervals during Fast Refresh
  const startedRef = useRef(false);

  const appStateSubRef = useRef<{ remove: () => void } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lastRefreshAtRef = useRef<number>(0);
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Phase-1 spine: partner click → return → “Booked?” prompt
    bootstrapPartnerReturnPrompt();

    // Prepare notifications early (permission prompt will only show if not granted).
    // If user denies, we just silently skip scheduling.
    ensureNotificationsReady().catch(() => null);

    const minMinutesBetweenRefreshes = 10;
    const intervalMinutes = 15;

    const shouldRunNow = () => {
      const now = Date.now();
      const minMs = minMinutesBetweenRefreshes * 60 * 1000;
      return now - lastRefreshAtRef.current >= minMs;
    };

    const runRefresh = async (reason: "startup" | "foreground" | "interval") => {
      if (refreshInFlightRef.current) return;
      if (!shouldRunNow() && reason !== "startup") return;

      refreshInFlightRef.current = true;
      lastRefreshAtRef.current = Date.now();

      try {
        // Keep it bounded. You can raise later once you add batching.
        await refreshFollowedMatches({ limit: 25 });
      } catch {
        // Never crash root on refresh failures
      } finally {
        refreshInFlightRef.current = false;
      }
    };

    // Startup refresh (slight delay so persisted stores rehydrate)
    const startupTimer = setTimeout(() => {
      runRefresh("startup").catch(() => null);
    }, 900);

    // Foreground refresh
    let lastState: AppStateStatus = AppState.currentState;

    appStateSubRef.current = AppState.addEventListener("change", (next) => {
      const becameActive = Boolean(String(lastState).match(/inactive|background/)) && next === "active";
      lastState = next;

      if (!becameActive) return;
      runRefresh("foreground").catch(() => null);
    }) as any;

    // Interval refresh while app is open
    intervalRef.current = setInterval(() => {
      runRefresh("interval").catch(() => null);
    }, intervalMinutes * 60 * 1000);

    return () => {
      clearTimeout(startupTimer);

      try {
        appStateSubRef.current?.remove?.();
      } catch {
        // ignore
      } finally {
        appStateSubRef.current = null;
      }

      try {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } catch {
        // ignore
      } finally {
        intervalRef.current = null;
      }

      startedRef.current = false;
    };
  }, []);

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

        {/**
         * NOTE:
         * - Removed "fixture/[id]" because your app navigates to /match/[id].
         * - Removed "city/[cityKey]" because it conflicts with city/[slug].
         * If those files still exist, delete/rename them properly in the tree.
         */}
      </Stack>
    </ProProvider>
  );
}
