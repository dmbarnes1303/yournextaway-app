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
      return "Browse big fixtures";
    case "derbies":
      return "Browse rivalries";
    case "atmospheres":
      return "Browse loudest trips";
    case "valueTrips":
      return "Browse value routes";
    case "perfectTrips":
      return "Browse best trips";
    case "easyTickets":
      return "Browse easier routes";
    case "multiMatchTrips":
      return "Browse stacked trips";
    case "weekendTrips":
      return "Browse weekend trips";
    case "europeanNights":
      return "Browse European nights";
    case "legendaryStadiums":
      return "Browse iconic grounds";
    case "iconicCities":
      return "Browse city-led trips";
    case "nightMatches":
      return "Browse night fixtures";
    case "titleDrama":
      return "Browse pressure games";
    case "bucketList":
      return "Browse must-do trips";
    case "matchdayCulture":
      return "Browse culture picks";
    case "underratedTrips":
      return "Browse hidden gems";
    default:
      return "Open category";
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
      return "Low friction";
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

function helperLine(category: DiscoverCategory) {
  switch (category) {
    case "perfectTrips":
      return "Best overall balance of fixture, city, access and trip quality.";
    case "bigMatches":
      return "Higher-profile fixtures with stronger occasion feel.";
    case "derbies":
      return "History, rivalry tension and edge first.";
    case "atmospheres":
      return "Crowd force, noise and matchday intensity.";
    case "valueTrips":
      return "Better experience-per-pound potential.";
    case "easyTickets":
      return "Cleaner routes where access looks more realistic.";
    case "multiMatchTrips":
      return "Trips that can support more than one match.";
    case "weekendTrips":
      return "Friday-to-Sunday football breaks that actually work.";
    case "europeanNights":
      return "Continental fixtures with stronger night-game pull.";
    case "legendaryStadiums":
      return "Ground prestige and club pull doing the heavy lifting.";
    case "iconicCities":
      return "Trips where the city matters as much as the match.";
    case "nightMatches":
      return "Later kickoffs with better lights-on energy.";
    case "titleDrama":
      return "Fixtures with sharper late-season pressure.";
    case "bucketList":
      return "Trips that should be done at least once.";
    case "matchdayCulture":
      return "Football culture beyond the 90 minutes.";
    case "underratedTrips":
      return "Less obvious trips with stronger upside than expected.";
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
  const helper = compact ? null : helperLine(category);

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
              {actionLabel}
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
    width: 224,
    borderRadius: 20,
    overflow: "hidden",
  },

  categoryCard: {
    borderRadius: 20,
    minHeight: 246,
  },

  categoryCardCompact: {
    borderRadius: 20,
    minHeight: 188,
  },

  categoryCardPrimary: {
    borderColor: "rgba(87,162,56,0.16)",
  },

  categoryImageWrap: {
    height: 98,
    position: "relative",
  },

  categoryImageWrapCompact: {
    height: 84,
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
    justifyContent: "flex-start",
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

  categoryInner: {
    padding: 14,
    minHeight: 148,
    gap: 12,
    justifyContent: "space-between",
  },

  categoryInnerCompact: {
    padding: 14,
    minHeight: 104,
    gap: 12,
    justifyContent: "space-between",
  },

  categoryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
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
