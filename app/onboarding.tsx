// app/onboarding.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Animated, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import SelectModal, { type SelectOption } from "@/src/components/SelectModal";
import { getBackgroundSource, type BackgroundKey } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import storage from "@/src/services/storage";

const LOGO = require("@/src/yna-logo.png");

type AlertsValue = "On" | "Off";

// Only allow onboarding keys (tied to BackgroundKey so it can't drift)
type OnboardingBgKey = Extract<BackgroundKey, "onboarding1" | "onboarding2" | "onboarding3" | "onboarding4">;

type ExplainStep = {
  title: string;
  subtitle: string;
  body: string;
  bgKey: Extract<OnboardingBgKey, "onboarding1" | "onboarding2" | "onboarding3">;
};

const STEPS: ExplainStep[] = [
  {
    title: "Start With A Fixture",
    subtitle: "Find The Right Match For Your Dates",
    body:
      "Browse fixtures across the top leagues, lock in your date window, and open a match to anchor the trip. From that moment, YourNextAway turns the fixture into a complete city-break plan.",
    bgKey: "onboarding1",
  },
  {
    title: "Build The Trip In One Hub",
    subtitle: "Flights, Stays, Tickets, And Notes Together",
    body:
      "Compare travel options, shortlist where to stay, and keep ticket links and trip notes organised in one place. Plan midweek bargains or weekend breaks without juggling tabs, screenshots, and group chats.",
    bgKey: "onboarding2",
  },
  {
    title: "Make The City Break Better",
    subtitle: "What To Do, Where To Base Yourself",
    body:
      "Use city and team guidance to shape the trip beyond the match. Build a simple itinerary, then store bookings and references so everything is ready when you travel.",
    bgKey: "onboarding3",
  },
];

const STORAGE_KEYS = {
  seenLanding: "yna:seenLanding",
  setupComplete: "yna:setupComplete",
  homeAirport: "yna:profile.homeAirport",
  currency: "yna:profile.currency",
  budgetTarget: "yna:profile.budgetTarget",
  alerts: "yna:profile.alerts",
};

/**
 * TUNING KNOBS
 * - BRAND_TOP: higher = brand sits lower (moves DOWN)
 * - CARD_RAISE: higher = card moves up more (exposes background)
 */
const BRAND_TOP = 18;
const CARD_RAISE = 14;

const CURRENCY_OPTIONS: SelectOption[] = [
  { label: "GBP (£)", value: "GBP" },
  { label: "EUR (€)", value: "EUR" },
  { label: "USD ($)", value: "USD" },
];

// Keep deterministic + reliable (no Intl quirks)
function getCountryCodeBestEffort(): string {
  return "GB";
}

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
  ],
};

