// src/components/Background.tsx
import React from "react";
import { ImageBackground, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { theme } from "@/src/constants/theme";

interface BackgroundProps {
  // Preferred (supports local require() and remote uri)
  imageSource?: ImageSourcePropType;

  // Legacy (remote URL string)
  imageUrl?: string;

  children: React.ReactNode;

  /**
   * Overlay darkness 0..1. Higher = darker.
   * Default matches your current app look.
   */
  overlayOpacity?: number;
}

/**
 * Touch-safe background wrapper:
 * - Background + overlay never steal touches.
 * - Supports local require() backgrounds and remote URLs.
 * - Overlay uses neutral black (no navy cast) to keep glass consistent.
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
    <View style={styles.container}>
      {/* Non-interactive background layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {source ? (
          <ImageBackground source={source} style={styles.image} resizeMode="cover">
            <View style={[styles.overlay, { opacity: clamped }]} />
          </ImageBackground>
        ) : (
          <View style={[styles.overlay, { opacity: clamped }]} />
        )}
      </View>

      {/* Interactive content layer */}
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  image: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlayBase,
  },
  content: { flex: 1 },
});
