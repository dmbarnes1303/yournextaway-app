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

  if (isBackgroundSpec(imageSource)) {
    return null;
  }

  return imageSource as ImageSourcePropType;
}

function getSpec(source?: BackgroundSource): BackgroundSpec | null {
  if (!source) return null;
  return isBackgroundSpec(source) ? source : null;
}

export default function Background({
  imageSource,
  imageUrl,
  children,
  mode = "image",
  solidColor = "#07090B",
  overlayOpacity = 0.5,
  topShadeOpacity = 0.16,
  centerShadeOpacity = 0.06,
  bottomShadeOpacity = 0.22,
}: Props) {
  const resolvedSource = useMemo(
    () => resolveImageSource(imageSource, imageUrl),
    [imageSource, imageUrl]
  );

  const spec = useMemo(() => getSpec(imageSource), [imageSource]);

  const resolvedSolidColor = spec?.colors?.[0] || solidColor;
  const resolvedTopShadeOpacity =
    spec?.topTintOpacity ?? topShadeOpacity;
  const resolvedBottomShadeOpacity =
    spec?.bottomShadeOpacity ?? bottomShadeOpacity;
  const resolvedCenterShadeOpacity = centerShadeOpacity;
  const vignetteOpacity = spec?.vignetteOpacity ?? 0.1;

  const sideTintColor = spec?.sideTintColor ?? null;
  const sideTintOpacity = spec?.sideTintOpacity ?? 0;
  const sideTintSide = spec?.sideTintSide ?? "both";

  if (mode === "solid" || (!resolvedSource && !spec)) {
    return (
      <View style={[styles.container, { backgroundColor: resolvedSolidColor }]}>
        {children}
      </View>
    );
  }

  if (!resolvedSource && spec) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: spec.colors[0],
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.gradientLayer,
            {
              backgroundColor: spec.colors[1],
              opacity: 0.34,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.bottomGradientLayer,
            {
              backgroundColor: spec.colors[2],
              opacity: 0.42,
            },
          ]}
        />

        <View
          pointerEvents="none"
          style={[
            styles.baseOverlay,
            { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
          ]}
        />

        {resolvedTopShadeOpacity > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.topShade,
              {
                backgroundColor: spec.topTintColor
                  ? hexToRgba(spec.topTintColor, resolvedTopShadeOpacity)
                  : `rgba(0,0,0,${resolvedTopShadeOpacity})`,
              },
            ]}
          />
        ) : null}

        {resolvedCenterShadeOpacity > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.centerShade,
              {
                backgroundColor: `rgba(0,0,0,${resolvedCenterShadeOpacity})`,
              },
            ]}
          />
        ) : null}

        {resolvedBottomShadeOpacity > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.bottomShade,
              {
                backgroundColor: `rgba(0,0,0,${resolvedBottomShadeOpacity})`,
              },
            ]}
          />
        ) : null}

        {sideTintColor && sideTintOpacity > 0 ? (
          <>
            {(sideTintSide === "left" || sideTintSide === "both") && (
              <View
                pointerEvents="none"
                style={[
                  styles.leftSideTint,
                  {
                    backgroundColor: hexToRgba(sideTintColor, sideTintOpacity),
                  },
                ]}
              />
            )}

            {(sideTintSide === "right" || sideTintSide === "both") && (
              <View
                pointerEvents="none"
                style={[
                  styles.rightSideTint,
                  {
                    backgroundColor: hexToRgba(sideTintColor, sideTintOpacity),
                  },
                ]}
              />
            )}
          </>
        ) : null}

        {vignetteOpacity > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.vignette,
              {
                backgroundColor: `rgba(0,0,0,${vignetteOpacity})`,
              },
            ]}
          />
        ) : null}

        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <ImageBackground source={resolvedSource!} style={styles.container} resizeMode="cover">
      <View
        pointerEvents="none"
        style={[
          styles.baseOverlay,
          { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
        ]}
      />

      {resolvedTopShadeOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.topShade,
            {
              backgroundColor: spec?.topTintColor
                ? hexToRgba(spec.topTintColor, resolvedTopShadeOpacity)
                : `rgba(0,0,0,${resolvedTopShadeOpacity})`,
            },
          ]}
        />
      ) : null}

      {resolvedCenterShadeOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.centerShade,
            {
              backgroundColor: `rgba(0,0,0,${resolvedCenterShadeOpacity})`,
            },
          ]}
        />
      ) : null}

      {resolvedBottomShadeOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.bottomShade,
            {
              backgroundColor: `rgba(0,0,0,${resolvedBottomShadeOpacity})`,
            },
          ]}
        />
      ) : null}

      {sideTintColor && sideTintOpacity > 0 ? (
        <>
          {(sideTintSide === "left" || sideTintSide === "both") && (
            <View
              pointerEvents="none"
              style={[
                styles.leftSideTint,
                {
                  backgroundColor: hexToRgba(sideTintColor, sideTintOpacity),
                },
              ]}
            />
          )}

          {(sideTintSide === "right" || sideTintSide === "both") && (
            <View
              pointerEvents="none"
              style={[
                styles.rightSideTint,
                {
                  backgroundColor: hexToRgba(sideTintColor, sideTintOpacity),
                },
              ]}
            />
          )}
        </>
      ) : null}

      {vignetteOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.vignette,
            {
              backgroundColor: `rgba(0,0,0,${vignetteOpacity})`,
            },
          ]}
        />
      ) : null}

      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const value = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return `rgba(0,0,0,${alpha})`;
  }

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },

  bottomGradientLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: "35%",
  },

  baseOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "34%",
  },

  centerShade: {
    position: "absolute",
    top: "24%",
    left: 0,
    right: 0,
    height: "28%",
  },

  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
  },

  leftSideTint: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "36%",
  },

  rightSideTint: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "36%",
  },

  vignette: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    flex: 1,
  },
});
