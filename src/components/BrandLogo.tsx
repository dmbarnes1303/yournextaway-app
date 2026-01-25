import React from "react";
import { Image, StyleSheet, View, type ImageSourcePropType, type ViewStyle } from "react-native";
import { theme } from "@/src/constants/theme";

type Props = {
  /**
   * Either:
   * - local: require("...")  (recommended)
   * - remote: { uri: "https://..." }
   */
  source: ImageSourcePropType;
  size?: number;
  style?: ViewStyle;
  /**
   * Optional: adds a subtle “badge” backing so it reads on busy photos.
   */
  badge?: boolean;
};

export default function BrandLogo({ source, size = 44, style, badge = true }: Props) {
  return (
    <View style={[styles.wrap, badge && styles.badge, { width: size + 18, height: size + 18 }, style]}>
      <Image source={source} style={{ width: size, height: size, resizeMode: "contain" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
