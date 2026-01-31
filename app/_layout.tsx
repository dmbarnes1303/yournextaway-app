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

// Keep the splash up until fonts are ready.
SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore
});

// ✅ Dev-only logging init (runs once per bundle load)
declare const __DEV__: boolean;
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
            {/* Boot redirect file (decides Landing vs Home) */}
            <Stack.Screen name="index" options={{ headerShown: false }} />

            {/* Top funnel */}
            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: true, headerTitle: "" }} />

            {/* Paywall */}
            <Stack.Screen name="paywall" options={{ headerTitle: "YourNextAway Pro" }} />

            {/* Tabs */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Details */}
            <Stack.Screen name="match/[id]" options={{ headerTitle: "Match" }} />

            {/*
              ⚠️ Potential routing conflict:
              You have BOTH city/[slug] and city/[cityKey]. Expo Router will treat these as the same route pattern.
              If both files exist in app/city/, one of them must go or be renamed.
            */}
            <Stack.Screen name="city/[slug]" options={{ headerTitle: "City" }} />
            <Stack.Screen name="city/[cityKey]" options={{ headerTitle: "City" }} />

            <Stack.Screen name="team/[teamKey]" options={{ headerTitle: "Team" }} />
            <Stack.Screen name="stadium/[slug]" options={{ headerTitle: "Stadium" }} />

            {/* Trips */}
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
