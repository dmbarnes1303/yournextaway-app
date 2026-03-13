import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import GlassCard from "@/src/components/GlassCard";
import { theme } from "@/src/constants/theme";

type RouteTile = {
  key: string;
  title: string;
  sub: string;
  icon: string;
  onPress: () => void;
};

type Props = {
  routeTiles: RouteTile[];
};

export default function RouteTiles({ routeTiles }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Choose your route</Text>
        <Text style={styles.sectionMeta}>Use the right path fast</Text>
      </View>

      <View style={styles.grid2}>
        {routeTiles.map((s) => (
          <Pressable
            key={s.key}
            onPress={s.onPress}
            style={({ pressed }) => [styles.tilePress, pressed && styles.pressed]}
            android_ripple={{ color: "rgba(255,255,255,0.06)" }}
          >
            <GlassCard strength="default" style={styles.tile} noPadding>
              <View style={styles.tileInner}>
                <View style={styles.tileTopRow}>
                  <Text style={styles.tileTitle}>{s.title}</Text>
                  <View style={styles.tileBadge}>
                    <Text style={styles.tileBadgeText}>{s.icon}</Text>
                  </View>
                </View>
                <Text style={styles.tileSub}>{s.sub}</Text>
                <Text style={styles.tileHint}>Tap to open</Text>
              </View>
            </GlassCard>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },
  sectionMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tilePress: { width: "48.5%", borderRadius: 18, overflow: "hidden" },
  tile: { borderRadius: 18 },
  tileInner: { paddingVertical: 14, paddingHorizontal: 14, gap: 8 },
  tileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  tileTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },
  tileSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 16,
  },
  tileHint: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    opacity: 0.8,
  },

  tileBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  tileBadgeText: { fontSize: 16, opacity: 0.95 },

  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
});