export default function Onboarding() {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0); // 0..2 explain, 3 prefs
  const isPrefsStep = stepIndex === 3;

  // Pref state
  const countryCode = useMemo(() => getCountryCodeBestEffort(), []);
  const airportOptions = useMemo(() => AIRPORTS_BY_COUNTRY[countryCode] ?? AIRPORTS_BY_COUNTRY.GB, [countryCode]);

  const [homeAirport, setHomeAirport] = useState<string>("Not Set");
  const [currency, setCurrency] = useState<string>(countryCode === "GB" ? "GBP" : "EUR");
  const [budgetTarget, setBudgetTarget] = useState<string>("Not Set");
  const [alerts, setAlerts] = useState<AlertsValue>("Off");

  const [activePicker, setActivePicker] = useState<null | "airport" | "currency" | "budget">(null);
  const closePicker = useCallback(() => setActivePicker(null), []);

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

  const budgetSummary = useMemo(() => {
    const b = budgetTarget === "Not Set" ? "Not set" : `${currency} ${budgetTarget}`;
    return alerts === "On" ? `${b} • Alerts on` : `${b} • Alerts off`;
  }, [alerts, budgetTarget, currency]);

  // Explain animation only
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPrefsStep) return;

    opacity.setValue(0);
    translateY.setValue(10);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [stepIndex, isPrefsStep, opacity, translateY]);

  // Hydrate stored prefs once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [sAirport, sCurrency, sBudget, sAlerts] = await Promise.all([
        storage.getString(STORAGE_KEYS.homeAirport),
        storage.getString(STORAGE_KEYS.currency),
        storage.getString(STORAGE_KEYS.budgetTarget),
        storage.getString(STORAGE_KEYS.alerts),
      ]);

      if (cancelled) return;

      if (sAirport) setHomeAirport(sAirport);
      if (sCurrency) setCurrency(sCurrency);
      if (sBudget) setBudgetTarget(sBudget);
      if (sAlerts === "On" || sAlerts === "Off") setAlerts(sAlerts);
    })().catch(() => {
      // ignore
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Background selection: step 4 must use onboarding4
  const bgKey: OnboardingBgKey = isPrefsStep ? "onboarding4" : STEPS[stepIndex].bgKey;
  const bgSource = getBackgroundSource(bgKey);

  const goHome = useCallback(() => {
    router.replace("/(tabs)/home");
  }, [router]);

  const next = useCallback(() => {
    setStepIndex((n) => Math.min(n + 1, 3));
  }, []);

  const back = useCallback(() => {
    setStepIndex((n) => Math.max(n - 1, 0));
  }, []);

  const complete = useCallback(async () => {
    try {
      await storage.setString(STORAGE_KEYS.seenLanding, "true");
      await Promise.all([
        storage.setString(STORAGE_KEYS.homeAirport, homeAirport),
        storage.setString(STORAGE_KEYS.currency, currency),
        storage.setString(STORAGE_KEYS.budgetTarget, budgetTarget),
        storage.setString(STORAGE_KEYS.alerts, alerts),
        storage.setString(STORAGE_KEYS.setupComplete, "true"),
      ]);
    } catch {
      // still allow continue
    }
    goHome();
  }, [alerts, budgetTarget, currency, goHome, homeAirport]);

  const dotColors = [
    theme.colors.primary,
    theme.colors.accent ?? theme.colors.primary,
    theme.colors.warning ?? theme.colors.primary,
    theme.colors.primary,
  ];

  const stepLabel = isPrefsStep ? "Step 4 of 4" : `Step ${stepIndex + 1} of 4`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={bgSource} overlayOpacity={0.68}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.screen}>
            {/* Top row */}
            <View style={styles.topRow}>
              {stepIndex > 0 ? (
                <Pressable onPress={back} style={styles.pill} hitSlop={10}>
                  <Text style={styles.pillText}>Back</Text>
                </Pressable>
              ) : (
                <View style={{ width: 72 }} />
              )}

              <Pressable
                onPress={() => {
                  Alert.alert("Skip onboarding?", "You can set preferences later in Profile.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Skip", style: "default", onPress: goHome },
                  ]);
                }}
                style={styles.pill}
                hitSlop={10}
              >
                <Text style={styles.pillText}>Skip</Text>
              </Pressable>
            </View>

            {/* Brand */}
            <View style={[styles.brand, { marginTop: BRAND_TOP }]}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
              <Text style={styles.tagline}>Plan • Fly • Watch • Repeat</Text>
            </View>

            {/* Card */}
            <View style={[styles.cardWrap, { transform: [{ translateY: -CARD_RAISE }] }]}>
              <View style={styles.card}>
                {!isPrefsStep ? (
                  <Animated.View style={{ opacity, transform: [{ translateY }] }}>
                    <Text style={styles.kicker}>{stepLabel}</Text>

                    <Text style={styles.h1}>{STEPS[stepIndex].title}</Text>
                    <Text style={styles.h2}>{STEPS[stepIndex].subtitle}</Text>
                    <Text style={styles.body}>{STEPS[stepIndex].body}</Text>

                    <View style={styles.dots}>
                      {Array.from({ length: 4 }).map((_, idx) => {
                        const active = idx === stepIndex;
                        const color = dotColors[idx] ?? theme.colors.primary;
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.dot,
                              {
                                backgroundColor: active ? color : "rgba(255,255,255,0.12)",
                                borderColor: active ? color : "rgba(255,255,255,0.12)",
                              },
                            ]}
                          />
                        );
                      })}
                    </View>

                    <View style={styles.actions}>
                      <Pressable onPress={goHome} style={[styles.btn, styles.btnGhost]}>
                        <Text style={styles.btnGhostText}>Skip For Now</Text>
                      </Pressable>

                      <Pressable onPress={next} style={[styles.btn, styles.btnPrimary]}>
                        <Text style={styles.btnPrimaryText}>Continue</Text>
                      </Pressable>
                    </View>

                    <Text style={styles.micro}>Football-first city breaks. Planned properly.</Text>
                  </Animated.View>
                ) : (
                  <View>
                    <Text style={styles.kicker}>{stepLabel}</Text>
                    <Text style={styles.h1}>Set your defaults</Text>
                    <Text style={styles.h2}>So fixtures and budgets feel personal</Text>
                    <Text style={styles.body}>
                      Optional. You can change any of this later in Profile. We use it to pre-fill comparisons and quick picks.
                    </Text>

                    <View style={styles.prefList}>
                      <Pressable onPress={() => setActivePicker("airport")} style={[styles.prefRow, styles.prefRowFirst]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.prefTitle}>Home airport</Text>
                          <Text style={styles.prefSub}>Departure defaults</Text>
                        </View>
                        <Text style={styles.prefValue} numberOfLines={1}>
                          {homeAirport === "Not Set" ? "Not set" : homeAirport}
                        </Text>
                        <Text style={styles.chev}>›</Text>
                      </Pressable>

                      <Pressable onPress={() => setActivePicker("currency")} style={styles.prefRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.prefTitle}>Currency</Text>
                          <Text style={styles.prefSub}>Budgets and comparisons</Text>
                        </View>
                        <Text style={styles.prefValue}>{currency}</Text>
                        <Text style={styles.chev}>›</Text>
                      </Pressable>

                      <Pressable onPress={() => setActivePicker("budget")} style={styles.prefRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.prefTitle}>Budget</Text>
                          <Text style={styles.prefSub}>Optional target</Text>
                        </View>
                        <Text style={styles.prefValue} numberOfLines={1}>
                          {budgetTarget === "Not Set" ? "Not set" : `${currency} ${budgetTarget}`}
                        </Text>
                        <Text style={styles.chev}>›</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setAlerts((v) => (v === "On" ? "Off" : "On"))}
                        style={[styles.prefRow, styles.prefRowLast]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.prefTitle}>Alerts</Text>
                          <Text style={styles.prefSub}>Quiet, useful drops</Text>
                        </View>
                        <View style={styles.alertPill}>
                          <Text style={styles.alertPillText}>{alerts}</Text>
                        </View>
                      </Pressable>
                    </View>

                    <View style={styles.dots}>
                      {Array.from({ length: 4 }).map((_, idx) => {
                        const active = idx === 3;
                        const color = dotColors[idx] ?? theme.colors.primary;
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.dot,
                              {
                                backgroundColor: active ? color : "rgba(255,255,255,0.12)",
                                borderColor: active ? color : "rgba(255,255,255,0.12)",
                                opacity: active ? 1 : 0.6,
                              },
                            ]}
                          />
                        );
                      })}
                    </View>

                    <View style={styles.actions}>
                      <Pressable onPress={goHome} style={[styles.btn, styles.btnGhost]}>
                        <Text style={styles.btnGhostText}>Skip For Now</Text>
                      </Pressable>

                      <Pressable onPress={complete} style={[styles.btn, styles.btnPrimary]}>
                        <Text style={styles.btnPrimaryText}>Browse Fixtures</Text>
                      </Pressable>
                    </View>

                    <Text style={styles.micro}>You’re set. Fixtures next.</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Mount modals only when needed */}
            {activePicker === "airport" ? (
              <SelectModal
                visible
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
            ) : null}

            {activePicker === "currency" ? (
              <SelectModal
                visible
                title="Currency"
                subtitle="Used for budgets and comparisons."
                options={CURRENCY_OPTIONS}
                selectedValue={currency}
                onClose={closePicker}
                onSelect={setCurrency}
              />
            ) : null}

            {activePicker === "budget" ? (
              <SelectModal
                visible
                title="Budget"
                subtitle={budgetSummary}
                options={budgetOptions}
                selectedValue={budgetTarget}
                onClose={closePicker}
                onSelect={(v) => setBudgetTarget(v === "Not Set" ? "Not Set" : v)}
                allowClear
                clearLabel="Clear budget"
                clearValue="Not Set"
              />
            ) : null}
          </View>
        </SafeAreaView>
      </Background>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  screen: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 12,
    paddingBottom: theme.spacing.lg,
    justifyContent: "space-between",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 72,
    alignItems: "center",
  },

  pillText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
  },

  brand: { alignItems: "center", gap: 6 },

  logo: { width: 110, height: 110 },

  tagline: {
    color: theme.colors.primary,
    fontWeight: "900",
    letterSpacing: 0.6,
    fontSize: theme.fontSize.sm,
  },

  cardWrap: {
    paddingBottom: theme.spacing.lg,
  },

  // transparent + premium, NO blur
  card: {
    padding: theme.spacing.lg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
    backgroundColor: "rgba(0,0,0,0.055)",
  },

  kicker: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    marginBottom: 8,
    fontSize: theme.fontSize.xs,
  },

  h1: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: "900",
    lineHeight: Platform.select({ ios: 34, android: 34, default: 34 }),
  },

  h2: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
    marginTop: 6,
    marginBottom: 10,
    opacity: 0.92,
  },

  body: {
    color: "rgba(255,255,255,0.70)",
    fontSize: theme.fontSize.md,
    lineHeight: 22,
    fontWeight: "700",
  },

  dots: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 1,
  },

  actions: {
    marginTop: theme.spacing.lg,
    flexDirection: "row",
    gap: 12,
  },

  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },

  btnPrimary: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.50)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },

  btnGhost: {
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  btnGhostText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },

  micro: {
    marginTop: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    fontSize: theme.fontSize.xs,
    fontWeight: "800",
  },

  prefList: {
    marginTop: 14,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },

  prefRowFirst: { borderTopWidth: 0 },
  prefRowLast: {},

  prefTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: "900",
  },

  prefSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: "800",
  },

  prefValue: {
    maxWidth: 180,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
    marginRight: 2,
  },

  chev: { color: theme.colors.textSecondary, fontSize: 26, marginTop: -2 },

  alertPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.24)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  alertPillText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
  },
});
