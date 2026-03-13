import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import {
  DISCOVER_CATEGORY_META,
  type DiscoverCategory,
} from "@/src/features/discover/discoverCategories";

export default function DiscoverCategoryScreen() {
  const { category } = useLocalSearchParams<{
    category: DiscoverCategory;
  }>();

  const meta = DISCOVER_CATEGORY_META[category];

  if (!meta) {
    return (
      <View style={styles.center}>
        <Text>Category not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{meta.title}</Text>
      <Text style={styles.subtitle}>
        Matches for this category will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 10,
    opacity: 0.6,
  },
});
