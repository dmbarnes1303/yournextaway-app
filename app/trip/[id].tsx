
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import Background from '@/src/components/Background';
import GlassCard from '@/src/components/GlassCard';
import { getBackground } from '@/src/constants/backgrounds';
import { theme } from '@/src/constants/theme';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <Background imageUrl={getBackground('trips')}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Trip Details',
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <GlassCard>
            <Text style={styles.text}>Trip ID: {id}</Text>
            <Text style={styles.subtext}>Trip details will be displayed here</Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  text: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
});
