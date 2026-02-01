// src/components/Background.tsx

import React from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from "react-native";
import { theme } from "@/src/constants/theme";

type BackgroundProps = {
  /** Preferred: local assets (require("...")) */
  imageSource?: ImageSourcePropType;

  /** Optional: remote URL */
  imageUrl?: string;

  children: React.ReactNode;

  /** 0..1 (higher = darker) */
  overlayOpacity?: number;
};

/**
 * Background
 * - Optional image (local or remote)
 * - Black overlay for readability
 * - Foreground content above
 */
export default function Background({
  imageSource,
  imageUrl,
  children,
  overlayOpacity = 0.85,
}: BackgroundProps) {
  const clamped = Math.max(0, Math.min(1, overlayOpacity));

  // Harden against accidental misuse:
  // Some screens passed require(...) into imageUrl, which becomes a number at runtime.
  const urlIsString = typeof imageUrl === "string" && imageUrl.trim().length > 0;

  const source: ImageSourcePropType | null =
    imageSource ??
    // If someone incorrectly passes require(...) into imageUrl, treat it as imageSource.
    ((typeof imageUrl === "number" ? (imageUrl as unknown as ImageSourcePropType) : null) ??
      (urlIsString ? ({ uri: imageUrl.trim() } as const) : null));

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {source ? (
          <ImageBackground source={source} style={styles.image} resizeMode="cover">
            <View style={[styles.overlay, { opacity: clamped }]} />
          </ImageBackground>
        ) : (
          <View style={[styles.overlay, { opacity: clamped }]} />
        )}
      </View>

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
