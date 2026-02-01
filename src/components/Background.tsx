import React from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/src/constants/theme";

type BackgroundProps = {
  imageSource?: ImageSourcePropType;
  imageUrl?: string;
  children: React.ReactNode;

  /** 0..1 (higher = darker). This multiplies the gradient strength. */
  overlayOpacity?: number;
};

/**
 * Background
 * - Image (local or remote)
 * - Premium readability overlay using gradients (not a flat black sheet)
 * - Vignette keeps text readable while letting the photo breathe
 */
export default function Background({
  imageSource,
  imageUrl,
  children,
  overlayOpacity = 0.85,
}: BackgroundProps) {
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  const o = clamp01(overlayOpacity);

  // Some screens might accidentally pass require(...) into imageUrl (number)
  const urlIsString = typeof imageUrl === "string" && imageUrl.trim().length > 0;

  const source: ImageSourcePropType | null =
    imageSource ??
    ((typeof imageUrl === "number"
      ? (imageUrl as unknown as ImageSourcePropType)
      : null) ??
      (urlIsString ? ({ uri: imageUrl.trim() } as const) : null));

  // Gradient strengths (scaled by overlayOpacity)
  const topA = clamp01(0.78 * o);     // strongest at top (status bar + hero)
  const midA = clamp01(0.46 * o);     // breathable middle
  const botA = clamp01(0.86 * o);     // strongest at bottom (tabs + CTAs)

  // Subtle vignette edge — stops bright corners from looking messy
  const edgeA = clamp01(0.38 * o);

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {source ? (
          <ImageBackground source={source} style={styles.image} resizeMode="cover">
            {/* Main readability gradient (top -> mid -> bottom) */}
            <LinearGradient
              colors={[
                `rgba(0,0,0,${topA})`,
                `rgba(0,0,0,${midA})`,
                `rgba(0,0,0,${botA})`,
              ]}
              locations={[0, 0.52, 1]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Edge vignette (very subtle) */}
            <LinearGradient
              colors={[
                `rgba(0,0,0,${edgeA})`,
                "rgba(0,0,0,0)",
                `rgba(0,0,0,${edgeA})`,
              ]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </ImageBackground>
        ) : (
          <View style={[styles.fallback, { opacity: o }]} />
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
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
  },
});
