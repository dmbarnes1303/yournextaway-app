import React from "react";
import { ScrollView, Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import type { QuickSpark } from "@/src/features/discover/types";

type Props = {
  sparks: QuickSpark[];
  onPressSpark: (spark: QuickSpark) => void;
};

export default function DiscoverQuickSparks({ sparks, onPressSpark }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.sparkRow}
    >
      {sparks.map((spark) => (
        <Pressable
          key={spark.id}
          onPress={() => onPressSpark(spark)}
          style={({ pressed }) => [styles.sparkPress, pressed && styles.pressed]}
        >
          <GlassCard strength="default" style={styles.sparkCard} noPadding>
            <View style={styles.sparkInner}>
              <View style={styles.sparkIconWrap}>
                <Ionicons name={spark.icon} size={17} color={theme.colors.text} />
              </View>
              <Text style={styles.sparkTitle}>{spark.title}</Text>
            </View>
          </GlassCard>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sparkRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  sparkPress: {
    borderRadius: 999,
    overflow: "hidden",
  },

  sparkCard: {
    borderRadius: 999,
  },

  sparkInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  sparkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  sparkTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
