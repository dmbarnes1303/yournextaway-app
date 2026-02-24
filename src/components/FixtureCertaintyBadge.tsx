// src/components/FixtureCertaintyBadge.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/src/constants/theme";
import type { FixtureCertainty } from "@/src/utils/fixtureCertainty";

function cfg(state: FixtureCertainty) {
  if (state === "tbc") {
    return {
      label: "Kickoff TBC",
      border: "rgba(255,200,80,0.40)",
      bg: "rgba(255,200,80,0.10)",
      fg: "rgba(255,200,80,1)",
    };
  }

  if (state === "changed") {
    return {
      label: "Date changed",
      border: "rgba(255,80,80,0.40)",
      bg: "rgba(255,80,80,0.10)",
      fg: "rgba(255,120,120,1)",
    };
  }

  if (state === "safe") {
    return {
      label: "Safe to book",
      border: "rgba(0,255,136,0.35)",
      bg: "rgba(0,255,136,0.08)",
      fg: "rgba(0,255,136,1)",
    };
  }

  return {
    label: "Confirmed",
    border: "rgba(160,195,255,0.35)",
    bg: "rgba(160,195,255,0.10)",
    fg: "rgba(160,195,255,1)",
  };
}

export default function FixtureCertaintyBadge({ state }: { state: FixtureCertainty }) {
  const c = cfg(state);

  return (
    <View style={[styles.badge, { borderColor: c.border, backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});
