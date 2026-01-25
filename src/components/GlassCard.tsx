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
 * Policy:
 * - iOS/web: BlurView background layer is fine.
 * - Android: NO blur, NO absolute tint overlay. Just a single translucent background.
 *
 * Brand:
 * - Neutral black/charcoal base (NOT navy).
 * - Neon green is used by screens/components as accents, not as the card base color.
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

    // IMPORTANT: Neutral charcoal glass, not blue.
    // Android needs slightly stronger opacity because there is no blur.
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.52)" : "rgba(0,0,0,0.38)",

    overflow: "hidden",
  },
  content: {
    padding: theme.spacing.md,
  },
});
