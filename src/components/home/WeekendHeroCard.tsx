import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { getCityImageUrl } from "@/src/data/cityImages";

export default function WeekendHeroCard({ weekend }: any) {
  const trip = weekend?.trips?.[0];

  const image = getCityImageUrl(trip?.city || "london");

  return (
    <GlassCard strength="strong" noPadding style={styles.card}>
      <Image source={{ uri: image }} style={styles.image} />

      <View style={styles.overlay} />

      <View style={styles.content}>
        <Text style={styles.kicker}>BEST WEEKEND</Text>

        <Text style={styles.title}>{weekend.label}</Text>

        <Text style={styles.meta}>
          Avg score {weekend.avgScore}
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 22,
  },

  image: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,9,11,0.64)",
  },

  content: {
    padding: 16,
    gap: 4,
  },

  kicker: {
    color: theme.colors.primary,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: theme.fontWeight.black,
  },

  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: theme.fontWeight.black,
  },

  meta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
});
