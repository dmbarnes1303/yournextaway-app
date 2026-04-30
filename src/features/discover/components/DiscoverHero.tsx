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
  const hasFeatured = Boolean(featuredTitle);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.kickerPill}>
          <Ionicons name="compass-outline" size={13} color="#A3E635" />
          <Text style={styles.kicker}>DISCOVER</Text>
        </View>

        <Text style={styles.title}>Find the football trip worth taking</Text>
        <Text style={styles.sub}>
          Live fixtures, European cities, big atmospheres and smarter trip ideas in one place.
        </Text>
      </View>

      <Pressable
        onPress={onToggleSetup}
        style={({ pressed }) => [styles.setupBar, pressed && styles.pressed]}
      >
        <View style={styles.setupTextWrap}>
          <Text style={styles.setupLabel}>Current setup</Text>
          <Text style={styles.setupText} numberOfLines={1}>
            {compactSummary}
          </Text>
        </View>

        <View style={styles.setupButton}>
          <Ionicons
            name={setupExpanded ? "chevron-up-outline" : "options-outline"}
            size={15}
            color="#FFFFFF"
          />
          <Text style={styles.setupButtonText}>
            {setupExpanded ? "Hide" : "Refine"}
          </Text>
        </View>
      </Pressable>

      {hasFeatured ? (
        <Pressable
          onPress={onPressFeatured}
          style={({ pressed }) => [styles.featureCard, pressed && styles.pressed]}
        >
          <Image source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }} style={styles.featureImage} />
          <View style={styles.imageShade} />
          <View style={styles.bottomFade} />
          <View style={styles.glow} />

          <View style={styles.featureContent}>
            <View style={styles.topRow}>
              <View style={styles.topPickPill}>
                <Ionicons name="sparkles-outline" size={13} color="#F5CC57" />
                <Text style={styles.topPickText}>Best live fit</Text>
              </View>

              <View style={styles.iconBox}>
                <Ionicons name={featuredIcon} size={18} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.featureMain}>
              <Text style={styles.featureEyebrow}>Top pick for your setup</Text>
              <Text style={styles.featureTitle} numberOfLines={2}>
                {featuredTitle}
              </Text>

              {featuredMeta ? (
                <Text style={styles.featureMeta} numberOfLines={2}>
                  {featuredMeta}
                </Text>
              ) : null}

              {featuredWhy ? (
                <Text style={styles.featureWhy} numberOfLines={2}>
                  {featuredWhy}
                </Text>
              ) : null}
            </View>

            <View style={styles.footer}>
              <View style={styles.cta}>
                <Text style={styles.ctaText}>Open route</Text>
              </View>

              <Text style={styles.footerLink}>Plan this trip ›</Text>
            </View>
          </View>
        </Pressable>
      ) : (
        <GlassCard style={styles.emptyCard} variant="matte" level="default">
          <Text style={styles.emptyTitle}>No live route surfaced yet</Text>
          <Text style={styles.emptyText}>
            Refine the setup and Discover will find a stronger football-trip option.
          </Text>

          <Pressable
            onPress={onToggleSetup}
            style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
          >
            <Text style={styles.emptyButtonText}>Adjust setup</Text>
          </Pressable>
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: theme.spacing.lg,
    gap: 14,
  },

  header: {
    gap: 8,
  },

  kickerPill: {
    alignSelf: "flex-start",
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(163,230,53,0.10)",
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.18)",
  },

  kicker: {
    color: "#BEF264",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 36,
    fontWeight: theme.fontWeight.black,
    letterSpacing: -0.4,
  },

  sub: {
    color: "rgba(240,245,242,0.76)",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "94%",
  },

  setupBar: {
    minHeight: 60,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor:
      Platform.OS === "android" ? "rgba(17,24,22,0.92)" : "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.18)",
  },

  setupTextWrap: {
    flex: 1,
    gap: 3,
  },

  setupLabel: {
    color: "#A3E635",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  setupText: {
    color: "rgba(240,245,242,0.78)",
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  setupButton: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  setupButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  featureCard: {
    minHeight: 330,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#0A0F12",
  },

  featureImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,5,7,0.34)",
  },

  bottomFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,5,7,0.30)",
  },

  glow: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: -12,
    height: 72,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.12)",
  },

  featureContent: {
    flex: 1,
    justifyContent: "space-between",
    padding: 18,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  topPickPill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(245,204,87,0.22)",
  },

  topPickText: {
    color: "#F5CC57",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  featureMain: {
    gap: 7,
  },

  featureEyebrow: {
    color: "#A3E635",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },

  featureTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 32,
    fontWeight: theme.fontWeight.black,
    letterSpacing: -0.35,
    maxWidth: "94%",
  },

  featureMeta: {
    color: "rgba(240,245,242,0.84)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "94%",
  },

  featureWhy: {
    color: "rgba(240,245,242,0.70)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "94%",
  },

  footer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  cta: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22,126,58,0.38)",
    borderWidth: 1,
    borderColor: "rgba(104,241,138,0.25)",
  },

  ctaText: {
    color: "#9AF2AE",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  footerLink: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  emptyCard: {
    padding: 18,
    borderRadius: 24,
    gap: 10,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: theme.fontWeight.black,
  },

  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: theme.fontWeight.bold,
  },

  emptyButton: {
    alignSelf: "flex-start",
    marginTop: 4,
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(163,230,53,0.10)",
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.18)",
  },

  emptyButtonText: {
    color: "#BEF264",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
});
