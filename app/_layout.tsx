import "react-native-reanimated";
import React, { useEffect, useMemo } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, Text, useColorScheme, StyleSheet } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SystemBars } from "react-native-edge-to-edge";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { theme as appTheme } from "@/src/constants/theme";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "index",
};

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  const navTheme: Theme = useMemo(() => {
    const base = colorScheme === "dark" ? DarkTheme : DefaultTheme;

    // Keep your navigation theme consistent with your app palette.
    // This affects things like header back arrow color and background in some cases.
    return {
      ...base,
      dark: colorScheme === "dark",
      colors: {
        ...base.colors,
        primary: appTheme.colors.primary,
        background: appTheme.colors.background,
        card: "rgba(10, 14, 26, 0.92)",
        text: appTheme.colors.text,
        border: "rgba(255,255,255,0.10)",
        notification: appTheme.colors.error,
      },
    };
  }, [colorScheme]);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <ThemeProvider value={navTheme}>
        <WidgetProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                // Default: show header on stack screens so Back is available.
                headerShown: true,
                headerTransparent: true,
                headerTitle: "",
                headerTintColor: appTheme.colors.text,

                // This makes the header readable on dark backgrounds.
                headerStyle: {
                  backgroundColor: "transparent",
                },

                // Always-visible back control.
                // If there is no back history, it safely routes to Home.
                headerLeft: () => (
                  <Pressable
                    onPress={() => {
                      if (router.canGoBack()) router.back();
                      else router.replace("/(tabs)/home");
                    }}
                    style={styles.backBtn}
                    hitSlop={12}
                  >
                    <Text style={styles.backText}>← Back</Text>
                  </Pressable>
                ),
              }}
            >
              {/* Boot route (index redirects to /landing) */}
              <Stack.Screen name="index" options={{ headerShown: false }} />

              {/* Landing / Onboarding typically look better without double back;
                  but leaving the back is harmless. If you prefer no header at all,
                  set headerShown: false here too. */}
              <Stack.Screen name="landing" options={{ headerTitle: "" }} />
              <Stack.Screen name="onboarding" options={{ headerTitle: "" }} />

              {/* Tabs should NOT have a stack header (you already do your own UI there). */}
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

              {/* Detail screens: header on, title optional */}
              <Stack.Screen name="match/[id]" options={{ headerTitle: "Match" }} />
              <Stack.Screen name="city/[slug]" options={{ headerTitle: "City" }} />
              <Stack.Screen name="team/[slug]" options={{ headerTitle: "Team" }} />
              <Stack.Screen
                name="stadium/[slug]"
                options={{ headerTitle: "Stadium" }}
              />

              {/* Trips: keep header on so you can always back out */}
              <Stack.Screen name="trip/build" options={{ headerTitle: "Build Trip" }} />
              <Stack.Screen name="trip/[id]" options={{ headerTitle: "Trip Details" }} />
            </Stack>

            <SystemBars style="light" />
          </GestureHandlerRootView>
        </WidgetProvider>
      </ThemeProvider>
    </>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  backText: {
    color: appTheme.colors.text,
    fontWeight: "900",
    fontSize: appTheme.fontSize.sm,
  },
});
