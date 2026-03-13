import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  isDiscoverCategory,
  type DiscoverCategory,
} from "@/src/features/discover/discoverCategories";
import { nextWeekendWindowIso } from "@/src/constants/football";

/**
 * Compatibility shim only.
 * Main Discover flow should come from the Discover tab itself.
 */
export default function DiscoverCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: DiscoverCategory | string;
    from?: string;
    to?: string;
    discoverFrom?: string;
    discoverTripLength?: string;
    discoverVibes?: string;
  }>();

  useEffect(() => {
    if (!params.category || !isDiscoverCategory(String(params.category))) return;

    const fallbackWindow = nextWeekendWindowIso();

    router.replace({
      pathname: "/(tabs)/fixtures",
      params: {
        discover: String(params.category),
        from: String(params.from ?? fallbackWindow.from),
        to: String(params.to ?? fallbackWindow.to),
        discoverFrom: params.discoverFrom ? String(params.discoverFrom) : undefined,
        discoverTripLength: params.discoverTripLength
          ? String(params.discoverTripLength)
          : undefined,
        discoverVibes: params.discoverVibes ? String(params.discoverVibes) : undefined,
      },
    } as any);
  }, [params, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
