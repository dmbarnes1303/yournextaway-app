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
import {
  DISCOVER_CATEGORY_META,
  type DiscoverCategory,
} from "@/src/features/discover/discoverCategories";
import { getDiscoverCategoryArtwork } from "@/src/features/discover/discoverCategoryArtwork";

type Props = {
  category: DiscoverCategory;
  compact?: boolean;
  onPress: (category: DiscoverCategory) => void;
};

function fallbackTagLabel(category: DiscoverCategory, compact: boolean) {
  if (compact) return "Browse";

  switch (category) {
    case "perfectTrips":
      return "Best fit";
    case "bigMatches":
      return "Big games";
    case "derbies":
      return "Derbies";
    case "atmospheres":
      return "Atmosphere";
    case "valueTrips":
      return "Value";
    case "easyTickets":
      return "Easier";
    case "multiMatchTrips":
      return "Stackable";
    case "weekendTrips":
      return "Weekend";
    case "europeanNights":
      return "Europe";
    case "legendaryStadiums":
      return "Iconic";
    case "iconicCities":
      return "City-led";
    case "nightMatches":
      return "Night";
    case "titleDrama":
      return "Stakes";
    case "bucketList":
      return "Must-do";
    case "matchdayCulture":
      return "Culture";
    case "underratedTrips":
      return "Hidden";
    default:
      return "Discover";
  }
}

function helperLine(category: DiscoverCategory) {
  switch (category) {
    case "perfectTrips":
      return "Strongest overall trip quality.";
    case "bigMatches":
      return "Higher-profile fixtures.";
    case "derbies":
      return "Rivalry intensity first.";
    case "atmospheres":
      return "Loud, high-energy matches.";
    case "valueTrips":
      return "Better experience per pound.";
    case "easyTickets":
      return "Lower access friction.";
    case "multiMatchTrips":
      return "More than one fixture.";
    case "weekendTrips":
      return "Clean Fri–Sun trips.";
    case "europeanNights":
      return "Midweek European feel.";
    case "legendaryStadiums":
      return "Ground-led trips.";
    case "iconicCities":
      return "City-first travel.";
    case "nightMatches":
      return "Evening kickoffs.";
    case "titleDrama":
      return "Pressure fixtures.";
    case "bucketList":
      return "Do it once trips.";
    case "matchdayCulture":
      return "Beyond the 90 mins.";
    case "underratedTrips":
      return "Less obvious wins.";
    default:
      return "Browse live routes.";
  }
}

export default function DiscoverCategoryCard({
  category,
  compact = false,
  onPress,
}: Props) {
  const meta = DISCOVER_CATEGORY_META[category];
  const artwork = getDiscoverCategoryArtwork(category);
  const primary = meta.emphasis === "primary";
  const badgeLabel = artwork.eyebrow ?? fallbackTagLabel(category, compact);

  return (
    <Pressable
      onPress={() => onPress(category)}
      style={({ pressed }) => [
        compact ? styles.pressCompact : styles.press,
        pressed && styles.pressed,
      ]}
    >
      <GlassCard
        strength={primary && !compact ? "strong" : "default"}
        style={[
          compact ? styles.cardCompact : styles.card,
          primary && !compact ? styles.cardPrimary : null,
        ]}
        noPadding
      >
        <View style={compact ? styles.imageWrapCompact : styles.imageWrap}>
          <Image
            source={{ uri: artwork.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />

          <View
            style={[
              styles.overlay,
              primary && !compact ? styles.overlayPrimary : null,
            ]}
            pointerEvents="none"
          />

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                primary && !compact ? styles.badgePrimary : null,
              ]}
            >
              <Text style={styles.badgeText} numberOfLines={1}>
                {badgeLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={compact ? styles.bodyCompact : styles.body}>
          <View
            style={[
              styles.iconWrap,
              primary && !compact ? styles.iconWrapPrimary : null,
            ]}
          >
            <Ionicons name={meta.icon} size={18} color={theme.colors.text} />
          </View>

          <View style={styles.textWrap}>
            <Text style={styles.title} numberOfLines={2}>
              {meta.title}
            </Text>

            <Text style={styles.subtitle} numberOfLines={2}>
              {meta.subtitle}
            </Text>

            {!compact ? (
              <Text style={styles.helper} numberOfLines={2}>
                {helperLine(category)}
              </Text>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText} numberOfLines={1}>
              Browse routes
            </Text>

            <View
              style={[
                styles.arrow,
                primary && !compact ? styles.arrowPrimary : null,
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
  press: {
    width: "48.5%",
    borderRadius: 20,
    overflow: "hidden",
  },

  pressCompact: {
    width: 224,
    borderRadius: 20,
    overflow: "hidden",
  },

  card: {
    borderRadius: 20,
    minHeight: 232,
  },

  cardCompact: {
    borderRadius: 20,
    minHeight: 176,
  },

  cardPrimary: {
    borderColor: "rgba(87,162,56,0.18)",
  },

  imageWrap: {
    height: 92,
    position: "relative",
  },

  imageWrapCompact: {
    height: 82,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.38)",
  },

  overlayPrimary: {
    backgroundColor: "rgba(5,8,10,0.30)",
  },

  badgeRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  badge: {
    maxWidth: "100%",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  badgePrimary: {
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(6,10,8,0.66)",
  },

  badgeText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.25,
  },

  body: {
    padding: 14,
    gap: 10,
    minHeight: 140,
  },

  bodyCompact: {
    padding: 14,
    gap: 10,
    minHeight: 94,
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(0,0,0,0.16)"
        : "rgba(255,255,255,0.04)",
  },

  iconWrapPrimary: {
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.09)",
  },

  textWrap: {
    gap: 4,
    flexShrink: 1,
  },

  title: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  helper: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: theme.fontWeight.bold,
  },

  footer: {
    marginTop: "auto",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  footerText: {
    flex: 1,
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  arrow: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(0,0,0,0.14)"
        : "rgba(255,255,255,0.05)",
  },

  arrowPrimary: {
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
});
