import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Image, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function toEstimatedChip(value: string | null, suffix?: string) {
  if (!value) return null;
  const stripped = value.replace(/^From\s+/i, "");
  return suffix ? `Estimated only • ${stripped} ${suffix}` : `Estimated only • ${stripped}`;
}

function confidenceCopy(confidence: "low" | "medium" | "high") {
  if (confidence === "high") {
    return {
      short: "High confidence",
      foot: "Estimated only. Based on strong fixture, league and venue detail.",
    };
  }

  if (confidence === "medium") {
    return {
      short: "Medium confidence",
      foot: "Estimated only. Based on solid fixture detail with some assumptions.",
    };
  }

  return {
    short: "Early estimate",
    foot: "Estimated only. Based on limited fixture detail. Live partner prices may differ.",
  };
}

function confidenceTone(confidence: "low" | "medium" | "high") {
  if (confidence === "high") return styles.confidenceHigh;
  if (confidence === "medium") return styles.confidenceMedium;
  return styles.confidenceLow;
}

function confidenceTextTone(confidence: "low" | "medium" | "high") {
  if (confidence === "high") return styles.confidenceHighText;
  if (confidence === "medium") return styles.confidenceMediumText;
  return styles.confidenceLowText;
}

function formatLeagueLine(row?: FixtureListRow) {
  const league = clean(row?.league?.name);
  const country = clean((row?.league as { country?: string } | undefined)?.country);

  if (league && country) return `${league} • ${country}`;
  return league || country || null;
}

function routeAngleLabel(
  variant: Variant,
  subtitle: string,
  pricing: {
    tripEstimate: string | null;
    ticketEstimate: string | null;
  }
) {
  if (subtitle) return subtitle;

  if (variant === "trending") {
    if (pricing.tripEstimate) return "High-interest fixture with estimated-only trip cost guidance";
    if (pricing.ticketEstimate) {
      return "High-interest fixture with estimated-only ticket guidance";
    }
    return "High-interest football route worth checking now";
  }

  if (pricing.tripEstimate) return "Live fixture route with estimated-only trip cost guidance";
  if (pricing.ticketEstimate) return "Live fixture route with estimated-only ticket guidance";
  return "Live discovery route worth checking now";
}

function ctaLabel(variant: Variant) {
  return variant === "trending" ? "Open trip" : "View route";
}

function topRightLabel(variant: Variant, tripEstimate: string | null) {
  if (tripEstimate) return tripEstimate;
  return variant === "trending" ? "Estimated only" : "Live route";
}

