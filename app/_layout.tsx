// app/_layout.tsx
import "react-native-reanimated";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";

import { theme } from "@/src/constants/theme";
import BackButton from "@/src/components/BackButton";
import { ProProvider } from "@/src/context/ProContext";

// Side-effect init (safe in dev; your logger is already web-safe)
import "@/utils/errorLogger";

import savedItemsStore from "@/src/state/savedItems";
import { bootstrapPartnerReturnPrompt } from "@/src/services/partnerReturnBootstrap";

// DEV overlay
import PartnerClicksDebugOverlay from "@/src/components/PartnerClicksDebugOverlay";

SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    (async () => {
      try {
        await savedItemsStore.load();
      } catch {
        // ignore (best-effort)
      }

      try {
        bootstrapPartnerReturnPrompt();
      } catch {
        // ignore (best-effort)
      }
    })();

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

            {/* Tabs group */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Details */}
            <Stack.Screen name="match/[id]" options={{ headerTitle: "Match" }} />

            {/* City routing */}
            <Stack.Screen name="city/[cityKey]" options={{ headerTitle: "City" }} />
            <Stack.Screen name="city/[slug]" options={{ headerTitle: "City" }} />

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
