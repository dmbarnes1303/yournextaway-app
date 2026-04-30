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
import { PLACEHOLDER_DISCOVER_IMAGE } from "@/src/features/discover/discoverPresets";

type Props = {
  category: DiscoverCategory;
  compact?: boolean;
  onPress: (category: DiscoverCategory) => void;
};

/**
 * Short + sharp → no waffle
 */
function tagLabel(category: DiscoverCategory, compact: boolean) {
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

function actionLabel(category: DiscoverCategory) {
  return "Browse routes";
}

export default function DiscoverCategoryCard({
  category,
  compact = false,
  onPress,
}: Props) {
  const meta = DISCOVER_CATEGORY_META[category];
  const primary = meta.emphasis === "primary";

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
          primary && !compact && styles.cardPrimary,
        ]}
        noPadding
      >
        {/* IMAGE */}
        <View style={compact ? styles.imageWrapCompact : styles.imageWrap}>
          <Image
            source={{ uri: PLACEHOLDER_DISCOVER_IMAGE }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.overlay} />

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                primary && !compact && styles.badgePrimary,
              ]}
            >
              <Text style={styles.badgeText}>
                {tagLabel(category, compact)}
              </Text>
            </View>
          </View>
        </View>

        {/* BODY */}
        <View style={compact ? styles.bodyCompact : styles.body}>
          <View style={styles.iconWrap}>
            <Ionicons name={meta.icon} size={18} color={theme.colors.text} />
          </View>

          <View style={styles.textWrap}>
            <Text style={styles.title} numberOfLines={2}>
              {meta.title}
            </Text>

            <Text style={styles.subtitle} numberOfLines={2}>
              {meta.subtitle}
            </Text>

            {!compact && (
              <Text style={styles.helper} numberOfLines={2}>
                {helperLine(category)}
              </Text>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{actionLabel(category)}</Text>

            <View style={styles.arrow}>
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
    height: 90,
  },

  imageWrapCompact: {
    height: 80,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,10,0.35)",
  },

  badgeRow: {
    position: "absolute",
    top: 10,
    left: 10,
  },

  badge: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  badgePrimary: {
    backgroundColor: "rgba(87,162,56,0.25)",
  },

  badgeText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  body: {
    padding: 14,
    gap: 10,
  },

  bodyCompact: {
    padding: 14,
    gap: 10,
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

  textWrap: {
    gap: 4,
  },

  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  helper: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },

  footer: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerText: {
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
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
});
