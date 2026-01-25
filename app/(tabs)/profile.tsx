// app/(tabs)/profile.tsx

import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  useWindowDimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getDeviceLocaleInfo } from "@/src/utils/deviceLocale";
import { getAirportOptionsForCountry, AirportOption } from "@/src/data/airports/airportsByCountry";

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

      {rightText ? (
        <Text style={styles.rowRight} numberOfLines={1}>
          {rightText}
        </Text>
      ) : null}
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

function showInfo(title: string, body: string) {
  Alert.alert(title, body);
}

// Alert action limits vary (iOS is stricter). Paginate options.
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function ProfileScreen() {
  const LOGO = useMemo(() => require("@/src/yna-logo.png"), []);
  const { width } = useWindowDimensions();

  // Responsive top-right logo size (no outer circle/border/background).
  const logoSize = useMemo(() => {
    const ideal = Math.round(width * 0.22);
    return Math.max(56, Math.min(90, ideal));
  }, [width]);

  // Guest identity until auth exists
  const displayName = useMemo(() => "Guest Traveller", []);
  const email = useMemo(() => "Not Signed In", []);

  const planName = useMemo(() => "Full Access", []);
  const languageOptions = useMemo(() => ["English", "Spanish", "Italian", "German", "French"], []);

  // Device locale + timezone (best-effort) — centralised for future reuse.
  const deviceInfo = useMemo(() => getDeviceLocaleInfo("GB"), []);
  const countryCode = deviceInfo.countryCode;

  const airportOptions = useMemo<AirportOption[]>(
    () => getAirportOptionsForCountry(countryCode, "GB"),
    [countryCode]
  );

  // Defaults (stateful for now; wire persistence later)
  const [homeAirport, setHomeAirport] = useState<string>("Not Set");
  const [currency, setCurrency] = useState<string>("GBP");
  const [language, setLanguage] = useState<string>("English");
  const [budgetTarget, setBudgetTarget] = useState<string>("Not Set");
  const [alerts, setAlerts] = useState<string>("Off");

  const budgetSummary =
    budgetTarget === "Not Set"
      ? "Not Set"
      : `${currency} ${budgetTarget}${alerts === "On" ? " • Alerts On" : " • Alerts Off"}`;

  const openPreferences = useCallback(() => {
    showInfo(
      "Preferences",
      "Set your planning defaults here:\n\n• Date window\n• League coverage\n• Sorting & filters\n• Planning behaviour\n\nNext: wire these into the core fixture + trip build flow."
    );
  }, []);

  const openHomeAirport = useCallback(() => {
    const pageSize = Platform.OS === "ios" ? 6 : 8;
    const pages = chunk(airportOptions, pageSize);

    const openPage = (pageIndex: number) => {
      const page = pages[pageIndex] ?? [];

      const actions: { text: string; onPress?: () => void; style?: "default" | "cancel" | "destructive" }[] = [
        { text: "Cancel", style: "cancel" },
        ...page.map((o) => ({ text: o.label, onPress: () => setHomeAirport(o.value) })),
      ];

      if (pages.length > 1 && pageIndex < pages.length - 1) {
        actions.push({ text: "More…", onPress: () => openPage(pageIndex + 1) });
      }

      actions.push({ text: "Clear", style: "destructive", onPress: () => setHomeAirport("Not Set") });

      Alert.alert("Home Airport", `Select a departure airport (${countryCode}).`, actions, { cancelable: true });
    };

    if (!airportOptions.length) {
      Alert.alert("Home Airport", "No airports available for your region yet.", [{ text: "OK" }], { cancelable: true });
      return;
    }

    openPage(0);
  }, [airportOptions, countryCode]);

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
    showInfo(
      "Notifications",
      "Fixture reminders and trip prompts.\n\nThis stays quiet and useful: no spam, no noise."
    );
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
        {
          text: alerts === "Off" ? "Turn Alerts On" : "Turn Alerts Off",
          onPress: () => setAlerts((p) => (p === "Off" ? "On" : "Off")),
        },
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
      "Plan: Full Access\n\nFull Access is the full planning hub:\n• Comparisons\n• Guides\n• Wallet storage\n• Smart trip tools"
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
    showInfo(
      "Privacy",
      "Trips and notes are stored locally by default.\n\nWhen sync is enabled, you’ll be able to use YourNextAway across devices."
    );
  }, []);

  const terms = useCallback(() => {
    showInfo("Terms", "Terms will be available here.");
  }, []);

  return (
    <Background imageUrl={getBackground("profile")} overlayOpacity={0.7}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header with top-right logo (no outer circle) */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Account, Preferences, And App Info</Text>
            </View>

            <View style={[styles.headerLogoWrap, { width: logoSize, height: logoSize }]} pointerEvents="none">
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
            <Row
              title="Home Airport"
              subtitle={`Departure Defaults For Comparisons (${countryCode})`}
              rightText={homeAirport}
              onPress={openHomeAirport}
            />
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

  headerRow: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  // No outer circle. Just the logo.
  headerLogoWrap: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },

  headerLogo: {
    width: "100%",
    height: "100%",
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
  smallBtnGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontWeight ? theme.fontSize.sm : 14 },

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
    maxWidth: 140,
    textAlign: "right",
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
