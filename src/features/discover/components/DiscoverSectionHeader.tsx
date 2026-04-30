import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/src/constants/theme";

type Props = {
  title: string;
  subtitle: string;
};

export default function DiscoverSectionHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.sectionHeaderStack}>
      <View style={styles.kickerRow}>
        <View style={styles.kickerDot} />
        <Text style={styles.kicker}>Discover route</Text>
      </View>

      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderStack: {
    gap: 6,
  },

  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  kickerDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#A3E635",
    shadowColor: "#A3E635",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  kicker: {
    color: "#9AF2AE",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.75,
    textTransform: "uppercase",
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: theme.fontWeight.black,
    letterSpacing: -0.25,
  },

  sectionSub: {
    color: "rgba(240,245,242,0.68)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "96%",
  },
});
