// src/components/FixtureCertaintyBadge.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { FixtureCertaintyState } from "@/src/utils/fixtureCertainty";

type Certainty = FixtureCertaintyState;

function cfg(state: Certainty) {
  switch (state) {
    case "tbc":
      return {
        label: "Kickoff TBC",
        border: "rgba(255,200,80,0.40)",
        bg: "rgba(255,200,80,0.10)",
        fg: "rgba(255,200,80,1)",
      };

    case "likely_tbc":
      return {
        label: "Likely TBC",
        border: "rgba(255,210,120,0.35)",
        bg: "rgba(255,210,120,0.10)",
        fg: "rgba(255,210,120,1)",
      };

    case "changed":
      return {
        label: "Date changed",
        border: "rgba(255,80,80,0.40)",
        bg: "rgba(255,80,80,0.10)",
        fg: "rgba(255,120,120,1)",
      };

    case "confirmed":
    default:
      return {
        label: "Confirmed",
        border: "rgba(160,195,255,0.35)",
        bg: "rgba(160,195,255,0.10)",
        fg: "rgba(160,195,255,1)",
      };
  }
}

export default function FixtureCertaintyBadge({ state }: { state: Certainty }) {
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
