// src/components/StadiumTravelCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { getStadium } from "@/src/data/stadiums";

type Props = {
  stadiumKey?: string | null;
  title?: string;
};

export default function StadiumTravelCard({
  stadiumKey,
  title = "Match Travel Intelligence",
}: Props) {
  const stadium = stadiumKey ? getStadium(stadiumKey) : null;

  if (!stadium) return null;

  const airportLine =
    stadium.airport && typeof stadium.distanceFromAirportKm === "number"
      ? `${stadium.airport} • ${stadium.distanceFromAirportKm} km`
      : stadium.airport ?? null;

  const transitItems = (stadium.transit ?? []).slice(0, 2);
  const stayItems = (stadium.stayAreas ?? []).slice(0, 2);
  const tip = stadium.tips?.[0] ?? null;

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {!!airportLine && (
        <View style={styles.section}>
          <Text style={styles.label}>✈ Airport</Text>
          <Text style={styles.value}>{airportLine}</Text>
        </View>
      )}

      {transitItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>🚇 Best Transport</Text>
          {transitItems.map((item) => {
            const suffix =
              typeof item.minutes === "number" ? ` • ${item.minutes} min` : "";
            const note = item.note ? ` • ${item.note}` : "";
            return (
              <Text key={`${item.label}-${item.minutes ?? "na"}`} style={styles.value}>
                {item.label}
                {suffix}
                {note}
              </Text>
            );
          })}
        </View>
      )}

      {stayItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>🏨 Best Stay Areas</Text>
          {stayItems.map((item) => (
            <Text key={item.area} style={styles.value}>
              {item.area} — {item.why}
            </Text>
          ))}
        </View>
      )}

      {!!tip && (
        <View style={styles.section}>
          <Text style={styles.label}>⚽ Matchday Tip</Text>
          <Text style={styles.value}>{tip}</Text>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  section: {
    gap: 6,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  value: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
