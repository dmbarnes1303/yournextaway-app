// src/components/PartnerClicksDebugOverlay.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/src/constants/theme";
import { getPartnerClicksDebugState } from "@/src/services/partnerClicks";

function msToAge(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

export default function PartnerClicksDebugOverlay() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(true);
  const [tick, setTick] = useState(0);

  // lightweight polling (dev only)
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 600);
    return () => clearInterval(t);
  }, []);

  const s = useMemo(() => getPartnerClicksDebugState(), [tick]);

  if (!__DEV__) return null;
  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.fab, { top: insets.top + 10 }]}
        hitSlop={10}
      >
        <Text style={styles.fabText}>Debug</Text>
      </Pressable>
    );
  }

  const age = s.lastClick ? msToAge(Date.now() - s.lastClick.createdAt) : "—";
  const urlShort = s.lastClick?.url ? String(s.lastClick.url).replace(/^https?:\/\//i, "").slice(0, 46) : "—";

  return (
    <View style={[styles.wrap, { top: insets.top + 10 }]}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.title}>PartnerClicks (dev)</Text>
          <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.close}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <Text style={styles.line}>
          opening: <Text style={styles.val}>{String(s.opening)}</Text> • subscribed:{" "}
          <Text style={styles.val}>{String(s.subscribed)}</Text> • platform:{" "}
          <Text style={styles.val}>{Platform.OS}</Text>
        </Text>

        <View style={styles.sep} />

        <Text style={styles.line}>
          lastClick: <Text style={styles.val}>{s.lastClick ? "yes" : "no"}</Text> • age:{" "}
          <Text style={styles.val}>{age}</Text>
        </Text>
        <Text style={styles.line}>
          itemId: <Text style={styles.val}>{s.lastClick?.itemId ?? "—"}</Text>
        </Text>
        <Text style={styles.line}>
          partner: <Text style={styles.val}>{s.lastClick?.partnerId ?? "—"}</Text>
        </Text>
        <Text style={styles.line} numberOfLines={1}>
          url: <Text style={styles.val}>{urlShort}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 9999,
    pointerEvents: "box-none",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.40)",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 12,
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  title: { flex: 1, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  close: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  closeText: { color: theme.colors.text, fontSize: 18, fontWeight: "900", marginTop: -1 },
  line: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },
  val: { color: "rgba(242,244,246,0.92)", fontWeight: "900" },
  sep: { height: 1, backgroundColor: "rgba(255,255,255,0.10)", marginTop: 10 },

  fab: {
    position: "absolute",
    right: 12,
    zIndex: 9999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.40)",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  fabText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },
});
