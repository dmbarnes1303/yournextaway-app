import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import {
  DISCOVER_CATEGORY_META,
  type DiscoverCategory,
} from "@/src/features/discover/discoverCategories";
import { PLACEHOLDER_DISCOVER_IMAGE } from "@/src/features/discover/discoverPresets";

type Props = {
  category: DiscoverCategory;
  compact?: boolean;
  onPress: (category: DiscoverCategory) => void;
};

export default function DiscoverCategoryCard({
  category,
  compact = false,
  onPress,
}: Props) {
  const meta = DISCOVER_CATEGORY_META[category];
  const primary = meta.emphasis === "primary";

  return (
    <Pressable
      onPress={() => onPress(category)}
      style={({ pressed }) => [
        compact ? styles.categoryPressCompact : styles.categoryPress,
        pressed && styles.pressed,
      ]}
    >
      <GlassCard
        strength="default"
        style={[
          compact ? styles.categoryCardCompact : styles.categoryCard,
          primary && !compact ? styles.categoryCardPrimary : null,
        ]}
        noPadding
      >
        <View style={styles.categoryImageWrap}>
          <Image
            source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }}
            style={styles.categoryImage}
            resizeMode="cover"
          />
          <View style={styles.categoryImageOverlay} />
          <View style={styles.categoryEyebrowPill}>
            <Text style={styles.categoryEyebrowText}>
              {compact ? "Browse" : "Discover"}
            </Text>
          </View>
        </View>

        <View style={compact ? styles.categoryInnerCompact : styles.categoryInner}>
          <View style={styles.categoryTopRow}>
            <View
              style={[
                styles.categoryIconWrap,
                primary && !compact ? styles.categoryIconWrapPrimary : null,
              ]}
            >
              <Ionicons name={meta.icon} size={18} color={theme.colors.text} />
            </View>
          </View>

          <View style={styles.categoryTextWrap}>
            <Text style={styles.categoryTitle}>{meta.title}</Text>
            <Text style={styles.categorySubtitle}>{meta.subtitle}</Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  categoryPress: {
    width: "48.5%",
    borderRadius: 18,
    overflow: "hidden",
  },

  categoryPressCompact: {
    width: 212,
    borderRadius: 18,
    overflow: "hidden",
  },

  categoryCard: {
    borderRadius: 18,
    minHeight: 214,
  },

  categoryCardCompact: {
    borderRadius: 18,
    minHeight: 184,
  },

  categoryCardPrimary: {
    borderColor: "rgba(87,162,56,0.16)",
  },

  categoryImageWrap: {
    height: 92,
    position: "relative",
  },

  categoryImage: {
    width: "100%",
    height: "100%",
  },

  categoryImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.36)",
  },

  categoryEyebrowPill: {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,10,10,0.58)",
  },

  categoryEyebrowText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  categoryInner: {
    padding: 14,
    minHeight: 120,
    gap: 12,
    justifyContent: "space-between",
  },

  categoryInnerCompact: {
    padding: 14,
    minHeight: 92,
    gap: 12,
    justifyContent: "space-between",
  },

  categoryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  categoryIconWrapPrimary: {
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  categoryTextWrap: {
    gap: 6,
  },

  categoryTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  categorySubtitle: {
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
