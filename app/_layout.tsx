// app/_layout.tsx
import "@/src/utils/errorLogger";
import React from "react";
import { Stack } from "expo-router";

import { ProProvider } from "@/src/context/ProContext";

export default function RootLayout() {
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

        {/* Modal */}
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />

        {/**
         * NOTE:
         * - Removed "fixture/[id]" because your app navigates to /match/[id].
         * - Removed "city/[cityKey]" because it conflicts with city/[slug].
         * If those files still exist, we should delete/rename them properly in the tree.
         */}
      </Stack>
    </ProProvider>
  );
}
