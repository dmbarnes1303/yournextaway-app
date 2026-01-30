// app/index.tsx
import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import storage from "@/src/services/storage";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const seenLanding = await storage.getString("yna:seenLanding");

        if (cancelled) return;

        if (seenLanding === "true") {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/landing");
        }
      } catch {
        if (!cancelled) router.replace("/landing");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <View />;
}
