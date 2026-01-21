
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Background from '@/src/components/Background';
import GlassCard from '@/src/components/GlassCard';
import ListRow from '@/src/components/ListRow';
import Divider from '@/src/components/Divider';
import { getBackground } from '@/src/constants/backgrounds';
import { theme } from '@/src/constants/theme';

export default function ProfileScreen() {
  const handleSettingsPress = () => {
    console.log('User tapped Settings');
  };

  const handlePreferencesPress = () => {
    console.log('User tapped Preferences');
  };

  const handleAboutPress = () => {
    console.log('User tapped About');
  };

  return (
    <Background imageUrl={getBackground('profile')}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account</Text>
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Football Fan</Text>
              <Text style={styles.profileEmail}>fan@yournextaway.com</Text>
            </View>
          </GlassCard>

          <View style={styles.section}>
            <ListRow
              title="Settings"
              subtitle="App preferences and configuration"
              onPress={handleSettingsPress}
            />
            <ListRow
              title="Preferences"
              subtitle="Customize your experience"
              onPress={handlePreferencesPress}
            />
            <Divider />
            <ListRow
              title="About"
              subtitle="App version and information"
              onPress={handleAboutPress}
            />
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
    marginBottom: theme.spacing.lg,
  },
  profileInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  profileName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  profileEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    marginTop: theme.spacing.md,
  },
});
