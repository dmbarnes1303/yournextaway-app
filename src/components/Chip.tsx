// src/components/Chip.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { theme } from "@/src/constants/theme";

type Variant = "default" | "primary" | "success" | "warning" | "info";

type Props = {
  label: string;
  variant?: Variant;

  /**
   * V2 additions
   */
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
};

function alpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const clamped = Math.max(0, Math.min(1, a));
  return `rgba(${r},${g},${b},${clamped})`;
}

function getColors(variant: Variant) {
  switch (variant) {
    case "primary": {
      const c = theme.colors.accentGreen;
      return { fg: alpha(c, 0.95), bg: alpha(c, 0.14), border: alpha(c, 0.22) };
    }
    case "success": {
      const c = theme.colors.success;
      return { fg: alpha(c, 0.95), bg: alpha(c, 0.14), border: alpha(c, 0.22) };
    }
    case "warning": {
      const c = theme.colors.warning;
      return { fg: alpha(c, 0.95), bg: alpha(c, 0.12), border: alpha(c, 0.22) };
    }
    case "info": {
      const c = theme.colors.info;
      return { fg: alpha(c, 0.95), bg: alpha(c, 0.14), border: alpha(c, 0.22) };
    }
    case "default":
    default: {
      return {
        fg: theme.colors.textSecondary,
        bg: "rgba(255,255,255,0.05)",
        border: theme.colors.borderSubtle,
      };
    }
  }
}

export default function Chip({ label, variant = "default", size = "sm", style }: Props) {
  const colors = useMemo(() => getColors(variant), [variant]);
  const isMd = size === "md";

  return (
    <View
      style={[
        styles.base,
        isMd ? styles.md : styles.sm,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.text, isMd ? styles.textMd : styles.textSm, { color: colors.fg }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: theme.borderRadius.pill,
  },

  sm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  md: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  text: {
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.15,
  },

  textSm: {
    fontSize: theme.fontSize.tiny,
  },

  textMd: {
    fontSize: theme.fontSize.meta,
  },
});
