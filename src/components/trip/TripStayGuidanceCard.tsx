import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";

type Area = {
  area: string;
  notes?: string;
};

type Props = {
  stadiumName?: string;
  stadiumCity?: string;
  logisticsSnippet?: string;
  bestAreas: Area[];
  budgetAreas: Area[];
  transportStops: string[];
  transportTips: string[];
  lateTransportNote?: string;
  stadiumMapsUrl: string;
  openUrl: (url: string) => void;
};

export default function TripStayGuidanceCard({
  stadiumName,
  stadiumCity,
  logisticsSnippet,
  bestAreas,
  budgetAreas,
  transportStops,
  transportTips,
  lateTransportNote,
  stadiumMapsUrl,
  openUrl,
}: Props) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>Stay guidance (stadium + best areas)</Text>

      <View style={styles.box}>
        <Text style={styles.stadium}>
          {stadiumName || "Stadium"}
          {stadiumCity ? <Text style={styles.city}> • {stadiumCity}</Text> : null}
        </Text>

        <Text style={styles.text}>
          {logisticsSnippet ||
            "Use the areas below as a shortlist. Tap Maps for directions."}
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => openUrl(stadiumMapsUrl)}
        >
          <Text style={styles.buttonText}>Open stadium in maps</Text>
        </Pressable>
      </View>

      {bestAreas.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Best areas</Text>

          {bestAreas.slice(0, 3).map((area, i) => (
            <View key={`best-${i}`} style={styles.row}>
              <Text style={styles.area}>{area.area}</Text>
              {area.notes ? (
                <Text style={styles.notes}>{area.notes}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {budgetAreas.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget areas</Text>

          {budgetAreas.slice(0, 2).map((area, i) => (
            <View key={`budget-${i}`} style={styles.row}>
              <Text style={styles.area}>{area.area}</Text>
              {area.notes ? (
                <Text style={styles.notes}>{area.notes}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {transportStops.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Best transport stops</Text>

          {transportStops.map((stop, i) => (
            <Text key={`stop-${i}`} style={styles.text}>
              • {stop}
            </Text>
          ))}
        </View>
      )}

      {transportTips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matchday tips</Text>

          {transportTips.map((tip, i) => (
            <Text key={`tip-${i}`} style={styles.text}>
              • {tip}
            </Text>
          ))}
        </View>
      )}

      {lateTransportNote ? (
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Late transport note</Text>
          <Text style={styles.text}>{lateTransportNote}</Text>
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: theme.spacing.lg },

  title: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 10,
  },

  box: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },

  stadium: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  city: {
    color: theme.colors.textSecondary,
  },

  text: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
  },

  button: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.4)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },

  buttonText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  section: {
    marginTop: 12,
    gap: 6,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  row: {
    gap: 4,
  },

  area: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  notes: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  warning: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,200,80,0.3)",
    borderRadius: 12,
    padding: 10,
  },

  warningTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 4,
  },
});
