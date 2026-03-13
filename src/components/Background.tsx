import React, { useMemo } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/src/constants/theme";
import {
  type BackgroundSource,
  type BackgroundSpec,
  isBackgroundSpec,
} from "@/src/constants/backgrounds";

type Props = {
  children?: React.ReactNode;
  imageSource?: BackgroundSource | ImageSourcePropType | { uri: string } | string | null;
  imageUrl?: string | ImageSourcePropType | { uri: string } | null;
  overlayOpacity?: number;
  topShadeOpacity?: number;
  bottomShadeOpacity?: number;
  centerShadeOpacity?: number;
};

function BrandSpecSurface({
  spec,
  children,
  overlayOpacity,
}: {
  spec: BackgroundSpec;
  children?: React.ReactNode;
  overlayOpacity: number;
}) {
  const topTintOpacity = spec.topTintOpacity ?? 0.08;
  const focalTintOpacity = spec.focalTintOpacity ?? 0.06;
  const bottomShadeOpacity = spec.bottomShadeOpacity ?? 0.28;
  const vignetteOpacity = spec.vignetteOpacity ?? 0.18;

  const horizontalTint =
    spec.focalTintPosition === "left"
      ? ["rgba(0,0,0,0.00)", `${hexToRgba(spec.focalTintColor ?? "#000000", focalTintOpacity)}`, "rgba(0,0,0,0.00)"]
      : spec.focalTintPosition === "right"
      ? ["rgba(0,0,0,0.00)", `${hexToRgba(spec.focalTintColor ?? "#000000", focalTintOpacity)}`, "rgba(0,0,0,0.00)"]
      : ["rgba(0,0,0,0.00)", `${hexToRgba(spec.focalTintColor ?? "#000000", focalTintOpacity)}`, "rgba(0,0,0,0.00)"];

  const horizontalLocations =
    spec.focalTintPosition === "left"
      ? [0, 0.22, 0.58]
      : spec.focalTintPosition === "right"
      ? [0.42, 0.78, 1]
      : [0, 0.5, 1];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={spec.colors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.image}
      >
        <LinearGradient
          pointerEvents="none"
          colors={[
            hexToRgba(spec.topTintColor, topTintOpacity),
            hexToRgba(spec.topTintColor, topTintOpacity * 0.35),
            "rgba(0,0,0,0.00)",
          ]}
          locations={[0, 0.28, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topWash}
        />

        {spec.focalTintColor ? (
          <LinearGradient
            pointerEvents="none"
            colors={horizontalTint}
            locations={horizontalLocations}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.centerBand}
          />
        ) : null}

        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0.018)", "rgba(255,255,255,0.00)"]}
          locations={[0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.highlightWash}
        />

        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.00)", `rgba(0,0,0,${bottomShadeOpacity})`]}
          locations={[0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.bottomShade}
        />

        <View pointerEvents="none" style={[styles.edgeVignette, { opacity: vignetteOpacity }]} />

        {overlayOpacity > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.overlay,
              { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
            ]}
          />
        ) : null}

        <View style={styles.content}>{children}</View>
      </LinearGradient>
    </View>
  );
}

function hexToRgba(hex: string, opacity: number) {
  const clean = String(hex).replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  if ([r, g, b].some((v) => Number.isNaN(v))) {
    return `rgba(0,0,0,${opacity})`;
  }

  return `rgba(${r},${g},${b},${opacity})`;
}

export default function Background({
  children,
  imageSource = null,
  imageUrl = null,
  overlayOpacity = 0,
  topShadeOpacity = 0.34,
  bottomShadeOpacity = 0.5,
  centerShadeOpacity = 0.04,
}: Props) {
  const resolved = useMemo<
    | { mode: "spec"; spec: BackgroundSpec }
    | { mode: "image"; source: ImageSourcePropType | { uri: string } }
    | { mode: "empty" }
  >(() => {
    if (imageSource && isBackgroundSpec(imageSource as BackgroundSource)) {
      return { mode: "spec", spec: imageSource as BackgroundSpec };
    }

    if (typeof imageUrl === "string" && imageUrl.trim()) {
      return { mode: "image", source: { uri: imageUrl } };
    }

    if (imageUrl && typeof imageUrl === "object") {
      return { mode: "image", source: imageUrl };
    }

    if (typeof imageSource === "string" && imageSource.trim()) {
      return { mode: "image", source: { uri: imageSource } };
    }

    if (imageSource && typeof imageSource === "object") {
      return { mode: "image", source: imageSource as ImageSourcePropType };
    }

    return { mode: "empty" };
  }, [imageSource, imageUrl]);

  if (resolved.mode === "spec") {
    return (
      <BrandSpecSurface spec={resolved.spec} overlayOpacity={overlayOpacity}>
        {children}
      </BrandSpecSurface>
    );
  }

  if (resolved.mode === "empty") {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.bgBase }]}>
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={resolved.source} resizeMode="cover" style={styles.image}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            `rgba(0,0,0,${topShadeOpacity})`,
            "rgba(0,0,0,0.10)",
            "rgba(0,0,0,0.00)",
          ]}
          locations={[0, 0.42, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.imageTopShade}
        />

        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(0,0,0,0.00)",
            `rgba(0,0,0,${centerShadeOpacity})`,
            "rgba(0,0,0,0.00)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.imageCenterShade}
        />

        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.02)", `rgba(0,0,0,${bottomShadeOpacity})`]}
          locations={[0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.bottomShade}
        />

        {overlayOpacity > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.overlay,
              { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
            ]}
          />
        ) : null}

        <View style={styles.content}>{children}</View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },

  image: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    flex: 1,
  },

  topWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
  },

  centerBand: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  highlightWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "20%",
  },

  edgeVignette: {
    ...StyleSheet.absoluteFillObject,
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderTopWidth: 10,
    borderBottomWidth: 26,
    borderLeftColor: "rgba(0,0,0,0.22)",
    borderRightColor: "rgba(0,0,0,0.22)",
    borderTopColor: "rgba(0,0,0,0.10)",
    borderBottomColor: "rgba(0,0,0,0.28)",
  },

  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "46%",
  },

  imageTopShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "38%",
  },

  imageCenterShade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});
