// src/features/discover/components/DiscoverInspirationRow.tsx

import React from "react";
import {
  ScrollView,
  Pressable,
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import type { InspirationPreset } from "@/src/features/discover/types";

type Props = {
  presets: InspirationPreset[];
  onPressPreset: (preset: InspirationPreset) => void;
};

function presetEyebrow(preset: InspirationPreset) {
  if (preset.category === "perfectTrips") return "Best all-round";
  if (preset.category === "easyTickets") return "Lower friction";
  if (preset.category === "bigMatches") return "Occasion-led";
  if (preset.category === "europeanNights") return "Midweek spotlight";
  if (preset.category === "weekendTrips") return "Fast weekend route";
  if (preset.category === "matchdayCulture") return "City + football";
  return "Discover preset";
}

function presetSupport(preset: InspirationPreset) {
  if (preset.category === "perfectTrips") {
    return "Balanced football city breaks with stronger all-round trip shape.";
  }
  if (preset.category === "easyTickets") {
    return "Cleaner routes where access, planning and travel friction should be more manageable.";
  }
  if (preset.category === "bigMatches") {
    return "Higher-profile fixtures with more atmosphere, glamour and travel pull.";
  }
  if (preset.category === "europeanNights") {
    return "Continental fixtures that feel bigger than a standard domestic trip.";
  }
  if (preset.category === "weekendTrips") {
    return "Friday-to-Sunday football breaks with stronger stacking potential.";
  }
  if (preset.category === "matchdayCulture") {
    return "Trips where the city, football culture and matchday feel all matter.";
  }
  return preset.subtitle;
}

function presetFooter(preset: InspirationPreset) {
  if (preset.tripLength === "day") return "Day-trip bias";
  if (preset.tripLength === "1") return "1-night bias";
  if (preset.tripLength === "2") return "2-night bias";
  if (preset.tripLength === "3") return "3-night bias";
  if (preset.windowKey === "wknd") return "Weekend window";
  if (preset.windowKey === "d30") return "Next 30 days";
  if (preset.windowKey === "d60") return "Next 60 days";
  return "Smart preset";
}

export default function DiscoverInspirationRow({
  presets,
  onPressPreset,
}: Props) {
  if (!presets.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {presets.map((preset) => (
        <Pressable
          key={preset.id}
          onPress={() => onPressPreset(preset)}
          style={({ pressed }) => [styles.cardPress, pressed && styles.pressed]}
        >
          <GlassCard strength="default" style={styles.card} noPadding>
            <View style={styles.inner}>
              <View style={styles.topRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name={preset.icon} size={18} color={theme.colors.text} />
                </View>

                <View style={styles.eyebrowPill}>
                  <Text style={styles.eyebrowText}>{presetEyebrow(preset)}</Text>
                </View>
              </View>

              <View style={styles.copyWrap}>
                <Text style={styles.title} numberOfLines={2}>
                  {preset.title}
                </Text>

                <Text style={styles.subtitle} numberOfLines={2}>
                  {preset.subtitle}
                </Text>

                <Text style={styles.support} numberOfLines={3}>
                  {presetSupport(preset)}
                </Text>
              </View>

              <View style={styles.footerRow}>
                <View style={styles.footerPill}>
                  <Text style={styles.footerPillText}>{presetFooter(preset)}</Text>
                </View>

                <Text style={styles.footerLink}>Open route</Text>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 12,
    paddingRight: theme.spacing.lg,
  },

  cardPress: {
    width: 252,
    borderRadius: 20,
    overflow: "hidden",
  },

  card: {
    borderRadius: 20,
    minHeight: 188,
  },

  inner: {
    padding: 14,
    minHeight: 188,
    gap: 12,
    justifyContent: "space-between",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  eyebrowPill: {
    maxWidth: 140,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
  },

  eyebrowText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  copyWrap: {
    gap: 6,
    flex: 1,
  },

  title: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    color: theme.colors.primary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
  },

  support: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 2,
  },

  footerPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
  },

  footerPillText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  footerLink: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
