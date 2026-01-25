// app/index.tsx
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  setupComplete: "yna:setupComplete",
};

export default function Index() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const done = await AsyncStorage.getItem(STORAGE_KEYS.setupComplete);

        if (done === "true") {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/landing");
        }
      } catch {
        router.replace("/landing");
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) return <View />;

  return <View />;
}
