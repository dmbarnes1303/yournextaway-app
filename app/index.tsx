// app/index.tsx
import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  setupComplete: "yna:setupComplete",
};

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const done = await AsyncStorage.getItem(STORAGE_KEYS.setupComplete);

        if (!alive) return;

        router.replace(done === "true" ? "/(tabs)/home" : "/landing");
      } catch {
        if (!alive) return;
        router.replace("/landing");
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  // Blank screen while deciding where to route.
  return <View />;
}
