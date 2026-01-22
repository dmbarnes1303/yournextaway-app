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
 * IMPORTANT:
 * - Expo Go on Android can render BlurView as an opaque layer above children,
 *   making text look "missing".
 * - For stability, we use BlurView on iOS/web, and a tinted fallback on Android.
 */
export default function GlassCard({ children, style, intensity = 20 }: GlassCardProps) {
  const useBlur = Platform.OS !== "android";

  return (
    <View style={[styles.container, style]}>
      {useBlur ? (
        <BlurView
          intensity={intensity}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : null}

      {/* Always include tint so Android still looks "glassy" without BlurView */}
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
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26, 31, 46, 0.45)",
  },
  content: {
    padding: theme.spacing.md,
  },
});
