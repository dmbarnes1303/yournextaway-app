import React, { useEffect } from "react";
import { Redirect } from "expo-router";

/**
 * Single source of truth for boot routing.
 * This prevents Expo/Metro from "restoring" you into a deep route (e.g. /trip/build).
 */
export default function Index() {
  return <Redirect href="/landing" />;
}
