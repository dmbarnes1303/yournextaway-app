
import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/src/constants/theme';

interface BackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
  overlay?: boolean;
}

export default function Background({ imageUrl, children, overlay = true }: BackgroundProps) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      >
        {overlay && (
          <LinearGradient
            colors={[
              'rgba(10, 14, 26, 0.85)',
              'rgba(10, 14, 26, 0.92)',
              'rgba(10, 14, 26, 0.95)',
            ]}
            style={styles.gradient}
          />
        )}
        {children}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
});
