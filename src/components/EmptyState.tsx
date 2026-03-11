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
  title: string;
  message: string;

  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconSize?: number;

  variant?: "default" | "compact";

  primaryAction?: Action;
  secondaryAction?: Action;

  hint?: string;
};

export default function EmptyState({
  title,
  message,
  iconName,
  iconColor,
  iconSize = 24,
  variant = "default",
  primaryAction,
  secondaryAction,
  hint,
}: EmptyStateProps) {
  const resolvedIconName = useMemo(() => {
    if (iconName) return iconName;
    return "sparkles";
  }, [iconName]);

  const resolvedIconColor = iconColor ?? theme.colors.textSecondary;
  const isCompact = variant === "compact";
  const hasActions = Boolean(primaryAction || secondaryAction);

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <View style={[styles.iconBadge, isCompact && styles.iconBadgeCompact]}>
        <Ionicons
          name={resolvedIconName}
          size={isCompact ? Math.max(20, iconSize - 2) : iconSize}
          color={resolvedIconColor}
        />
      </View>

      <Text style={[styles.title, isCompact && styles.titleCompact]} numberOfLines={2}>
        {title}
      </Text>

      <Text style={[styles.message, isCompact && styles.messageCompact]}>
        {message}
      </Text>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {hasActions ? (
        <View style={[styles.actions, isCompact && styles.actionsCompact]}>
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
                pressed && Platform.OS !== "web" ? styles.secondaryBtnPressed : null,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>{secondaryAction.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 22,
  },

  containerCompact: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },

  iconBadgeCompact: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginBottom: 10,
  },

  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
    letterSpacing: 0.15,
    maxWidth: 520,
  },

  titleCompact: {
    fontSize: 15,
    lineHeight: 19,
  },

  message: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
    textAlign: "center",
    maxWidth: 520,
  },

  messageCompact: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
  },

  hint: {
    marginTop: 8,
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.medium,
    textAlign: "center",
    maxWidth: 520,
  },

  actions: {
    marginTop: 14,
    width: "100%",
    alignItems: "center",
    gap: 8,
  },

  actionsCompact: {
    marginTop: 12,
  },

  primaryBtnWrap: {
    width: "100%",
  },

  primaryBtn: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    backgroundColor: theme.colors.accentGreen,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.2,
  },

  secondaryBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryBtnPressed: {
    opacity: 0.85,
  },

  secondaryBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
  },
});
