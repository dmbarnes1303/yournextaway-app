
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '@/src/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export default function GlassCard({ children, style, intensity = 20 }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} style={styles.blur}>
        <View style={styles.content}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blur: {
    backgroundColor: 'rgba(26, 31, 46, 0.7)',
  },
  content: {
    padding: theme.spacing.md,
  },
});
