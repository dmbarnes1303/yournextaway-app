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

type Tone = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = {
  label?: string; // convenience
  children?: React.ReactNode; // or custom node content
  onPress?: () => void;

  tone?: Tone;
  size?: Size;

  loading?: boolean;
  disabled?: boolean;

  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;

  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;

  /**
   * Optional: more "sporty premium" CTA pop
   * Use sparingly (e.g. 1 primary CTA per screen)
   */
  glow?: boolean;
};

function alpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const clamped = Math.max(0, Math.min(1, a));
  return `rgba(${r},${g},${b},${clamped})`;
}

function getToneStyles(tone: Tone) {
  switch (tone) {
    case "primary":
      return {
        bg: theme.colors.accentGreen,
        border: "transparent",
        text: "#FFFFFF",
        spinner: "#FFFFFF",
      };
    case "secondary":
      return {
        bg: "rgba(255,255,255,0.04)",
        border: theme.colors.borderSubtle,
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
        border: "transparent",
        text: "#FFFFFF",
        spinner: "#FFFFFF",
      };
  }
}

function sizeCfg(size: Size) {
  switch (size) {
    case "sm":
      return { h: 40, px: 14, font: theme.fontSize.meta };
    case "lg":
      return { h: 54, px: 20, font: theme.fontSize.h2 };
    case "md":
    default:
      return { h: 48, px: 18, font: theme.fontSize.body };
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

  const content = children ?? (
    <Text style={[styles.text, { color: cfg.text, fontSize: s.font }, textStyle]}>
      {label ?? "Continue"}
    </Text>
  );

  const glowStyle =
    glow && tone === "primary"
      ? {
          shadowColor: theme.colors.accentGreen,
          shadowOpacity: 0.28,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 10,
        }
      : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        {
          height: s.h,
          paddingHorizontal: s.px,
          backgroundColor: cfg.bg,
          borderColor: cfg.border,
          opacity: isDisabled ? 0.55 : 1,
          transform: pressed && !isDisabled ? [{ scale: 0.985 }] : [{ scale: 1 }],
        },
        glowStyle,
        tone === "ghost" ? styles.ghost : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={cfg.spinner} />
      ) : (
        <View style={styles.row}>
          {leftSlot ? <View style={styles.slot}>{leftSlot}</View> : null}
          <View style={styles.center}>{content}</View>
          {rightSlot ? <View style={styles.slot}>{rightSlot}</View> : <View style={styles.slot} />}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },

  ghost: {
    borderWidth: 0,
    paddingHorizontal: 0,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  slot: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.2,
  },
});
