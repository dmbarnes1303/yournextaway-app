// app/(tabs)/_layout.tsx
import React, { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

import { theme } from "@/src/constants/theme";

function safeStr(v: unknown) {
  const s = String(v ?? "").trim();
  return s || "";
}

function extractFixtureIdFromNotificationData(data: any): string | null {
  const kind = safeStr(data?.kind);
  const fixtureId = safeStr(data?.fixtureId);

  if (kind === "kickoff_update" && fixtureId) return fixtureId;

  // fallback: if you ever send fixtureId without kind
  if (fixtureId) return fixtureId;

  return null;
}

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + Math.max(insets.bottom, 10);

  // Guard against double-processing when app resumes + listener fires
  const lastHandledKeyRef = useRef<string>("");

  useEffect(() => {
    let mounted = true;

    const handleResponse = (response: Notifications.NotificationResponse) => {
      try {
        const data = response?.notification?.request?.content?.data ?? {};
        const fixtureId = extractFixtureIdFromNotificationData(data);
        if (!fixtureId) return;

        const key = `${fixtureId}:${safeStr(data?.kind) || "unknown"}`;
        if (lastHandledKeyRef.current === key) return;
        lastHandledKeyRef.current = key;

        // Route to match details
        router.push({ pathname: "/match/[id]", params: { id: fixtureId } } as any);
      } catch {
        // ignore
      }
    };

    // 1) Cold start / background-tap: grab the last response once on mount
    (async () => {
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        if (!mounted || !last) return;
        handleResponse(last);
      } catch {
        // ignore
      }
    })();

    // 2) Foreground/background: listen for taps
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleResponse(response);
    });

    return () => {
      mounted = false;
      try {
        sub.remove();
      } catch {
        // ignore
      }
    };
  }, [router]);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: "rgba(0,0,0,0.85)",
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: tabBarHeight,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fixtures"
        options={{
          title: "Fixtures",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Trips",
          tabBarIcon: ({ color, size }) => <Ionicons name="airplane-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
