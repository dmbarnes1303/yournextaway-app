import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "@/src/constants/theme";
import GlassCard from "@/src/components/GlassCard";

export type ProgressState = "empty" | "saved" | "booked";

export type TripProgressKey = "tickets" | "flight" | "hotel" | "transfer" | "things";

export type TripProgressItem = {
  key: TripProgressKey;
  label: string;
  state: ProgressState;
  onPress?: () => void;
};

function getStateConfig(state: ProgressState) {
  if (state === "booked") {
    return {
      badgeBg: "rgba(87,162,56,0.16)",
      badgeBorder: "rgba(87,162,56,0.42)",
      dot: theme.colors.accentGreen,
      icon: "✓",
      iconColor: theme.colors.textPrimary,
      labelColor: theme.colors.textPrimary,
      subLabel: "Booked",
      subLabelColor: "rgba(87,162,56,0.95)",
      cardBorder: "rgba(87,162,56,0.28)",
      cardBg: "rgba(87,162,56,0.07)",
    };
  }

  if (state === "saved") {
    return {
      badgeBg: "rgba(255,255,255,0.08)",
      badgeBorder: "rgba(255,255,255,0.16)",
      dot: "rgba(231,236,231,0.72)",
      icon: "•",
      iconColor: theme.colors.textSecondary,
      labelColor: theme.colors.textSecondary,
      subLabel: "Saved",
      subLabelColor: theme.colors.textMuted,
      cardBorder: "rgba(255,255,255,0.12)",
      cardBg: "rgba(255,255,255,0.035)",
    };
  }

  return {
    badgeBg: "rgba(0,0,0,0.14)",
    badgeBorder: theme.colors.borderSubtle,
    dot: "rgba(231,236,231,0.22)",
    icon: "",
    iconColor: theme.colors.textMuted,
    labelColor: theme.colors.textMuted,
    subLabel: "Not started",
    subLabelColor: theme.colors.textMuted,
    cardBorder: "rgba(255,255,255,0.10)",
    cardBg: "rgba(255,255,255,0.02)",
  };
}

function StateBadge({ state }: { state: ProgressState }) {
  const cfg = getStateConfig(state);

  return (
    <View style={[styles.stateBadge, { backgroundColor: cfg.badgeBg, borderColor: cfg.badgeBorder }]}>
      <View style={[styles.stateDot, { backgroundColor: cfg.dot }]} />
      {cfg.icon ? <Text style={[styles.stateIcon, { color: cfg.iconColor }]}>{cfg.icon}</Text> : null}
    </View>
  );
}

export default function TripProgressStrip({
  items,
  title = "Trip progress",
}: {
  items: TripProgressItem[];
  title?: string;
}) {
  const ordered = useMemo(() => {
    const order: TripProgressKey[] = ["tickets", "flight", "hotel", "transfer", "things"];
    const map = new Map(items.map((i) => [i.key, i]));
    return order.map((k) => map.get(k)).filter(Boolean) as TripProgressItem[];
  }, [items]);

  return (
    <GlassCard level="default" variant="matte" style={styles.card} noPadding>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.hint}>Tap a step</Text>
        </View>

        <View style={styles.grid}>
          {ordered.map((it) => {
            const cfg = getStateConfig(it.state);

            const content = (
              <View
                style={[
                  styles.tile,
                  {
                    borderColor: cfg.cardBorder,
                    backgroundColor: cfg.cardBg,
                  },
                ]}
              >
                <StateBadge state={it.state} />

                <Text style={[styles.label, { color: cfg.labelColor }]} numberOfLines={1}>
                  {it.label}
                </Text>

                <Text style={[styles.subLabel, { color: cfg.subLabelColor }]} numberOfLines={1}>
                  {cfg.subLabel}
                </Text>
              </View>
            );

            if (!it.onPress) {
              return (
                <View key={it.key} style={styles.tileWrap}>
                  {content}
                </View>
              );
            }

            return (
              <Pressable
                key={it.key}
                onPress={it.onPress}
                style={({ pressed }) => [styles.tileWrap, pressed && styles.tilePressed]}
                android_ripple={{ color: "rgba(255,255,255,0.04)" }}
              >
                {content}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "rgba(231,236,231,0.22)" }]} />
            <Text style={styles.legendText}>Not started</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "rgba(231,236,231,0.72)" }]} />
            <Text style={styles.legendText}>Saved</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.accentGreen }]} />
            <Text style={styles.legendText}>Booked</Text>
          </View>
        </View>
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
    gap: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  title: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
    fontSize: 14,
    letterSpacing: 0.2,
  },

  hint: {
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.semibold,
    fontSize: 12,
  },

  grid: {
    flexDirection: "row",
    gap: 8,
  },

  tileWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },

  tilePressed: {
    opacity: 0.94,
  },

  tile: {
    minHeight: 92,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  stateBadge: {
    minWidth: 46,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  stateDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },

  stateIcon: {
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    marginTop: -1,
  },

  label: {
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  subLabel: {
    fontSize: 10,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
  },

  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    paddingTop: 2,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },

  legendText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
  },
});
