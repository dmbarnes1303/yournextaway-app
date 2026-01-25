// app/index.tsx
import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem("yna:seenLanding");

        if (seen === "true") {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/landing");
        }
      } catch {
        router.replace("/landing");
      }
    })();
  }, [router]);

  return <View />;
}
