// src/components/GlowButton.tsx
import React from "react";
import type { TextStyle, ViewStyle } from "react-native";
import Button from "@/src/components/Button";

/**
 * V2: GlowButton is just a convenience wrapper.
 * - primary => v2 primary with controlled glow
 * - secondary => v2 secondary (outline-like)
 */
interface GlowButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
}

export default function GlowButton({
  title,
  onPress,
  style,
  textStyle,
  variant = "primary",
  disabled,
  loading,
}: GlowButtonProps) {
  const tone = variant === "primary" ? "primary" : "secondary";
  const glow = variant === "primary";

  return (
    <Button
      label={title}
      onPress={onPress}
      tone={tone}
      glow={glow}
      disabled={disabled}
      loading={loading}
      style={style}
      textStyle={textStyle}
    />
  );
}
