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
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderStack: {
    gap: 4,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: theme.fontWeight.black,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },
});
