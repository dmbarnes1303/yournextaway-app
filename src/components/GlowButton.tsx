
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '@/src/constants/theme';

interface GlowButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary';
}

export default function GlowButton({ 
  title, 
  onPress, 
  style, 
  textStyle,
  variant = 'primary' 
}: GlowButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.text,
        isPrimary ? styles.textPrimary : styles.textSecondary,
        textStyle,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  text: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
  textPrimary: {
    color: theme.colors.background,
  },
  textSecondary: {
    color: theme.colors.primary,
  },
});
