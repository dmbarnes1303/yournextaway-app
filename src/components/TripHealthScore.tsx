// src/components/TripHealthScore.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/src/constants/theme";

export default function TripHealthScore({
  score,
  missing,
  isPro,
  capHint,
}: {
  score: number; // 0..100
  missing: string[];
  isPro: boolean;
  capHint?: string;
}) {
  const pct = useMemo(() => {
    const n = Number(score);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }, [score]);

  const barCfg = useMemo(() => {
    if (pct >= 85) return { border: "rgba(0,255,136,0.45)", fill: "rgba(0,255,136,0.35)" };
    if (pct >= 55) return { border: "rgba(255,200,80,0.40)", fill: "rgba(255,200,80,0.28)" };
    return { border: "rgba(255,80,80,0.40)", fill: "rgba(255,80,80,0.24)" };
  }, [pct]);

  const missingLine = missing.length ? missing.join(", ") : "Nothing critical missing.";

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Trip readiness</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>

      <View style={[styles.bar, { borderColor: barCfg.border }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barCfg.fill }]} />
      </View>

      {isPro ? (
        <Text style={styles.detail} numberOfLines={2}>
          {missing.length ? `Missing: ${missingLine}` : "You’re set. Add extras if you want."}
        </Text>
      ) : (
        <Text style={styles.detail} numberOfLines={2}>
          Pro shows exactly what’s missing + adds automation.
        </Text>
      )}

      {capHint ? <Text style={styles.capHint}>{capHint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    padding: 12,
  },

  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: theme.colors.text, fontWeight: "900" },
  pct: { color: theme.colors.text, fontWeight: "900" },

  bar: {
    marginTop: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 999 },

  detail: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 16,
  },

  capHint: {
    marginTop: 8,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
    lineHeight: 14,
  },
});
