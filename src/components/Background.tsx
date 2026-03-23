// src/components/Background.tsx
import React, { useMemo } from "react";
import { ImageBackground, StyleSheet, View, type ImageSourcePropType } from "react-native";

type Props = {
  imageSource?: ImageSourcePropType;
  imageUrl?: string | null;
  children: React.ReactNode;
  mode?: "image" | "solid";
  solidColor?: string;
  overlayOpacity?: number;
  topShadeOpacity?: number;
  centerShadeOpacity?: number;
  bottomShadeOpacity?: number;
};

export default function Background({
  imageSource,
  imageUrl,
  children,
  mode = "image",
  solidColor = "#07090B",
  overlayOpacity = 0.5,
  topShadeOpacity = 0.16,
  centerShadeOpacity = 0.06,
  bottomShadeOpacity = 0.22,
}: Props) {
  const resolvedSource = useMemo<ImageSourcePropType | undefined>(() => {
    const cleanUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";
    if (cleanUrl) return { uri: cleanUrl };
    return imageSource;
  }, [imageSource, imageUrl]);

  if (mode === "solid" || !resolvedSource) {
    return <View style={[styles.container, { backgroundColor: solidColor }]}>{children}</View>;
  }

  return (
    <ImageBackground source={resolvedSource} style={styles.container} resizeMode="cover">
      <View
        pointerEvents="none"
        style={[styles.baseOverlay, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]}
      />

      {topShadeOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={[styles.topShade, { backgroundColor: `rgba(0,0,0,${topShadeOpacity})` }]}
        />
      ) : null}

      {centerShadeOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={[styles.centerShade, { backgroundColor: `rgba(0,0,0,${centerShadeOpacity})` }]}
        />
      ) : null}

      {bottomShadeOpacity > 0 ? (
        <View
          pointerEvents="none"
          style={[styles.bottomShade, { backgroundColor: `rgba(0,0,0,${bottomShadeOpacity})` }]}
        />
      ) : null}

      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  baseOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "34%",
  },

  centerShade: {
    position: "absolute",
    top: "24%",
    left: 0,
    right: 0,
    height: "28%",
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
