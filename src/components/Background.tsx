// src/components/Background.tsx
import React, { useMemo } from "react";
import { ImageBackground, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/src/constants/theme";

type Props = {
  children?: React.ReactNode;

  /**
   * Backwards compatibility:
   * - Some screens pass imageSource (ImageSourcePropType)
   * - Some screens pass imageUrl (string)
   *
   * Prefer imageUrl going forward (remote, crisp).
   */
  imageSource?: ImageSourcePropType | { uri: string } | null;
  imageUrl?: string | null;

  /**
   * Extra dimming layer (kept for legacy usage).
   * Use sparingly; the primary readability comes from top/bottom gradients.
   */
  overlayOpacity?: number;

  /**
   * Fine control: top and bottom gradient strength.
   * Defaults match the v2 spec: readable without blur.
   */
  topShadeOpacity?: number;    // e.g. 0.70
  bottomShadeOpacity?: number; // e.g. 0.85
};

export default function Background({
  children,
  imageSource = null,
  imageUrl = null,
  overlayOpacity = 0,
  topShadeOpacity = 0.70,
  bottomShadeOpacity = 0.85,
}: Props) {
  const resolvedSource = useMemo<ImageSourcePropType | { uri: string } | null>(() => {
    if (imageUrl && typeof imageUrl === "string") return { uri: imageUrl };
    if (imageSource) return imageSource;
    return null;
  }, [imageSource, imageUrl]);

  // If no image is provided, use matte base background (still premium).
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
        {/* Top shade */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            `rgba(0,0,0,${topShadeOpacity})`,
            "rgba(0,0,0,0)",
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topShade}
        />

        {/* Bottom shade */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(0,0,0,0)",
            `rgba(0,0,0,${bottomShadeOpacity})`,
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.bottomShade}
        />

        {/* Optional uniform overlay (legacy knob) */}
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

  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
  },

  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
  },

  content: {
    flex: 1,
  },
});
