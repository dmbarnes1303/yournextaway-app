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
  if (preset.category === "weekendTrips") return "Weekend route";
  if (preset.category === "matchdayCulture") return "City + football";
  return "Preset route";
}

function presetSupport(preset: InspirationPreset) {
  if (preset.category === "perfectTrips") {
    return "Balanced football city breaks with strong overall trip shape.";
  }
  if (preset.category === "easyTickets") {
    return "Cleaner routes with lower planning friction.";
  }
  if (preset.category === "bigMatches") {
    return "High-profile fixtures with real travel pull.";
  }
  if (preset.category === "europeanNights") {
    return "European nights that feel bigger than domestic fixtures.";
  }
  if (preset.category === "weekendTrips") {
    return "Friday–Sunday football breaks that actually work.";
  }
  if (preset.category === "matchdayCulture") {
    return "Trips where the city and matchday both matter.";
  }
  return preset.subtitle;
}

function presetFooter(preset: InspirationPreset) {
  if (preset.tripLength === "day") return "Day trip";
  if (preset.tripLength === "1") return "1 night";
  if (preset.tripLength === "2") return "2 nights";
  if (preset.tripLength === "3") return "3 nights";
  if (preset.windowKey === "wknd") return "Weekend";
  if (preset.windowKey === "d30") return "Next 30 days";
  if (preset.windowKey === "d60") return "Next 60 days";
  return "Preset";
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
          style={({ pressed }) => [
            styles.cardPress,
            pressed && styles.pressed,
          ]}
        >
          <GlassCard strength="default" style={styles.card} noPadding>
            <View style={styles.inner}>
              <View style={styles.topRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name={preset.icon} size={18} color="#F5CC57" />
                </View>

                <View style={styles.eyebrowPill}>
                  <Text style={styles.eyebrowText}>
                    {presetEyebrow(preset)}
                  </Text>
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
                  <Text style={styles.footerPillText}>
                    {presetFooter(preset)}
                  </Text>
                </View>

                <View style={styles.cta}>
                  <Text style={styles.footerLink}>Open route</Text>
                  <Ionicons
                    name="arrow-forward-outline"
                    size={14}
                    color="#F5CC57"
                  />
                </View>
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
    width: 260,
    borderRadius: 22,
    overflow: "hidden",
  },

  card: {
    borderRadius: 22,
    minHeight: 190,
    borderColor: "rgba(250,204,21,0.15)",
  },

  inner: {
    padding: 15,
    minHeight: 190,
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
    borderColor: "rgba(250,204,21,0.25)",
    backgroundColor: "rgba(250,204,21,0.08)",
    shadowColor: "#F5CC57",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },

  eyebrowPill: {
    maxWidth: 140,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(0,0,0,0.20)"
        : "rgba(255,255,255,0.05)",
  },

  eyebrowText: {
    color: "rgba(240,245,242,0.65)",
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  copyWrap: {
    gap: 6,
    flex: 1,
  },

  title: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    color: "#F5CC57",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
  },

  support: {
    color: "rgba(240,245,242,0.7)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 4,
  },

  footerPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(0,0,0,0.16)"
        : "rgba(255,255,255,0.04)",
  },

  footerPillText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
  },

  footerLink: {
    color: "#F5CC57",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
