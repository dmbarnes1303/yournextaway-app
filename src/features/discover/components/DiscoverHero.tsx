import React from "react";
import { View, Text, StyleSheet, Pressable, Image, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { PLACEHOLDER_DISCOVER_IMAGE } from "@/src/features/discover/discoverPresets";

type Props = {
  compactSummary: string;
  setupExpanded: boolean;
  onToggleSetup: () => void;
  featuredTitle?: string | null;
  featuredMeta?: string | null;
  featuredWhy?: string | null;
  featuredIcon: keyof typeof Ionicons.glyphMap;
  onPressFeatured?: () => void;
};

export default function DiscoverHero({
  compactSummary,
  setupExpanded,
  onToggleSetup,
  featuredTitle,
  featuredMeta,
  featuredWhy,
  featuredIcon,
  onPressFeatured,
}: Props) {
  const hasFeatured = !!featuredTitle;

  return (
    <GlassCard strength="strong" style={styles.hero} noPadding>
      <View style={styles.heroInner}>
        <Text style={styles.kicker}>DISCOVER</Text>
        <Text style={styles.title}>Find your next football trip</Text>
        <Text style={styles.sub}>
          Big atmospheres, city breaks, European nights, and stacked football weekends.
        </Text>

        {hasFeatured ? (
          <Pressable
            onPress={onPressFeatured}
            style={({ pressed }) => [styles.heroFeaturePress, pressed && styles.pressed]}
          >
            <View style={styles.heroFeatureImageWrap}>
              <Image
                source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }}
                style={styles.heroFeatureImage}
                resizeMode="cover"
              />
              <View style={styles.heroFeatureOverlay} />
              <View style={styles.heroFeatureBadge}>
                <Text style={styles.heroFeatureBadgeText}>Top pick for your setup</Text>
              </View>
            </View>

            <View style={styles.heroFeatureBody}>
              <View style={styles.heroFeatureTopRow}>
                <View style={styles.heroFeatureIconWrap}>
                  <Ionicons name={featuredIcon} size={18} color={theme.colors.text} />
                </View>
                <Text style={styles.heroFeatureCtaInline}>Open route</Text>
              </View>

              <Text style={styles.heroFeatureTitle} numberOfLines={2}>
                {featuredTitle}
              </Text>

              {!!featuredMeta ? (
                <Text style={styles.heroFeatureMeta} numberOfLines={2}>
                  {featuredMeta}
                </Text>
              ) : null}

              {!!featuredWhy ? (
                <Text style={styles.heroFeatureWhy} numberOfLines={2}>
                  {featuredWhy}
                </Text>
              ) : null}
            </View>
          </Pressable>
        ) : null}

        <Pressable onPress={onToggleSetup} style={styles.heroActionRow}>
          <View style={styles.heroActionPill}>
            <Ionicons
              name={setupExpanded ? "chevron-up-outline" : "options-outline"}
              size={16}
              color={theme.colors.text}
            />
            <Text style={styles.heroActionText}>
              {setupExpanded ? "Hide trip setup" : "Edit trip setup"}
            </Text>
          </View>

          <View style={styles.heroMiniSummary}>
            <Text style={styles.heroMiniSummaryText}>{compactSummary}</Text>
          </View>
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: theme.spacing.lg,
    borderRadius: 24,
  },

  heroInner: {
    padding: 15,
    gap: 10,
  },

  kicker: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.1,
  },

  title: {
    color: theme.colors.text,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: theme.fontWeight.black,
  },

  sub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  heroFeaturePress: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 2,
  },

  heroFeatureImageWrap: {
    height: 170,
    position: "relative",
  },

  heroFeatureImage: {
    width: "100%",
    height: "100%",
  },

  heroFeatureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.42)",
  },

  heroFeatureBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(6,10,8,0.64)",
  },

  heroFeatureBadgeText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  heroFeatureBody: {
    padding: 14,
    gap: 7,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.05)",
  },

  heroFeatureTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  heroFeatureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  heroFeatureCtaInline: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  heroFeatureTitle: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: theme.fontWeight.black,
  },

  heroFeatureMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  heroFeatureWhy: {
    color: theme.colors.primary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
  },

  heroActionRow: {
    gap: 8,
    marginTop: 2,
  },

  heroActionPill: {
    alignSelf: "flex-start",
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  heroActionText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  heroMiniSummary: {
    alignSelf: "flex-start",
  },

  heroMiniSummaryText: {
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
