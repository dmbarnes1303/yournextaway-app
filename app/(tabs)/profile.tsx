// app/(tabs)/profile.tsx
import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from "react-native";
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

type AirportOption = { label: string; value: string };

const AIRPORTS_BY_COUNTRY: Record<string, AirportOption[]> = {
  GB: [
    { label: "London Heathrow (LHR)", value: "London Heathrow (LHR)" },
    { label: "London Gatwick (LGW)", value: "London Gatwick (LGW)" },
    { label: "London Stansted (STN)", value: "London Stansted (STN)" },
    { label: "London Luton (LTN)", value: "London Luton (LTN)" },
    { label: "London City (LCY)", value: "London City (LCY)" },
    { label: "Manchester (MAN)", value: "Manchester (MAN)" },
    { label: "Birmingham (BHX)", value: "Birmingham (BHX)" },
    { label: "Edinburgh (EDI)", value: "Edinburgh (EDI)" },
    { label: "Glasgow (GLA)", value: "Glasgow (GLA)" },
    { label: "Bristol (BRS)", value: "Bristol (BRS)" },
    { label: "Newcastle (NCL)", value: "Newcastle (NCL)" },
    { label: "Liverpool (LPL)", value: "Liverpool (LPL)" },
    { label: "Leeds Bradford (LBA)", value: "Leeds Bradford (LBA)" },
  ],
  ES: [
    { label: "Madrid (MAD)", value: "Madrid (MAD)" },
    { label: "Barcelona (BCN)", value: "Barcelona (BCN)" },
    { label: "Málaga (AGP)", value: "Málaga (AGP)" },
    { label: "Alicante (ALC)", value: "Alicante (ALC)" },
    { label: "Valencia (VLC)", value: "Valencia (VLC)" },
    { label: "Seville (SVQ)", value: "Seville (SVQ)" },
    { label: "Palma de Mallorca (PMI)", value: "Palma de Mallorca (PMI)" },
    { label: "Bilbao (BIO)", value: "Bilbao (BIO)" },
  ],
  IT: [
    { label: "Rome Fiumicino (FCO)", value: "Rome Fiumicino (FCO)" },
    { label: "Milan Malpensa (MXP)", value: "Milan Malpensa (MXP)" },
    { label: "Milan Linate (LIN)", value: "Milan Linate (LIN)" },
    { label: "Venice (VCE)", value: "Venice (VCE)" },
    { label: "Naples (NAP)", value: "Naples (NAP)" },
    { label: "Bologna (BLQ)", value: "Bologna (BLQ)" },
    { label: "Turin (TRN)", value: "Turin (TRN)" },
    { label: "Florence (FLR)", value: "Florence (FLR)" },
  ],
  DE: [
    { label: "Frankfurt (FRA)", value: "Frankfurt (FRA)" },
    { label: "Munich (MUC)", value: "Munich (MUC)" },
    { label: "Berlin (BER)", value: "Berlin (BER)" },
    { label: "Düsseldorf (DUS)", value: "Düsseldorf (DUS)" },
    { label: "Hamburg (HAM)", value: "Hamburg (HAM)" },
    { label: "Cologne Bonn (CGN)", value: "Cologne Bonn (CGN)" },
    { label: "Stuttgart (STR)", value: "Stuttgart (STR)" },
  ],
  FR: [
    { label: "Paris Charles de Gaulle (CDG)", value: "Paris Charles de Gaulle (CDG)" },
    { label: "Paris Orly (ORY)", value: "Paris Orly (ORY)" },
    { label: "Nice (NCE)", value: "Nice (NCE)" },
    { label: "Lyon (LYS)", value: "Lyon (LYS)" },
    { label: "Marseille (MRS)", value: "Marseille (MRS)" },
    { label: "Toulouse (TLS)", value: "Toulouse (TLS)" },
    { label: "Bordeaux (BOD)", value: "Bordeaux (BOD)" },
  ],
};

function getCountryCodeBestEffort(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || "";
    const match = locale.match(/-([A-Z]{2})\b/);
    if (match?.[1]) return match[1];

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("Europe/London")) return "GB";
    if (tz.includes("Europe/Madrid")) return "ES";
    if (tz.includes("Europe/Rome")) return "IT";
    if (tz.includes("Europe/Berlin")) return "DE";
    if (tz.includes("Europe/Paris")) return "FR";
  } catch {
    // ignore
  }
  return "GB";
}

export default function ProfileScreen() {
  const LOGO = useMemo(() => require("@/src/yna-logo.png"), []);

  // Guest identity until auth exists
  const displayName = useMemo(() => "Guest Traveller", []);
  const email = useMemo(() => "Not Signed In", []);

  // Product choices you approved
  const planName = useMemo(() => "Full Access", []);
  const languageOptions = useMemo(() => ["English", "Spanish", "Italian", "German", "French"], []);

  // Defaults (stateful, so you can wire persistence later)
  const [homeAirport, setHomeAirport] = useState<string>("Not Set");
  const [currency, setCurrency] = useState<string>("GBP");
  const [language, setLanguage] = useState<string>("English");
  const [budgetTarget, setBudgetTarget] = useState<string>("Not Set");
  const [alerts, setAlerts] = useState<string>("Off");

  const countryCode = useMemo(() => getCountryCodeBestEffort(), []);
  const airportOptions = useMemo<AirportOption[]>(() => {
    return AIRPORTS_BY_COUNTRY[countryCode] ?? AIRPORTS_BY_COUNTRY.GB;
  }, [countryCode]);

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
    // Alert button limits are tight; paginate into chunks.
    const first = airportOptions.slice(0, 6);
    const rest = airportOptions.slice(6);

    Alert.alert(
      "Home Airport",
      `Select a departure airport (${countryCode}).`,
      [
        { text: "Cancel", style: "cancel" },
        ...first.map((o) => ({ text: o.label, onPress: () => setHomeAirport(o.value) })),
        ...(rest.length
          ? [
              {
                text: "More…",
                onPress: () =>
                  Alert.alert(
                    "More Airports",
                    "Pick one:",
                    [
                      { text: "Cancel", style: "cancel" },
                      ...rest.map((o) => ({ text: o.label, onPress: () => setHomeAirport(o.value) })),
                      { text: "Clear", style: "destructive", onPress: () => setHomeAirport("Not Set") },
                    ],
                    { cancelable: true }
                  ),
              },
            ]
          : []),
        { text: "Clear", style: "destructive", onPress: () => setHomeAirport("Not Set") },
      ],
      { cancelable: true }
    );
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
    showInfo("Notifications", "Fixture reminders and trip prompts.\n\nWe’ll keep this quiet and useful: no spam, no noise.");
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
      "Plan: Full Access\n\nFull Access includes the full planning hub: comparisons, guides, wallet storage, and smart trip tools."
    );
  }, []);

  const openFAQ = useCallback(() => {
    showInfo(
      "FAQ",
      "How it works:\n• Start with a fixture\n• Save it as a trip\n• Build everything else in one hub (travel, stay, tickets, what to do)\n\nIf something feels unclear, report it and we’ll tighten the flow."
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
    <Background imageUrl={getBackground("profile")} overlayOpacity={0.70}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header with top-right logo (NO outer circle) */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Account, Preferences, And App Info</Text>
            </View>

            {/* No border, no circle. Make logo fill the old circle area. */}
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

  // NO outer circle: no border, no background, just space for the logo.
  // Size equals the old circle footprint, logo fills it.
  headerLogoWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  headerLogo: { width: 44, height: 44 },

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

  defaultKicker: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    lineHeight: 14,
  },
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
  rowSubtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

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
