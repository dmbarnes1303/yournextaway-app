import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { type FixtureListRow } from "@/src/services/apiFootball";
import { PLACEHOLDER_DISCOVER_IMAGE } from "@/src/features/discover/discoverPresets";

type Variant = "live" | "trending";

type Props = {
  row: FixtureListRow;
  title: string;
  subtitle: string;
  badge: string;
  onPress: () => void;
  variant?: Variant;
};

export default function DiscoverFixtureCard({
  row,
  title,
  subtitle,
  badge,
  onPress,
  variant = "live",
}: Props) {
  const isTrending = variant === "trending";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        isTrending ? styles.trendingPress : styles.livePress,
        pressed && styles.pressed,
      ]}
    >
      <GlassCard
        strength="default"
        style={isTrending ? styles.trendingCard : styles.liveCard}
        noPadding
      >
        <View style={isTrending ? styles.trendingImageWrap : styles.liveImageWrap}>
          <Image
            source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }}
            style={isTrending ? styles.trendingImage : styles.liveImage}
            resizeMode="cover"
          />
          <View
            style={isTrending ? styles.trendingImageOverlay : styles.liveImageOverlay}
          />
          <View style={isTrending ? styles.trendingTopBar : styles.liveTopBar}>
            <View style={isTrending ? styles.trendingHotPill : styles.liveRankPill}>
              <Text style={isTrending ? styles.trendingHotText : styles.liveRankText}>
                {badge}
              </Text>
            </View>
          </View>
        </View>

        <View style={isTrending ? styles.trendingBody : styles.liveBody}>
          <Text style={isTrending ? styles.trendingTitle : styles.liveTitle} numberOfLines={2}>
            {title}
          </Text>

          <Text
            style={isTrending ? styles.trendingLabel : styles.liveMeta}
            numberOfLines={isTrending ? 1 : 2}
          >
            {subtitle}
          </Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  livePress: {
    width: 246,
    borderRadius: 20,
    overflow: "hidden",
  },

  liveCard: {
    borderRadius: 20,
  },

  liveImageWrap: {
    height: 108,
    position: "relative",
  },

  liveImage: {
    width: "100%",
    height: "100%",
  },

  liveImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.40)",
  },

  liveTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  liveRankPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(6,10,8,0.60)",
  },

  liveRankText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  liveBody: {
    padding: 14,
    gap: 6,
    minHeight: 110,
  },

  liveTitle: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: theme.fontWeight.black,
  },

  liveMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  trendingPress: {
    width: 274,
    borderRadius: 20,
    overflow: "hidden",
  },

  trendingCard: {
    borderRadius: 20,
  },

  trendingImageWrap: {
    height: 122,
    position: "relative",
  },

  trendingImage: {
    width: "100%",
    height: "100%",
  },

  trendingImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.34)",
  },

  trendingTopBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  trendingHotPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(8,10,10,0.70)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  trendingHotText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  trendingBody: {
    padding: 14,
    gap: 6,
    minHeight: 110,
  },

  trendingTitle: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: theme.fontWeight.black,
  },

  trendingLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
