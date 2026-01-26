// src/components/GlassCard.tsx
import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { theme } from "@/src/constants/theme";

type GlassStrength = "subtle" | "default" | "strong";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;

  /**
   * Backwards compatible:
   * - If provided, used as BlurView intensity on iOS/web.
   * Prefer strength for consistency.
   */
  intensity?: number;

  /**
   * Canonical approach: consistent glass levels across the app.
   */
  strength?: GlassStrength;

  /**
   * Optional: remove default inner padding (some screens may want full-bleed content).
   */
  noPadding?: boolean;
}

/**
 * GlassCard (Android-safe, consistent recipe)
 *
 * Rules:
 * - Android: no blur (performance + reliability). Use stronger translucent base + border.
 * - iOS/web: BlurView + translucent base + border.
 * - Use strength to standardise the look across screens. Avoid ad-hoc intensities.
 */
export default function GlassCard({
  children,
  style,
  intensity,
  strength = "default",
  noPadding = false,
}: GlassCardProps) {
  const useBlur = Platform.OS !== "android";
  const blurIntensity = intensity ?? theme.glass.blur[strength];

  return (
    <View style={[styles.container, stylesByStrength[strength], style]}>
      {useBlur ? (
        <BlurView
          intensity={blurIntensity}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : null}

      <View style={[styles.content, noPadding && styles.contentNoPadding]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.glass.border,
    overflow: "hidden",
  },

  content: {
    padding: theme.spacing.md,
  },

  contentNoPadding: {
    padding: 0,
  },
});

const stylesByStrength = StyleSheet.create<Record<GlassStrength, ViewStyle>>({
  subtle: {
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.subtle
        : theme.glass.iosBg.subtle,
  },
  default: {
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.default
        : theme.glass.iosBg.default,
  },
  strong: {
    backgroundColor:
      Platform.OS === "android"
        ? theme.glass.androidBg.strong
        : theme.glass.iosBg.strong,
  },
});
