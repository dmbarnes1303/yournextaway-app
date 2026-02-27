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

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SelectModal, { type SelectOption } from "@/src/components/SelectModal";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import storage from "@/src/services/storage";

import preferencesStore from "@/src/state/preferences";
import useFollowStore from "@/src/state/followStore";

/* -------------------------------------------------------------------------- */
/* Row UI */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------------------------------- */

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
    if (tz.includes("Europe/Amsterdam")) return "NL";
  } catch {
    // ignore
  }
  return "GB";
}

function cleanUpper3(v: unknown, fallback: string) {
  const s = String(v ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(s) ? s : fallback;
}

function labelForIata(options: SelectOption[], code: string) {
  const c = String(code ?? "").trim().toUpperCase();
  const hit = options.find((o) => String(o.value).toUpperCase() === c);
  return hit?.label ?? c;
}

function planLabel(plan: PlanValue) {
  if (plan === "free") return "Free";
  if (plan === "premium") return "Premium";
  return "Not set";
}

function parseBoolOrDefaultTrue(v: string | null): boolean {
  const s = (v ?? "").trim().toLowerCase();
  if (s === "false") return false;
  if (s === "true") return true;
  return true;
}

/* -------------------------------------------------------------------------- */
/* Storage keys */
/* -------------------------------------------------------------------------- */

const STORAGE_KEYS = {
  plan: "yna:plan",
  currency: "yna:profile.currency",
  language: "yna:profile.language",
  budgetTarget: "yna:profile.budgetTarget",
  alerts: "yna:profile.alerts",
  showIntroOnStartup: "yna:showIntroOnStartup",
};

type PlanValue = "not_set" | "free" | "premium";
type AlertsValue = "On" | "Off";

/* -------------------------------------------------------------------------- */
/* Options */
/* -------------------------------------------------------------------------- */

const UK_ORIGIN_OPTIONS: SelectOption[] = [
  { label: "London (All airports) — LON", value: "LON" },
  { label: "Manchester — MAN", value: "MAN" },
  { label: "Birmingham — BHX", value: "BHX" },
  { label: "Newcastle — NCL", value: "NCL" },
  { label: "Edinburgh — EDI", value: "EDI" },
  { label: "Glasgow — GLA", value: "GLA" },
  { label: "Bristol (South West) — BRS", value: "BRS" },
  { label: "Exeter (Devon) — EXT", value: "EXT" },
  { label: "Newquay (Cornwall) — NQY", value: "NQY" },
  { label: "Bournemouth (Dorset) — BOH", value: "BOH" },
  { label: "Southampton (South Coast) — SOU", value: "SOU" },
  { label: "Cardiff (Wales) — CWL", value: "CWL" },
  { label: "Liverpool — LPL", value: "LPL" },
  { label: "Leeds Bradford — LBA", value: "LBA" },
  { label: "East Midlands — EMA", value: "EMA" },
  { label: "Belfast Intl — BFS", value: "BFS" },
];

const EURO_ORIGIN_OPTIONS: SelectOption[] = [
  { label: "London (All airports) — LON", value: "LON" },
  { label: "Paris (All airports) — PAR", value: "PAR" },
  { label: "Milan (All airports) — MIL", value: "MIL" },
  { label: "Rome (All airports) — ROM", value: "ROM" },
  { label: "Barcelona — BCN", value: "BCN" },
  { label: "Madrid — MAD", value: "MAD" },
  { label: "Amsterdam — AMS", value: "AMS" },
  { label: "Berlin — BER", value: "BER" },
  { label: "Munich — MUC", value: "MUC" },
  { label: "Lisbon — LIS", value: "LIS" },
  { label: "Porto — OPO", value: "OPO" },
  { label: "Vienna — VIE", value: "VIE" },
];

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

/* -------------------------------------------------------------------------- */
/* Screen */
/* -------------------------------------------------------------------------- */

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const LOGO = useMemo(() => require("@/src/yna-logo.png"), []);
  const displayName = useMemo(() => "Guest traveller", []);
  const email = useMemo(() => "Not signed in", []);

  const followedCount = useFollowStore((s) => (Array.isArray(s.followed) ? s.followed.length : 0));

  const countryCode = useMemo(() => getCountryCodeBestEffort(), []);
  const originOptions = useMemo(() => (countryCode === "GB" ? UK_ORIGIN_OPTIONS : EURO_ORIGIN_OPTIONS), [countryCode]);

  const [originIata, setOriginIata] = useState<string>(preferencesStore.getPreferredOriginIata());
  const [originLoaded, setOriginLoaded] = useState<boolean>(preferencesStore.getState().loaded);

  const [plan, setPlan] = useState<PlanValue>("not_set");
  const [currency, setCurrency] = useState(countryCode === "GB" ? "GBP" : "EUR");
  const [language, setLanguage] = useState("English");
  const [budgetTarget, setBudgetTarget] = useState("Not Set");
  const [alerts, setAlerts] = useState<AlertsValue>("Off");
  const [showIntroOnStartup, setShowIntroOnStartup] = useState<boolean>(true);

  const [activePicker, setActivePicker] = useState<null | "origin" | "currency" | "language" | "budget" | "plan">(null);
  const closePicker = useCallback(() => setActivePicker(null), []);

  const logoSize = useMemo(() => {
    const max = 74;
    const min = 58;
    if (width < 360) return min;
    if (width < 410) return 64;
    return max;
  }, [width]);

  const planSummary = useMemo(() => planLabel(plan), [plan]);

  const originSummary = useMemo(() => {
    if (!originLoaded) return "Loading…";
    return labelForIata(originOptions, originIata);
  }, [originIata, originLoaded, originOptions]);

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

  /* --------------------------- preferences load --------------------------- */

  useEffect(() => {
    let mounted = true;

    const sync = () => {
      const s = preferencesStore.getState();
      if (!mounted) return;
      setOriginLoaded(!!s.loaded);
      setOriginIata(cleanUpper3(s.preferredOriginIata, "LON"));
    };

    const unsub = preferencesStore.subscribe(sync);
    sync();

    if (!preferencesStore.getState().loaded) {
      preferencesStore.load().finally(sync);
    }

    return () => {
      mounted = false;
      try {
        unsub();
      } catch {
        // ignore
      }
    };
  }, []);

  /* ------------------------ load local profile prefs ---------------------- */

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [storedPlan, storedCurrency, storedLanguage, storedBudget, storedAlerts, storedShowIntro] =
          await Promise.all([
            storage.getString(STORAGE_KEYS.plan),
            storage.getString(STORAGE_KEYS.currency),
            storage.getString(STORAGE_KEYS.language),
            storage.getString(STORAGE_KEYS.budgetTarget),
            storage.getString(STORAGE_KEYS.alerts),
            storage.getString(STORAGE_KEYS.showIntroOnStartup),
          ]);

        if (!mounted) return;

        if (storedPlan === "free" || storedPlan === "premium") setPlan(storedPlan);
        if (storedCurrency) setCurrency(storedCurrency);
        if (storedLanguage) setLanguage(storedLanguage);
        if (storedBudget) setBudgetTarget(storedBudget);
        if (storedAlerts === "On" || storedAlerts === "Off") setAlerts(storedAlerts);
        setShowIntroOnStartup(parseBoolOrDefaultTrue(storedShowIntro));
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* ------------------------------ persist prefs --------------------------- */

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          storage.setString(STORAGE_KEYS.plan, plan),
          storage.setString(STORAGE_KEYS.currency, currency),
          storage.setString(STORAGE_KEYS.language, language),
          storage.setString(STORAGE_KEYS.budgetTarget, budgetTarget),
          storage.setString(STORAGE_KEYS.alerts, alerts),
          storage.setString(STORAGE_KEYS.showIntroOnStartup, showIntroOnStartup ? "true" : "false"),
        ]);
      } catch {
        // ignore
      }
    })();
  }, [alerts, budgetTarget, currency, language, plan, showIntroOnStartup]);

  /* ------------------------------ actions -------------------------------- */

  const onSelectOrigin = useCallback(async (v: string) => {
    const code = cleanUpper3(v, "LON");
    setOriginIata(code);
    try {
      await preferencesStore.setPreferredOriginIata(code);
    } catch {
      // best-effort
    }
  }, []);

  const openFollowing = useCallback(() => {
    router.push("/following" as any);
  }, [router]);

  const openFAQ = useCallback(() => {
    showInfo(
      "FAQ",
      "How it works:\n• Start with a fixture\n• Follow it for kickoff alerts\n• Save it as a trip\n• Build everything else in one place (travel, stay, tickets, what to do)\n\nIf anything feels unclear, we tighten the flow."
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
      "Trips and notes are stored locally by default.\n\nWhen sync is enabled, you’ll be able to use the app across devices."
    );
  }, []);

  const terms = useCallback(() => {
    showInfo("Terms", "Terms will be available here.");
  }, []);

  const resetDefaults = useCallback(() => {
    Alert.alert("Reset defaults?", "This restores the default preferences on this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          try {
            await Promise.all([
              storage.setString(STORAGE_KEYS.plan, "not_set"),
              storage.setString(STORAGE_KEYS.currency, countryCode === "GB" ? "GBP" : "EUR"),
              storage.setString(STORAGE_KEYS.language, "English"),
              storage.setString(STORAGE_KEYS.budgetTarget, "Not Set"),
              storage.setString(STORAGE_KEYS.alerts, "Off"),
              storage.setString(STORAGE_KEYS.showIntroOnStartup, "true"),
              preferencesStore.setPreferredOriginIata("LON"),
            ]);

            setPlan("not_set");
            setCurrency(countryCode === "GB" ? "GBP" : "EUR");
            setLanguage("English");
            setBudgetTarget("Not Set");
            setAlerts("Off");
            setOriginIata("LON");
            setShowIntroOnStartup(true);

            Alert.alert("Reset complete", "Defaults restored.");
          } catch {
            Alert.alert("Reset failed", "Couldn’t reset defaults.");
          }
        },
      },
    ]);
  }, [countryCode]);

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
              <Image
                source={LOGO}
                style={{ width: logoSize, height: logoSize, transform: [{ scale: 1.15 }] }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* ACCOUNT (compact, not a dashboard) */}
          <GlassCard style={styles.card} strength="default">
            <View style={styles.accountTop}>
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

            <Row
              title="Following"
              subtitle="Kickoff alerts and updates"
              value={`${followedCount} match${followedCount === 1 ? "" : "es"}`}
              onPress={openFollowing}
              last
            />
          </GlassCard>

          {/* DEFAULTS */}
          <GlassCard style={[styles.card, { padding: 0 }]} strength="subtle" noPadding>
            <View style={styles.listHeader}>
              <Text style={styles.sectionH}>Your defaults</Text>
              <Text style={styles.listSub}>{`Region: ${countryCode}`}</Text>
            </View>

            <Row
              title="Show intro on startup"
              subtitle="Landing + onboarding will appear when you open the app"
              rightSlot={
                <View style={styles.switchWrap}>
                  <Switch value={showIntroOnStartup} onValueChange={(v) => setShowIntroOnStartup(!!v)} />
                </View>
              }
            />

            <Row
              title="Departure city"
              subtitle="Used to prefill flight searches (IATA city code)"
              value={originSummary}
              onPress={() => setActivePicker("origin")}
            />

            <Row title="Currency" subtitle="Budgets and comparisons" value={currency} onPress={() => setActivePicker("currency")} />
            <Row title="Language" subtitle="App language" value={language} onPress={() => setActivePicker("language")} />

            <Row
              title="Budget"
              subtitle={budgetTarget === "Not Set" ? "Optional" : "Target budget for quick planning"}
              value={budgetTarget === "Not Set" ? "Not set" : `${currency} ${budgetTarget}`}
              onPress={() => setActivePicker("budget")}
            />

            <Row
              title="Budget alerts"
              subtitle="Quiet, useful drop alerts"
              rightSlot={
                <View style={styles.switchWrap}>
                  <Switch value={alerts === "On"} onValueChange={(v) => setAlerts(v ? "On" : "Off")} />
                </View>
              }
              last
            />

            <View style={styles.resetWrap}>
              <Pressable onPress={resetDefaults} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
                <Text style={styles.resetText}>Reset defaults</Text>
              </Pressable>
            </View>
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
          subtitle="Pick Free or Premium."
          options={PLAN_OPTIONS}
          selectedValue={plan === "not_set" ? "" : plan}
          onClose={closePicker}
          onSelect={(v) => setPlan(v === "free" || v === "premium" ? v : "not_set")}
          allowClear
          clearLabel="Clear plan"
          clearValue=""
        />

        <SelectModal
          visible={activePicker === "origin"}
          title="Departure city"
          subtitle="Pick an IATA city/airport code used to prefill flight searches."
          options={originOptions}
          selectedValue={cleanUpper3(originIata, "LON")}
          onClose={closePicker}
          onSelect={onSelectOrigin}
          allowClear
          clearLabel="Reset to London (LON)"
          clearValue="LON"
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
          subtitle={alerts === "On" ? "Alerts on" : "Alerts off"}
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

  accountTop: { flexDirection: "row", alignItems: "center", gap: 12 },

  name: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.black },
  meta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

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
    marginBottom: 4,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  sectionH: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.black },

  listHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 10,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    justifyContent: "space-between",
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
    maxWidth: 190,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
    marginRight: 2,
  },

  switchWrap: { marginRight: 2 },

  chev: { color: theme.colors.textSecondary, fontSize: 26, marginTop: -2 },

  resetWrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 12,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  resetText: { color: "rgba(255,120,120,0.95)", fontWeight: "900" },

  footerNote: {
    textAlign: "center",
    color: "rgba(0,255,136,0.80)",
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
    marginTop: 2,
  },
});
