// app/index.tsx
import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import storage from "@/src/services/storage";

const STORAGE_KEYS = {
  showIntroOnStartup: "yna:showIntroOnStartup", // "true" | "false" (default true)
};

function parseBoolOrDefaultTrue(v: string | null): boolean {
  const s = (v ?? "").trim().toLowerCase();
  if (s === "false") return false;
  if (s === "true") return true;
  return true; // default
}

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await storage.getString(STORAGE_KEYS.showIntroOnStartup);
        const showIntro = parseBoolOrDefaultTrue(raw);

        if (cancelled) return;

        router.replace(showIntro ? "/landing" : "/(tabs)/home");
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
