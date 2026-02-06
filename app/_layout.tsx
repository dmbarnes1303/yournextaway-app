// app/_layout.tsx
import "react-native-reanimated";
import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";

import { theme } from "@/src/constants/theme";
import BackButton from "@/src/components/BackButton";
import { ProProvider } from "@/src/context/ProContext";

import "@/utils/errorLogger";

import savedItemsStore from "@/src/state/savedItems";
import { bootstrapPartnerReturnPrompt } from "@/src/services/partnerReturnBootstrap";

import PartnerClicksDebugOverlay from "@/src/components/PartnerClicksDebugOverlay";

SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const didInitRef = useRef(false);

  useEffect(() => {
    if (!fontsLoaded) return;
    if (didInitRef.current) return;
    didInitRef.current = true;

    // Hide splash as soon as fonts are ready. Don’t block on best-effort boot tasks.
    SplashScreen.hideAsync().catch(() => {
      // ignore
    });

    (async () => {
      // savedItems is required for click->pending->wallet pipeline
      try {
        await savedItemsStore.load();
      } catch {
        // ignore (best-effort)
      }

      // partner click return watcher + booked prompt
      try {
        bootstrapPartnerReturnPrompt();
      } catch {
        // ignore (best-effort)
      }
    })();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />

      <GestureHandlerRootView style={styles.flex}>
        <ProProvider>
          {__DEV__ ? <PartnerClicksDebugOverlay /> : null}

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
            {/* Top-level routes */}
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="paywall" options={{ headerTitle: "YourNextAway Pro" }} />

            {/* Tabs */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Details */}
            <Stack.Screen name="match/[id]" options={{ headerTitle: "Match" }} />

            {/* City (ONLY these two) */}
            <Stack.Screen name="city/[slug]" options={{ headerTitle: "City" }} />
            <Stack.Screen name="city/key/[cityKey]" options={{ headerTitle: "City" }} />

            {/* Team / Stadium */}
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
