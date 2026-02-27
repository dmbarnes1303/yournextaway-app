// src/components/TripProgressStrip.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "@/src/constants/theme";

export type ProgressState = "empty" | "saved" | "booked";

export type TripProgressKey = "tickets" | "flight" | "hotel" | "transfer" | "things";

export type TripProgressItem = {
  key: TripProgressKey;
  label: string;
  state: ProgressState;
  onPress?: () => void;
};

function Dot({ state }: { state: ProgressState }) {
  const cfg =
    state === "booked"
      ? { border: "rgba(0,255,136,0.65)", bg: "rgba(0,255,136,0.18)", text: "✓" }
      : state === "saved"
      ? { border: "rgba(255,255,255,0.28)", bg: "rgba(255,255,255,0.10)", text: "●" }
      : { border: "rgba(255,255,255,0.16)", bg: "rgba(0,0,0,0.10)", text: "" };

  return (
    <View style={[styles.dot, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
      <Text style={styles.dotText}>{cfg.text}</Text>
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
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>Tap to jump</Text>
      </View>

      <View style={styles.row}>
        {ordered.map((it, idx) => {
          const clickable = !!it.onPress;
          const node = (
            <View style={styles.item}>
              <Dot state={it.state} />
              <Text style={[styles.label, it.state === "booked" && styles.labelBooked]} numberOfLines={1}>
                {it.label}
              </Text>
            </View>
          );

          return (
            <React.Fragment key={it.key}>
              {clickable ? (
                <Pressable onPress={it.onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
                  {node}
                </Pressable>
              ) : (
                node
              )}

              {idx < ordered.length - 1 ? <View style={styles.line} /> : null}
            </React.Fragment>
          );
        })}
      </View>
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
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { color: theme.colors.text, fontWeight: "900" },
  hint: { color: theme.colors.textTertiary, fontWeight: "900", fontSize: 12 },

  row: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  item: { alignItems: "center", gap: 6, width: 62 },
  label: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 11 },
  labelBooked: { color: theme.colors.text },

  dot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dotText: { color: theme.colors.text, fontWeight: "900", fontSize: 12, marginTop: -1 },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginHorizontal: 8,
  },
});
