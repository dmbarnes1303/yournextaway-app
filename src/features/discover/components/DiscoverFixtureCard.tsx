import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { PLACEHOLDER_DISCOVER_IMAGE } from "@/src/features/discover/discoverPresets";
import { estimateFixturePricing } from "@/src/features/discover/discoverPrice";
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
  row,
}: Props) {
  const isTrending = variant === "trending";
  const uri = imageUri || PLACEHOLDER_DISCOVER_IMAGE;
  const pricing = row ? estimateFixturePricing(row) : null;

  const tripLabel = pricing?.tripLabel ?? null;
  const ticketLabel = pricing?.ticketLabel ?? null;
  const confidence = pricing?.confidence ?? "low";

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
            source={{ uri }}
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

            {tripLabel ? (
              <View style={styles.pricePill}>
                <Text style={styles.pricePillText}>{tripLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={isTrending ? styles.trendingBody : styles.liveBody}>
          <Text style={isTrending ? styles.trendingTitle : styles.liveTitle} numberOfLines={2}>
            {title}
          </Text>

          {meta ? (
            <Text
              style={isTrending ? styles.trendingMeta : styles.liveMeta}
              numberOfLines={2}
            >
              {meta}
            </Text>
          ) : null}

          {tripLabel || ticketLabel ? (
            <View style={styles.pricingRow}>
              {tripLabel ? (
                <View style={styles.pricingChipStrong}>
                  <Text style={styles.pricingChipStrongText}>{tripLabel} trip</Text>
                </View>
              ) : null}

              {ticketLabel ? (
                <View style={styles.pricingChip}>
                  <Text style={styles.pricingChipText}>{ticketLabel} ticket</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <Text
            style={isTrending ? styles.trendingLabel : styles.liveWhy}
            numberOfLines={isTrending ? 1 : 2}
          >
            {subtitle}
          </Text>

          {pricing ? (
            <Text style={styles.estimateNote} numberOfLines={1}>
              Estimated pricing • {confidence} confidence
            </Text>
          ) : null}
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
    justifyContent: "space-between",
    gap: 8,
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
    minHeight: 146,
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

  liveWhy: {
    color: theme.colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.black,
    marginTop: 2,
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
    justifyContent: "space-between",
    gap: 8,
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
    minHeight: 138,
  },

  trendingTitle: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: theme.fontWeight.black,
  },

  trendingMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  trendingLabel: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  pricePill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(8,10,10,0.70)",
  },

  pricePillText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  pricingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },

  pricingChip: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  pricingChipText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  pricingChipStrong: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  pricingChipStrongText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  estimateNote: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: theme.fontWeight.bold,
    marginTop: 2,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
