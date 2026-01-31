// app/_layout.tsx
import "react-native-reanimated";

import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { StyleSheet } from "react-native";

import { theme } from "@/src/constants/theme";
import BackButton from "@/src/components/BackButton";
import { ProProvider } from "@/src/context/ProContext";
import { setupErrorLogging } from "@/src/utils/errorLogger";

declare const __DEV__: boolean;

// Keep the splash up until fonts are ready.
SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore
});

// ✅ Dev-only logging init (safe)
if (__DEV__) {
  try {
    setupErrorLogging();
  } catch {
    // never crash because of logging
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    SplashScreen.hideAsync().catch(() => {
      // ignore
    });
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />

      <GestureHandlerRootView style={styles.flex}>
        <ProProvider>
          <Stack
            screenOptions={{
              headerShown: true,
              headerTransparent: true,
              headerTitle: "",
              headerTintColor: theme.colors.text,
              headerStyle: { backgroundColor: "transparent" },
              headerLeft: () => <BackButton fallbackHref="/(tabs)/home" />,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />

            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: true, headerTitle: "" }} />

            <Stack.Screen name="paywall" options={{ headerTitle: "YourNextAway Pro" }} />

            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            <Stack.Screen name="match/[id]" options={{ headerTitle: "Match" }} />

            {/* ✅ Canonical city route */}
            <Stack.Screen name="city/[slug]" options={{ headerTitle: "City" }} />

            {/* ✅ Secondary key route (no conflict now) */}
            <Stack.Screen name="city/key/[cityKey]" options={{ headerTitle: "City" }} />

            <Stack.Screen name="team/[teamKey]" options={{ headerTitle: "Team" }} />
            <Stack.Screen name="stadium/[slug]" options={{ headerTitle: "Stadium" }} />

            <Stack.Screen name="trip/build" options={{ headerTitle: "Build Trip" }} />
            <Stack.Screen name="trip/[id]" options={{ headerTitle: "Trip Details" }} />
          </Stack>
        </ProProvider>
      </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
