// src/components/Button.tsx
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { theme } from "@/src/constants/theme";

type Tone = "primary" | "secondary" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

type Props = {
  label?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  tone?: Tone;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  glow?: boolean;
};

function alpha(hex: string, a: number) {
  const h = String(hex || "").replace("#", "");
  const clamped = Math.max(0, Math.min(1, a));

  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    return `rgba(255,255,255,${clamped})`;
  }

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${clamped})`;
}

function getToneStyles(tone: Tone) {
  switch (tone) {
    case "primary":
      return {
        bg: theme.colors.emerald,
        border: theme.colors.borderEmerald,
        text: theme.colors.textOnBrand,
        spinner: theme.colors.textOnBrand,
      };

    case "gold":
      return {
        bg: theme.colors.gold,
        border: theme.colors.borderGold,
        text: theme.colors.textOnGold,
        spinner: theme.colors.textOnGold,
      };

    case "secondary":
      return {
        bg: theme.colors.bgElevated,
        border: theme.colors.borderStrong,
        text: theme.colors.textPrimary,
        spinner: theme.colors.textPrimary,
      };

    case "ghost":
      return {
        bg: "transparent",
        border: "transparent",
        text: theme.colors.textPrimary,
        spinner: theme.colors.textPrimary,
      };

    case "danger":
    default:
      return {
        bg: theme.colors.error,
        border: alpha(theme.colors.error, 0.85),
        text: "#FFFFFF",
        spinner: "#FFFFFF",
      };
  }
}

function sizeCfg(size: Size) {
  switch (size) {
    case "sm":
      return { minHeight: 40, px: 12, fontSize: 13 };
    case "lg":
      return { minHeight: 54, px: 18, fontSize: 17 };
    case "md":
    default:
      return { minHeight: 48, px: 16, fontSize: 15 };
  }
}

export default function Button({
  label,
  children,
  onPress,
  tone = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftSlot,
  rightSlot,
  style,
  textStyle,
  glow = false,
}: Props) {
  const cfg = useMemo(() => getToneStyles(tone), [tone]);
  const s = useMemo(() => sizeCfg(size), [size]);

  const isDisabled = disabled || loading || !onPress;

  const glowStyle =
    glow && tone === "primary"
      ? theme.shadow.emeraldGlow
      : glow && tone === "gold"
        ? theme.shadow.goldGlow
        : null;

  const content =
    children ?? (
      <Text
        numberOfLines={1}
        ellipsizeMode="clip"
        style={[
          styles.text,
          {
            color: cfg.text,
            fontSize: s.fontSize,
          },
          tone === "ghost" && styles.ghostText,
          textStyle,
        ]}
      >
        {label ?? "Continue"}
      </Text>
    );

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: s.minHeight,
          paddingHorizontal: tone === "ghost" ? 0 : s.px,
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          borderWidth: tone === "ghost" ? 0 : 1,
          opacity: isDisabled ? 0.5 : 1,
          transform: pressed && !isDisabled ? [{ scale: 0.985 }] : [{ scale: 1 }],
        },
        tone === "primary" && styles.primarySurface,
        tone === "gold" && styles.goldSurface,
        tone === "secondary" && styles.secondarySurface,
        tone === "ghost" && styles.ghostSurface,
        glowStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={cfg.spinner} />
      ) : (
        <View style={styles.row}>
          {leftSlot ? <View style={styles.slot}>{leftSlot}</View> : null}
          <View style={styles.center}>{content}</View>
          {rightSlot ? <View style={styles.slot}>{rightSlot}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.button,
    justifyContent: "center",
    overflow: "hidden",
  },

  primarySurface: {
    backgroundColor: theme.colors.emerald,
  },

  goldSurface: {
    backgroundColor: theme.colors.gold,
  },

  secondarySurface: {
    backgroundColor: theme.colors.bgElevated,
  },

  ghostSurface: {
    backgroundColor: "transparent",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    gap: 7,
  },

  slot: {
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.1,
    textAlign: "center",
  },

  ghostText: {
    textDecorationLine: "none",
  },
});
