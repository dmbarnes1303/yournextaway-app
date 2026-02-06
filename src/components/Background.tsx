// src/components/Background.tsx
import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";

/**
 * Background (STRIPPED MODE)
 * Intentionally boring: no images, gradients, blur, or overlays.
 * This keeps the app usable while we lock routing/state.
 *
 * We keep the same prop names so nothing else breaks.
 */
type Props = {
  children: React.ReactNode;

  // kept for compatibility; ignored in stripped mode
  imageUrl?: string;
  imageSource?: any;

  // kept for compatibility
  overlay?: boolean;

  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function Background({ children, style, contentStyle }: Props) {
  return (
    <View style={[styles.root, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },
  content: {
    flex: 1,
  },
});
