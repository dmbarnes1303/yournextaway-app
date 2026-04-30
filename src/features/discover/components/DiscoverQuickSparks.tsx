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
  if (spark.category === "nightMatches") return "Night fixtures";
  if (spark.category === "valueTrips") return "Smart routes";
  return "Quick route";
}

function sparkSupport(spark: QuickSpark) {
  if (spark.category === "europeanNights") {
    return "European nights with real travel pull.";
  }
  if (spark.category === "weekendTrips") {
    return "Clean Friday–Sunday football breaks.";
  }
  if (spark.category === "multiMatchTrips") {
    return "Cities that support multiple fixtures.";
  }
  if (spark.category === "derbies") {
    return "Rivalries with real edge.";
  }
  if (spark.category === "nightMatches") {
    return "Evening kickoffs + nightlife overlap.";
  }
  if (spark.category === "valueTrips") {
    return "Better trips without premium pricing.";
  }
  return "Strong live discover angle.";
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
          style={({ pressed }) => [
            styles.cardPress,
            pressed && styles.pressed,
          ]}
        >
          <GlassCard strength="default" style={styles.card} noPadding>
            <View style={styles.inner}>
              <View style={styles.topRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name={spark.icon} size={18} color="#9AF2AE" />
                </View>

                <View style={styles.eyebrowPill}>
                  <Text style={styles.eyebrowText}>
                    {sparkEyebrow(spark)}
                  </Text>
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
                  color="#9AF2AE"
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
    width: 240,
    borderRadius: 22,
    overflow: "hidden",
  },

  card: {
    borderRadius: 22,
    minHeight: 170,
    borderColor: "rgba(163,230,53,0.15)",
  },

  inner: {
    padding: 15,
    minHeight: 170,
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
    borderColor: "rgba(163,230,53,0.25)",
    backgroundColor: "rgba(163,230,53,0.08)",
    shadowColor: "#A3E635",
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
    gap: 8,
    paddingTop: 4,
  },

  footerText: {
    color: "#9AF2AE",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
