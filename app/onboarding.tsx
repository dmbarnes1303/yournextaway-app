// app/onboarding.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import SelectModal, { type SelectOption } from "@/src/components/SelectModal";
import { getBackgroundSource } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import storage from "@/src/services/storage";

const LOGO = require("@/src/yna-logo.png");

type StepBg =
  | "onboarding1"
  | "onboarding2"
  | "onboarding3"
  | "onboarding4";

type ExplainStep = {
  title: string;
  subtitle: string;
  body: string;
  bgKey: StepBg;
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

type AlertsValue = "On" | "Off";

const BRAND_TOP = 18;
const CARD_RAISE = 14;

const CURRENCY_OPTIONS: SelectOption[] = [
  { label: "GBP (£)", value: "GBP" },
  { label: "EUR (€)", value: "EUR" },
  { label: "USD ($)", value: "USD" },
];

function getCountryCodeBestEffort() {
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
  ],
};

export default function Onboarding() {
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const isPrefsStep = stepIndex === 3;

  const countryCode = useMemo(() => getCountryCodeBestEffort(), []);
  const airportOptions = AIRPORTS_BY_COUNTRY[countryCode];

  const [homeAirport, setHomeAirport] = useState("Not Set");
  const [currency, setCurrency] = useState("GBP");
  const [budgetTarget, setBudgetTarget] = useState("Not Set");
  const [alerts, setAlerts] = useState<AlertsValue>("Off");

  const [activePicker, setActivePicker] =
    useState<null | "airport" | "currency" | "budget">(null);

  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPrefsStep) return;

    opacity.setValue(0);
    translateY.setValue(10);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stepIndex]);

  const bgKey: StepBg = isPrefsStep
    ? "onboarding4"
    : STEPS[stepIndex].bgKey;

  const bgSource = getBackgroundSource(bgKey);

  const goHome = () => router.replace("/(tabs)/home");

  const next = () => setStepIndex((s) => Math.min(s + 1, 3));
  const back = () => setStepIndex((s) => Math.max(s - 1, 0));

  const complete = async () => {
    await storage.setString(STORAGE_KEYS.seenLanding, "true");
    await storage.setString(STORAGE_KEYS.setupComplete, "true");
    await storage.setString(STORAGE_KEYS.homeAirport, homeAirport);
    await storage.setString(STORAGE_KEYS.currency, currency);
    await storage.setString(STORAGE_KEYS.budgetTarget, budgetTarget);
    await storage.setString(STORAGE_KEYS.alerts, alerts);
    goHome();
  };

  const stepLabel = isPrefsStep
    ? "Step 4 of 4"
    : `Step ${stepIndex + 1} of 4`;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Background imageSource={bgSource} overlayOpacity={0.68}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.screen}>
            {/* Top */}
            <View style={styles.topRow}>
              {stepIndex > 0 ? (
                <Pressable onPress={back} style={styles.pill}>
                  <Text style={styles.pillText}>Back</Text>
                </Pressable>
              ) : (
                <View style={{ width: 72 }} />
              )}

              <Pressable
                onPress={() =>
                  Alert.alert("Skip onboarding?", "", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Skip", onPress: goHome },
                  ])
                }
                style={styles.pill}
              >
                <Text style={styles.pillText}>Skip</Text>
              </Pressable>
            </View>

            {/* Brand */}
            <View style={[styles.brand, { marginTop: BRAND_TOP }]}>
              <Image source={LOGO} style={styles.logo} />
              <Text style={styles.tagline}>
                Plan • Fly • Watch • Repeat
              </Text>
            </View>

            {/* Card */}
            <View style={{ transform: [{ translateY: -CARD_RAISE }] }}>
              <View style={styles.card}>
                {!isPrefsStep ? (
                  <Animated.View
                    style={{ opacity, transform: [{ translateY }] }}
                  >
                    <Text style={styles.kicker}>{stepLabel}</Text>
                    <Text style={styles.h1}>
                      {STEPS[stepIndex].title}
                    </Text>
                    <Text style={styles.h2}>
                      {STEPS[stepIndex].subtitle}
                    </Text>
                    <Text style={styles.body}>
                      {STEPS[stepIndex].body}
                    </Text>

                    <View style={styles.actions}>
                      <Pressable
                        onPress={goHome}
                        style={[styles.btn, styles.btnGhost]}
                      >
                        <Text style={styles.btnGhostText}>
                          Skip For Now
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={next}
                        style={[styles.btn, styles.btnPrimary]}
                      >
                        <Text style={styles.btnPrimaryText}>
                          Continue
                        </Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                ) : (
                  <View>
                    <Text style={styles.kicker}>{stepLabel}</Text>
                    <Text style={styles.h1}>Set your defaults</Text>
                    <Text style={styles.h2}>
                      So fixtures and budgets feel personal
                    </Text>

                    <View style={styles.prefList}>
                      <Pressable
                        onPress={() => setActivePicker("airport")}
                        style={styles.prefRow}
                      >
                        <Text style={styles.prefTitle}>
                          Home airport
                        </Text>
                        <Text style={styles.prefValue}>
                          {homeAirport}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setActivePicker("currency")}
                        style={styles.prefRow}
                      >
                        <Text style={styles.prefTitle}>Currency</Text>
                        <Text style={styles.prefValue}>{currency}</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setActivePicker("budget")}
                        style={styles.prefRow}
                      >
                        <Text style={styles.prefTitle}>Budget</Text>
                        <Text style={styles.prefValue}>
                          {budgetTarget}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          setAlerts((a) =>
                            a === "On" ? "Off" : "On"
                          )
                        }
                        style={styles.prefRow}
                      >
                        <Text style={styles.prefTitle}>Alerts</Text>
                        <Text style={styles.prefValue}>{alerts}</Text>
                      </Pressable>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        onPress={goHome}
                        style={[styles.btn, styles.btnGhost]}
                      >
                        <Text style={styles.btnGhostText}>
                          Skip For Now
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={complete}
                        style={[styles.btn, styles.btnPrimary]}
                      >
                        <Text style={styles.btnPrimaryText}>
                          Browse Fixtures
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Modals */}
            {activePicker === "airport" && (
              <SelectModal
                visible
                title="Home airport"
                options={airportOptions}
                selectedValue={homeAirport}
                onSelect={setHomeAirport}
                onClose={() => setActivePicker(null)}
              />
            )}

            {activePicker === "currency" && (
              <SelectModal
                visible
                title="Currency"
                options={CURRENCY_OPTIONS}
                selectedValue={currency}
                onSelect={setCurrency}
                onClose={() => setActivePicker(null)}
              />
            )}

            {activePicker === "budget" && (
              <SelectModal
                visible
                title="Budget"
                options={[
                  { label: "Not set", value: "Not Set" },
                  { label: "150", value: "150" },
                  { label: "250", value: "250" },
                  { label: "350", value: "350" },
                ]}
                selectedValue={budgetTarget}
                onSelect={setBudgetTarget}
                onClose={() => setActivePicker(null)}
              />
            )}
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
    padding: theme.spacing.lg,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  pillText: { color: theme.colors.textSecondary },
  brand: { alignItems: "center", gap: 6 },
  logo: { width: 110, height: 110 },
  tagline: { color: theme.colors.primary, fontWeight: "900" },
  card: {
    padding: theme.spacing.lg,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  kicker: { color: theme.colors.textSecondary },
  h1: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: "900",
  },
  h2: {
    color: theme.colors.text,
    fontWeight: "800",
    marginTop: 6,
  },
  body: { color: "rgba(255,255,255,0.7)", marginTop: 6 },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  btnPrimary: {
    borderColor: theme.colors.primary,
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900" },
  btnGhost: {
    borderColor: theme.colors.border,
  },
  btnGhostText: { color: theme.colors.textSecondary },
  prefList: {
    marginTop: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
  prefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  prefTitle: { color: theme.colors.text },
  prefValue: { color: theme.colors.textSecondary },
});
