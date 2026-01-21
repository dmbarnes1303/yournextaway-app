
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@/src/constants/theme';
import { IconSymbol } from '@/components/IconSymbol';

interface ListRowProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

export default function ListRow({ title, subtitle, onPress, showChevron = true }: ListRowProps) {
  const content = (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {showChevron && (
        <IconSymbol
          ios_icon_name="chevron.right"
          android_material_icon_name="chevron-right"
          size={20}
          color={theme.colors.textTertiary}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
