// app/_layout.tsx
import "@/src/utils/errorLogger";
import React, { useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { AppState, type AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";

import { ProProvider } from "@/src/context/ProContext";
import { bootstrapPartnerReturnPrompt } from "@/src/services/partnerReturnBootstrap";
import { refreshFollowedMatches } from "@/src/services/followedMatchesRefresh";
import preferencesStore from "@/src/state/preferences";

// DEV club-key validation
if (__DEV__) {
  import("@/src/data/_dev/validateClubKeys").then((m) => {
    try {
      m.validateAllClubKeys();
    } catch {}
  });
}

export default function RootLayout() {
  const router = useRouter();

  const startedRef = useRef(false);
  const appStateSubRef = useRef<{ remove: () => void } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifSubRef = useRef<{ remove: () => void } | null>(null);

  const lastRefreshAtRef = useRef<number>(0);
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // ✅ Partner return detection (booking completed prompt)
    bootstrapPartnerReturnPrompt();

    // Load preferences early
    preferencesStore.load().catch(() => null);

    // Notification tap → open match
    try {
      notifSubRef.current =
        Notifications.addNotificationResponseReceivedListener((resp) => {
          const data: any = resp?.notification?.request?.content?.data ?? {};
          const kind = String(data?.kind ?? "").trim();
          const fixtureId = String(data?.fixtureId ?? "").trim();

          if (kind === "kickoff_update" && fixtureId) {
            router.push({ pathname: "/match/[id]", params: { id: fixtureId } } as any);
          }
        });
    } catch {}

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
      } catch {}
      intervalRef.current = null;
    };

    const startupTimer = setTimeout(() => {
      runRefresh("startup").catch(() => null);
    }, 900);

    let lastState: AppStateStatus = AppState.currentState;

    const onAppState = (next: AppStateStatus) => {
      const becameActive =
        Boolean(String(lastState).match(/inactive|background/)) &&
        next === "active";

      const becameInactive = lastState === "active" && next !== "active";
      lastState = next;

      if (becameActive) {
        preferencesStore.load().catch(() => null);
        runRefresh("foreground").catch(() => null);
        startInterval();
      }

      if (becameInactive) {
        stopInterval();
      }
    };

    appStateSubRef.current =
      AppState.addEventListener("change", onAppState) as any;

    if (AppState.currentState === "active") startInterval();

    return () => {
      clearTimeout(startupTimer);

      try {
        appStateSubRef.current?.remove?.();
      } catch {}
      appStateSubRef.current = null;

      stopInterval();

      try {
        notifSubRef.current?.remove?.();
      } catch {}
      notifSubRef.current = null;

      startedRef.current = false;
    };
  }, [router]);

  return (
    <ProProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="match/[id]" />
        <Stack.Screen name="trip/[id]" />
        <Stack.Screen name="trip/build" />
        <Stack.Screen name="city/[slug]" />
        <Stack.Screen name="team/[teamKey]" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ProProvider>
  );
        }
