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
    let mounted = true;

    (async () => {
      try {
        const setupComplete = await AsyncStorage.getItem(STORAGE_KEYS.setupComplete);

        if (!mounted) return;

        if (setupComplete === "true") {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/landing");
        }
      } catch {
        if (!mounted) return;
        router.replace("/landing");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  // Empty while redirecting
  return <View />;
}
