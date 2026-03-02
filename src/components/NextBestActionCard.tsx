// src/components/NextBestActionCard.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/src/constants/theme";
import GlassCard from "@/src/components/GlassCard";
import Button from "@/src/components/Button";
import Chip from "@/src/components/Chip";

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

  const primaryLabel = useMemo(() => {
    if (!locked) return action.cta;
    return "Unlock with Pro";
  }, [action.cta, locked]);

  const primaryPress = useMemo(() => {
    if (!locked) return action.onPress;
    return onUpgradePress ?? action.onPress;
  }, [locked, onUpgradePress, action.onPress]);

  return (
    <GlassCard level="default" variant="matte" style={styles.card} noPadding>
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <Text style={styles.kicker}>NEXT BEST STEP</Text>
          {action.badge ? <Chip label={action.badge} variant="default" /> : null}
        </View>

        <Text style={styles.title}>{action.title}</Text>
        <Text style={styles.body}>{action.body}</Text>

        {locked ? (
          <View style={styles.lockBanner}>
            <Text style={styles.lockTitle}>Pro feature</Text>
            <Text style={styles.lockBody}>
              Pro unlocks automation + price tracking. Free still lets you book — you just won’t get the power assists.
            </Text>
          </View>
        ) : null}

        <View style={styles.btnRow}>
          <Button
            label={primaryLabel}
            tone={locked ? "secondary" : "primary"}
            onPress={primaryPress}
            glow={!locked}
            style={{ flex: 1 }}
          />

          {action.secondaryCta && action.onSecondaryPress ? (
            <Button
              label={action.secondaryCta}
              tone="secondary"
              onPress={action.onSecondaryPress}
              style={{ flex: 1 }}
            />
          ) : null}
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
    gap: 10,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  kicker: {
    color: theme.colors.accentGreen,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    letterSpacing: 0.6,
  },

  title: {
    marginTop: 2,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.2,
  },

  body: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontSize: 13,
    lineHeight: 18,
  },

  lockBanner: {
    marginTop: 2,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: "rgba(242,201,76,0.28)",
    backgroundColor: "rgba(242,201,76,0.08)",
    padding: 12,
    gap: 6,
  },

  lockTitle: {
    color: theme.colors.accentGold,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    letterSpacing: 0.6,
  },

  lockBody: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontSize: 12,
    lineHeight: 16,
  },

  btnRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 10,
  },
});
