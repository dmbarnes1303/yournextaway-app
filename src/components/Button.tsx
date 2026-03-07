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
        bg: "rgba(255,255,255,0.05)",
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
      return {
        minHeight: 40,
        px: 14,
        fontSize: 13,
        slot: 24,
      };

    case "lg":
      return {
        minHeight: 54,
        px: 18,
        fontSize: 17,
        slot: 30,
      };

    case "md":
    default:
      return {
        minHeight: 48,
        px: 16,
        fontSize: 15,
        slot: 28,
      };
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
      ? {
          shadowColor: theme.colors.accentGreen,
          shadowOpacity: 0.24,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }
      : null;

  const content =
    children ?? (
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.text,
          {
            color: cfg.text,
            fontSize: s.fontSize,
          },
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
          opacity: isDisabled ? 0.55 : 1,
          transform: pressed && !isDisabled ? [{ scale: 0.985 }] : [{ scale: 1 }],
        },
        tone === "primary" && styles.primarySurface,
        tone === "secondary" && styles.secondarySurface,
        glowStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={cfg.spinner} />
      ) : (
        <View style={styles.row}>
          <View style={[styles.slot, { width: s.slot }]}>
            {leftSlot ?? null}
          </View>

          <View style={styles.center}>{content}</View>

          <View style={[styles.slot, { width: s.slot }]}>
            {rightSlot ?? null}
          </View>
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
    backgroundColor: theme.colors.accentGreen,
  },

  secondarySurface: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  slot: {
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
