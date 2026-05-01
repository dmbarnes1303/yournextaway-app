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
type Variant = "matte" | "glass" | "brand" | "gold";

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;

  // Legacy props
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

function levelFromIntensity(intensity?: number): GlassLevel {
  if (typeof intensity !== "number") return "default";
  if (intensity < 18) return "subtle";
  if (intensity < 32) return "default";
  return "strong";
}

function getBackgroundColor(variant: Variant, level: GlassLevel): string {
  if (variant === "brand") {
    if (level === "subtle") return theme.colors.bgBrand;
    if (level === "strong") return theme.colors.bgBrandElevated;
    return theme.colors.bgBrand;
  }

  if (variant === "gold") {
    if (level === "subtle") return "rgba(23,19,8,0.76)";
    if (level === "strong") return "rgba(23,19,8,0.94)";
    return "rgba(23,19,8,0.86)";
  }

  if (variant === "glass") {
    if (Platform.OS === "android") return theme.glass.android[level];
    return theme.glass.bg[level];
  }

  if (level === "subtle") return theme.colors.bgSurface;
  if (level === "strong") return theme.colors.bgElevated;
  return theme.surfaces.elevated;
}

function getBorderColor(
  variant: Variant,
  level: GlassLevel,
  override?: string
): string {
  if (override) return override;

  if (variant === "brand") return theme.colors.borderEmerald;
  if (variant === "gold") return theme.colors.borderGold;

  if (variant === "glass") {
    return level === "strong" ? theme.colors.borderStrong : theme.glass.border;
  }

  return level === "strong" ? theme.colors.borderStrong : theme.colors.borderSubtle;
}

function getShadowStyle(variant: Variant, level: GlassLevel) {
  if (variant === "brand" && level === "strong") return theme.shadow.emeraldGlow;
  if (variant === "gold" && level === "strong") return theme.shadow.goldGlow;
  return theme.shadow.soft;
}

export default function GlassCard({
  children,
  style,

  strength,
  noPadding,
  intensity,
  androidFallbackColor,

  level,
  variant,
  disableBlur,
  forceBlur,

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
    return resolvedLevel === "strong" ? "brand" : "matte";
  }, [variant, resolvedLevel]);

  const legacyIntensity = typeof intensity === "number" ? intensity : null;
  const isBlurCapable = Platform.OS === "ios" || Platform.OS === "web";

  const shouldBlur =
    isBlurCapable &&
    !disableBlur &&
    (forceBlur === true ||
      resolvedVariant === "glass" ||
      (legacyIntensity != null && legacyIntensity >= 45));

  const resolvedPadding =
    noPadding ? 0 : typeof padding === "number" ? padding : theme.spacing.md;

  const blurIntensity = useMemo(() => {
    if (!shouldBlur) return 0;
    if (legacyIntensity != null) return clamp(legacyIntensity, 1, 100);
    if (resolvedLevel === "subtle") return 18;
    if (resolvedLevel === "strong") return 38;
    return 28;
  }, [shouldBlur, legacyIntensity, resolvedLevel]);

  const backgroundColor =
    Platform.OS === "android" && androidFallbackColor
      ? androidFallbackColor
      : getBackgroundColor(resolvedVariant, resolvedLevel);

  const baseStyle: any[] = [
    styles.base,
    {
      padding: resolvedPadding,
      backgroundColor,
      borderColor: getBorderColor(resolvedVariant, resolvedLevel, borderColor),
      borderWidth: 1,
    },
    getShadowStyle(resolvedVariant, resolvedLevel),
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
});
