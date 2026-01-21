
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/src/constants/theme';

interface ChipProps {
  label: string;
  variant?: 'default' | 'primary' | 'success';
}

export default function Chip({ label, variant = 'default' }: ChipProps) {
  const variantStyle = variant === 'primary' 
    ? styles.chipPrimary 
    : variant === 'success'
    ? styles.chipSuccess
    : styles.chipDefault;

  const textVariantStyle = variant === 'primary'
    ? styles.textPrimary
    : variant === 'success'
    ? styles.textSuccess
    : styles.textDefault;

  return (
    <View style={[styles.chip, variantStyle]}>
      <Text style={[styles.text, textVariantStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  chipDefault: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  chipPrimary: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  chipSuccess: {
    backgroundColor: `${theme.colors.success}20`,
  },
  text: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  textDefault: {
    color: theme.colors.textSecondary,
  },
  textPrimary: {
    color: theme.colors.primary,
  },
  textSuccess: {
    color: theme.colors.success,
  },
});
