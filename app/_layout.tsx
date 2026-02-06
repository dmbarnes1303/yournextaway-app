// app/_layout.tsx
import "@/src/utils/errorLogger";
import React, { useEffect } from "react";
import { Stack } from "expo-router";

import { ProProvider } from "@/src/context/ProContext";
import { bootstrapPartnerReturnPrompt } from "@/src/services/partnerReturnBootstrap";

export default function RootLayout() {
  useEffect(() => {
    // Phase-1 spine: partner click → return → “Booked?” prompt
    // Must be bootstrapped at the app root so it works from any screen.
    bootstrapPartnerReturnPrompt();
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
