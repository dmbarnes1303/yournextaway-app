
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Background from '@/src/components/Background';
import GlowButton from '@/src/components/GlowButton';
import GlassCard from '@/src/components/GlassCard';
import { getBackground } from '@/src/constants/backgrounds';
import { theme } from '@/src/constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleContinue = () => {
    console.log('User tapped Continue button');
    router.replace('/(tabs)/home');
  };

  return (
    <Background imageUrl={getBackground('onboarding')}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to YourNextAway</Text>
            <Text style={styles.subtitle}>
              Your football travel companion
            </Text>
          </View>

          <View style={styles.features}>
            <GlassCard style={styles.featureCard}>
              <Text style={styles.featureTitle}>🏟️ Find Matches</Text>
              <Text style={styles.featureText}>
                Browse fixtures across European leagues and stadiums
              </Text>
            </GlassCard>

            <GlassCard style={styles.featureCard}>
              <Text style={styles.featureTitle}>🌍 Explore Cities</Text>
              <Text style={styles.featureText}>
                Discover what to see and do in each destination
              </Text>
            </GlassCard>

            <GlassCard style={styles.featureCard}>
              <Text style={styles.featureTitle}>✈️ Plan Trips</Text>
              <Text style={styles.featureText}>
                Organize your travel, tickets, and accommodation
              </Text>
            </GlassCard>
          </View>

          <View style={styles.footer}>
            <GlowButton
              title="Continue"
              onPress={handleContinue}
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  featureCard: {
    marginBottom: theme.spacing.md,
  },
  featureTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  footer: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
});
