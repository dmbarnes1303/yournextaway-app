import React from "react";
import { View, Text, StyleSheet } from "react-native";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

export default function NextTripCard({ trip }: any) {
  if (!trip) return null;

  const home = trip?.fixture?.teams?.home?.name ?? "Home";

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.kicker}>NEXT TRIP</Text>

      <Text style={styles.title}>{home}</Text>

      <Text style={styles.meta}>
        {formatUkDateTimeMaybe(trip.kickoffIso)}
      </Text>

      <Text style={styles.meta}>
        {trip.city}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 6,
  },

  kicker: {
    color: theme.colors.primary,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: theme.fontWeight.black,
  },

  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  meta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
});
