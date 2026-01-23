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
 * GlassCard (Android-safe)
 *
 * Reality:
 * - Android + Expo Go + Blur/absolute overlays + animated parents = unreliable compositing.
 *
 * Policy:
 * - iOS/web: BlurView background layer is fine.
 * - Android: NO blur, NO absolute tint overlay. Just a single translucent background.
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

      {/* IMPORTANT: On Android we do not add any absolute overlay views. */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(26, 31, 46, 0.72)" : "rgba(26, 31, 46, 0.55)",
    overflow: "hidden",
  },
  content: {
    padding: theme.spacing.md,
  },
});
