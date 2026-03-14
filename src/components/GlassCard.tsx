// src/components/GlassCard.tsx
import React, { useMemo } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { theme } from "@/src/constants/theme";

type GlassLevel = "subtle" | "default" | "strong";
type Variant = "matte" | "glass";

/**
 * Legacy compatibility notes:
 * - Many screens used: <GlassCard strength="subtle" noPadding />
 * - Some used: <GlassCard intensity={26} />
 * - Some used: <GlassCard strength="strong" ...> expecting blur-ish overlay
 *
 * V2 intent:
 * - Matte surfaces by default (premium)
 * - True blur only for overlays or explicit usage
 */
type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;

  // Legacy props (supported)
  strength?: GlassLevel;
  noPadding?: boolean;
  intensity?: number;
  androidFallbackColor?: string;

  // Preferred props
  level?: GlassLevel;
  variant?: Variant;
  disableBlur?: boolean;
  forceBlur?: boolean;

  // Optional overrides
  borderColor?: string;
  padding?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function alpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`;
}

function levelFromIntensity(intensity?: number): GlassLevel {
  const i = typeof intensity === "number" ? intensity : null;
  if (i == null) return "default";
  if (i < 18) return "subtle";
  if (i < 32) return "default";
  return "strong";
}

export default function GlassCard({
  children,
  style,

  // legacy
  strength,
  noPadding,
  intensity,
  androidFallbackColor,

  // preferred
  level,
  variant,
  disableBlur,
  forceBlur,

  // misc
  borderColor,
  padding,
}: Props) {
  const resolvedLevel: GlassLevel = useMemo(() => {
    if (level) return level;
    if (strength) return strength;
    return levelFromIntensity(intensity);
  }, [level, strength, intensity]);

  const resolvedVariant: Variant = useMemo(() => {
    if (variant) return variant;
    return resolvedLevel === "strong" ? "glass" : "matte";
  }, [variant, resolvedLevel]);

  const isBlurCapable = Platform.OS === "ios" || Platform.OS === "web";

  const legacyIntensity = typeof intensity === "number" ? intensity : null;
  const eligibleByLegacy = legacyIntensity != null && legacyIntensity >= 45;

  const shouldBlur =
    isBlurCapable &&
    !disableBlur &&
    (forceBlur === true ||
      (resolvedVariant === "glass" &&
        (resolvedLevel === "strong" || eligibleByLegacy)));

  const matteBg =
    resolvedLevel === "subtle"
      ? theme.colors.bgSurface
      : theme.colors.bgElevated;

  const glassBg =
    resolvedLevel === "subtle"
      ? alpha(theme.colors.bgSurface, 0.35)
      : resolvedLevel === "default"
        ? alpha(theme.colors.bgSurface, 0.28)
        : alpha(theme.colors.bgSurface, 0.22);

  const bg = resolvedVariant === "glass" ? glassBg : matteBg;

  const defaultBorder =
    resolvedVariant === "glass" ? theme.colors.borderSubtle : "transparent";

  const resolvedBorder = borderColor ?? defaultBorder;

  const resolvedPadding =
    noPadding ? 0 : typeof padding === "number" ? padding : theme.spacing.md;

  const blurIntensity = useMemo(() => {
    if (!shouldBlur) return 0;
    if (legacyIntensity != null) return clamp(legacyIntensity, 1, 100);
    return resolvedLevel === "subtle" ? 18 : resolvedLevel === "default" ? 26 : 34;
  }, [shouldBlur, legacyIntensity, resolvedLevel]);

  const baseStyle: any[] = [
    styles.base,
    {
      padding: resolvedPadding,
      backgroundColor: bg,
      borderColor: resolvedBorder,
      borderWidth: resolvedVariant === "glass" ? 1 : 0,
    },
    styles.shadow,
    Platform.OS === "android" && androidFallbackColor
      ? { backgroundColor: androidFallbackColor }
      : null,
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
    borderRadius: theme.borderRadius.card,
    overflow: "hidden",
  },

  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
});
