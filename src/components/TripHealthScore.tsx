// src/components/TripHealthScore.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/src/constants/theme";
import GlassCard from "@/src/components/GlassCard";
import Chip from "@/src/components/Chip";

function clampScore(score: number) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function tier(pct: number) {
  if (pct >= 85) return "good" as const;
  if (pct >= 55) return "ok" as const;
  return "risk" as const;
}

function tierCopy(t: "good" | "ok" | "risk") {
  switch (t) {
    case "good":
      return { label: "Ready", chip: "success" as const };
    case "ok":
      return { label: "In progress", chip: "primary" as const };
    default:
      return { label: "At risk", chip: "default" as const };
  }
}

export default function TripHealthScore({
  score,
  missing,
  isPro,
  capHint,
}: {
  score: number;
  missing: string[];
  isPro: boolean;
  capHint?: string;
}) {
  const pct = useMemo(() => clampScore(score), [score]);
  const t = useMemo(() => tier(pct), [pct]);
  const copy = useMemo(() => tierCopy(t), [t]);

  const missingTop = useMemo(() => {
    const arr = Array.isArray(missing) ? missing.filter(Boolean).map(String) : [];
    return arr.slice(0, 3);
  }, [missing]);

  const fillColor = useMemo(() => {
    if (t === "good") return "rgba(87,162,56,0.35)";
    if (t === "ok") return "rgba(242,201,76,0.30)";
    return "rgba(214,69,69,0.28)";
  }, [t]);

  const borderColor = useMemo(() => {
    if (t === "good") return "rgba(87,162,56,0.28)";
    if (t === "ok") return "rgba(242,201,76,0.22)";
    return "rgba(214,69,69,0.20)";
  }, [t]);

  const primaryLine = useMemo(() => {
    if (t === "good") return "You’re basically ready to book around this fixture.";
    if (t === "ok") return "You’re partway there — lock in the big items next.";
    return "You’re missing key pieces — avoid booking expensive parts yet.";
  }, [t]);

  const detailLine = useMemo(() => {
    if (!missingTop.length) return "Nothing critical missing. Add extras only if useful.";
    return `Missing: ${missingTop.join(", ")}${missing.length > 3 ? "…" : ""}`;
  }, [missingTop, missing.length]);

  const supportLine = useMemo(() => {
    if (!isPro) return "Pro adds automation and price tracking, but your core missing items still matter first.";
    return detailLine;
  }, [isPro, detailLine]);

  return (
    <GlassCard level="default" variant="matte" style={styles.card} noPadding>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title}>Trip readiness</Text>
            <Text style={styles.primaryLine} numberOfLines={2}>
              {primaryLine}
            </Text>
          </View>

          <View style={styles.scoreCol}>
            <Text style={styles.pct}>{pct}%</Text>
            <Chip label={copy.label} variant={copy.chip} />
          </View>
        </View>

        <View style={[styles.bar, { borderColor }]}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
        </View>

        <Text style={styles.detail} numberOfLines={2}>
          {supportLine}
        </Text>

        {capHint ? <Text style={styles.capHint}>{capHint}</Text> : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.sheet,
    overflow: "hidden",
  },

  inner: {
    padding: 14,
    gap: 10,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  title: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
    fontSize: 14,
    letterSpacing: 0.2,
  },

  primaryLine: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontSize: 13,
    lineHeight: 18,
  },

  scoreCol: {
    alignItems: "flex-end",
    gap: 8,
  },

  pct: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
    fontSize: 20,
    letterSpacing: 0.2,
  },

  bar: {
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    borderRadius: 999,
  },

  detail: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontSize: 12,
    lineHeight: 16,
  },

  capHint: {
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.semibold,
    fontSize: 11,
    lineHeight: 14,
  },
});
