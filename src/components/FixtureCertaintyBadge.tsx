import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/src/constants/theme";
import type { FixtureCertainty } from "@/src/utils/fixtureCertainty";

export default function FixtureCertaintyBadge({
  state,
}: {
  state: FixtureCertainty;
}) {
  const cfg =
    state === "tbc"
      ? { label: "Kickoff TBC", color: "rgba(255,200,80,1)" }
      : state === "changed"
      ? { label: "Date changed", color: "rgba(255,120,120,1)" }
      : state === "safe"
      ? { label: "Safe to book", color: "rgba(0,255,136,1)" }
      : { label: "Confirmed", color: "rgba(160,195,255,1)" };

  return (
    <View style={[styles.badge, { borderColor: cfg.color }]}>
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
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
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  text: {
    fontSize: 11,
    fontWeight: "900",
  },
});
