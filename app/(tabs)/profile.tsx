// app/(tabs)/profile.tsx

import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

/* ----------------------------- Row Component ----------------------------- */

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
        {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>

      {rightText && <Text style={styles.rowRight}>{rightText}</Text>}
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

/* ----------------------------- Helpers ----------------------------- */

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
  ],
  ES: [
    { label: "Madrid (MAD)", value: "Madrid (MAD)" },
    { label: "Barcelona (BCN)", value: "Barcelona (BCN)" },
    { label: "Málaga (AGP)", value: "Málaga (AGP)" },
    { label: "Valencia (VLC)", value: "Valencia (VLC)" },
  ],
  IT: [
    { label: "Rome Fiumicino (FCO)", value: "Rome Fiumicino (FCO)" },
    { label: "Milan Malpensa (MXP)", value: "Milan Malpensa (MXP)" },
    { label: "Milan Linate (LIN)", value: "Milan Linate (LIN)" },
    { label: "Venice (VCE)", value: "Venice (VCE)" },
  ],
  DE: [
    { label: "Frankfurt (FRA)", value: "Frankfurt (FRA)" },
    { label: "Munich (MUC)", value: "Munich (MUC)" },
    { label: "Berlin (BER)", value: "Berlin (BER)" },
  ],
  FR: [
    { label: "Paris CDG (CDG)", value: "Paris CDG (CDG)" },
    { label: "Paris Orly (ORY)", value: "Paris Orly (ORY)" },
    { label: "Nice (NCE)", value: "Nice (NCE)" },
  ],
};

function getCountryCodeBestEffort(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || "";
    const match = locale.match(/-([A-Z]{2})/);
    if (match?.[1]) return match[1];

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("London")) return "GB";
    if (tz.includes("Madrid")) return "ES";
    if (tz.includes("Rome")) return "IT";
    if (tz.includes("Berlin")) return "DE";
    if (tz.includes("Paris")) return "FR";
  } catch {}

  return "GB";
}

/* ----------------------------- Screen ----------------------------- */

