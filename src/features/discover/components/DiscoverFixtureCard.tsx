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
    if (pricing.ticketEstimate) return "High-interest fixture with estimated-only ticket guidance";
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
  return variant === "trending" ? 144 : 126;
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
        variant={isTrending ? "gold" : "brand"}
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
                  <Ionicons
                    name="airplane-outline"
                    size={11}
                    color={isTrending ? theme.colors.textOnGold : theme.colors.text}
                  />
                  <Text
                    style={
                      isTrending ? styles.heroPricePillGoldText : styles.heroPricePillText
                    }
                    numberOfLines={1}
                  >
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
                  <View style={isTrending ? styles.pricingChipGold : styles.pricingChipStrong}>
                    <Text
                      style={
                        isTrending
                          ? styles.pricingChipGoldText
                          : styles.pricingChipStrongText
                      }
                    >
                      {tripEstimate}
                    </Text>
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
              <Text style={isTrending ? styles.ctaInlineGoldText : styles.ctaInlineText}>
                {ctaLabel(variant)}
              </Text>
              <Ionicons
                name="arrow-forward-outline"
                size={13}
                color={isTrending ? theme.colors.accentGold : theme.colors.primary}
              />
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  livePress: {
    width: 268,
    borderRadius: 22,
    overflow: "hidden",
  },

  trendingPress: {
    width: 294,
    borderRadius: 22,
    overflow: "hidden",
  },

  liveCard: {
    borderRadius: 22,
  },

  trendingCard: {
    borderRadius: 22,
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
    backgroundColor: "rgba(4,8,6,0.42)",
  },

  trendingImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12,10,4,0.28)",
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
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderGreenSoft,
    backgroundColor: theme.badge.bgGreen,
  },

  liveBadgeText: {
    color: theme.badge.textGreen,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.25,
  },

  trendingBadgePill: {
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderGoldSoft,
    backgroundColor: theme.badge.bgGold,
  },

  trendingBadgeText: {
    color: theme.badge.textGold,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.25,
  },

  heroPricePill: {
    maxWidth: 192,
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
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

  heroPricePillGoldText: {
    color: theme.colors.textOnGold,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  heroGhostPill: {
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
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
    color: "rgba(255,255,255,0.95)",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  liveBody: {
    padding: 14,
    gap: 6,
    minHeight: 180,
  },

  trendingBody: {
    padding: 14,
    gap: 7,
    minHeight: 194,
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
    color: theme.colors.accentGreenSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.black,
    marginTop: 2,
  },

  trendingAngle: {
    color: theme.colors.accentGoldSoft,
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
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  pricingChipText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  pricingChipStrong: {
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: theme.colors.borderGreenSoft,
    backgroundColor: theme.badge.bgGreen,
  },

  pricingChipStrongText: {
    color: theme.badge.textGreen,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  pricingChipGold: {
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: theme.colors.borderGoldSoft,
    backgroundColor: theme.badge.bgGold,
  },

  pricingChipGoldText: {
    color: theme.badge.textGold,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  confidenceChip: {
    borderRadius: theme.borderRadius.pill,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
  },

  confidenceChipText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  confidenceHigh: {
    borderColor: theme.colors.borderGreenSoft,
    backgroundColor: theme.badge.bgGreen,
  },

  confidenceMedium: {
    borderColor: theme.colors.borderGoldSoft,
    backgroundColor: theme.badge.bgGold,
  },

  confidenceLow: {
    borderColor: theme.colors.borderSubtle,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.04)",
  },

  confidenceHighText: {
    color: theme.badge.textGreen,
  },

  confidenceMediumText: {
    color: theme.badge.textGold,
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

  ctaInlineGoldText: {
    color: theme.colors.accentGold,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
