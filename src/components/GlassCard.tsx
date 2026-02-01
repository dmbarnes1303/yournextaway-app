import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { theme } from "@/src/constants/theme";

type GlassStrength = "subtle" | "default" | "strong";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;

  /**
   * Backwards compatibility.
   * Prefer using strength instead.
   */
  intensity?: number;

  /**
   * Canonical strength levels.
   */
  strength?: GlassStrength;

  /**
   * Remove inner padding if required.
   */
  noPadding?: boolean;
}

/**
 * GlassCard
 * - iOS/Web: blur + tinted glass
 * - Android: no blur, stronger tint
 * - Adds a subtle top highlight so it reads like glass, not grey plastic
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
    <View style={[styles.shell, stylesByStrength[strength], style]}>
      {useBlur ? (
        <BlurView
          intensity={blurIntensity}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : null}

      {/* Glass highlight / sheen */}
      <View pointerEvents="none" style={styles.highlightTop} />

      <View style={[styles.content, noPadding && styles.noPadding]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "relative",
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.glass.border,
    overflow: "hidden",

    // Soft elevation
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },

    // Android fallback
    elevation: 4,
  },

  highlightTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 64,
    // looks like a subtle reflection band
    backgroundColor: "rgba(255,255,255,0.05)",
    opacity: 0.65,
  },

  content: {
    padding: theme.spacing.md,
  },

  noPadding: {
    padding: 0,
  },
});

const stylesByStrength = StyleSheet.create<Record<GlassStrength, ViewStyle>>({
  subtle: {
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  default: {
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  strong: {
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.strong : theme.glass.iosBg.strong,
  },
});
