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

function getBackgroundColor(variant: Variant, level: GlassLevel) {
  if (variant === "brand") {
    if (level === "subtle") return theme.colors.bgBrandDeep;
    if (level === "strong") return theme.colors.bgBrandElevated;
    return theme.colors.bgBrandElevated;
  }

  if (variant === "gold") {
    if (level === "subtle") return alpha(theme.colors.bgGoldDeep, 0.78);
    if (level === "strong") return alpha(theme.colors.bgGoldDeep, 0.94);
    return alpha(theme.colors.bgGoldDeep, 0.88);
  }

  if (variant === "glass") {
    if (level === "subtle") return alpha(theme.colors.bgSurface, 0.34);
    if (level === "strong") return alpha(theme.colors.bgSurface, 0.18);
    return alpha(theme.colors.bgSurface, 0.24);
  }

  if (level === "subtle") return theme.colors.bgSurface;
  if (level === "strong") return theme.colors.bgElevated;
  return theme.colors.bgElevated;
}

function getBorderColor(
  variant: Variant,
  level: GlassLevel,
  override?: string
): string {
  if (override) return override;

  if (variant === "brand") {
    return level === "strong"
      ? theme.colors.borderGreenStrong
      : theme.colors.borderGreenSoft;
  }

  if (variant === "gold") {
    return level === "strong"
      ? theme.colors.borderGoldStrong
      : theme.colors.borderGoldSoft;
  }

  if (variant === "glass") {
    return theme.glass.border;
  }

  return theme.colors.borderSubtle;
}

function getBorderWidth(variant: Variant) {
  if (variant === "matte") return 1;
  return 1;
}

function getShadowStyle(variant: Variant, level: GlassLevel) {
  if (variant === "brand" && level === "strong") {
    return theme.shadow.greenGlow;
  }

  if (variant === "gold" && level === "strong") {
    return theme.shadow.goldGlow;
  }

  return theme.shadow.soft;
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
    return resolvedLevel === "strong" ? "brand" : "matte";
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

  const backgroundColor = getBackgroundColor(resolvedVariant, resolvedLevel);
  const resolvedBorder = getBorderColor(resolvedVariant, resolvedLevel, borderColor);
  const resolvedBorderWidth = getBorderWidth(resolvedVariant);

  const resolvedPadding =
    noPadding ? 0 : typeof padding === "number" ? padding : theme.spacing.md;

  const blurIntensity = useMemo(() => {
    if (!shouldBlur) return 0;
    if (legacyIntensity != null) return clamp(legacyIntensity, 1, 100);
    return resolvedLevel === "subtle" ? 18 : resolvedLevel === "default" ? 26 : 36;
  }, [shouldBlur, legacyIntensity, resolvedLevel]);

  const shadowStyle = getShadowStyle(resolvedVariant, resolvedLevel);

  const baseStyle: any[] = [
    styles.base,
    {
      padding: resolvedPadding,
      backgroundColor,
      borderColor: resolvedBorder,
      borderWidth: resolvedBorderWidth,
    },
    shadowStyle,
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
});
