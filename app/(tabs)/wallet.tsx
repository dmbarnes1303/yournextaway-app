
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Background from '@/src/components/Background';
import GlassCard from '@/src/components/GlassCard';
import EmptyState from '@/src/components/EmptyState';
import { getBackground } from '@/src/constants/backgrounds';
import { theme } from '@/src/constants/theme';

export default function WalletScreen() {
  return (
    <Background imageUrl={getBackground('wallet')}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Your tickets and passes</Text>
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card}>
            <EmptyState
              title="No tickets yet"
              message="Your match tickets will appear here"
            />
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  card: {
    minHeight: 200,
  },
});
