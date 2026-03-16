// src/features/discover/components/DiscoverHero.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from "react-native";
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
  const actionLabel = setupExpanded ? "Hide setup" : "Refine setup";

  return (
    <GlassCard strength="strong" style={styles.hero} noPadding>
      <View style={styles.heroInner}>
        <View style={styles.headerBlock}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerPill}>
              <Ionicons
                name="compass-outline"
                size={13}
                color={theme.colors.text}
              />
              <Text style={styles.kicker}>DISCOVER</Text>
            </View>

            <View style={styles.livePill}>
              <Text style={styles.livePillText}>Live football-trip intelligence</Text>
            </View>
          </View>

          <Text style={styles.title}>Find a football trip actually worth taking</Text>

          <Text style={styles.sub}>
            Discover big atmospheres, city-break fixtures, European nights, easier ticket routes,
            and stackable football weekends across your live search window.
          </Text>
        </View>

        <View style={styles.summaryShell}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryKicker}>Current setup</Text>

            <Pressable
              onPress={onToggleSetup}
              hitSlop={8}
              style={({ pressed }) => [
                styles.setupToggleInline,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={setupExpanded ? "chevron-up-outline" : "options-outline"}
                size={16}
                color={theme.colors.text}
              />
              <Text style={styles.setupToggleInlineText}>{actionLabel}</Text>
            </Pressable>
          </View>

          <Text style={styles.summaryText} numberOfLines={2}>
            {compactSummary}
          </Text>
        </View>

        {hasFeatured ? (
          <Pressable
            onPress={onPressFeatured}
            style={({ pressed }) => [
              styles.featureWrap,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.featureImageWrap}>
              <Image
                source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }}
                style={styles.featureImage}
                resizeMode="cover"
              />
              <View style={styles.featureImageOverlay} />

              <View style={styles.featureTopBar}>
                <View style={styles.topPickPill}>
                  <Ionicons
                    name="sparkles-outline"
                    size={13}
                    color={theme.colors.text}
                  />
                  <Text style={styles.topPickPillText}>Best live fit</Text>
                </View>

                <View style={styles.openRoutePill}>
                  <Text style={styles.openRoutePillText}>Open route</Text>
                </View>
              </View>
            </View>

            <View style={styles.featureBody}>
              <View style={styles.featureTitleRow}>
                <View style={styles.featureIconWrap}>
                  <Ionicons
                    name={featuredIcon}
                    size={18}
                    color={theme.colors.text}
                  />
                </View>

                <View style={styles.featureTitleTextWrap}>
                  <Text style={styles.featureEyebrow}>Top pick for your current setup</Text>
                  <Text style={styles.featureTitle} numberOfLines={2}>
                    {featuredTitle}
                  </Text>
                </View>
              </View>

              {!!featuredMeta ? (
                <Text style={styles.featureMeta} numberOfLines={2}>
                  {featuredMeta}
                </Text>
              ) : null}

              {!!featuredWhy ? (
                <View style={styles.featureWhyBox}>
                  <Text style={styles.featureWhyLabel}>Why this works</Text>
                  <Text style={styles.featureWhy} numberOfLines={3}>
                    {featuredWhy}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ) : (
          <View style={styles.noFeatureWrap}>
            <View style={styles.noFeatureIcon}>
              <Ionicons
                name="search-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
            </View>

            <View style={styles.noFeatureTextWrap}>
              <Text style={styles.noFeatureTitle}>No featured live route yet</Text>
              <Text style={styles.noFeatureText}>
                Adjust your setup and Discover will surface a stronger current football-trip option.
              </Text>
            </View>

            <Pressable
              onPress={onToggleSetup}
              style={({ pressed }) => [
                styles.noFeatureButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.noFeatureButtonText}>Adjust setup</Text>
            </Pressable>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: theme.spacing.lg,
    borderRadius: 26,
    borderColor: "rgba(255,255,255,0.08)",
  },

  heroInner: {
    padding: 16,
    gap: 14,
  },

  headerBlock: {
    gap: 8,
  },

  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },

  kickerPill: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.12)" : "rgba(87,162,56,0.08)",
  },

  kicker: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1,
  },

  livePill: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
  },

  livePillText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  title: {
    color: theme.colors.text,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: theme.fontWeight.black,
    maxWidth: "94%",
  },

  sub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "96%",
  },

  summaryShell: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },

  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  summaryKicker: {
    color: theme.colors.textTertiary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  setupToggleInline: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
  },

  setupToggleInlineText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  summaryText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  featureWrap: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.04)",
  },

  featureImageWrap: {
    height: 188,
    position: "relative",
  },

  featureImage: {
    width: "100%",
    height: "100%",
  },

  featureImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.46)",
  },

  featureTopBar: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  topPickPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.26)",
    backgroundColor: "rgba(6,10,8,0.68)",
  },

  topPickPillText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.25,
  },

  openRoutePill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(8,10,10,0.68)",
  },

  openRoutePillText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  featureBody: {
    padding: 15,
    gap: 10,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.24)" : "rgba(255,255,255,0.05)",
  },

  featureTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  featureTitleTextWrap: {
    flex: 1,
    gap: 3,
  },

  featureEyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.25,
  },

  featureTitle: {
    color: theme.colors.text,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: theme.fontWeight.black,
  },

  featureMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  featureWhyBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.16)",
    backgroundColor: "rgba(87,162,56,0.08)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 4,
  },

  featureWhyLabel: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  featureWhy: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  noFeatureWrap: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
    padding: 14,
    gap: 10,
  },

  noFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
  },

  noFeatureTextWrap: {
    gap: 4,
  },

  noFeatureTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  noFeatureText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  noFeatureButton: {
    alignSelf: "flex-start",
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  noFeatureButtonText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
});
