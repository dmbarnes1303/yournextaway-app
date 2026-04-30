import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { PLACEHOLDER_DISCOVER_IMAGE } from "@/src/features/discover/discoverPresets";
import type { FixtureListRow } from "@/src/services/apiFootball";

type Variant = "live" | "trending";

type Props = {
  title: string;
  subtitle: string;
  badge: string;
  onPress: () => void;
  variant?: Variant;
  meta?: string;
  imageUri?: string;
  row?: FixtureListRow;
};

export default function DiscoverFixtureCard({
  title,
  subtitle,
  badge,
  onPress,
  variant = "live",
  meta,
  imageUri,
}: Props) {
  const isTrending = variant === "trending";
  const uri = imageUri || PLACEHOLDER_DISCOVER_IMAGE;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.press,
        pressed && styles.pressed,
      ]}
    >
      <GlassCard
        variant={isTrending ? "gold" : "brand"}
        strength="default"
        style={styles.card}
        noPadding
      >
        {/* IMAGE */}
        <View style={styles.imageWrap}>
          <Image source={{ uri }} style={styles.image} />

          <View style={styles.overlay} />

          {/* TOP BAR */}
          <View style={styles.topBar}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>

            {isTrending ? (
              <View style={styles.trendingPill}>
                <Text style={styles.trendingText}>Trending</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {meta ? (
            <Text style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}

          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>

          {/* CTA */}
          <View style={styles.footer}>
            <Text style={styles.cta}>
              {isTrending ? "Open trip" : "View route"}
            </Text>

            <Ionicons
              name="arrow-forward-outline"
              size={14}
              color={isTrending ? theme.colors.accentGold : theme.colors.primary}
            />
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: {
    width: 260,
    borderRadius: 24,
    overflow: "hidden",
  },

  card: {
    borderRadius: 24,
  },

  imageWrap: {
    height: 140,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.45)",
  },

  topBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  badge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  trendingPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(245,204,87,0.15)",
    borderWidth: 1,
    borderColor: "rgba(245,204,87,0.25)",
  },

  trendingText: {
    color: theme.colors.accentGold,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  body: {
    padding: 14,
    gap: 6,
  },

  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  meta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  footer: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  cta: {
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.primary,
  },

  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
});
