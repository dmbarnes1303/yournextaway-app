// src/components/Background.tsx
import React, { useMemo } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from "react-native";

import {
  type BackgroundSource,
  type BackgroundSpec,
  isBackgroundSpec,
} from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

type Props = {
  imageSource?: BackgroundSource;
  imageUrl?: string | null;
  children: React.ReactNode;
  mode?: "image" | "solid";
  solidColor?: string;
  overlayOpacity?: number;
  topShadeOpacity?: number;
  centerShadeOpacity?: number;
  bottomShadeOpacity?: number;
};

function resolveImageSource(
  imageSource?: BackgroundSource,
  imageUrl?: string | null
): ImageSourcePropType | null {
  const cleanUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";
  if (cleanUrl) return { uri: cleanUrl };

  if (!imageSource) return null;

  if (typeof imageSource === "string") {
    const trimmed = imageSource.trim();
    return trimmed ? { uri: trimmed } : null;
  }

  if (isBackgroundSpec(imageSource)) return null;

  return imageSource as ImageSourcePropType;
}

function getSpec(source?: BackgroundSource): BackgroundSpec | null {
  if (!source) return null;
  return isBackgroundSpec(source) ? source : null;
}

function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function rgbaBlack(alpha: number): string {
  return `rgba(0,0,0,${clampOpacity(alpha)})`;
}

function hexToRgba(hex: string, alpha: number): string {
  const value = String(hex || "").replace("#", "").trim();

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return rgbaBlack(alpha);
  }

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${clampOpacity(alpha)})`;
}

export default function Background({
  imageSource,
  imageUrl,
  children,
  mode = "image",
  solidColor = theme.colors.bgBase,
  overlayOpacity = 0.54,
  topShadeOpacity = 0.22,
  centerShadeOpacity = 0.08,
  bottomShadeOpacity = 0.48,
}: Props) {
  const resolvedSource = useMemo(
    () => resolveImageSource(imageSource, imageUrl),
    [imageSource, imageUrl]
  );

  const spec = useMemo(() => getSpec(imageSource), [imageSource]);

  const resolvedSolidColor = spec?.colors?.[0] || solidColor;

  const resolvedTopShadeOpacity = spec?.topTintOpacity ?? topShadeOpacity;
  const resolvedBottomShadeOpacity = spec?.bottomShadeOpacity ?? bottomShadeOpacity;
  const resolvedCenterShadeOpacity = centerShadeOpacity;
  const vignetteOpacity = spec?.vignetteOpacity ?? 0.18;

  const sideTintColor = spec?.sideTintColor ?? theme.colors.emerald;
  const sideTintOpacity = spec?.sideTintOpacity ?? 0.04;
  const sideTintSide = spec?.sideTintSide ?? "both";

  const topShadeColor = spec?.topTintColor
    ? hexToRgba(spec.topTintColor, resolvedTopShadeOpacity)
    : rgbaBlack(resolvedTopShadeOpacity);

  const bottomShadeColor = rgbaBlack(resolvedBottomShadeOpacity);
  const centerShadeColor = rgbaBlack(resolvedCenterShadeOpacity);
  const baseOverlayColor = rgbaBlack(overlayOpacity);
  const vignetteColor = rgbaBlack(vignetteOpacity);

  if (mode === "solid" || (!resolvedSource && !spec)) {
    return (
      <View style={[styles.container, { backgroundColor: resolvedSolidColor }]}>
        <View pointerEvents="none" style={styles.launchTint} />
        <View pointerEvents="none" style={[styles.bottomShade, { backgroundColor: bottomShadeColor }]} />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  if (!resolvedSource && spec) {
    return (
      <View style={[styles.container, { backgroundColor: spec.colors[0] }]}>
        <View
          pointerEvents="none"
          style={[
            styles.gradientLayer,
            {
              backgroundColor: spec.colors[1],
              opacity: 0.28,
            },
          ]}
        />

        <View
          pointerEvents="none"
          style={[
            styles.bottomGradientLayer,
            {
              backgroundColor: spec.colors[2],
              opacity: 0.36,
            },
          ]}
        />

        <View pointerEvents="none" style={[styles.baseOverlay, { backgroundColor: baseOverlayColor }]} />

        <View pointerEvents="none" style={styles.launchTint} />

        {resolvedTopShadeOpacity > 0 ? (
          <View pointerEvents="none" style={[styles.topShade, { backgroundColor: topShadeColor }]} />
        ) : null}

        {resolvedCenterShadeOpacity > 0 ? (
          <View pointerEvents="none" style={[styles.centerShade, { backgroundColor: centerShadeColor }]} />
        ) : null}

        {resolvedBottomShadeOpacity > 0 ? (
          <View pointerEvents="none" style={[styles.bottomShade, { backgroundColor: bottomShadeColor }]} />
        ) : null}

        {sideTintColor && sideTintOpacity > 0 ? (
          <>
            {(sideTintSide === "left" || sideTintSide === "both") && (
              <View
                pointerEvents="none"
                style={[
                  styles.leftSideTint,
                  { backgroundColor: hexToRgba(sideTintColor, sideTintOpacity) },
                ]}
              />
            )}

            {(sideTintSide === "right" || sideTintSide === "both") && (
              <View
                pointerEvents="none"
                style={[
                  styles.rightSideTint,
                  { backgroundColor: hexToRgba(sideTintColor, sideTintOpacity) },
                ]}
              />
            )}
          </>
        ) : null}

        {vignetteOpacity > 0 ? (
          <View pointerEvents="none" style={[styles.vignette, { backgroundColor: vignetteColor }]} />
        ) : null}

        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <ImageBackground source={resolvedSource!} style={styles.container} resizeMode="cover">
      <View pointerEvents="none" style={[styles.baseOverlay, { backgroundColor: baseOverlayColor }]} />

      <View pointerEvents="none" style={styles.launchTint} />

      {resolvedTopShadeOpacity > 0 ? (
        <View pointerEvents="none" style={[styles.topShade, { backgroundColor: topShadeColor }]} />
      ) : null}

      {resolvedCenterShadeOpacity > 0 ? (
        <View pointerEvents="none" style={[styles.centerShade, { backgroundColor: centerShadeColor }]} />
      ) : null}

      {resolvedBottomShadeOpacity > 0 ? (
        <View pointerEvents="none" style={[styles.bottomShade, { backgroundColor: bottomShadeColor }]} />
      ) : null}

      {sideTintColor && sideTintOpacity > 0 ? (
        <>
          {(sideTintSide === "left" || sideTintSide === "both") && (
            <View
              pointerEvents="none"
              style={[
                styles.leftSideTint,
                { backgroundColor: hexToRgba(sideTintColor, sideTintOpacity) },
              ]}
            />
          )}

          {(sideTintSide === "right" || sideTintSide === "both") && (
            <View
              pointerEvents="none"
              style={[
                styles.rightSideTint,
                { backgroundColor: hexToRgba(sideTintColor, sideTintOpacity) },
              ]}
            />
          )}
        </>
      ) : null}

      {vignetteOpacity > 0 ? (
        <View pointerEvents="none" style={[styles.vignette, { backgroundColor: vignetteColor }]} />
      ) : null}

      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },

  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  bottomGradientLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: "34%",
  },

  baseOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  launchTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(34,197,94,0.018)",
  },

  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "32%",
  },

  centerShade: {
    position: "absolute",
    top: "24%",
    left: 0,
    right: 0,
    height: "30%",
  },

  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "52%",
  },

  leftSideTint: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "38%",
  },

  rightSideTint: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "38%",
  },

  vignette: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    flex: 1,
  },
});
