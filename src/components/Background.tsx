import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

type Props = {
  imageSource: any;
  overlayOpacity?: number;
  topShadeOpacity?: number;
  centerShadeOpacity?: number;
  bottomShadeOpacity?: number;
  children: React.ReactNode;
};

export default function Background({
  imageSource,
  overlayOpacity = 0.52,
  topShadeOpacity = 0.18,
  centerShadeOpacity = 0,
  bottomShadeOpacity = 0.26,
  children,
}: Props) {
  return (
    <ImageBackground source={imageSource} style={styles.container} resizeMode="cover">
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
