import React from "react";
import { Pressable, Text, StyleSheet, Platform } from "react-native";
import { theme } from "@/src/constants/theme";

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export default function DiscoverFilterChip({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(0,0,0,0.18)"
        : "rgba(255,255,255,0.045)",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  chipActive: {
    borderColor: "rgba(104,241,138,0.35)",
    backgroundColor:
      Platform.OS === "android"
        ? "rgba(18,103,49,0.35)"
        : "rgba(18,103,49,0.28)",
    shadowColor: "#68F18A",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  chipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  chipTextActive: {
    color: "#9AF2AE",
  },

  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
});
