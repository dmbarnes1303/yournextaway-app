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

function SoftTint({
  color,
  opacity,
  style,
}: {
  color: string;
  opacity: number;
  style?: any;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        style,
        {
          backgroundColor: color,
          opacity,
        },
      ]}
    />
  );
}

function FocalTint({
  color,
  opacity,
  position,
}: {
  color: string;
  opacity: number;
  position: "left" | "center" | "right";
}) {
  const baseStyle =
    position === "left"
      ? styles.focalLeft
      : position === "right"
      ? styles.focalRight
      : styles.focalCenter;

  return <SoftTint color={color} opacity={opacity} style={baseStyle} />;
}

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
  const focalTintOpacity = spec.focalTintOpacity ?? 0.08;
  const bottomShadeOpacity = spec.bottomShadeOpacity ?? 0.28;
  const vignetteOpacity = spec.vignetteOpacity ?? 0.22;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={spec.colors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.image}
      >
        <SoftTint color={spec.topTintColor} opacity={topTintOpacity} style={styles.topTint} />

        {spec.focalTintColor ? (
          <FocalTint
            color={spec.focalTintColor}
            opacity={focalTintOpacity}
            position={spec.focalTintPosition ?? "center"}
          />
        ) : null}

        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0.02)", "rgba(255,255,255,0.00)"]}
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

        <View pointerEvents="none" style={[styles.vignette, { opacity: vignetteOpacity }]} />

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

  topTint: {
    top: -20,
    left: -20,
    right: -20,
    height: "30%",
    borderRadius: 999,
  },

  focalCenter: {
    top: "18%",
    left: "-12%",
    right: "-12%",
    height: "42%",
    borderRadius: 999,
  },

  focalLeft: {
    top: "20%",
    left: "-20%",
    width: "78%",
    height: "44%",
    borderRadius: 999,
  },

  focalRight: {
    top: "18%",
    right: "-20%",
    width: "78%",
    height: "44%",
    borderRadius: 999,
  },

  highlightWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "26%",
  },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderColor: "rgba(0,0,0,0.0)",
    shadowColor: "#000",
    shadowOpacity: 1,
    shadowRadius: 80,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
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
