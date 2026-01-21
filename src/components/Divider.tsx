
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '@/src/constants/theme';

export default function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing.md,
  },
});
