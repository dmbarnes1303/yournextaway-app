// app/(tabs)/profile.tsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image, Platform } from "react-native";
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

function showInfo(title: string, body: string) {
  Alert.alert(title, body);
}

/**
 * Simple, permission-free default airport guesser.
 * UK-first: prefer London airports. Bias to LGW (South East) with a safe fallback to LHR.
 * Later: replace with real geolocation + nearest-airport lookup.
 */
function guessDefaultAirport(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const isUKTz = tz.includes("London") || tz.includes("Europe/London");
    if (!isUKTz) return "Not Set";

    // Heuristic bias:
    // - Android devices in UK commonly used by people travelling from LGW/LHR.
    // - For your use case (South East), LGW is a reasonable “auto” default.
    // Keep it deterministic and simple.
    return "London (LGW)";
  } catch {
    return "London (LHR)";
  }
}

export default function ProfileScreen() {
  const LOGO = useMemo(() => require("@/src/yna-logo.png"), []);

  // Guest identity until auth exists
  const displayName = useMemo(() => "Guest Traveller", []);
  const email = useMemo(() => "Not Signed In", []);

  // Product choices
  const planName = useMemo(() => "Full Access", []);
  const languageOptions = useMemo(() => ["English", "Spanish", "Italian", "German", "French"], []);

  // Defaults (stateful now; persistence later)
  const [homeAirport, setHomeAirport] = useState<string>("Not Set");
  const [currency, setCurrency] = useState<string>("GBP");
  const [language, setLanguage] = useState<string>("English");
  const [budgetTarget, setBudgetTarget] = useState<string>("Not Set");
  const [alerts, setAlerts] = useState<string>("Off");

  // Auto-select airport ONCE (do not overwrite if user has set it)
  useEffect(() => {
    if (homeAirport !== "Not Set") return;
    const guessed = guessDefaultAirport();
    if (guessed !== "Not Set") setHomeAirport(guessed);
  }, [homeAirport]);

  const budgetSummary =
    budgetTarget === "Not Set"
      ? "Not Set"
      : `${currency} ${budgetTarget}${alerts === "On" ? " • Alerts On" : " • Alerts Off"}`;

  const openPreferences = useCallback(() => {
    showInfo(
      "Preferences",
      "Set your planning defaults here: date window, league coverage, sorting, and general behaviour.\n\nNext: wire this into the core fixture + trip build flow."
    );
  }, []);

  const openHomeAirport = useCallback(() => {
    // Smarter preset list (UK-first). Keep it lean and useful.
    const options = [
      { label: "London (LGW)", value: "London (LGW)" },
      { label: "London (LHR)", value: "London (LHR)" },
      { label: "London (STN)", value: "London (STN)" },
      { label: "London (LTN)", value: "London (LTN)" },
      { label: "Manchester (MAN)", value: "Manchester (MAN)" },
      { label: "Birmingham (BHX)", value: "Birmingham (BHX)" },
      { label: "Edinburgh (EDI)", value: "Edinburgh (EDI)" },
      { label: "Glasgow (GLA)", value: "Glasgow (GLA)" },
    ];

    Alert.alert(
      "Home Airport",
      "Choose your default departure airport for comparisons.",
      [
        { text: "Cancel", style: "cancel" },
        ...options.slice(0, 4).map((o) => ({ text: o.label, onPress: () => setHomeAirport(o.value) })),
        {
          text: "More…",
          onPress: () =>
            Alert.alert(
              "More Airports",
              "Pick one:",
              [
                { text: "Cancel", style: "cancel" },
                ...options.slice(4).map((o) => ({ text: o.label, onPress: () => setHomeAirport(o.value) })),
                { text: "Clear", style: "destructive", onPress: () => setHomeAirport("Not Set") },
              ],
              { cancelable: true }
            ),
        },
        { text: "Clear", style: "destructive", onPress: () => setHomeAirport("Not Set") },
      ],
      { cancelable: true }
    );
  }, []);

  const openCurrency = useCallback(() => {
    Alert.alert(
      "Currency",
      "Choose the currency used for budgets and comparisons.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "GBP", onPress: () => setCurrency("GBP") },
        { text: "EUR", onPress: () => setCurrency("EUR") },
        { text: "USD", onPress: () => setCurrency("USD") },
      ],
      { cancelable: true }
    );
  }, []);

  const openNotifications = useCallback(() => {
    showInfo("Notifications", "Fixture reminders and trip prompts.\n\nKeep it quiet and useful: no spam, no noise.");
  }, []);

  const openLanguage = useCallback(() => {
    Alert.alert(
      "Language",
      "Select your language.",
      [{ text: "Cancel", style: "cancel" }, ...languageOptions.map((l) => ({ text: l, onPress: () => setLanguage(l) }))],
      { cancelable: true }
    );
  }, [languageOptions]);

  const openBudgetAlerts = useCallback(() => {
    Alert.alert(
      "Budget & Alerts",
      "Set a target budget and toggle alerts.",
      [
        { text: "Cancel", style: "cancel" },
        { text: alerts === "Off" ? "Turn Alerts On" : "Turn Alerts Off", onPress: () => setAlerts((p) => (p === "Off" ? "On" : "Off")) },
        { text: `Set Budget: ${currency} 250`, onPress: () => setBudgetTarget("250") },
        { text: `Set Budget: ${currency} 500`, onPress: () => setBudgetTarget("500") },
        { text: "Clear Budget", style: "destructive", onPress: () => setBudgetTarget("Not Set") },
      ],
      { cancelable: true }
    );
  }, [alerts, currency]);

  const managePlan = useCallback(() => {
    showInfo(
      "Plan",
      "Plan: Full Access\n\nFull Access includes the full planning hub: comparisons, guides, wallet storage, and smart trip tools."
    );
  }, []);

  const openFAQ = useCallback(() => {
    showInfo(
      "FAQ",
      "How it works:\n• Start with a fixture\n• Save it as a trip\n• Build everything else in one hub (travel, stay, tickets, what to do)\n\nIf anything feels unclear, we tighten the flow."
    );
  }, []);

  const about = useCallback(() => {
    showInfo(
      "About YourNextAway",
      "YourNextAway helps you plan football-first city breaks across Europe.\n\nStart with a match, then build the trip in one place — travel, stay, tickets, and what to do."
    );
  }, []);

  const privacy = useCallback(() => {
    showInfo("Privacy", "Trips and notes are stored locally by default.\n\nWhen sync is enabled, you’ll be able to use YourNextAway across devices.");
  }, []);

  const terms = useCallback(() => {
    showInfo("Terms", "Terms will be available here.");
  }, []);

  return (
    <Background imageUrl={getBackground("profile")} overlayOpacity={0.70}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header with top-right logo */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Account, Preferences, And App Info</Text>
            </View>

            <View style={styles.headerLogoWrap} pointerEvents="none">
              <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
            </View>
          </View>

          {/* Identity + plan */}
          <GlassCard style={styles.card} intensity={24}>
            <View style={styles.identityTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.meta}>{email}</Text>
              </View>

              <Pressable onPress={managePlan} style={styles.planPill}>
                <Text style={styles.planLabel}>Plan</Text>
                <Text style={styles.planValue}>{planName}</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionH}>Your Defaults</Text>

            <View style={styles.defaultsRow}>
              <Pressable onPress={openHomeAirport} style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Home Airport</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {homeAirport}
                </Text>
              </Pressable>

              <Pressable onPress={openCurrency} style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Currency</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {currency}
                </Text>
              </Pressable>
            </View>

            <View style={styles.defaultsRow}>
              <Pressable onPress={openLanguage} style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Language</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {language}
                </Text>
              </Pressable>

              <Pressable onPress={openBudgetAlerts} style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Budget & Alerts</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {budgetSummary}
                </Text>
              </Pressable>
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
            <Row title="Preferences" subtitle="Date Window, League Coverage, And Planning Behaviour" onPress={openPreferences} />
            <Row title="Home Airport" subtitle="Departure Defaults For Comparisons" rightText={homeAirport} onPress={openHomeAirport} />
            <Row title="Currency" subtitle="Budgets And Comparisons" rightText={currency} onPress={openCurrency} />
            <Row title="Notifications" subtitle="Fixture Reminders And Trip Prompts" onPress={openNotifications} />
            <Row title="Language" subtitle="App Language" rightText={language} onPress={openLanguage} />
            <Row
              title="Budget & Alerts"
              subtitle="Target Budget And Drop Alerts"
              rightText={budgetTarget === "Not Set" ? "Not Set" : budgetSummary}
              onPress={openBudgetAlerts}
              last
            />
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

  headerRow: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  headerLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  headerLogo: {
    width: 34,
    height: 34,
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
