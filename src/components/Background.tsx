import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

type Props = {
  imageSource: any;
  overlayOpacity?: number;
  children: React.ReactNode;
};

export default function Background({
  imageSource,
  overlayOpacity = 0.6,
  children,
}: Props) {
  return (
    <ImageBackground
      source={imageSource}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark overlay */}
      <View
        style={[
          styles.overlay,
          { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    flex: 1,
  },
});
