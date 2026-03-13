import React, { useMemo } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/src/constants/theme";
import {
  type BackgroundPattern,
  type BackgroundSource,
  type BackgroundSpec,
  isBackgroundSpec,
} from "@/src/constants/backgrounds";

type Props = {
  children?: React.ReactNode;
  imageSource?: BackgroundSource | ImageSourcePropType | { uri: string } | string | null;
  imageUrl?: string | ImageSourcePropType | { uri: string } | null;
  overlayOpacity?: number;
  topShadeOpacity?: number;
  bottomShadeOpacity?: number;
  centerShadeOpacity?: number;
};

function GlowLayer({
  color,
  opacity,
  style,
}: {
  color: string;
  opacity: number;
  style?: any;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        style,
        {
          backgroundColor: color,
          opacity,
        },
      ]}
    />
  );
}

function PatternOverlay({ pattern }: { pattern: BackgroundPattern }) {
  if (pattern === "none") return null;

  if (pattern === "pitch") {
    return (
      <View pointerEvents="none" style={styles.patternWrap}>
        <View style={styles.pitchLineTop} />
        <View style={styles.pitchLineBottom} />
        <View style={styles.pitchCircle} />
        <View style={styles.pitchHalfway} />
      </View>
    );
  }

  if (pattern === "routes") {
    return (
      <View pointerEvents="none" style={styles.patternWrap}>
        <View style={[styles.routeArc, styles.routeArcA]} />
        <View style={[styles.routeArc, styles.routeArcB]} />
        <View style={[styles.routeArc, styles.routeArcC]} />
        <View style={[styles.routeDot, { top: "19%", left: "18%" }]} />
        <View style={[styles.routeDot, { top: "28%", right: "22%" }]} />
        <View style={[styles.routeDot, { bottom: "26%", left: "28%" }]} />
      </View>
    );
  }

  if (pattern === "grid") {
    return (
      <View pointerEvents="none" style={styles.patternWrap}>
        <View style={[styles.gridLineV, { left: "18%" }]} />
        <View style={[styles.gridLineV, { left: "50%" }]} />
        <View style={[styles.gridLineV, { left: "82%" }]} />
        <View style={[styles.gridLineH, { top: "22%" }]} />
        <View style={[styles.gridLineH, { top: "50%" }]} />
        <View style={[styles.gridLineH, { top: "78%" }]} />
      </View>
    );
  }

  if (pattern === "vault") {
    return (
      <View pointerEvents="none" style={styles.patternWrap}>
        <View style={[styles.ticketRect, { top: "15%", left: "9%" }]} />
        <View style={[styles.ticketRect, { top: "48%", right: "10%" }]} />
        <View style={[styles.ticketRectSmall, { top: "28%", right: "18%" }]} />
        <View style={[styles.ticketRectSmall, { bottom: "18%", left: "17%" }]} />
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={styles.patternWrap}>
      <View style={[styles.calmBlob, styles.calmBlobA]} />
      <View style={[styles.calmBlob, styles.calmBlobB]} />
    </View>
  );
}

function BrandSpecSurface({
  spec,
  children,
  overlayOpacity,
}: {
  spec: BackgroundSpec;
  children?: React.ReactNode;
  overlayOpacity: number;
}) {
  const topGlowOpacity = spec.topGlowOpacity ?? 0.14;
  const centerGlowOpacity = spec.centerGlowOpacity ?? 0.08;
  const bottomShadeOpacity = spec.bottomShadeOpacity ?? 0.24;
  const grainOpacity = spec.grainOpacity ?? 0.025;

  return (
    <View style={styles.root}>
      <LinearGradient colors={spec.colors} style={styles.image}>
        <GlowLayer
          color={spec.topGlowColor}
          opacity={topGlowOpacity}
          style={styles.topGlow}
        />

        {spec.centerGlowColor ? (
          <GlowLayer
            color={spec.centerGlowColor}
            opacity={centerGlowOpacity}
            style={styles.centerGlow}
          />
        ) : null}

        <PatternOverlay pattern={spec.pattern} />

        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.00)", `rgba(0,0,0,${bottomShadeOpacity})`]}
          locations={[0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.bottomShade}
        />

        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: "#FFFFFF",
              opacity: grainOpacity,
            },
          ]}
        />

        {overlayOpacity > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.overlay,
              { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
            ]}
          />
        ) : null}

        <View style={styles.content}>{children}</View>
      </LinearGradient>
    </View>
  );
}

