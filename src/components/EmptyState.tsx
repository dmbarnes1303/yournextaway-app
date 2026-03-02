// src/components/FixtureCertaintyBadge.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import type { FixtureCertaintyState } from "@/src/utils/fixtureCertainty";
import { theme } from "@/src/constants/theme";

type Props = {
  state: FixtureCertaintyState;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "compact";
};

type BadgeCfg = {
  label: string;
  fg: string;
  bg: string;
  border: string;
  dot: string;
};

function alpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const clamped = Math.max(0, Math.min(1, a));
  return `rgba(${r},${g},${b},${clamped})`;
}

function cfg(state: FixtureCertaintyState): BadgeCfg {
  switch (state) {
    case "tbc": {
      const c = theme.colors.accentGold;
      return {
        label: "Kickoff TBC",
        fg: c,
        dot: c,
        bg: alpha(c, 0.12),
        border: alpha(c, 0.22),
      };
    }

    case "likely_tbc": {
      const c = theme.colors.accentGold;
      return {
        label: "Likely placeholder",
        fg: alpha(c, 0.92),
        dot: alpha(c, 0.92),
        bg: alpha(c, 0.10),
        border: alpha(c, 0.20),
      };
    }

    case "changed": {
      const c = theme.colors.accentBlue;
      return {
        label: "Date changed",
        fg: alpha(c, 0.95),
        dot: alpha(c, 0.95),
        bg: alpha(c, 0.14),
        border: alpha(c, 0.22),
      };
    }

    case "confirmed":
    default: {
      const c = theme.colors.accentGreen;
      return {
        label: "Confirmed",
        fg: alpha(c, 0.95),
        dot: alpha(c, 0.95),
        bg: alpha(c, 0.14),
        border: alpha(c, 0.22),
      };
    }
  }
}

export default function FixtureCertaintyBadge({ state, style, variant = "default" }: Props) {
  const c = useMemo(() => cfg(state), [state]);

  const compact = variant === "compact";

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: c.bg, borderColor: c.border },
        style,
      ]}
    >
      <View style={[styles.dot, compact && styles.dotCompact, { backgroundColor: c.dot }]} />
      <Text style={[styles.text, compact && styles.textCompact, { color: c.fg }]} numberOfLines={1}>
        {c.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: theme.borderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
  },

  badgeCompact: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 7,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },

  dotCompact: {
    width: 7,
    height: 7,
  },

  text: {
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.semibold,
    letterSpacing: 0.2,
  },

  textCompact: {
    fontSize: 11,
    letterSpacing: 0.15,
  },
});
