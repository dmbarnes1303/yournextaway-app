// src/components/GlassCard.tsx
import React, { useMemo } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { theme } from "@/src/constants/theme";

type GlassLevel = "subtle" | "default" | "strong";

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;

  /**
   * Backwards compatible:
   * Older code uses <GlassCard intensity={26} />
   * We map intensity -> level + (iOS/web) blur intensity.
   */
  intensity?: number;

  /**
   * Preferred new API:
   * Explicitly pick glass strength.
   */
  level?: GlassLevel;

  /**
   * Optional: override border color.
   * If omitted, uses theme.glass.border.
   */
  borderColor?: string;

  /**
   * Optional: disable blur even on iOS/web (debug / readability).
   */
  disableBlur?: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function levelFromIntensity(intensity?: number): GlassLevel {
  const i = typeof intensity === "number" ? intensity : null;
  if (i == null) return "default";
  if (i < 18) return "subtle";
  if (i < 28) return "default";
  return "strong";
}

function blurFromLevel(level: GlassLevel) {
  // expo-blur wants a number; we keep your theme as the source of truth.
  const t = theme.glass.blur[level];
  return clamp(t, 1, 100);
}

export default function GlassCard({
  children,
  style,
  intensity,
  level,
  borderColor,
  disableBlur,
}: Props) {
  const resolvedLevel: GlassLevel = useMemo(() => {
    if (level) return level;
    return levelFromIntensity(intensity);
  }, [level, intensity]);

  const resolvedBorder = borderColor ?? theme.glass.border;

  const isBlurCapable = Platform.OS === "ios" || Platform.OS === "web";
  const shouldBlur = isBlurCapable && !disableBlur;

  // Background tint differs per platform because Android has no blur.
  const bg =
    Platform.OS === "android"
      ? theme.glass.androidBg[resolvedLevel]
      : theme.glass.iosBg[resolvedLevel];

  const blurIntensity = useMemo(() => {
    // If legacy "intensity" provided, respect it (but clamp).
    if (typeof intensity === "number") return clamp(intensity, 1, 100);
    return blurFromLevel(resolvedLevel);
  }, [intensity, resolvedLevel]);

  if (shouldBlur) {
    return (
      <BlurView
        tint="dark"
        intensity={blurIntensity}
        style={[
          styles.base,
          styles.shadow,
          { borderColor: resolvedBorder, backgroundColor: bg },
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  // Android + fallback: no blur, just premium tinted glass.
  return (
    <View
      style={[
        styles.base,
        styles.shadow,
        { borderColor: resolvedBorder, backgroundColor: bg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    overflow: "hidden",
  },
  shadow: {
    // Keep it subtle + premium (no neon glow here; that belongs on accents only)
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
});
