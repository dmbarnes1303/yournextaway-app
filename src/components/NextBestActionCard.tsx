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
    return locked ? "Unlock with Pro" : action.cta;
  }, [locked, action.cta]);

  const primaryPress = useMemo(() => {
    return locked ? (onUpgradePress ?? action.onPress) : action.onPress;
  }, [locked, onUpgradePress, action.onPress]);

  const secondaryVisible = Boolean(action.secondaryCta && action.onSecondaryPress && !locked);

  return (
    <GlassCard level="default" variant="matte" style={styles.card} noPadding>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <Text style={styles.kicker}>NEXT STEP</Text>
          {action.badge ? <Chip label={action.badge} variant="default" /> : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {action.title}
        </Text>

        <Text style={styles.body}>{action.body}</Text>

        {locked ? (
          <View style={styles.lockRow}>
            <Text style={styles.lockText}>
              Pro unlocks automation, alerts, and price tracking for this step.
            </Text>
          </View>
        ) : null}

        <View style={[styles.actions, secondaryVisible && styles.actionsSplit]}>
          <Button
            label={primaryLabel}
            tone={locked ? "secondary" : "primary"}
            onPress={primaryPress}
            glow={!locked}
            style={secondaryVisible ? styles.primarySplit : styles.primaryFull}
          />

          {secondaryVisible ? (
            <Button
              label={action.secondaryCta!}
              tone="secondary"
              onPress={action.onSecondaryPress!}
              style={styles.secondarySplit}
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
    padding: 12,
    gap: 8,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  kicker: {
    color: theme.colors.accentGreen,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
    letterSpacing: 0.7,
  },

  title: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.15,
  },

  body: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontSize: 12,
    lineHeight: 17,
  },

  lockRow: {
    marginTop: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(242,201,76,0.24)",
    backgroundColor: "rgba(242,201,76,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  lockText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: 11,
    lineHeight: 15,
  },

  actions: {
    marginTop: 4,
  },

  actionsSplit: {
    flexDirection: "row",
    gap: 8,
  },

  primaryFull: {
    width: "100%",
  },

  primarySplit: {
    flex: 1.15,
  },

  secondarySplit: {
    flex: 0.85,
  },
});
