import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  isDiscoverCategory,
  type DiscoverCategory,
} from "@/src/features/discover/discoverCategories";
import { nextWeekendWindowIso } from "@/src/constants/football";

export default function DiscoverCategoryScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{
    category?: DiscoverCategory | string;
  }>();

  useEffect(() => {
    if (!category || !isDiscoverCategory(String(category))) return;

    const window = nextWeekendWindowIso();

    router.replace({
      pathname: "/(tabs)/fixtures",
      params: {
        from: window.from,
        to: window.to,
        discover: String(category),
      },
    } as any);
  }, [category, router]);

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
