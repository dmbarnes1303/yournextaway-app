// src/components/GlassCard.tsx
import React, { useMemo } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { theme } from "@/src/constants/theme";

type GlassLevel = "subtle" | "default" | "strong";

/**
 * V2 intent:
 * - Matte surfaces by default (premium, modern)
 * - True blur reserved for overlays / special moments
 *
 * Backwards compatibility:
 * - Existing code may pass intensity
 * - Existing code may pass level
 */
type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;

  /**
   * Legacy:
   * Many screens call <GlassCard intensity={26} />
   * In V2, typical legacy intensities will NOT blur by default.
   * Blur is only enabled for very high intensities (>= 45) unless forceBlur is true.
   */
  intensity?: number;

  /**
   * Preferred:
   * "subtle" -> softer matte
   * "default" -> standard matte card
   * "strong" -> can use blur if enabled
   */
  level?: GlassLevel;

  /**
   * Optional border override (rarely needed in V2).
   */
  borderColor?: string;

  /**
   * Disable blur even if eligible.
   */
  disableBlur?: boolean;

  /**
   * Force blur on capable platforms (iOS/web). Use for overlays / sheets only.
   */
  forceBlur?: boolean;

  /**
   * V2 addition:
   * - "matte" (default): solid premium surfaces
   * - "glass": translucent + eligible for blur
   *
   * If omitted, we infer:
   * - level="strong" -> glass
   * - otherwise -> matte
   */
  variant?: "matte" | "glass";
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function levelFromIntensity(intensity?: number): GlassLevel {
  const i = typeof intensity === "number" ? intensity : null;
  if (i == null) return "default";
  if (i < 18) return "subtle";
  if (i < 32) return "default";
  return "strong";
}

function alpha(hex: string, a: number) {
  // hex like #RRGGBB
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`;
}

export default function GlassCard({
  children,
  style,
  intensity,
  level,
  borderColor,
  disableBlur,
  forceBlur,
  variant,
}: Props) {
  const resolvedLevel: GlassLevel = useMemo(() => {
    if (level) return level;
    return levelFromIntensity(intensity);
  }, [level, intensity]);

  const resolvedVariant: "matte" | "glass" = useMemo(() => {
    if (variant) return variant;
    return resolvedLevel === "strong" ? "glass" : "matte";
  }, [variant, resolvedLevel]);

  const isBlurCapable = Platform.OS === "ios" || Platform.OS === "web";

  /**
   * V2 blur policy:
   * - Blur is NOT the default look anymore.
   * - Blur only triggers when:
   *    - forceBlur is true, OR
   *    - variant="glass" AND (level="strong" OR intensity>=45)
   */
  const legacyIntensity = typeof intensity === "number" ? intensity : null;
  const eligibleByLegacy = legacyIntensity != null && legacyIntensity >= 45;

  const shouldBlur =
    isBlurCapable &&
    !disableBlur &&
    (forceBlur === true ||
      (resolvedVariant === "glass" &&
        (resolvedLevel === "strong" || eligibleByLegacy)));

  // Matte surface backgrounds (primary look)
  const matteBg =
    resolvedLevel === "subtle"
      ? theme.colors.bgSurface
      : resolvedLevel === "default"
      ? theme.colors.bgElevated
      : theme.colors.bgElevated;

  // Glass tint (when variant="glass")
  const glassBg =
    resolvedLevel === "subtle"
      ? alpha(theme.colors.bgSurface, 0.35)
      : resolvedLevel === "default"
      ? alpha(theme.colors.bgSurface, 0.28)
      : alpha(theme.colors.bgSurface, 0.22);

  const bg = resolvedVariant === "glass" ? glassBg : matteBg;

  // Border: V2 is border-light; matte cards usually have no border.
  const defaultBorder =
    resolvedVariant === "glass"
      ? theme.colors.borderSubtle
      : "transparent";

  const resolvedBorder = borderColor ?? defaultBorder;

  // Blur intensity:
  // - If legacy intensity is provided AND we're blurring, respect it (clamped).
  // - Otherwise, map by level.
  const blurIntensity = useMemo(() => {
    if (!shouldBlur) return 0;
    if (legacyIntensity != null) return clamp(legacyIntensity, 1, 100);
    return resolvedLevel === "subtle" ? 18 : resolvedLevel === "default" ? 26 : 34;
  }, [shouldBlur, legacyIntensity, resolvedLevel]);

  const baseStyle = [
    styles.base,
    resolvedVariant === "glass" ? styles.glassFrame : styles.matteFrame,
    styles.shadow,
    { backgroundColor: bg, borderColor: resolvedBorder },
    style,
  ];

  if (shouldBlur) {
    return (
      <BlurView tint="dark" intensity={blurIntensity} style={baseStyle}>
        {children}
      </BlurView>
    );
  }

  return <View style={baseStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.card ?? theme.borderRadius.lg,
    padding: theme.spacing.md,
    overflow: "hidden",
  },

  matteFrame: {
    borderWidth: 0,
  },

  glassFrame: {
    borderWidth: 1,
  },

  shadow: {
    // Premium, soft elevation (no harsh "card outline" look)
    shadowColor: "#000",
    shadowOpacity: 0.30,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
});
