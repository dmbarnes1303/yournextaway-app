// src/components/Background.tsx

import React from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from "react-native";
import { theme } from "@/src/constants/theme";

interface BackgroundProps {
  /** For local assets: require("...") etc */
  imageSource?: ImageSourcePropType;

  /** For remote images: https://... */
  imageUrl?: string;

  children: React.ReactNode;

  /**
   * 0..1
   * Higher = darker.
   */
  overlayOpacity?: number;
}

/**
 * Background
 *
 * - Optional image
 * - Black overlay for readability
 * - Foreground content above
 *
 * Background layer never steals touches.
 */
export default function Background({
  imageSource,
  imageUrl,
  children,
  overlayOpacity = 0.85,
}: BackgroundProps) {
  const clamped = Math.max(0, Math.min(1, overlayOpacity));

  const source: ImageSourcePropType | null =
    imageSource ?? (imageUrl ? { uri: imageUrl } : null);

  return (
    <View style={styles.root}>
      {/* Background layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {source ? (
          <ImageBackground source={source} style={styles.image} resizeMode="cover">
            <View style={[styles.overlay, { opacity: clamped }]} />
          </ImageBackground>
        ) : (
          <View style={[styles.overlay, { opacity: clamped }]} />
        )}
      </View>

      {/* Foreground */}
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
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
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
  },
});
