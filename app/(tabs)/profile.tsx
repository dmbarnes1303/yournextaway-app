// app/(tabs)/profile.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  useWindowDimensions,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SelectModal, { type SelectOption } from "@/src/components/SelectModal";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

type RowProps = {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  rightSlot?: React.ReactNode;
  last?: boolean;
};

function Row({ title, subtitle, value, onPress, rightSlot, last }: RowProps) {
  const content = (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>

      {rightSlot ? rightSlot : null}

      {!rightSlot && value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      {onPress ? <Text style={styles.chev}>›</Text> : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      {content}
    </Pressable>
  );
}

function showInfo(title: string, body: string) {
  Alert.alert(title, body);
}

/**
 * Best-effort country code (no extra libs).
 */
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

const STORAGE_KEYS = {
  setupComplete: "yna:setupComplete",
  plan: "yna:plan",
  homeAirport: "yna:profile.homeAirport",
  currency: "yna:profile.currency",
  language: "yna:profile.language",
  budgetTarget: "yna:profile.budgetTarget",
  alerts: "yna:profile.alerts",
};

type PlanValue = "not_set" | "free" | "premium";
type AlertsValue = "On" | "Off";

const AIRPORTS_BY_COUNTRY: Record<string, SelectOption[]> = {
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
    { label: "East Midlands (EMA)", value: "East Midlands (EMA)" },
    { label: "Belfast Intl (BFS)", value: "Belfast Intl (BFS)" },
    { label: "Belfast City (BHD)", value: "Belfast City (BHD)" },
    { label: "Cardiff (CWL)", value: "Cardiff (CWL)" },
    { label: "Southampton (SOU)", value: "Southampton (SOU)" },
    { label: "Aberdeen (ABZ)", value: "Aberdeen (ABZ)" },
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
    { label: "Tenerife South (TFS)", value: "Tenerife South (TFS)" },
    { label: "Gran Canaria (LPA)", value: "Gran Canaria (LPA)" },
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
    { label: "Pisa (PSA)", value: "Pisa (PSA)" },
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

const CURRENCY_OPTIONS: SelectOption[] = [
  { label: "GBP (£)", value: "GBP" },
  { label: "EUR (€)", value: "EUR" },
  { label: "USD ($)", value: "USD" },
];

const LANGUAGE_OPTIONS: SelectOption[] = [
  { label: "English", value: "English" },
  { label: "Spanish", value: "Spanish" },
  { label: "Italian", value: "Italian" },
  { label: "German", value: "German" },
  { label: "French", value: "French" },
];

const PLAN_OPTIONS: SelectOption[] = [
  { label: "Free Plan", value: "free" },
  { label: "Premium Plan", value: "premium" },
];

function planLabel(plan: PlanValue) {
  if (plan === "free") return "Free";
  if (plan === "premium") return "Premium";
  return "Not set";
}

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const LOGO = useMemo(() => require("@/src/yna-logo.png"), []);
  const displayName = useMemo(() => "Guest Traveller", []);
  const email = useMemo(() => "Not Signed In", []);

  const [loading, setLoading] = useState(true);

  const [plan, setPlan] = useState<PlanValue>("not_set");
  const [homeAirport, setHomeAirport] = useState("Not Set");
  const [currency, setCurrency] = useState("GBP");
  const [language, setLanguage] = useState("English");
  const [budgetTarget, setBudgetTarget] = useState("Not Set");
  const [alerts, setAlerts] = useState<AlertsValue>("Off");
  const [setupComplete, setSetupComplete] = useState(false);

  const [activePicker, setActivePicker] = useState<null | "airport" | "currency" | "language" | "budget" | "plan">(null);
  const closePicker = useCallback(() => setActivePicker(null), []);

  const countryCode = useMemo(() => getCountryCodeBestEffort(), []);
  const airportOptions = useMemo(() => AIRPORTS_BY_COUNTRY[countryCode] ?? AIRPORTS_BY_COUNTRY.GB, [countryCode]);

  const logoSize = useMemo(() => {
    const max = 86;
    const min = 62;
    if (width < 360) return min;
    if (width < 410) return 76;
    return max;
  }, [width]);

  // Derived
  const canFinishSetup = useMemo(() => homeAirport !== "Not Set" && plan !== "not_set", [homeAirport, plan]);

  const budgetSummary = useMemo(() => {
    const b = budgetTarget === "Not Set" ? "Not set" : `${currency} ${budgetTarget}`;
    return alerts === "On" ? `${b} • Alerts on` : `${b} • Alerts off`;
  }, [alerts, budgetTarget, currency]);

  const budgetOptions = useMemo<SelectOption[]>(() => {
    return [
      { label: "Not set", value: "Not Set" },
      { label: `${currency} 150`, value: "150" },
      { label: `${currency} 250`, value: "250" },
      { label: `${currency} 350`, value: "350" },
      { label: `${currency} 500`, value: "500" },
      { label: `${currency} 750`, value: "750" },
    ];
  }, [currency]);

  // Load persisted settings once
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [storedSetup, storedPlan, storedAirport, storedCurrency, storedLanguage, storedBudget, storedAlerts] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.setupComplete),
            AsyncStorage.getItem(STORAGE_KEYS.plan),
            AsyncStorage.getItem(STORAGE_KEYS.homeAirport),
            AsyncStorage.getItem(STORAGE_KEYS.currency),
            AsyncStorage.getItem(STORAGE_KEYS.language),
            AsyncStorage.getItem(STORAGE_KEYS.budgetTarget),
            AsyncStorage.getItem(STORAGE_KEYS.alerts),
          ]);

        if (!mounted) return;

        setSetupComplete(storedSetup === "true");

        if (storedPlan === "free" || storedPlan === "premium") setPlan(storedPlan);
        if (storedAirport) setHomeAirport(storedAirport);
        if (storedCurrency) setCurrency(storedCurrency);
        if (storedLanguage) setLanguage(storedLanguage);
        if (storedBudget) setBudgetTarget(storedBudget);
        if (storedAlerts === "On" || storedAlerts === "Off") setAlerts(storedAlerts);
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Save changes best-effort whenever user updates settings
  useEffect(() => {
    if (loading) return;

    (async () => {
      try {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.plan, plan),
          AsyncStorage.setItem(STORAGE_KEYS.homeAirport, homeAirport),
          AsyncStorage.setItem(STORAGE_KEYS.currency, currency),
          AsyncStorage.setItem(STORAGE_KEYS.language, language),
          AsyncStorage.setItem(STORAGE_KEYS.budgetTarget, budgetTarget),
          AsyncStorage.setItem(STORAGE_KEYS.alerts, alerts),
        ]);
      } catch {
        // ignore
      }
    })();
  }, [alerts, budgetTarget, currency, homeAirport, language, loading, plan]);

  const finishSetup = useCallback(async () => {
    if (!canFinishSetup) {
      Alert.alert("Finish setup", "To finish setup, you must:\n\n• Set your Home Airport\n• Choose Free or Premium");
      return;
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.setupComplete, "true");
      setSetupComplete(true);
      router.replace("/(tabs)/home");
    } catch {
      Alert.alert("Something went wrong", "We couldn’t save setup status, but you can continue.");
      router.replace("/(tabs)/home");
    }
  }, [canFinishSetup, router]);

  const resetSetup = useCallback(() => {
    Alert.alert("Reset setup?", "This will make the app show Landing again on next launch.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiSet([
              [STORAGE_KEYS.setupComplete, "false"],
              [STORAGE_KEYS.plan, "not_set"],
              [STORAGE_KEYS.homeAirport, "Not Set"],
              [STORAGE_KEYS.currency, "GBP"],
              [STORAGE_KEYS.language, "English"],
              [STORAGE_KEYS.budgetTarget, "Not Set"],
              [STORAGE_KEYS.alerts, "Off"],
            ]);

            setSetupComplete(false);
            setPlan("not_set");
            setHomeAirport("Not Set");
            setCurrency("GBP");
            setLanguage("English");
            setBudgetTarget("Not Set");
            setAlerts("Off");

            Alert.alert("Reset complete", "Landing will show again next time you open the app.");
          } catch {
            Alert.alert("Reset failed", "Couldn’t reset setup status.");
          }
        },
      },
    ]);
  }, []);

  // Info / legal
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
    showInfo("Privacy", "Trips and notes are stored locally by default.\n\nWhen sync is enabled, you’ll be able to use the app across devices.");
  }, []);

  const terms = useCallback(() => {
    showInfo("Terms", "Terms will be available here.");
  }, []);

  const planSummary = useMemo(() => planLabel(plan), [plan]);

  return (
    <Background imageUrl={getBackground("profile")} overlayOpacity={0.78}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Your defaults and app info</Text>
            </View>

            <View style={[styles.logoMask, { width: logoSize, height: logoSize }]} pointerEvents="none">
              <Image source={LOGO} style={{ width: logoSize, height: logoSize, transform: [{ scale: 1.18 }] }} resizeMode="cover" />
            </View>
          </View>

          {/* IDENTITY */}
          <GlassCard style={styles.card} strength="default">
            <View style={styles.identityTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.meta}>{email}</Text>
              </View>

              <Pressable onPress={() => setActivePicker("plan")} style={styles.planPill}>
                <Text style={styles.planPillLabel}>Plan</Text>
                <Text style={styles.planPillValue}>{planSummary}</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <View style={styles.setupBlock}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionH}>Setup</Text>
                <Text style={styles.sectionHint}>
                  Set a home airport and plan. Then the app boots straight into Home.
                </Text>
              </View>

              <View style={styles.setupStatusPill}>
                <Text style={styles.setupStatusKicker}>Status</Text>
                <Text style={styles.setupStatusValue}>{setupComplete ? "Complete" : "Incomplete"}</Text>
              </View>
            </View>

            <View style={styles.primaryActions}>
              <Pressable
                onPress={finishSetup}
                disabled={!canFinishSetup}
                style={[styles.btn, styles.btnPrimary, !canFinishSetup && styles.btnDisabled]}
              >
                <Text style={styles.btnPrimaryText}>Finish setup</Text>
                <Text style={styles.btnMeta}>{canFinishSetup ? "Save & continue" : "Choose plan + airport"}</Text>
              </Pressable>

              <Pressable onPress={resetSetup} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Reset</Text>
                <Text style={styles.btnMeta}>Show Landing next launch</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* DEFAULTS */}
          <GlassCard style={[styles.card, { padding: 0 }]} strength="subtle" noPadding>
            <View style={styles.listHeader}>
              <Text style={styles.sectionH}>Your defaults</Text>
              <Text style={styles.listSub}>{`Region: ${countryCode}`}</Text>
            </View>

            <Row
              title="Home airport"
              subtitle="Departure defaults for comparisons"
              value={homeAirport === "Not Set" ? "Not set" : homeAirport}
              onPress={() => setActivePicker("airport")}
            />
            <Row title="Plan" subtitle="Free or Premium" value={planSummary} onPress={() => setActivePicker("plan")} />
            <Row title="Currency" subtitle="Budgets and comparisons" value={currency} onPress={() => setActivePicker("currency")} />
            <Row title="Language" subtitle="App language" value={language} onPress={() => setActivePicker("language")} />
            <Row
              title="Budget"
              subtitle={budgetTarget === "Not Set" ? "Optional" : "Target budget for quick planning"}
              value={budgetTarget === "Not Set" ? "Not set" : `${currency} ${budgetTarget}`}
              onPress={() => setActivePicker("budget")}
            />
            <Row
              title="Alerts"
              subtitle="Budget drop alerts (quiet, useful)"
              last
              rightSlot={
                <View style={styles.switchWrap}>
                  <Switch
                    value={alerts === "On"}
                    onValueChange={(v) => setAlerts(v ? "On" : "Off")}
                  />
                </View>
              }
            />
          </GlassCard>

          {/* INFO */}
          <GlassCard style={[styles.card, { padding: 0 }]} strength="subtle" noPadding>
            <View style={styles.listHeader}>
              <Text style={styles.sectionH}>Help & info</Text>
              <Text style={styles.listSub}>No noise. Just the essentials.</Text>
            </View>

            <Row title="FAQ" subtitle="How the flow works" onPress={openFAQ} />
            <Row title="About" subtitle="What YourNextAway does" onPress={about} />
            <Row title="Privacy" subtitle="What’s stored and where" onPress={privacy} />
            <Row title="Terms" subtitle="Legal" onPress={terms} last />
          </GlassCard>

          <Text style={styles.footerNote}>PLAN • FLY • WATCH • REPEAT</Text>
          <View style={{ height: 10 }} />
        </ScrollView>

        {/* PICKERS */}
        <SelectModal
          visible={activePicker === "plan"}
          title="Choose your plan"
          subtitle="Pick Free or Premium. Required to finish setup."
          options={PLAN_OPTIONS}
          selectedValue={plan === "not_set" ? "" : plan}
          onClose={closePicker}
          onSelect={(v) => setPlan(v === "free" || v === "premium" ? v : "not_set")}
          allowClear
          clearLabel="Clear plan"
          clearValue=""
        />

        <SelectModal
          visible={activePicker === "airport"}
          title="Home airport"
          subtitle={`Select a departure airport (${countryCode}).`}
          options={airportOptions}
          selectedValue={homeAirport}
          onClose={closePicker}
          onSelect={setHomeAirport}
          allowClear
          clearLabel="Clear airport"
          clearValue="Not Set"
        />

        <SelectModal
          visible={activePicker === "currency"}
          title="Currency"
          subtitle="Used for budgets and comparisons."
          options={CURRENCY_OPTIONS}
          selectedValue={currency}
          onClose={closePicker}
          onSelect={setCurrency}
        />

        <SelectModal
          visible={activePicker === "language"}
          title="Language"
          subtitle="Select your language."
          options={LANGUAGE_OPTIONS}
          selectedValue={language}
          onClose={closePicker}
          onSelect={setLanguage}
        />

        <SelectModal
          visible={activePicker === "budget"}
          title="Budget"
          subtitle={alerts === "On" ? "Alerts are on" : "Alerts are off"}
          options={budgetOptions}
          selectedValue={budgetTarget}
          onClose={closePicker}
          onSelect={(v) => setBudgetTarget(v === "Not Set" ? "Not Set" : v)}
          allowClear
          clearLabel="Clear budget"
          clearValue="Not Set"
        />
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

  logoMask: {
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "transparent",
    marginTop: 2,
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

  card: { padding: theme.spacing.lg },

  identityTop: { flexDirection: "row", alignItems: "center", gap: 12 },

  name: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.black },
  meta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold },

  planPill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.28)",
    backgroundColor: "rgba(0,0,0,0.20)",
    alignItems: "flex-end",
  },
  planPillLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.black },
  planPillValue: { marginTop: 2, color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.black },

  divider: {
    marginTop: 14,
    marginBottom: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  sectionH: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.black },

  sectionHint: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "700",
  },

  setupBlock: { flexDirection: "row", alignItems: "center", gap: 10 },

  setupStatusPill: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 110,
    alignItems: "flex-end",
  },
  setupStatusKicker: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.black },
  setupStatusValue: { marginTop: 3, color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.black },

  primaryActions: { marginTop: 14, flexDirection: "row", gap: 10 },

  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  btnPrimary: {
    borderColor: "rgba(0,255,136,0.50)",
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  btnGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  btnDisabled: { opacity: 0.6 },

  btnMeta: { color: theme.colors.textTertiary, fontSize: theme.fontSize.xs, fontWeight: "800" },

  listHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 10,
  },

  listSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  rowLast: {},

  rowTitle: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.black },
  rowSubtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  rowValue: {
    maxWidth: 170,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    marginRight: 2,
  },

  switchWrap: { marginRight: 2 },

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
