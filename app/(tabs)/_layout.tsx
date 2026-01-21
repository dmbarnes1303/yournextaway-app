// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/src/constants/theme";

// Ensure the default tab is always Home
export const unstable_settings = {
  initialRouteName: "home",
};

function iconName(
  routeName: string,
  focused: boolean
): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case "home":
      return focused ? "home" : "home-outline";
    case "fixtures":
      return focused ? "calendar" : "calendar-outline";
    case "trips":
      return focused ? "map" : "map-outline";
    case "wallet":
      return focused ? "wallet" : "wallet-outline";
    case "profile":
      return focused ? "person" : "person-outline";
    default:
      return focused ? "ellipse" : "ellipse-outline";
  }
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,

        tabBarStyle: {
          backgroundColor: "rgba(10, 14, 26, 0.92)",
          borderTopColor: "rgba(255,255,255,0.08)",
          height: Platform.OS === "ios" ? 84 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
        },

        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={iconName(route.name, focused)}
            size={size ?? 22}
            color={color}
          />
        ),
      })}
    >
      {/**
       * Hard-hide any accidental routes that Expo Router may discover in /app/(tabs)
       * (e.g. index.tsx, (home)/index.tsx, etc.). This prevents random extra tabs.
       */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="(home)" options={{ href: null }} />

      {/**
       * Your five locked tabs:
       */}
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="fixtures" options={{ title: "Fixtures" }} />
      <Tabs.Screen name="trips" options={{ title: "Trips" }} />
      <Tabs.Screen name="wallet" options={{ title: "Wallet" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
