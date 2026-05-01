// src/components/Input.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "@/src/constants/theme";

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onPressRight?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputWrapStyle?: StyleProp<ViewStyle>;
  variant?: "default" | "compact";
  allowClear?: boolean;
};

function alpha(hex: string, a: number) {
  const h = String(hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return `rgba(255,255,255,${Math.max(0, Math.min(1, a))})`;

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const clamped = Math.max(0, Math.min(1, a));

  return `rgba(${r},${g},${b},${clamped})`;
}

export default function Input({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  onPressRight,
  containerStyle,
  inputWrapStyle,
  variant = "default",
  allowClear = true,
  style,
  value,
  onChangeText,
  editable = true,
  placeholder,
  placeholderTextColor,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  const isCompact = variant === "compact";
  const showClear = allowClear && editable && !!value && String(value).length > 0;

  const borderColor = useMemo(() => {
    if (error) return alpha(theme.colors.error, 0.45);
    if (focused) return alpha(theme.colors.emerald, 0.45);
    return theme.colors.borderSubtle;
  }, [error, focused]);

  const backgroundColor = Platform.OS === "android" ? theme.glass.android.default : theme.glass.bg.default;
  const phColor = placeholderTextColor ?? theme.colors.textMuted;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputWrap,
          isCompact && styles.inputWrapCompact,
          { backgroundColor, borderColor },
          !editable && styles.disabled,
          inputWrapStyle,
        ]}
      >
        {leftIcon ? (
          <View style={styles.iconLeft}>
            <Ionicons name={leftIcon} size={18} color={theme.colors.textSecondary} />
          </View>
        ) : null}

        <TextInput
          value={value as any}
          onChangeText={onChangeText}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor={phColor}
          style={[
            styles.input,
            isCompact && styles.inputCompact,
            { color: theme.colors.textPrimary },
            style as any,
          ]}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          selectionColor={alpha(theme.colors.emerald, 0.7)}
          autoCapitalize={rest.autoCapitalize ?? "none"}
          autoCorrect={rest.autoCorrect ?? false}
          {...rest}
        />

        {showClear ? (
          <Pressable
            onPress={() => onChangeText?.("")}
            hitSlop={10}
            style={({ pressed }) => [styles.iconRightBtn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
          </Pressable>
        ) : rightIcon ? (
          <Pressable
            onPress={onPressRight}
            disabled={!onPressRight}
            hitSlop={10}
            style={({ pressed }) => [
              styles.iconRightBtn,
              pressed && onPressRight ? styles.pressed : null,
              !onPressRight ? styles.disabledIcon : null,
            ]}
            accessibilityRole="button"
          >
            <Ionicons name={rightIcon} size={18} color={theme.colors.textSecondary} />
          </Pressable>
        ) : (
          <View style={styles.iconRightSpacer} />
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },

  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    fontWeight: theme.fontWeight.semibold,
    marginBottom: 8,
    letterSpacing: 0.2,
  },

  inputWrap: {
    minHeight: 48,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  inputWrapCompact: { minHeight: 44 },

  iconLeft: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  input: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: 0.1,
  },

  inputCompact: { fontSize: theme.fontSize.meta },

  iconRightBtn: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.pill,
    alignItems: "center",
    justifyContent: "center",
  },

  iconRightSpacer: {
    width: 34,
    height: 34,
  },

  hint: {
    marginTop: 8,
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    lineHeight: 16,
  },

  error: {
    marginTop: 8,
    color: theme.colors.error,
    fontSize: theme.fontSize.tiny,
    lineHeight: 16,
    fontWeight: theme.fontWeight.medium,
  },

  disabled: { opacity: 0.7 },
  disabledIcon: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
});