function imageHeight(variant: Variant) {
  return variant === "trending" ? 138 : 122;
}

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

  const pricing = useMemo(() => {
    return row ? estimateFixturePricing(row) : null;
  }, [row]);

  const tripEstimate = pricing?.tripLabel ? toEstimatedChip(pricing.tripLabel, "trip") : null;
  const ticketEstimate = pricing?.ticketLabel
    ? toEstimatedChip(pricing.ticketLabel, "ticket")
    : null;

  const confidence = pricing?.confidence ?? "low";
  const confidenceUi = confidenceCopy(confidence);
  const leagueLine = formatLeagueLine(row);

  const routeAngle = routeAngleLabel(variant, subtitle, {
    tripEstimate,
    ticketEstimate,
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        isTrending ? styles.trendingPress : styles.livePress,
        pressed && styles.pressed,
      ]}
    >
      <GlassCard
        strength={isTrending ? "strong" : "default"}
        style={isTrending ? styles.trendingCard : styles.liveCard}
        noPadding
      >
        <View style={[styles.imageWrap, { height: imageHeight(variant) }]}>
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
          <View style={isTrending ? styles.trendingImageOverlay : styles.liveImageOverlay} />

          <View style={styles.topBar}>
            <View style={isTrending ? styles.trendingBadgePill : styles.liveBadgePill}>
              <Text style={isTrending ? styles.trendingBadgeText : styles.liveBadgeText}>
                {badge}
              </Text>
            </View>

            <View style={tripEstimate ? styles.heroPricePill : styles.heroGhostPill}>
              {tripEstimate ? (
                <>
                  <Ionicons name="airplane-outline" size={11} color={theme.colors.text} />
                  <Text style={styles.heroPricePillText} numberOfLines={1}>
                    {topRightLabel(variant, tripEstimate)}
                  </Text>
                </>
              ) : (
                <Text style={styles.heroGhostPillText}>{topRightLabel(variant, null)}</Text>
              )}
            </View>
          </View>

          {leagueLine ? (
            <View style={styles.bottomImageLabel}>
              <Text style={styles.bottomImageLabelText} numberOfLines={1}>
                {leagueLine}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={isTrending ? styles.trendingBody : styles.liveBody}>
          <Text style={isTrending ? styles.trendingTitle : styles.liveTitle} numberOfLines={2}>
            {title}
          </Text>

          {meta ? (
            <Text style={styles.metaText} numberOfLines={2}>
              {meta}
            </Text>
          ) : null}

          <Text style={isTrending ? styles.trendingAngle : styles.liveAngle} numberOfLines={2}>
            {routeAngle}
          </Text>

          {tripEstimate || ticketEstimate || pricing ? (
            <View style={styles.pricingBlock}>
              <View style={styles.pricingRow}>
                {tripEstimate ? (
                  <View style={styles.pricingChipStrong}>
                    <Text style={styles.pricingChipStrongText}>{tripEstimate}</Text>
                  </View>
                ) : null}

                {ticketEstimate ? (
                  <View style={styles.pricingChip}>
                    <Text style={styles.pricingChipText}>{ticketEstimate}</Text>
                  </View>
                ) : null}

                {pricing ? (
                  <View style={[styles.confidenceChip, confidenceTone(confidence)]}>
                    <Text style={[styles.confidenceChipText, confidenceTextTone(confidence)]}>
                      {confidenceUi.short}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.footerRow}>
            <Text style={styles.estimateNote} numberOfLines={3}>
              {pricing ? confidenceUi.foot : "Estimated only. Live partner prices may differ."}
            </Text>

            <View style={styles.ctaInline}>
              <Text style={styles.ctaInlineText}>{ctaLabel(variant)}</Text>
              <Ionicons name="arrow-forward-outline" size={13} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  livePress: {
    width: 264,
    borderRadius: 22,
    overflow: "hidden",
  },

  trendingPress: {
    width: 290,
    borderRadius: 22,
    overflow: "hidden",
  },

  liveCard: {
    borderRadius: 22,
  },

  trendingCard: {
    borderRadius: 22,
    borderColor: "rgba(255,255,255,0.10)",
  },

  imageWrap: {
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  liveImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.44)",
  },

  trendingImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.34)",
  },

  topBar: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  liveBadgePill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(6,10,8,0.62)",
  },

  liveBadgeText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  trendingBadgePill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,10,10,0.72)",
  },

  trendingBadgeText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  heroPricePill: {
    maxWidth: 188,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(8,10,10,0.72)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  heroPricePillText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  heroGhostPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,10,10,0.52)",
  },

  heroGhostPillText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  bottomImageLabel: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
  },

  bottomImageLabelText: {
    color: "rgba(255,255,255,0.94)",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  liveBody: {
    padding: 14,
    gap: 6,
    minHeight: 176,
  },

  trendingBody: {
    padding: 14,
    gap: 7,
    minHeight: 190,
  },

  liveTitle: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: theme.fontWeight.black,
  },

  trendingTitle: {
    color: theme.colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: theme.fontWeight.black,
  },

  metaText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  liveAngle: {
    color: theme.colors.primary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.black,
    marginTop: 2,
  },

  trendingAngle: {
    color: theme.colors.primary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
    marginTop: 2,
  },

  pricingBlock: {
    marginTop: 4,
  },

  pricingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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

  confidenceChip: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
  },

  confidenceChipText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  confidenceHigh: {
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  confidenceMedium: {
    borderColor: "rgba(242,201,76,0.24)",
    backgroundColor: "rgba(242,201,76,0.10)",
  },

  confidenceLow: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.04)",
  },

  confidenceHighText: {
    color: "rgba(87,162,56,0.95)",
  },

  confidenceMediumText: {
    color: "rgba(242,201,76,0.95)",
  },

  confidenceLowText: {
    color: theme.colors.textSecondary,
  },

  footerRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },

  estimateNote: {
    flex: 1,
    color: theme.colors.textTertiary,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: theme.fontWeight.bold,
  },

  ctaInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 1,
  },

  ctaInlineText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
