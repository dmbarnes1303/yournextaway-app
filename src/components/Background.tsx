// src/components/Background.tsx
import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { theme } from "@/src/constants/theme";

interface BackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
  overlayOpacity?: number; // 0..1
}

/**
 * Touch-safe background wrapper:
 * - Background image + overlay can never steal touches.
 * - Content is rendered in a separate layer above.
 */
export default function Background({ imageUrl, children, overlayOpacity = 0.85 }: BackgroundProps) {
  const clamped = Math.max(0, Math.min(1, overlayOpacity));

  return (
    <View style={styles.container}>
      {/* Non-interactive background layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ImageBackground source={{ uri: imageUrl }} style={styles.image} resizeMode="cover">
          <View style={[styles.overlay, { opacity: clamped }]} />
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
    backgroundColor: "rgb(10, 14, 26)",
  },

  // Content sits above the background; box-none ensures parent doesn't block children touches
  content: { flex: 1 },
});
