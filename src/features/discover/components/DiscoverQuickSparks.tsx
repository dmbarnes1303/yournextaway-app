// src/features/discover/components/DiscoverQuickSparks.tsx

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
import type { QuickSpark } from "@/src/features/discover/types";

type Props = {
  sparks: QuickSpark[];
  onPressSpark: (spark: QuickSpark) => void;
};

function sparkEyebrow(spark: QuickSpark) {
  if (spark.category === "europeanNights") return "Midweek spotlight";
  if (spark.category === "weekendTrips") return "Fast weekend route";
  if (spark.category === "multiMatchTrips") return "Stacked football";
  if (spark.category === "derbies") return "Occasion-led";
  if (spark.category === "nightMatches") return "Later kickoffs";
  if (spark.category === "valueTrips") return "Smarter spend";
  return "Quick discover";
}

function sparkSupport(spark: QuickSpark) {
  if (spark.category === "europeanNights") {
    return "Champions League, Europa League and Conference League travel pull.";
  }
  if (spark.category === "weekendTrips") {
    return "Cleaner Friday-to-Sunday football breaks with better trip shape.";
  }
  if (spark.category === "multiMatchTrips") {
    return "Cities and routes that can support more than one live fixture.";
  }
  if (spark.category === "derbies") {
    return "History, rivalry and stronger edge than a standard fixture.";
  }
  if (spark.category === "nightMatches") {
    return "Evening fixtures with better lights-on feel and nightlife overlap.";
  }
  if (spark.category === "valueTrips") {
    return "Better experience-per-pound routes without defaulting to the obvious.";
  }
  return "Fast route into one of the stronger live discover angles.";
}

export default function DiscoverQuickSparks({
  sparks,
  onPressSpark,
}: Props) {
  if (!sparks.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {sparks.map((spark) => (
        <Pressable
          key={spark.id}
          onPress={() => onPressSpark(spark)}
          style={({ pressed }) => [styles.cardPress, pressed && styles.pressed]}
        >
          <GlassCard strength="default" style={styles.card} noPadding>
            <View style={styles.inner}>
              <View style={styles.topRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name={spark.icon} size={18} color={theme.colors.text} />
                </View>

                <View style={styles.eyebrowPill}>
                  <Text style={styles.eyebrowText}>{sparkEyebrow(spark)}</Text>
                </View>
              </View>

              <View style={styles.copyWrap}>
                <Text style={styles.title} numberOfLines={2}>
                  {spark.title}
                </Text>

                <Text style={styles.support} numberOfLines={3}>
                  {sparkSupport(spark)}
                </Text>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Open route</Text>
                <Ionicons
                  name="arrow-forward-outline"
                  size={15}
                  color={theme.colors.textSecondary}
                />
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
    width: 232,
    borderRadius: 20,
    overflow: "hidden",
  },

  card: {
    borderRadius: 20,
    minHeight: 164,
  },

  inner: {
    padding: 14,
    minHeight: 164,
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
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.20)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  eyebrowPill: {
    maxWidth: 136,
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
    gap: 8,
    paddingTop: 2,
  },

  footerText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
