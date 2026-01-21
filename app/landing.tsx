
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Background from '@/src/components/Background';
import GlowButton from '@/src/components/GlowButton';
import { getBackground } from '@/src/constants/backgrounds';
import { theme } from '@/src/constants/theme';

export default function LandingScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    console.log('User tapped Get Started button');
    router.push('/onboarding');
  };

  return (
    <Background imageUrl={getBackground('landing')}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>YourNextAway</Text>
            <Text style={styles.subtitle}>
              Plan your football trips across Europe
            </Text>
            <Text style={styles.description}>
              Discover matches, explore cities, and experience the beautiful game
            </Text>
          </View>

          <View style={styles.footer}>
            <GlowButton
              title="Get Started"
              onPress={handleGetStarted}
              style={styles.button}
            />
          </View>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
});
