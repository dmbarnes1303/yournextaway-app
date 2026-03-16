// src/features/discover/components/DiscoverCategoryCard.tsx

import React from "react";
import { View, Text, StyleSheet, Pressable, Image, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import {
  DISCOVER_CATEGORY_META,
  type DiscoverCategory,
} from "@/src/features/discover/discoverCategories";
import { PLACEHOLDER_DISCOVER_IMAGE } from "@/src/features/discover/discoverPresets";

type Props = {
  category: DiscoverCategory;
  compact?: boolean;
  onPress: (category: DiscoverCategory) => void;
};

function categoryActionLabel(category: DiscoverCategory) {
  switch (category) {
    case "bigMatches":
      return "See big fixtures";
    case "derbies":
      return "See rivalries";
    case "atmospheres":
      return "See loudest trips";
    case "valueTrips":
      return "See best value";
    case "perfectTrips":
      return "See best trips";
    case "easyTickets":
      return "See easier routes";
    case "multiMatchTrips":
      return "See stacked trips";
    case "weekendTrips":
      return "See weekend options";
    case "europeanNights":
      return "See European nights";
    case "legendaryStadiums":
      return "See iconic grounds";
    case "iconicCities":
      return "See city-led trips";
    case "nightMatches":
      return "See night fixtures";
    case "titleDrama":
      return "See pressure games";
    case "bucketList":
      return "See must-do trips";
    case "matchdayCulture":
      return "See culture picks";
    case "underratedTrips":
      return "See overlooked gems";
    default:
      return "Open route";
  }
}

function categoryTagLabel(category: DiscoverCategory, compact: boolean) {
  if (compact) return "Browse";

  switch (category) {
    case "perfectTrips":
      return "Best fit";
    case "bigMatches":
      return "Occasion-led";
    case "derbies":
      return "Rivalries";
    case "atmospheres":
      return "Energy";
    case "valueTrips":
      return "Value";
    case "easyTickets":
      return "Lower friction";
    case "multiMatchTrips":
      return "Stackable";
    case "weekendTrips":
      return "Weekend";
    case "europeanNights":
      return "Europe";
    case "legendaryStadiums":
      return "Ground-led";
    case "iconicCities":
      return "City-led";
    case "nightMatches":
      return "Evening";
    case "titleDrama":
      return "Stakes";
    case "bucketList":
      return "Must-do";
    case "matchdayCulture":
      return "Culture";
    case "underratedTrips":
      return "Hidden upside";
    default:
      return "Discover";
  }
}

function helperLine(category: DiscoverCategory, compact: boolean) {
  if (compact) return null;

  switch (category) {
    case "perfectTrips":
      return "Best overall balance of fixture, city, access and trip quality.";
    case "bigMatches":
      return "Higher-profile fixtures with stronger travel pull and occasion feel.";
    case "derbies":
      return "History, edge and rivalry tension first.";
    case "atmospheres":
      return "Crowd force, noise and matchday intensity.";
    case "valueTrips":
      return "Better experience-per-pound without dead-end filler.";
    case "easyTickets":
      return "Cleaner routes where access looks more realistic.";
    case "multiMatchTrips":
      return "Trips that can support more than one match.";
    case "weekendTrips":
      return "Friday-to-Sunday football breaks that actually work.";
    default:
      return "Open this route to browse ranked live options.";
  }
}

export default function DiscoverCategoryCard({
  category,
  compact = false,
  onPress,
}: Props) {
  const meta = DISCOVER_CATEGORY_META[category];
  const primary = meta.emphasis === "primary";
  const actionLabel = categoryActionLabel(category);
  const tagLabel = categoryTagLabel(category, compact);
  const helper = helperLine(category, compact);

  return (
    <Pressable
      onPress={() => onPress(category)}
      style={({ pressed }) => [
        compact ? styles.categoryPressCompact : styles.categoryPress,
        pressed && styles.pressed,
      ]}
    >
      <GlassCard
        strength={primary && !compact ? "strong" : "default"}
        style={[
          compact ? styles.categoryCardCompact : styles.categoryCard,
          primary && !compact ? styles.categoryCardPrimary : null,
        ]}
        noPadding
      >
        <View style={compact ? styles.categoryImageWrapCompact : styles.categoryImageWrap}>
          <Image
            source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }}
            style={styles.categoryImage}
            resizeMode="cover"
          />
          <View
            style={[
              styles.categoryImageOverlay,
              primary && !compact ? styles.categoryImageOverlayPrimary : null,
            ]}
          />

          <View style={styles.imageTopRow}>
            <View
              style={[
                styles.categoryEyebrowPill,
                primary && !compact ? styles.categoryEyebrowPillPrimary : null,
              ]}
            >
              <Text style={styles.categoryEyebrowText}>{tagLabel}</Text>
            </View>

            <View style={styles.imageTopIconPill}>
              <Ionicons name={meta.icon} size={14} color={theme.colors.text} />
            </View>
          </View>
        </View>

        <View style={compact ? styles.categoryInnerCompact : styles.categoryInner}>
          <View style={styles.categoryTopRow}>
            <View
              style={[
                styles.categoryIconWrap,
                primary && !compact ? styles.categoryIconWrapPrimary : null,
              ]}
            >
              <Ionicons name={meta.icon} size={18} color={theme.colors.text} />
            </View>

            {!compact ? (
              <View style={styles.inlineActionPill}>
                <Text style={styles.inlineActionPillText}>{actionLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.categoryTextWrap}>
            <Text style={styles.categoryTitle} numberOfLines={compact ? 2 : 2}>
              {meta.title}
            </Text>

            <Text style={styles.categorySubtitle} numberOfLines={compact ? 2 : 2}>
              {meta.subtitle}
            </Text>

            {helper ? (
              <Text style={styles.categoryHelper} numberOfLines={3}>
                {helper}
              </Text>
            ) : null}
          </View>

          <View style={styles.categoryFooterRow}>
            <Text style={styles.categoryFooterText} numberOfLines={1}>
              {compact ? actionLabel : "Open ranked routes"}
            </Text>

            <View
              style={[
                styles.footerArrowWrap,
                primary && !compact ? styles.footerArrowWrapPrimary : null,
              ]}
            >
              <Ionicons
                name="arrow-forward-outline"
                size={14}
                color={theme.colors.text}
              />
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  categoryPress: {
    width: "48.5%",
    borderRadius: 20,
    overflow: "hidden",
  },

  categoryPressCompact: {
    width: 228,
    borderRadius: 20,
    overflow: "hidden",
  },

  categoryCard: {
    borderRadius: 20,
    minHeight: 262,
  },

  categoryCardCompact: {
    borderRadius: 20,
    minHeight: 206,
  },

  categoryCardPrimary: {
    borderColor: "rgba(87,162,56,0.16)",
  },

  categoryImageWrap: {
    height: 102,
    position: "relative",
  },

  categoryImageWrapCompact: {
    height: 88,
    position: "relative",
  },

  categoryImage: {
    width: "100%",
    height: "100%",
  },

  categoryImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.38)",
  },

  categoryImageOverlayPrimary: {
    backgroundColor: "rgba(5,8,10,0.28)",
  },

  imageTopRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  categoryEyebrowPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(8,10,10,0.58)",
  },

  categoryEyebrowPillPrimary: {
    borderColor: "rgba(87,162,56,0.22)",
    backgroundColor: "rgba(6,10,8,0.64)",
  },

  categoryEyebrowText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  imageTopIconPill: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(8,10,10,0.58)",
  },

  categoryInner: {
    padding: 14,
    minHeight: 160,
    gap: 12,
    justifyContent: "space-between",
  },

  categoryInnerCompact: {
    padding: 14,
    minHeight: 118,
    gap: 12,
    justifyContent: "space-between",
  },

  categoryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
  },

  categoryIconWrapPrimary: {
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  inlineActionPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.04)",
  },

  inlineActionPillText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  categoryTextWrap: {
    gap: 6,
    flexShrink: 1,
  },

  categoryTitle: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: theme.fontWeight.black,
  },

  categorySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  categoryHelper: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.bold,
    marginTop: 2,
  },

  categoryFooterRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  categoryFooterText: {
    flex: 1,
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  footerArrowWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.04)",
  },

  footerArrowWrapPrimary: {
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
