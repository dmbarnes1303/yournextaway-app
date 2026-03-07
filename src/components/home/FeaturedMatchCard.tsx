import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getCityImageUrl } from "@/src/data/cityImages";

export default function FeaturedMatchCard({ trip, onPress }: any) {
  const home = trip?.fixture?.teams?.home?.name ?? "Home";
  const away = trip?.fixture?.teams?.away?.name ?? "Away";

  const image = getCityImageUrl(trip?.city || "london");

  return (
    <GlassCard strength="strong" noPadding style={styles.card}>
      <Image source={{ uri: image }} style={styles.image} />

      <View style={styles.overlay} />

      <View style={styles.content}>
        <Text style={styles.title}>
          {home} vs {away}
        </Text>

        <Text style={styles.meta}>
          {formatUkDateTimeMaybe(trip.kickoffIso)}
        </Text>

        <Text style={styles.meta}>
          {trip.city} • {trip.stadiumName}
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
    backgroundColor: "rgba(8,10,12,0.65)",
  },

  content: {
    padding: 16,
    gap: 4,
  },

  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  meta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },
});
