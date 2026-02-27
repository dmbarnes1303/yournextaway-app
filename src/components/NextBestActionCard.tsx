// src/components/NextBestActionCard.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { theme } from "@/src/constants/theme";

export type NextAction = {
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
  secondaryCta?: string;
  onSecondaryPress?: () => void;
  badge?: string;
  proLocked?: boolean;
};

export default function NextBestActionCard({
  action,
  isPro,
  onUpgradePress,
}: {
  action: NextAction | null;
  isPro: boolean;
  onUpgradePress?: () => void;
}) {
  if (!action) return null;

  const locked = Boolean(action.proLocked && !isPro);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>NEXT BEST STEP</Text>
        {action.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{action.badge}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title}>{action.title}</Text>
      <Text style={styles.body}>{action.body}</Text>

      <View style={styles.btnRow}>
        <Pressable
          onPress={locked ? onUpgradePress : action.onPress}
          style={({ pressed }) => [styles.btn, styles.btnPrimary, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={styles.btnPrimaryText}>{locked ? "Unlock with Pro" : action.cta}</Text>
        </Pressable>

        {action.secondaryCta && action.onSecondaryPress ? (
          <Pressable
            onPress={action.onSecondaryPress}
            style={({ pressed }) => [styles.btn, styles.btnSecondary, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.btnSecondaryText}>{action.secondaryCta}</Text>
          </Pressable>
        ) : null}
      </View>

      {locked ? (
        <Text style={styles.lockHint}>
          Pro unlocks automation + price tracking. Free still lets you book — you just won’t get the power assists.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.22)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  kicker: { color: theme.colors.primary, fontWeight: "900", fontSize: 12, letterSpacing: 0.4 },

  badge: {
    borderWidth: 1,
    borderColor: "rgba(255,200,80,0.40)",
    backgroundColor: "rgba(255,200,80,0.10)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: "rgba(255,200,80,1)", fontWeight: "900", fontSize: 11 },

  title: { marginTop: 10, color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  body: { marginTop: 8, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  btnRow: { marginTop: 12, flexDirection: "row", gap: 10 },

  btn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  btnPrimary: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900" },

  btnSecondary: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.14)",
  },
  btnSecondaryText: { color: theme.colors.textSecondary, fontWeight: "900" },

  lockHint: {
    marginTop: 10,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
    lineHeight: 14,
  },
});
