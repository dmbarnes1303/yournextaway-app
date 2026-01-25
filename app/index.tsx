// app/index.tsx
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  onboardingComplete: "yna:onboardingComplete",
};

export default function Index() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const done = await AsyncStorage.getItem(STORAGE_KEYS.onboardingComplete);

        // Not completed -> show Landing
        if (done !== "true") {
          router.replace("/landing");
        } else {
          // Completed -> go straight to Home
          router.replace("/(tabs)/home");
        }
      } catch {
        // If storage fails, fail-safe to Landing (first run experience).
        router.replace("/landing");
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  // Render nothing while routing.
  if (!ready) return <View />;

  return <View />;
}
