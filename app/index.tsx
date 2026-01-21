import React, { useEffect } from "react";
import { useRouter } from "expo-router";

/**
 * Hard boot route.
 * Prevents Expo/Metro restoring you into a deep route (e.g. /trip/build).
 */
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/landing");
  }, [router]);

  return null;
}
