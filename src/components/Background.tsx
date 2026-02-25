// src/components/Background.tsx
import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { theme } from "@/src/constants/theme";

type Props = {
  children?: React.ReactNode;
  imageSource?: any;
  /**
   * Overlay opacity:
   * landing: 0.55
   * default: 0.72
   * dense: 0.82
   * modal: 0.90
   */
  overlayOpacity?: number;
};

export default function Background({
  children,
  imageSource,
  overlayOpacity = 0.72,
}: Props) {
  return (
    <View style={styles.root}>
      {imageSource ? (
        <ImageBackground
          source={imageSource}
          resizeMode="cover"
          style={styles.image}
        >
          <View
            style={[
              styles.overlay,
              { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
            ]}
          />
          <View style={styles.content}>{children}</View>
        </ImageBackground>
      ) : (
        <View style={[styles.fallback, { backgroundColor: theme.colors.bgBase }]}>
          <View style={styles.content}>{children}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  image: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    flex: 1,
  },

  fallback: {
    flex: 1,
  },
});
