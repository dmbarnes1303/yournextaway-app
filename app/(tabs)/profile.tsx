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
  rightText?: string;
  onPress: () => void;
  last?: boolean;
};

function Row({ title, subtitle, rightText, onPress, last }: RowProps) {
  return (
    <Pressable onPress={onPress} style={[styles.row, last && styles.rowLast]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>

      {rightText ? <Text style={styles.rowRight}>{rightText}</Text> : null}
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

function pill(label: string, value: string) {
  return { label, value };
}

export default function ProfileScreen() {
  // No auth yet: show a clean “Guest” identity (as requested).
  const displayName = useMemo(() => "Guest Traveller", []);
  const email = useMemo(() => "Not Signed In", []);

  // Defaults are placeholders for now (until Preferences is wired).
  const defaults = useMemo(
    () => ({
      airport: "Not Set",
      currency: "GBP",
      language: "English",
      budget: "Not Set",
      alerts: "Off",
    }),
    []
  );

  const planName = useMemo(() => "Premium", []);

  function showInfo(title: string, body: string) {
    Alert.alert(title, body);
  }

  function openPreferences() {
    showInfo(
      "Preferences",
      "This is where you’ll control defaults like date window, league coverage, and planning behaviour.\n\nHook-up comes next."
    );
  }

  function openHomeAirport() {
    showInfo(
      "Home Airport",
      "Set your default departure airport so routes and travel suggestions can be tailored to you."
    );
  }

  function openCurrency() {
    showInfo("Currency", "Choose the currency used for budgets and comparisons.");
  }

  function openNotifications() {
    showInfo(
      "Notifications",
      "Fixture reminders, price alerts, and trip prompts. We’ll keep this minimal and useful — no spam."
    );
  }

  function openLanguage() {
    showInfo(
      "Language",
      "Choose your language. We’ll add localisation once the core flow is fully locked."
    );
  }

  function openBudgetAlerts() {
    showInfo(
      "Budget & Alerts",
      "Set a target budget and get alerts when travel or stay options drop into range."
    );
  }

  function openFAQ() {
    showInfo(
      "FAQ",
      "What this app does:\n• Start with a fixture\n• Build a trip around it\n• Keep flights, stays, tickets and plans in one hub\n\nIf something feels unclear, that’s on the UX — report it and we’ll tighten it."
    );
  }

  function managePlan() {
    // IMPORTANT: no “coming soon” tone; treat it as part of a finished product.
    showInfo(
      "Plan",
      "Plan: Premium\n\nPremium unlocks the full hub: comparisons, guides, wallet storage, and smart trip tools.\n\nBilling setup can be wired when you’re ready."
    );
  }

  function about() {
    showInfo(
      "About YourNextAway",
      "YourNextAway helps you plan football-first city breaks across Europe.\n\nStart with a match, then build the trip in one place — travel, stay, tickets, and what to do."
    );
  }

  function privacy() {
    showInfo(
      "Privacy",
      "Trips and notes are stored locally by default.\n\nWhen accounts sync is added, you’ll be able to back up and use YourNextAway across devices."
    );
  }

  function terms() {
    showInfo("Terms", "Terms will be available here.");
  }

  return (
    <Background imageUrl={getBackground("profile")} overlayOpacity={0.70}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Account, Preferences, And App Info</Text>
          </View>

          {/* Identity + plan */}
          <GlassCard style={styles.card} intensity={24}>
            <View style={styles.identityTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.meta}>{email}</Text>
              </View>

              <View style={styles.planPill}>
                <Text style={styles.planLabel}>Plan</Text>
                <Text style={styles.planValue}>{planName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionH}>Your Defaults</Text>

            <View style={styles.defaultsRow}>
              <View style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Home Airport</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {defaults.airport}
                </Text>
              </View>

              <View style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Currency</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {defaults.currency}
                </Text>
              </View>
            </View>

            <View style={styles.defaultsRow}>
              <View style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Language</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {defaults.language}
                </Text>
              </View>

              <View style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Budget Alerts</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {defaults.budget === "Not Set" ? "Not Set" : `${defaults.currency} ${defaults.budget}`} • {defaults.alerts}
                </Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <Pressable onPress={openPreferences} style={[styles.smallBtn, styles.smallBtnPrimary]}>
                <Text style={styles.smallBtnText}>Edit Preferences</Text>
              </Pressable>

              <Pressable onPress={managePlan} style={[styles.smallBtn, styles.smallBtnGhost]}>
                <Text style={styles.smallBtnGhostText}>Manage Plan</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* Settings */}
          <GlassCard style={[styles.card, { padding: 0 }]} intensity={24}>
            <Row
              title="Preferences"
              subtitle="Date Window, League Coverage, And Planning Behaviour"
              onPress={openPreferences}
            />
            <Row title="Home Airport" subtitle="Departure Defaults For Comparisons" rightText={defaults.airport} onPress={openHomeAirport} />
            <Row title="Currency" subtitle="Budgets And Comparisons" rightText={defaults.currency} onPress={openCurrency} />
            <Row title="Notifications" subtitle="Reminders And Price Alerts" onPress={openNotifications} />
            <Row title="Language" subtitle="Localisation And Region Settings" rightText={defaults.language} onPress={openLanguage} />
            <Row title="Budget & Alerts" subtitle="Target Budget And Drop Alerts" onPress={openBudgetAlerts} last />
          </GlassCard>

          {/* Help */}
          <GlassCard style={[styles.card, { padding: 0 }]} intensity={24}>
            <Row title="FAQ" subtitle="How It Works And What’s Included" onPress={openFAQ} last />
          </GlassCard>

          {/* Legal / about */}
          <GlassCard style={[styles.card, { padding: 0 }]} intensity={24}>
            <Row title="About" subtitle="What YourNextAway Does" onPress={about} />
            <Row title="Privacy" subtitle="What’s Stored And Where" onPress={privacy} />
            <Row title="Terms" subtitle="Legal" onPress={terms} last />
          </GlassCard>

          <Text style={styles.footerNote}>Plan • Fly • Watch • Repeat</Text>
          <View style={{ height: 8 }} />
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
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
  },

  card: { padding: theme.spacing.md },

  identityTop: { flexDirection: "row", alignItems: "center", gap: 12 },

  name: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.black },
  meta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold },

  planPill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.28)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "flex-end",
  },
  planLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.black },
  planValue: { marginTop: 2, color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.black },

  divider: {
    marginTop: 14,
    marginBottom: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  sectionH: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.black },

  defaultsRow: { marginTop: 12, flexDirection: "row", gap: 10 },

  defaultChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 70,
    justifyContent: "space-between",
  },

  defaultKicker: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.black, lineHeight: 14 },
  defaultValue: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.black },

  quickActions: { marginTop: 14, flexDirection: "row", gap: 10 },

  smallBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  smallBtnPrimary: { borderColor: theme.colors.primary, backgroundColor: "rgba(0,0,0,0.40)" },
  smallBtnText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },
  smallBtnGhost: { borderColor: theme.colors.border, backgroundColor: "rgba(0,0,0,0.22)" },
  smallBtnGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  rowLast: { borderBottomWidth: 0 },

  rowTitle: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.black },
  rowSubtitle: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: theme.fontWeight.bold },

  rowRight: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    marginRight: 2,
  },

  chev: { color: theme.colors.textSecondary, fontSize: 26, marginTop: -2 },

  footerNote: {
    textAlign: "center",
    color: "rgba(0,255,136,0.80)",
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
    marginTop: 2,
  },
});
