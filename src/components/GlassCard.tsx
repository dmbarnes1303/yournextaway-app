// src/components/GlassCard.tsx
import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

/**
 * GlassCard (STRIPPED MODE)
 * No blur, no sheen, no heavy elevation.
 * Just a simple card so screens are readable while routing is fixed.
 */
type GlassStrength = "subtle" | "default" | "strong";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;

  // kept for compatibility (ignored)
  intensity?: number;

  // kept for compatibility (minor styling only)
  strength?: GlassStrength;

  noPadding?: boolean;
}

export default function GlassCard({
  children,
  style,
  strength = "default",
  noPadding = false,
}: GlassCardProps) {
  return (
    <View style={[styles.card, strengthStyles[strength], style]}>
      <View style={[styles.content, noPadding && styles.noPadding]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  content: {
    padding: 14,
  },
  noPadding: {
    padding: 0,
  },
});

const strengthStyles: Record<GlassStrength, ViewStyle> = {
  subtle: { backgroundColor: "rgba(255,255,255,0.04)" },
  default: { backgroundColor: "rgba(255,255,255,0.06)" },
  strong: { backgroundColor: "rgba(255,255,255,0.10)" },
};
