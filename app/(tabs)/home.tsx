
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Background from '@/src/components/Background';
import GlassCard from '@/src/components/GlassCard';
import SectionHeader from '@/src/components/SectionHeader';
import { getBackground } from '@/src/constants/backgrounds';
import { theme } from '@/src/constants/theme';

export default function HomeScreen() {
  return (
    <Background imageUrl={getBackground('home')}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>YourNextAway</Text>
            <Text style={styles.subtitle}>Plan your next football trip</Text>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Upcoming Matches" subtitle="Find your next game" />
            <GlassCard>
              <Text style={styles.cardText}>
                Browse fixtures across Europe and plan your trip
              </Text>
            </GlassCard>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Popular Destinations" subtitle="Top cities for football" />
            <GlassCard>
              <Text style={styles.cardText}>
                Explore cities with the best football atmosphere
              </Text>
            </GlassCard>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Your Trips" subtitle="Manage your plans" />
            <GlassCard>
              <Text style={styles.cardText}>
                No trips planned yet. Start planning your first trip!
              </Text>
            </GlassCard>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  cardText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});
