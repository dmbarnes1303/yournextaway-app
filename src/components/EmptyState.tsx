// src/components/EmptyState.tsx

import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/src/constants/theme";
import PressableScale from "@/src/components/PressableScale";

type Action = {
  label: string;
  onPress: () => void;
};

type EmptyStateProps = {
  // Backwards compatible (required today)
  title: string;
  message: string;

  /**
   * Optional enhancements (V2)
   */
  iconName?: keyof typeof Ionicons.glyphMap; // e.g. "football", "sparkles", "airplane"
  iconColor?: string;
  iconSize?: number;

  /**
   * Visual density control
   */
  variant?: "default" | "compact";

  /**
   * Actions (optional)
   */
  primaryAction?: Action;
  secondaryAction?: Action;

  /**
   * Optional helper line under message (e.g. "Tip: follow matches to get alerts")
   */
  hint?: string;
};

export default function EmptyState({
  title,
  message,
  iconName,
  iconColor,
  iconSize = 34,
  variant = "default",
  primaryAction,
  secondaryAction,
  hint,
}: EmptyStateProps) {
  const resolvedIconName = useMemo(() => {
    if (iconName) return iconName;
    // Sensible default that feels "premium" and not childish
    return "sparkles";
  }, [iconName]);

  const resolvedIconColor = iconColor ?? theme.colors.textSecondary;

  const isCompact = variant === "compact";

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <View style={styles.iconWrap}>
        <View style={styles.iconBadge}>
          <Ionicons name={resolvedIconName} size={iconSize} color={resolvedIconColor} />
        </View>
      </View>

      <Text style={[styles.title, isCompact && styles.titleCompact]}>{title}</Text>

      <Text style={[styles.message, isCompact && styles.messageCompact]}>{message}</Text>

      {!!hint && <Text style={styles.hint}>{hint}</Text>}

      {(!!primaryAction || !!secondaryAction) && (
        <View style={styles.actions}>
          {primaryAction ? (
            <PressableScale onPress={primaryAction.onPress} style={styles.primaryBtnWrap}>
              <View style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>{primaryAction.label}</Text>
              </View>
            </PressableScale>
          ) : null}

          {secondaryAction ? (
            <Pressable
              onPress={secondaryAction.onPress}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && Platform.OS !== "web" ? { opacity: 0.85 } : null,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>{secondaryAction.label}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    alignItems: "center",
  },

  containerCompact: {
    paddingVertical: theme.spacing.xl,
  },

  iconWrap: {
    marginBottom: theme.spacing.md,
  },

  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.h2,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
    letterSpacing: 0.2,
  },

  titleCompact: {
    fontSize: theme.fontSize.body,
  },

  message: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.regular,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 520,
  },

  messageCompact: {
    marginTop: theme.spacing.xs,
  },

  hint: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.regular,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 520,
  },

  actions: {
    marginTop: theme.spacing.lg,
    width: "100%",
    alignItems: "center",
    gap: theme.spacing.sm,
  },

  primaryBtnWrap: {
    width: "100%",
  },

  primaryBtn: {
    height: 48,
    borderRadius: theme.borderRadius.button,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accentGreen,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.2,
  },

  secondaryBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  secondaryBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.meta,
    fontWeight: theme.fontWeight.medium,
  },
});