export default function Background({
  children,
  imageSource = null,
  imageUrl = null,
  overlayOpacity = 0,
  topShadeOpacity = 0.34,
  bottomShadeOpacity = 0.5,
  centerShadeOpacity = 0.04,
}: Props) {
  const resolved = useMemo<
    | { mode: "spec"; spec: BackgroundSpec }
    | { mode: "image"; source: ImageSourcePropType | { uri: string } }
    | { mode: "empty" }
  >(() => {
    if (imageSource && isBackgroundSpec(imageSource as BackgroundSource)) {
      return { mode: "spec", spec: imageSource as BackgroundSpec };
    }

    if (typeof imageUrl === "string" && imageUrl.trim()) {
      return { mode: "image", source: { uri: imageUrl } };
    }

    if (imageUrl && typeof imageUrl === "object") {
      return { mode: "image", source: imageUrl };
    }

    if (typeof imageSource === "string" && imageSource.trim()) {
      return { mode: "image", source: { uri: imageSource } };
    }

    if (imageSource && typeof imageSource === "object") {
      return { mode: "image", source: imageSource as ImageSourcePropType };
    }

    return { mode: "empty" };
  }, [imageSource, imageUrl]);

  if (resolved.mode === "spec") {
    return (
      <BrandSpecSurface spec={resolved.spec} overlayOpacity={overlayOpacity}>
        {children}
      </BrandSpecSurface>
    );
  }

  if (resolved.mode === "empty") {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.bgBase }]}>
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={resolved.source} resizeMode="cover" style={styles.image}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            `rgba(0,0,0,${topShadeOpacity})`,
            "rgba(0,0,0,0.10)",
            "rgba(0,0,0,0.00)",
          ]}
          locations={[0, 0.42, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topShade}
        />

        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(0,0,0,0.00)",
            `rgba(0,0,0,${centerShadeOpacity})`,
            "rgba(0,0,0,0.00)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.centerShade}
        />

        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0.02)", `rgba(0,0,0,${bottomShadeOpacity})`]}
          locations={[0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.bottomShade}
        />

        {overlayOpacity > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.overlay,
              { backgroundColor: `rgba(0,0,0,${overlayOpacity})` },
            ]}
          />
        ) : null}

        <View style={styles.content}>{children}</View>
      </ImageBackground>
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
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    flex: 1,
  },

  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "38%",
  },

  centerShade: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },

  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "46%",
  },

  topGlow: {
    top: "-8%",
    left: "-18%",
    right: "-18%",
    height: "34%",
    borderRadius: 999,
  },

  centerGlow: {
    top: "24%",
    left: "-10%",
    right: "-10%",
    height: "24%",
    borderRadius: 999,
  },

  patternWrap: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },

  pitchLineTop: {
    position: "absolute",
    top: "14%",
    left: "7%",
    right: "7%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  pitchLineBottom: {
    position: "absolute",
    bottom: "15%",
    left: "7%",
    right: "7%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  pitchHalfway: {
    position: "absolute",
    top: "22%",
    bottom: "22%",
    left: "50%",
    width: 1,
    marginLeft: -0.5,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  pitchCircle: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    top: "34%",
    left: "50%",
    marginLeft: -90,
    marginTop: -90,
  },

  routeArc: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    backgroundColor: "transparent",
  },

  routeArcA: {
    width: 360,
    height: 360,
    top: "-4%",
    right: "-28%",
  },

  routeArcB: {
    width: 260,
    height: 260,
    top: "36%",
    left: "-18%",
  },

  routeArcC: {
    width: 420,
    height: 420,
    bottom: "-18%",
    right: "-34%",
  },

  routeDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.26)",
  },

  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  ticketRect: {
    position: "absolute",
    width: 220,
    height: 92,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.015)",
  },

  ticketRectSmall: {
    position: "absolute",
    width: 150,
    height: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.01)",
  },

  calmBlob: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  calmBlobA: {
    width: 240,
    height: 240,
    top: "-4%",
    right: "-18%",
  },

  calmBlobB: {
    width: 200,
    height: 200,
    bottom: "-2%",
    left: "-10%",
  },
});
