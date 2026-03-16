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
            <
