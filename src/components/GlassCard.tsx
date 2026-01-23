// src/components/GlassCard.tsx
import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { theme } from "@/src/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

/**
 * DEBUG SANITY CHECK:
 * - Tint is set to bright magenta to prove this file is actually being used at runtime.
 * - Once confirmed, we will revert tint and fix Build Trip panel properly.
 */
export default function GlassCard({ children, style, intensity = 20 }: GlassCardProps) {
  const useBlur = Platform.OS !== "android";

  return (
    <View style={[styles.container, style]}>
      {useBlur ? (
        <BlurView
          intensity={intensity}
          tint="dark"
          style={[StyleSheet.absoluteFillObject, styles.blur]}
          pointerEvents="none"
        />
      ) : null}

      <View pointerEvents="none" style={styles.tint} />

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(26, 31, 46, 0.55)",
  },
  blur: {
    zIndex: 0,
    elevation: 0,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    // DEBUG: if you don't see this, you're not running this file
    backgroundColor: "rgba(255,0,255,0.85)",
    zIndex: 1,
    elevation: 1,
  },
  content: {
    padding: theme.spacing.md,
    zIndex: 2,
    elevation: 2,
  },
});
