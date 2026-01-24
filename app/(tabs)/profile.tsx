// app/(tabs)/profile.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

type RowProps = {
  title: string;
  subtitle?: string;
  onPress: () => void;
};

function Row({ title, subtitle, onPress }: RowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  // Tonight: keep it realistic. No auth yet, so present a clean “demo identity”.
  const displayName = useMemo(() => "Guest Traveller", []);
  const email = useMemo(() => "Not signed in", []);

  function comingSoon(title: string) {
    Alert.alert(title, "This is a preview build. That section isn’t wired up yet.");
  }

  function about() {
    Alert.alert(
      "About YourNextAway",
      "YourNextAway helps you plan short breaks around European football fixtures.\n\nIt’s built for neutral travellers exploring cities — not supporter culture."
    );
  }

  function sendFeedback() {
    Alert.alert(
      "Feedback",
      "Perfect — tell me what felt confusing or slow.\n\nFor now, just message me with:\n• what you searched\n• what you tapped\n• what you expected"
    );
  }

  return (
    <Background imageUrl={getBackground("profile")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Account, preferences, and app info</Text>
          </View>

          <GlassCard style={styles.card} intensity={22}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.meta}>{email}</Text>

            <View style={styles.divider} />

            <Text style={styles.blurbTitle}>What you’re testing</Text>
            <Text style={styles.blurb}>
              This is an early build. The core flow to test is: search → open fixtures/match → plan a trip → save it.
            </Text>
          </GlassCard>

          <GlassCard style={[styles.card, { padding: 0 }]} intensity={22}>
            <Row
              title="Preferences"
              subtitle="Search behaviour, date window defaults, and UI options"
              onPress={() => comingSoon("Preferences")}
            />
            <Row
              title="Notifications"
              subtitle="Price drops, fixture reminders, and trip prompts"
              onPress={() => comingSoon("Notifications")}
            />
            <Row
              title="Support & feedback"
              subtitle="Report bugs and suggest improvements"
              onPress={sendFeedback}
            />
          </GlassCard>

          <GlassCard style={[styles.card, { padding: 0 }]} intensity={22}>
            <Row title="About" subtitle="Version and what this app does" onPress={about} />
            <Row title="Privacy" subtitle="What’s stored locally vs online" onPress={() => comingSoon("Privacy")} />
          </GlassCard>

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },

  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  card: { padding: theme.spacing.md },

  name: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "900" },
  meta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  divider: {
    marginTop: 14,
    marginBottom: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  blurbTitle: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "900" },
  blurb: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },

  rowTitle: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "900" },
  rowSubtitle: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  chev: {
    color: theme.colors.textSecondary,
    fontSize: 26,
    marginTop: -2,
  },
});
