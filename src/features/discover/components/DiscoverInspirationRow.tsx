import React from "react";
import { ScrollView, Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import type { InspirationPreset } from "@/src/features/discover/types";

type Props = {
  presets: InspirationPreset[];
  onPressPreset: (preset: InspirationPreset) => void;
};

export default function DiscoverInspirationRow({ presets, onPressPreset }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.inspirationRow}
    >
      {presets.map((preset) => (
        <Pressable
          key={preset.id}
          onPress={() => onPressPreset(preset)}
          style={({ pressed }) => [styles.inspirationPress, pressed && styles.pressed]}
        >
          <GlassCard strength="default" style={styles.inspirationCard} noPadding>
            <View style={styles.inspirationInner}>
              <View style={styles.inspirationIconWrap}>
                <Ionicons name={preset.icon} size={18} color={theme.colors.text} />
              </View>

              <View style={styles.inspirationTextWrap}>
                <Text style={styles.inspirationTitle}>{preset.title}</Text>
                <Text style={styles.inspirationSub}>{preset.subtitle}</Text>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  inspirationRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  inspirationPress: {
    width: 216,
    borderRadius: 18,
    overflow: "hidden",
  },

  inspirationCard: {
    borderRadius: 18,
    minHeight: 112,
  },

  inspirationInner: {
    padding: 14,
    minHeight: 112,
    gap: 12,
    justifyContent: "space-between",
  },

  inspirationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  inspirationTextWrap: {
    gap: 6,
  },

  inspirationTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  inspirationSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
