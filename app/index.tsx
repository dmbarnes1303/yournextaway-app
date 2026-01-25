// app/index.tsx
import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  seenLanding: "yna:seenLanding",
};

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEYS.seenLanding);

        if (!mounted) return;

        // Browse-first:
        // - First ever open -> Landing
        // - Returning user -> Home
        if (seen === "true") {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/landing");
        }
      } catch {
        // If storage fails, default to Landing (safe + predictable).
        if (mounted) router.replace("/landing");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  // Empty while we redirect
  return <View />;
}
