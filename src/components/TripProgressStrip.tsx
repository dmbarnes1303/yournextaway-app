// src/components/TripProgressStrip.tsx
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

function StatePill({ state }: { state: ProgressState }) {
  const cfg =
    state === "booked"
      ? {
          dot: "rgba(87,162,56,1)",
          ring: "rgba(87,162,56,0.40)",
          bg: "rgba(87,162,56,0.12)",
          text: "✓",
          textColor: theme.colors.textPrimary,
        }
      : state === "saved"
      ? {
          dot: "rgba(231,236,231,0.55)",
          ring: theme.colors.borderSubtle,
          bg: "rgba(255,255,255,0.06)",
          text: "•",
          textColor: theme.colors.textSecondary,
        }
      : {
          dot: "rgba(231,236,231,0.18)",
          ring: theme.colors.borderSubtle,
          bg: "rgba(0,0,0,0.10)",
          text: "",
          textColor: theme.colors.textMuted,
        };

  return (
    <View style={[styles.statePill, { backgroundColor: cfg.bg, borderColor: cfg.ring }]}>
      <View style={[styles.stateDot, { backgroundColor: cfg.dot }]} />
      {cfg.text ? <Text style={[styles.stateText, { color: cfg.textColor }]}>{cfg.text}</Text> : null}
    </View>
  );
}

function stateLabelStyle(state: ProgressState) {
  if (state === "booked") return styles.labelBooked;
  if (state === "saved") return styles.labelSaved;
  return styles.labelEmpty;
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
          <Text style={styles.hint}>Tap to jump</Text>
        </View>

        <View style={styles.rail}>
          {ordered.map((it) => {
            const clickable = !!it.onPress;
            const node = (
              <View style={styles.item}>
                <StatePill state={it.state} />
                <Text style={[styles.label, stateLabelStyle(it.state)]} numberOfLines={1}>
                  {it.label}
                </Text>
              </View>
            );

            if (!clickable) return <View key={it.key} style={styles.itemWrap}>{node}</View>;

            return (
              <Pressable
                key={it.key}
                onPress={it.onPress}
                style={({ pressed }) => [styles.itemWrap, pressed && styles.itemPressed]}
                android_ripple={{ color: "rgba(255,255,255,0.04)" }}
              >
                {node}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "rgba(231,236,231,0.20)" }]} />
            <Text style={styles.legendText}>Not started</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "rgba(231,236,231,0.55)" }]} />
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
    padding: 12,
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

  rail: {
    flexDirection: "row",
    gap: 10,
  },

  itemWrap: {
    flex: 1,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    overflow: "hidden",
  },

  itemPressed: {
    opacity: 0.95,
  },

  item: {
    alignItems: "center",
    gap: 8,
  },

  statePill: {
    height: 28,
    minWidth: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 10,
  },

  stateDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },

  stateText: {
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    marginTop: -1,
  },

  label: {
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  labelEmpty: { color: theme.colors.textMuted },
  labelSaved: { color: theme.colors.textSecondary },
  labelBooked: { color: theme.colors.textPrimary },

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
