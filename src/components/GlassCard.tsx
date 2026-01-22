// src/components/GlassCard.tsx
import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { theme } from "@/src/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export default function GlassCard({ children, style, intensity = 20 }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      {/* CRITICAL: BlurView must never steal touches */}
      <BlurView
        intensity={intensity}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Fallback tint layer helps Android + low-blur scenarios */}
      <View pointerEvents="none" style={styles.tint} />

      {/* Content is the only interactive layer */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
