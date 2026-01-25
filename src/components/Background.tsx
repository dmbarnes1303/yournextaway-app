// src/components/Background.tsx
import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { theme } from "@/src/constants/theme";

interface BackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
  overlayOpacity?: number; // 0..1
  /**
   * Optional: lets a specific screen slightly bias the overlay.
   * Default stays neutral-black.
   */
  overlayColor?: string;
}

/**
 * Touch-safe background wrapper:
 * - Background image + overlays can never steal touches.
 * - Neutral-black overlay avoids “blue wash” across the app.
 * - Subtle vignette improves legibility without killing the photo.
 */
export default function Background({
  imageUrl,
  children,
  overlayOpacity = 0.82,
  overlayColor,
}: BackgroundProps) {
  const clamped = Math.max(0, Math.min(1, overlayOpacity));

  // Neutral charcoal-black by default (NOT navy).
  const baseOverlay = overlayColor ?? "rgb(8, 8, 10)";

  return (
    <View style={styles.container}>
      {/* Non-interactive background layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ImageBackground source={{ uri: imageUrl }} style={styles.image} resizeMode="cover">
          {/* Base dark overlay */}
          <View style={[styles.overlay, { opacity: clamped, backgroundColor: baseOverlay }]} />

          {/* Vignette: darkens edges/top/bottom slightly so glass + text pop */}
          <View style={styles.vignetteOuter} />
          <View style={styles.vignetteTop} />
          <View style={styles.vignetteBottom} />
        </ImageBackground>
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
  },

  // Subtle edge vignette (neutral black). Kept low so it doesn't feel “muddy”.
  vignetteOuter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  vignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "rgba(0,0,0,0.30)",
  },

  // Content sits above the background; box-none ensures parent doesn't block children touches
  content: { flex: 1 },
});
