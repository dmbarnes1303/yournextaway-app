import React from "react";
import { ImageBackground, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { theme } from "@/src/constants/theme";

type BackgroundProps = {
  imageSource?: ImageSourcePropType;
  imageUrl?: string;
  children: React.ReactNode;
  overlayOpacity?: number; // 0..1 (higher = darker)
};

export default function Background({
  imageSource,
  imageUrl,
  children,
  overlayOpacity = 0.85,
}: BackgroundProps) {
  const clamped = Math.max(0, Math.min(1, overlayOpacity));

  const urlIsString = typeof imageUrl === "string" && imageUrl.trim().length > 0;

  // If someone incorrectly passes require(...) into imageUrl, it's a number at runtime.
  const source: ImageSourcePropType | null =
    imageSource ??
    (typeof (imageUrl as any) === "number"
      ? ((imageUrl as unknown) as ImageSourcePropType)
      : urlIsString
      ? ({ uri: imageUrl.trim() } as const)
      : null);

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
  root: { flex: 1, backgroundColor: theme.colors.bgBase },
  image: { flex: 1, width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000" },
  content: { flex: 1 },
});
