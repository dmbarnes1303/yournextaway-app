import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { getBackground } from "@/src/constants/backgrounds";

import {
  DISCOVER_ROWS,
  DISCOVER_CATEGORY_META,
  type DiscoverCategory,
} from "@/src/features/discover/discoverCategories";

export default function DiscoverScreen() {
  const router = useRouter();

  const goCategory = (category: DiscoverCategory) => {
    router.push({
      pathname: "/discover/[category]",
      params: { category },
    } as any);
  };

  return (
    <Background imageSource={getBackground("discover")} overlayOpacity={0.64}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>Discover</Text>

          {DISCOVER_ROWS.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((cat) => {
                const meta = DISCOVER_CATEGORY_META[cat];

                return (
                  <Pressable
                    key={cat}
                    onPress={() => goCategory(cat)}
                    style={({ pressed }) => [
                      styles.cardPress,
                      pressed && { opacity: 0.92 },
                    ]}
                  >
                    <GlassCard style={styles.card} noPadding>
                      <View style={styles.cardInner}>
                        <Text style={styles.icon}>{meta.icon}</Text>
                        <Text style={styles.title}>{meta.title}</Text>
                      </View>
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  content: {
    padding: theme.spacing.lg,
    gap: 14,
  },

  header: {
    fontSize: 28,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  cardPress: {
    width: "48.5%",
    borderRadius: 18,
  },

  card: {
    borderRadius: 18,
  },

  cardInner: {
    padding: 16,
    gap: 6,
  },

  icon: {
    fontSize: 22,
  },

  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },
});
