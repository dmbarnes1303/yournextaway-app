// components/LoadingButton.tsx
import React from "react";
import type { TextStyle, ViewStyle } from "react-native";
import Button from "@/src/components/Button";

/**
 * Legacy template adapter.
 * Keeps the old API but routes visuals through v2 Button.
 */

interface LoadingButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  style?: ViewStyle;
  textStyle?: TextStyle;
  loadingColor?: string; // kept for compatibility; ignored (v2 handles this)
}

export function LoadingButton({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
  textStyle,
}: LoadingButtonProps) {
  const tone = variant === "primary" ? "primary" : "secondary";

  return (
    <Button
      onPress={onPress}
      label={title}
      loading={loading}
      disabled={disabled}
      tone={tone}
      size="md"
      style={style}
      textStyle={textStyle}
      glow={variant === "primary"}
    />
  );
}
