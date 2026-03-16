// src/features/discover/components/DiscoverFixtureCard.tsx

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

function estimatedLabel(value: string | null, suffix?: string) {
  if (!value) return null;
  return suffix ? `Est. ${value.slice(5)} ${suffix}` : `Est. ${value.slice(5)}`;
}

function confidenceLabel(confidence: "low" | "medium" | "high") {
  if (confidence === "high") return "Estimate confidence: high";
  if (confidence === "medium") return "Estimate confidence: medium";
  return "Estimate confidence: low";
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

function formatTeamsLine(row?: FixtureListRow) {
  const home = clean(row?.teams?.home?.name);
  const away = clean(row?.teams?.away?.name);
  if (!home && !away) return null;
  if (home && away) return `${home} vs ${away}`;
  return home || away || null;
}

function formatLeagueLine(row?: FixtureListRow) {
  const league = clean(row?.league?.name);
  const country = clean((row?.league as any)?.country);
  if (league && country) return `${league} • ${country}`;
  return league || country || null;
}

function routeAngleLabel(variant: Variant, pricingAvailable: boolean, subtitle: string) {
  if (subtitle) return subtitle;
  if (variant === "trending") {
    return pricingAvailable
      ? "High-interest football trip with live route potential"
      : "Big-occasion football trip worth opening";
  }
  return pricingAvailable
    ? "Trip-ready route with estimated cost guidance"
    : "Live discovery route worth checking now";
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

  const tripEstimate = pricing?.tripLabel ? estimatedLabel(pricing.tripLabel, "trip") : null;
  const ticketEstimate = pricing?.ticketLabel ? estimatedLabel(pricing.ticketLabel, "ticket") : null;
  const confidence = pricing?.confidence ?? "low";

  const teamsLine = formatTeamsLine(row);
  const leagueLine = formatLeagueLine(row);
  const routeAngle = routeAngleLabel(variant, Boolean(tripEstimate || ticketEstimate), subtitle);

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
        <View style={isTrending ? styles.trendingImageWrap : styles.liveImageWrap}>
          <Image
            source={{ uri }}
            style={isTrending ? styles.trendingImage : styles.liveImage}
            resizeMode="cover"
          />
          <View style={isTrending ? styles.trendingImageOverlay : styles.liveImageOverlay} />

          <View style={styles.topBar}>
            <View style={isTrending ? styles.trendingBadgePill : styles.liveBadgePill}>
              <Text style={isTrending ? styles.trendingBadgeText : styles.liveBadgeText}>
                {badge}
              </Text>
            </View>

            {tripEstimate ? (
              <View style={styles.heroPricePill}>
                <Ionicons name="airplane-outline" size={11} color={theme.colors.text} />
                <Text style={styles.heroPricePillText} numberOfLines={1}>
                  {tripEstimate}
                </Text>
              </View>
            ) : (
              <View style={styles.heroGhostPill}>
                <Text style={styles.heroGhostPillText}>
                  {isTrending ? "Open trip" : "Live route"}
                </Text>
              </View>
            )}
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
          {teamsLine ? (
            <Text style={styles.teamsLine} numberOfLines={1}>
              {teamsLine}
            </Text>
          ) : null}

          <Text style={isTrending ? styles.trendingTitle : styles.liveTitle} numberOfLines={2}>
            {title}
          </Text>

          {meta ? (
            <Text style={isTrending ? styles.trendingMeta : styles.liveMeta} numberOfLines={2}>
              {meta}
            </Text>
          ) : null}

          <Text
            style={isTrending ? styles.trendingAngle : styles.liveAngle}
            numberOfLines={2}
          >
            {routeAngle}
          </Text>

          {tripEstimate || ticketEstimate ? (
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
                    {confidence === "high"
                      ? "High confidence"
                      : confidence === "medium"
                        ? "Medium confidence"
                        : "Low confidence"}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.footerRow}>
            {pricing ? (
              <Text style={styles.estimateNote} numberOfLines={1}>
                Estimated only • {confidenceLabel(confidence)}
              </Text>
            ) : (
              <Text style={styles.estimateNote} numberOfLines={1}>
                Live discovery route
              </Text>
            )}

            <View style={styles.ctaInline}>
              <Text style={styles.ctaInlineText}>
                {isTrending ? "Open trip" : "View route"}
              </Text>
              <Ionicons
                name="arrow-forward-outline"
                size={13}
                color={theme.colors.primary}
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
    width: 262,
    borderRadius: 22,
    overflow: "hidden",
  },

  trendingPress: {
    width: 286,
    borderRadius: 22,
    overflow: "hidden",
  },

  liveCard: {
    borderRadius: 22,
  },

  trendingCard: {
    borderRadius: 22,
  },

  liveImageWrap: {
    height: 118,
    position: "relative",
  },

  trendingImageWrap: {
    height: 132,
    position: "relative",
  },

  liveImage: {
    width: "100%",
    height: "100%",
  },

  trendingImage: {
    width: "100%",
    height: "100%",
  },

  liveImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.42)",
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
    maxWidth: 148,
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
    bottom: 10,
    right: 10,
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
    minHeight: 170,
  },

  trendingBody: {
    padding: 14,
    gap: 6,
    minHeight: 178,
  },

  teamsLine: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
    textTransform: "uppercase",
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

  liveMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  trendingMeta: {
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

  pricingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
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
    alignItems: "center",
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
