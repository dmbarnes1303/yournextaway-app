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

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "landing",
};

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="light" />

      <GestureHandlerRootView style={styles.flex}>
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
          {/* Boot redirect file */}
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* Top funnel */}
          <Stack.Screen name="landing" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: true }} />

          {/* Tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Details */}
          <Stack.Screen name="match/[id]" options={{ headerTitle: "Match" }} />
          <Stack.Screen name="city/[slug]" options={{ headerTitle: "City" }} />
          <Stack.Screen name="team/[slug]" options={{ headerTitle: "Team" }} />
          <Stack.Screen name="stadium/[slug]" options={{ headerTitle: "Stadium" }} />

          {/* Trips */}
          <Stack.Screen name="trip/build" options={{ headerTitle: "Build Trip" }} />
          <Stack.Screen name="trip/[id]" options={{ headerTitle: "Trip Details" }} />
        </Stack>
      </GestureHandlerRootView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
