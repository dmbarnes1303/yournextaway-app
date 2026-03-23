import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/src/constants/theme";

type Props = {
  title: string;
  value?: string;
  subtitle?: string;
};

export default function ListRow({ title, value, subtitle }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {value ? <Text style={styles.value}>{value}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },

  content: {
    flex: 1,
  },

  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  value: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },
});
