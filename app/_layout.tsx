// app/_layout.tsx
import "@/src/utils/errorLogger";
import React, { useEffect, useRef } from "react";
import { Stack } from "expo-router";

import { ProProvider } from "@/src/context/ProContext";
import { bootstrapPartnerReturnPrompt } from "@/src/services/partnerReturnBootstrap";

// Follow refresh (Phase 1): foreground refresh + in-app alerts for kickoff changes
import { startFollowAutoRefresh } from "@/src/services/followRefresh";

export default function RootLayout() {
  // Ensure we never stack listeners if React Fast Refresh remounts strangely
  const stopFollowRefreshRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    // Phase-1 spine: partner click → return → “Booked?” prompt
    bootstrapPartnerReturnPrompt();

    // Phase-1 follow refresh:
    // - refresh on foreground
    // - optional interval while active (keeps Following list sane)
    // - Phase 1 uses Alert.alert when kickoff changes AND user has kickoffConfirmed enabled
    stopFollowRefreshRef.current = startFollowAutoRefresh({
      intervalMinutes: 15,
      showInAppAlerts: true,
      concurrency: 4,
      minMinutesBetweenRefreshes: 10,
    });

    return () => {
      try {
        stopFollowRefreshRef.current?.();
      } catch {
        // ignore
      } finally {
        stopFollowRefreshRef.current = null;
      }
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
