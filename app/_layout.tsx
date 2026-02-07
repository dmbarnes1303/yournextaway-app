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

    // Optional: pre-warm notifications.
    // Product risk: this may prompt too early and get denied.
    ensureNotificationsReady().catch(() => null);

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