export default function ProfileScreen() {
  const LOGO = useMemo(() => require("@/src/yna-logo.png"), []);

  const displayName = "Guest Traveller";
  const email = "Not Signed In";
  const planName = "Full Access";

  const languageOptions = ["English", "Spanish", "Italian", "German", "French"];

  const [homeAirport, setHomeAirport] = useState("Not Set");
  const [currency, setCurrency] = useState("GBP");
  const [language, setLanguage] = useState("English");
  const [budgetTarget, setBudgetTarget] = useState("Not Set");
  const [alerts, setAlerts] = useState("Off");

  const countryCode = useMemo(() => getCountryCodeBestEffort(), []);
  const airportOptions = AIRPORTS_BY_COUNTRY[countryCode] ?? AIRPORTS_BY_COUNTRY.GB;

  const budgetSummary =
    budgetTarget === "Not Set"
      ? "Not Set"
      : `${currency} ${budgetTarget}${alerts === "On" ? " • Alerts On" : ""}`;

  /* ---------------- Actions ---------------- */

  const openHomeAirport = useCallback(() => {
    Alert.alert(
      "Home Airport",
      `Airports in ${countryCode}`,
      [
        { text: "Cancel", style: "cancel" },
        ...airportOptions.map((a) => ({
          text: a.label,
          onPress: () => setHomeAirport(a.value),
        })),
        { text: "Clear", style: "destructive", onPress: () => setHomeAirport("Not Set") },
      ]
    );
  }, [airportOptions, countryCode]);

  const openCurrency = () => {
    Alert.alert("Currency", "Choose currency", [
      { text: "Cancel", style: "cancel" },
      { text: "GBP", onPress: () => setCurrency("GBP") },
      { text: "EUR", onPress: () => setCurrency("EUR") },
      { text: "USD", onPress: () => setCurrency("USD") },
    ]);
  };

  const openLanguage = () => {
    Alert.alert("Language", "Choose language", [
      { text: "Cancel", style: "cancel" },
      ...languageOptions.map((l) => ({ text: l, onPress: () => setLanguage(l) })),
    ]);
  };

  const openBudgetAlerts = () => {
    Alert.alert("Budget & Alerts", "", [
      { text: "Cancel", style: "cancel" },
      { text: "Toggle Alerts", onPress: () => setAlerts((p) => (p === "Off" ? "On" : "Off")) },
      { text: "Set Budget £250", onPress: () => setBudgetTarget("250") },
      { text: "Set Budget £500", onPress: () => setBudgetTarget("500") },
      { text: "Clear Budget", style: "destructive", onPress: () => setBudgetTarget("Not Set") },
    ]);
  };

  /* ---------------- UI ---------------- */

  return (
    <Background imageUrl={getBackground("profile")} overlayOpacity={0.7}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Account, Preferences, And App Info</Text>
            </View>

            <View style={styles.logoWrap}>
              <Image source={LOGO} style={styles.logo} />
            </View>
          </View>

          {/* Identity */}
          <GlassCard style={styles.card}>
            <View style={styles.identityRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.meta}>{email}</Text>
              </View>

              <View style={styles.planPill}>
                <Text style={styles.planLabel}>Plan</Text>
                <Text style={styles.planValue}>{planName}</Text>
              </View>
            </View>
          </GlassCard>

          {/* Defaults */}
          <GlassCard style={styles.card}>
            <Text style={styles.section}>Your Defaults</Text>

            <View style={styles.defaultsRow}>
              <Pressable onPress={openHomeAirport} style={styles.defaultChip}>
                <Text style={styles.defaultLabel}>Home Airport</Text>
                <Text style={styles.defaultValue}>{homeAirport}</Text>
              </Pressable>

              <Pressable onPress={openCurrency} style={styles.defaultChip}>
                <Text style={styles.defaultLabel}>Currency</Text>
                <Text style={styles.defaultValue}>{currency}</Text>
              </Pressable>
            </View>

            <View style={styles.defaultsRow}>
              <Pressable onPress={openLanguage} style={styles.defaultChip}>
                <Text style={styles.defaultLabel}>Language</Text>
                <Text style={styles.defaultValue}>{language}</Text>
              </Pressable>

              <Pressable onPress={openBudgetAlerts} style={styles.defaultChip}>
                <Text style={styles.defaultLabel}>Budget & Alerts</Text>
                <Text style={styles.defaultValue}>{budgetSummary}</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* Settings */}
          <GlassCard style={[styles.card, { padding: 0 }]}>
            <Row title="Home Airport" subtitle="Departure Default" rightText={homeAirport} onPress={openHomeAirport} />
            <Row title="Currency" subtitle="Budgets & Comparisons" rightText={currency} onPress={openCurrency} />
            <Row title="Language" subtitle="App Language" rightText={language} onPress={openLanguage} />
            <Row title="Budget & Alerts" subtitle="Target Budget & Drops" rightText={budgetSummary} onPress={openBudgetAlerts} last />
          </GlassCard>

          <Text style={styles.footer}>Plan • Fly • Watch • Repeat</Text>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* ----------------------------- Styles ----------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: { width: 32, height: 32 },

  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: "900",
  },

  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: 4,
  },

  card: {
    padding: theme.spacing.md,
  },

  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  name: { color: theme.colors.text, fontSize: 18, fontWeight: "900" },
  meta: { color: theme.colors.textSecondary, marginTop: 6 },

  planPill: {
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  planLabel: { color: theme.colors.textSecondary, fontSize: 10 },
  planValue: { color: theme.colors.primary, fontWeight: "900" },

  section: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 10,
  },

  defaultsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  defaultChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 12,
  },

  defaultLabel: { color: theme.colors.textSecondary, fontSize: 12 },
  defaultValue: { color: theme.colors.text, marginTop: 6, fontWeight: "900" },

  row: {
    flexDirection: "row",
    padding: 14,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },

  rowLast: { borderBottomWidth: 0 },

  rowTitle: { color: theme.colors.text, fontWeight: "900" },
  rowSubtitle: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 },
  rowRight: { color: theme.colors.textSecondary },
  chev: { color: theme.colors.textSecondary, fontSize: 22 },

  footer: {
    textAlign: "center",
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
});
