// components/button.tsx
import React from "react";
import type { TextStyle, ViewStyle } from "react-native";
import ButtonV2 from "@/src/components/Button";

/**
 * Legacy adapter.
 * Existing code imports from "@/components/button" and expects:
 * - variant: "filled" | "outline" | "ghost"
 * - size: "sm" | "md" | "lg"
 * - children (text)
 *
 * We map this to the new v2 Button system.
 */

type ButtonVariant = "filled" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  variant = "filled",
  size = "md",
  disabled = false,
  loading = false,
  children,
  style,
  textStyle,
}) => {
  const tone =
    variant === "filled" ? "primary" : variant === "outline" ? "secondary" : "ghost";

  return (
    <ButtonV2
      onPress={onPress}
      tone={tone}
      size={size}
      disabled={disabled}
      loading={loading}
      style={style}
      textStyle={textStyle}
    >
      {children}
    </ButtonV2>
  );
};

export default Button;
