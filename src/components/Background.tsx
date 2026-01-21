import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { theme } from "@/src/constants/theme";

interface BackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
  overlayOpacity?: number; // 0..1
}

export default function Background({
  imageUrl,
  children,
  overlayOpacity = 0.85,
}: BackgroundProps) {
  const clamped = Math.max(0, Math.min(1, overlayOpacity));

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: imageUrl }} style={styles.image} resizeMode="cover">
        <View style={[styles.overlay, { opacity: clamped }]} />
        {children}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgb(10, 14, 26)",
  },
});
