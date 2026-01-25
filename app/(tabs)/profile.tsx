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
  // Option B: boot routing uses ONLY this flag (app/index.tsx)
  setupComplete: "yna:setupComplete",

  // Setup fields
  plan: "yna:plan",
  homeAirport: "yna:profile.homeAirport",
  currency: "yna:profile.currency",
  language: "yna:profile.language",
  budgetTarget: "yna:profile.budgetTarget",
  alerts: "yna:profile.alerts",
};

type PlanValue = "not_set" | "free" | "premium";

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
  return "Not Set";
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
  const [alerts, setAlerts] = useState<"On" | "Off">("Off");
  const [setupComplete, setSetupComplete] = useState(false);

  const [activePicker, setActivePicker] = useState<null | "airport" | "currency" | "language" | "budget" | "plan">(null);
  const closePicker = useCallback(() => setActivePicker(null), []);

  const countryCode = useMemo(() => getCountryCodeBestEffort(), []);
  const airportOptions = useMemo(
    () => AIRPORTS_BY_COUNTRY[countryCode] ?? AIRPORTS_BY_COUNTRY.GB,
    [countryCode]
  );

  const budgetSummary = useMemo(() => {
    if (budgetTarget === "Not Set") return "Not Set";
    return `${currency} ${budgetTarget}${alerts === "On" ? " • Alerts On" : " • Alerts Off"}`;
  }, [alerts, budgetTarget, currency]);

  const budgetOptions = useMemo<SelectOption[]>(() => {
    return [
      { label: "Not Set", value: "Not Set" },
      { label: `${currency} 150`, value: "150" },
      { label: `${currency} 250`, value: "250" },
      { label: `${currency} 350`, value: "350" },
      { label: `${currency} 500`, value: "500" },
      { label: `${currency} 750`, value: "750" },
    ];
  }, [currency]);

  const logoSize = useMemo(() => {
    const max = 90;
    const min = 64;
    if (width < 360) return min;
    if (width < 410) return 78;
    return max;
  }, [width]);

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

  const openPreferences = useCallback(() => {
    showInfo(
      "Preferences",
      "Set your planning defaults here: date window, league coverage, sorting, and general behaviour.\n\nNext: wire this into the core fixture + trip build flow."
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
    showInfo("Privacy", "Trips and notes are stored locally by default.\n\nWhen sync is enabled, you’ll be able to use the app across devices.");
  }, []);

  const terms = useCallback(() => {
    showInfo("Terms", "Terms will be available here.");
  }, []);

  const canFinishSetup = useMemo(() => {
    return homeAirport !== "Not Set" && plan !== "not_set";
  }, [homeAirport, plan]);

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
    Alert.alert(
      "Reset setup?",
      "This will make the app show Landing again on next launch.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              // Option B: boot routing uses ONLY setupComplete.
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
      ]
    );
  }, []);

  const planSummary = useMemo(() => {
    return plan === "not_set" ? "Not Set" : planLabel(plan);
  }, [plan]);

  return (
    <Background imageUrl={getBackground("profile")} overlayOpacity={0.7}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Account, Preferences, And App Info</Text>
            </View>

            <View style={[styles.headerLogoMask, { width: logoSize, height: logoSize, pointerEvents: "none" }]}>
              <Image
                source={LOGO}
                style={[styles.headerLogoImage, { width: logoSize, height: logoSize }]}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Setup status + Finish setup */}
          <GlassCard style={styles.card} intensity={24}>
            <View style={styles.identityTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.meta}>{email}</Text>
              </View>

              <Pressable onPress={() => setActivePicker("plan")} style={styles.planPill}>
                <Text style={styles.planLabel}>Plan</Text>
                <Text style={styles.planValue}>{planSummary}</Text>
              </Pressable>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionH}>Setup</Text>

            <View style={styles.setupRow}>
              <View style={styles.setupStatus}>
                <Text style={styles.setupKicker}>Setup Status</Text>
                <Text style={styles.setupValue}>{setupComplete ? "Complete" : "Not Complete"}</Text>
              </View>

              <Pressable
                onPress={finishSetup}
                disabled={!canFinishSetup}
                style={[styles.finishBtn, canFinishSetup ? styles.finishBtnOn : styles.finishBtnOff]}
              >
                <Text style={styles.finishBtnText}>Finish Setup</Text>
              </Pressable>
            </View>

            <Text style={styles.setupHint}>
              To finish setup: set a Home Airport + choose Free/Premium. After that, the app will boot straight into Home.
            </Text>

            <View style={styles.quickActions}>
              <Pressable onPress={() => setActivePicker("plan")} style={[styles.smallBtn, styles.smallBtnPrimary]}>
                <Text style={styles.smallBtnText}>Choose Plan</Text>
              </Pressable>

              <Pressable onPress={resetSetup} style={[styles.smallBtn, styles.smallBtnGhost]}>
                <Text style={styles.smallBtnGhostText}>Reset Setup</Text>
              </Pressable>
            </View>
          </GlassCard>

          <GlassCard style={styles.card} intensity={24}>
            <Text style={styles.sectionH}>Your Defaults</Text>

            <View style={styles.defaultsRow}>
              <Pressable onPress={() => setActivePicker("airport")} style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Home Airport</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {homeAirport}
                </Text>
              </Pressable>

              <Pressable onPress={() => setActivePicker("currency")} style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Currency</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {currency}
                </Text>
              </Pressable>
            </View>

            <View style={styles.defaultsRow}>
              <Pressable onPress={() => setActivePicker("language")} style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Language</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {language}
                </Text>
              </Pressable>

              <Pressable onPress={() => setActivePicker("budget")} style={styles.defaultChip}>
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

              <Pressable
                onPress={() =>
                  showInfo(
                    "Notifications",
                    "Fixture reminders and trip prompts.\n\nKeep it quiet and useful: no spam, no noise."
                  )
                }
                style={[styles.smallBtn, styles.smallBtnGhost]}
              >
                <Text style={styles.smallBtnGhostText}>Notifications</Text>
              </Pressable>
            </View>
          </GlassCard>

          <GlassCard style={[styles.card, { padding: 0 }]} intensity={24}>
            <Row title="Plan" subtitle="Choose Free or Premium" rightText={planSummary} onPress={() => setActivePicker("plan")} />
            <Row
              title="Home Airport"
              subtitle={`Departure defaults for comparisons (${countryCode})`}
              rightText={homeAirport}
              onPress={() => setActivePicker("airport")}
            />
            <Row title="Currency" subtitle="Budgets and comparisons" rightText={currency} onPress={() => setActivePicker("currency")} />
            <Row title="Language" subtitle="App language" rightText={language} onPress={() => setActivePicker("language")} />
            <Row
              title="Budget & Alerts"
              subtitle="Target budget and drop alerts"
              rightText={budgetTarget === "Not Set" ? "Not Set" : budgetSummary}
              onPress={() => setActivePicker("budget")}
              last
            />
          </GlassCard>

          <GlassCard style={[styles.card, { padding: 0 }]} intensity={24}>
            <Row title="FAQ" subtitle="How it works and what’s included" onPress={openFAQ} last />
          </GlassCard>

          <GlassCard style={[styles.card, { padding: 0 }]} intensity={24}>
            <Row title="About" subtitle="What YourNextAway does" onPress={about} />
            <Row title="Privacy" subtitle="What’s stored and where" onPress={privacy} />
            <Row title="Terms" subtitle="Legal" onPress={terms} last />
          </GlassCard>

          <Text style={styles.footerNote}>Plan • Fly • Watch • Repeat</Text>
          <View style={{ height: 10 }} />
        </ScrollView>

        {/* Pickers */}
        <SelectModal
          visible={activePicker === "plan"}
          title="Choose Your Plan"
          subtitle="Pick Free or Premium. This is required to finish setup."
          options={PLAN_OPTIONS}
          selectedValue={plan === "not_set" ? "" : plan}
          onClose={closePicker}
          onSelect={(v) => setPlan(v === "free" || v === "premium" ? v : "not_set")}
          allowClear
          clearLabel="Clear Plan"
          clearValue=""
        />

        <SelectModal
          visible={activePicker === "airport"}
          title="Home Airport"
          subtitle={`Select a departure airport (${countryCode}).`}
          options={airportOptions}
          selectedValue={homeAirport}
          onClose={closePicker}
          onSelect={setHomeAirport}
          allowClear
          clearLabel="Clear Airport"
          clearValue="Not Set"
        />

        <SelectModal
          visible={activePicker === "currency"}
          title="Currency"
          subtitle="Choose the currency used for budgets and comparisons."
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
          subtitle={`Pick a target budget. Alerts are currently: ${alerts}`}
          options={budgetOptions}
          selectedValue={budgetTarget}
          onClose={closePicker}
          onSelect={(v) => setBudgetTarget(v === "Not Set" ? "Not Set" : v)}
          allowClear
          clearLabel="Clear Budget"
          clearValue="Not Set"
        />

        {activePicker === "budget" ? (
          <View style={[styles.alertToggleWrap, { pointerEvents: "box-none" }]}>
            <Pressable
              onPress={() => setAlerts((p) => (p === "Off" ? "On" : "Off"))}
              style={[styles.alertToggle, alerts === "On" && styles.alertToggleOn]}
            >
              <Text style={styles.alertToggleText}>{alerts === "On" ? "Alerts: On" : "Alerts: Off"}</Text>
            </Pressable>
          </View>
        ) : null}
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

  headerLogoMask: {
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "transparent",
    marginTop: 2,
  },
  headerLogoImage: { transform: [{ scale: 1.22 }] },

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

  setupRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  setupStatus: {
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

  setupKicker: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    lineHeight: 14,
  },

  setupValue: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },

  finishBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    minHeight: 70,
    justifyContent: "center",
    alignItems: "center",
  },

  finishBtnOn: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.40)",
  },

  finishBtnOff: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
    opacity: 0.65,
  },

  finishBtnText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.sm,
  },

  setupHint: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

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
    maxWidth: 150,
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

  /* Alerts Toggle Overlay */
  alertToggleWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 22,
    alignItems: "center",
  },

  alertToggle: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  alertToggleOn: {
    borderColor: "rgba(0,255,136,0.30)",
    backgroundColor: "rgba(0,255,136,0.08)",
  },

  alertToggleText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.sm,
  },
});
