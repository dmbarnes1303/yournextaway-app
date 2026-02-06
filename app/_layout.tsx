// app/_layout.tsx
import "@/src/utils/errorLogger";
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="trip/[id]" />
      <Stack.Screen name="trip/build" />
      <Stack.Screen name="fixture/[id]" />
      <Stack.Screen name="city/[slug]" />
      <Stack.Screen name="city/[cityKey]" />
      <Stack.Screen name="team/[teamKey]" />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}
