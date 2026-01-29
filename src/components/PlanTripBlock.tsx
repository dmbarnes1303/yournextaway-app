// src/components/PlanTripBlock.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";
import { buildFlightsUrl, buildHotelsUrl, buildTicketsUrl } from "@/src/constants/affiliates";

type Props = {
  title?: string;
  cityName?: string;
  country?: string;
  teamName?: string;
  onBuildTrip?: () => void;
};

export default function PlanTripBlock(props: Props) {
  const flightsUrl = useMemo(
    () => buildFlightsUrl({ cityName: props.cityName, country: props.country }),
    [props.cityName, props.country]
  );

  const hotelsUrl = useMemo(
    () => buildHotelsUrl({ cityName: props.cityName, country: props.country }),
    [props.cityName, props.country]
  );

  const ticketsUrl = useMemo(
    () => buildTicketsUrl({ teamName: props.teamName, cityName: props.cityName }),
    [props.teamName, props.cityName]
  );

  function open(url: string) {
    Linking.openURL(url).catch(() => {});
  }

  return (
    <GlassCard style={styles.card} intensity={22}>
      <Text style={styles.h2}>{props.title ?? "Plan your trip"}</Text>
      <Text style={styles.sub}>
        Quick actions to turn browsing into a real weekend away.
      </Text>

      <View style={styles.grid}>
        <Pressable onPress={() => open(flightsUrl)} style={styles.action}>
          <Text style={styles.actionTitle}>Find flights</Text>
          <Text style={styles.actionSub}>Search routes & prices</Text>
        </Pressable>

        <Pressable onPress={() => open(hotelsUrl)} style={styles.action}>
          <Text style={styles.actionTitle}>Find hotels</Text>
          <Text style={styles.actionSub}>Pick a base to stay</Text>
        </Pressable>

        <Pressable onPress={() => open(ticketsUrl)} style={styles.action}>
          <Text style={styles.actionTitle}>Find tickets</Text>
          <Text style={styles.actionSub}>Check availability</Text>
        </Pressable>

        <Pressable onPress={props.onBuildTrip} style={[styles.action, styles.actionPrimary]} disabled={!props.onBuildTrip}>
          <Text style={styles.actionTitle}>Build trip</Text>
          <Text style={styles.actionSub}>Save a plan in the app</Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing.lg },
  h2: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg },
  sub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  grid: { marginTop: 12, gap: 10 },
  action: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  actionPrimary: {
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  actionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  actionSub: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "700", fontSize: theme.fontSize.xs },
});
