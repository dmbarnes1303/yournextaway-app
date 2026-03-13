import React, { useMemo } from "react";
import { ImageBackground, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/src/constants/theme";

type Props = {
  children?: React.ReactNode;
  imageSource?: ImageSourcePropType | { uri: string } | string | null;
  imageUrl?: string | ImageSourcePropType | { uri: string } | null;

  /**
   * Extra full-screen darkening layer.
   * Keep this low. If a screen needs heavy readability help,
   * tune the top/bottom shades first.
   */
  overlayOpacity?: number;

  /**
   * Per-screen shade controls.
   * These defaults are intentionally balanced, not extreme.
   */
  topShadeOpacity?: number;
  bottomShadeOpacity?: number;
  centerShadeOpacity?: number;

  /**
   * Optional subtle colour wash to stop the background feeling flat.
   * Use tiny values only.
   */
  tintOpacity?: number;
};

export default function Background({
  children,
  imageSource = null,
  imageUrl = null,
  overlayOpacity = 0,
  topShadeOpacity = 0.34,
  bottomShadeOpacity = 0.42,
  centerShadeOpacity = 0.04,
  tintOpacity = 0.10,
}: Props) {
  const resolvedSource = useMemo<ImageSourcePropType | { uri: string } | null>(() => {
    if (typeof imageUrl === "string" && imageUrl.trim()) return { uri: imageUrl };
    if (imageUrl && typeof imageUrl === "object") return imageUrl;

    if (typeof imageSource === "string" && imageSource.trim()) return { uri: imageSource };
    if (imageSource) return imageSource;

    return null;
  }, [imageSource, imageUrl]);

  if (!resolvedSource) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.bgBase }]}>
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={resolvedSource} resizeMode="cover" style={styles.image}>
        <View
          pointerEvents="none"
          style={[
            styles.tint,
            {
              backgroundColor: `rgba(6,10,14,${tintOpacity})`,
            },
          ]}
        />

        <LinearGradient
          pointerEvents="none"
          colors={[
            `rgba(0,0,0,${topShadeOpacity})`,
            "rgba(0,0,0,0.14)",
            "rgba(0,0,0,0.02)",
          ]}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topShade}
        />

        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(0,0,0,0.01)",
            `rgba(0,0,0,${centerShadeOpacity})`,
            "rgba(0,0,0,0.01)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.centerShade}
        />

        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(0,0,0,0.03)",
            `rgba(0,0,0,${bottomShadeOpacity})`,
          ]}
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

  tint: {
    ...StyleSheet.absoluteFillObject,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "38%",
  },

  centerShade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "42%",
  },

  content: {
    flex: 1,
  },
});
