// app/(tabs)/profile.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

/* --------------------------------- Types --------------------------------- */

type RowProps = {
  title: string;
  subtitle?: string;
  rightText?: string;
  onPress: () => void;
  last?: boolean;
};

type Option = { label: string; value: string };

/* ------------------------------- UI Pieces ------------------------------- */

function Row({ title, subtitle, rightText, onPress, last }: RowProps) {
  return (
    <Pressable onPress={onPress} style={[styles.row, last && styles.rowLast]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>

      {rightText ? <Text style={styles.rowRight} numberOfLines={1}>{rightText}</Text> : null}
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

function showInfo(title: string, body: string) {
  Alert.alert(title, body);
}

/**
 * IMPORTANT:
 * Android Alert only shows ~3 buttons, so it truncates long option lists.
 * This modal picker is the cross-device fix.
 */
function SelectModal({
  visible,
  title,
  subtitle,
  options,
  selectedValue,
  onClose,
  onSelect,
  allowClear,
  clearLabel = "Clear",
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: Option[];
  selectedValue?: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  allowClear?: boolean;
  clearLabel?: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s));
  }, [options, q]);

  const renderItem = useCallback(
    ({ item }: { item: Option }) => {
      const active = selectedValue === item.value;
      return (
        <Pressable
          onPress={() => {
            onSelect(item.value);
            setQ("");
            onClose();
          }}
          style={[styles.pickRow, active && styles.pickRowActive]}
        >
          <Text style={[styles.pickRowText, active && styles.pickRowTextActive]} numberOfLines={1}>
            {item.label}
          </Text>
          {active ? <Text style={styles.pickTick}>✓</Text> : null}
        </Pressable>
      );
    },
    [onClose, onSelect, selectedValue]
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalWrap}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <GlassCard style={styles.modalCard} intensity={26}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{title}</Text>
              {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
            </View>

            <Pressable onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search…"
              placeholderTextColor="rgba(255,255,255,0.40)"
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            style={styles.pickList}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          />

          {allowClear ? (
            <Pressable
              onPress={() => {
                onSelect("Not Set");
                setQ("");
                onClose();
              }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>{clearLabel}</Text>
            </Pressable>
          ) : null}
        </GlassCard>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Best-effort country code (no extra libs).
 * Locale sometimes includes region (en-GB). Timezone fallback for top 5.
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

/* ------------------------------- Data Sets ------------------------------- */
/**
 * Keep this list intentionally “major airports”.
 * Expand whenever you add a new league/country.
 */
const AIRPORTS_BY_COUNTRY: Record<string, Option[]> = {
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

const CURRENCY_OPTIONS: Option[] = [
  { label: "GBP (£)", value: "GBP" },
  { label: "EUR (€)", value: "EUR" },
  { label: "USD ($)", value: "USD" },
];

const LANGUAGE_OPTIONS: Option[] = [
  { label: "English", value: "English" },
  { label: "Spanish", value: "Spanish" },
  { label: "Italian", value: "Italian" },
  { label: "German", value: "German" },
  { label: "French", value: "French" },
];

/* -------------------------------- Screen -------------------------------- */

export default function ProfileScreen() {
  const LOGO = useMemo(() => require("@/src/yna-logo.png"), []);

  // Guest identity until auth exists
  const displayName = useMemo(() => "Guest Traveller", []);
  const email = useMemo(() => "Not Signed In", []);
  const planName = useMemo(() => "Full Access", []);

  // Defaults (stateful for future persistence)
  const [homeAirport, setHomeAirport] = useState<string>("Not Set");
  const [currency, setCurrency] = useState<string>("GBP");
  const [language, setLanguage] = useState<string>("English");
  const [budgetTarget, setBudgetTarget] = useState<string>("Not Set");
  const [alerts, setAlerts] = useState<string>("Off");

  // Pickers (Modal instead of Alert due to Android button limits)
  const [airportOpen, setAirportOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);

  const countryCode = useMemo(() => getCountryCodeBestEffort(), []);
  const airportOptions = useMemo<Option[]>(() => AIRPORTS_BY_COUNTRY[countryCode] ?? AIRPORTS_BY_COUNTRY.GB, [countryCode]);

  const budgetSummary = useMemo(() => {
    if (budgetTarget === "Not Set") return "Not Set";
    return `${currency} ${budgetTarget}${alerts === "On" ? " • Alerts On" : " • Alerts Off"}`;
  }, [alerts, budgetTarget, currency]);

  // Actions
  const openPreferences = useCallback(() => {
    showInfo(
      "Preferences",
      "Set your planning defaults here: date window, league coverage, sorting, and general behaviour.\n\nNext: wire this into the core fixture + trip build flow."
    );
  }, []);

  const openNotifications = useCallback(() => {
    showInfo("Notifications", "Fixture reminders and trip prompts.\n\nKeep it quiet and useful: no spam, no noise.");
  }, []);

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

  const budgetOptions = useMemo<Option[]>(() => {
    // Keep it simple for now; you can replace with a real input later.
    return [
      { label: `Not Set`, value: "Not Set" },
      { label: `${currency} 150`, value: "150" },
      { label: `${currency} 250`, value: "250" },
      { label: `${currency} 350`, value: "350" },
      { label: `${currency} 500`, value: "500" },
      { label: `${currency} 750`, value: "750" },
    ];
  }, [currency]);

  return (
    <Background imageUrl={getBackground("profile")} overlayOpacity={0.70}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with top-right logo */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Account, Preferences, And App Info</Text>
            </View>

            {/* Logo: bigger, no “outer-circle UI” (crop/zoom inside mask). */}
            <View style={styles.headerLogoMask} pointerEvents="none">
              <Image source={LOGO} style={styles.headerLogoImage} resizeMode="cover" />
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
              <Pressable onPress={() => setAirportOpen(true)} style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Home Airport</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {homeAirport}
                </Text>
              </Pressable>

              <Pressable onPress={() => setCurrencyOpen(true)} style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Currency</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {currency}
                </Text>
              </Pressable>
            </View>

            <View style={styles.defaultsRow}>
              <Pressable onPress={() => setLanguageOpen(true)} style={styles.defaultChip}>
                <Text style={styles.defaultKicker}>Language</Text>
                <Text style={styles.defaultValue} numberOfLines={1}>
                  {language}
                </Text>
              </Pressable>

              <Pressable onPress={() => setBudgetOpen(true)} style={styles.defaultChip}>
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
            <Row
              title="Preferences"
              subtitle="Date Window, League Coverage, And Planning Behaviour"
              onPress={openPreferences}
            />
            <Row
              title="Home Airport"
              subtitle={`Departure Defaults For Comparisons (${countryCode})`}
              rightText={homeAirport}
              onPress={() => setAirportOpen(true)}
            />
            <Row
              title="Currency"
              subtitle="Budgets And Comparisons"
              rightText={currency}
              onPress={() => setCurrencyOpen(true)}
            />
            <Row
              title="Notifications"
              subtitle="Fixture Reminders And Trip Prompts"
              onPress={openNotifications}
            />
            <Row
              title="Language"
              subtitle="App Language"
              rightText={language}
              onPress={() => setLanguageOpen(true)}
            />
            <Row
              title="Budget & Alerts"
              subtitle="Target Budget And Drop Alerts"
              rightText={budgetTarget === "Not Set" ? "Not Set" : budgetSummary}
              onPress={() => setBudgetOpen(true)}
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

        {/* Airport Picker */}
        <SelectModal
          visible={airportOpen}
          title="Home Airport"
          subtitle={`Select a departure airport (${countryCode}).`}
          options={airportOptions}
          selectedValue={homeAirport}
          onClose={() => setAirportOpen(false)}
          onSelect={(v) => setHomeAirport(v)}
          allowClear
          clearLabel="Clear Airport"
        />

        {/* Currency Picker */}
        <SelectModal
          visible={currencyOpen}
          title="Currency"
          subtitle="Choose the currency used for budgets and comparisons."
          options={CURRENCY_OPTIONS}
          selectedValue={currency}
          onClose={() => setCurrencyOpen(false)}
          onSelect={(v) => setCurrency(v)}
        />

        {/* Language Picker */}
        <SelectModal
          visible={languageOpen}
          title="Language"
          subtitle="Select your language."
          options={LANGUAGE_OPTIONS}
          selectedValue={language}
          onClose={() => setLanguageOpen(false)}
          onSelect={(v) => setLanguage(v)}
        />

        {/* Budget & Alerts */}
        <SelectModal
          visible={budgetOpen}
          title="Budget & Alerts"
          subtitle={`Pick a target budget. Alerts are currently: ${alerts}`}
          options={budgetOptions}
          selectedValue={budgetTarget}
          onClose={() => setBudgetOpen(false)}
          onSelect={(v) => {
            if (v === "Not Set") {
              setBudgetTarget("Not Set");
              return;
            }
            setBudgetTarget(v);
          }}
          allowClear
          clearLabel="Clear Budget"
        />
        {/* Simple toggle chip for alerts */}
        {budgetOpen ? (
          <View style={styles.alertToggleWrap} pointerEvents="box-none">
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

/* -------------------------------- Styles -------------------------------- */

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

  // Bigger logo. “Outer ring” is inside the PNG, so we crop/zoom to reduce its visual dominance.
  headerLogoMask: {
    width: 90,
    height: 90,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "transparent",
    marginTop: 2,
  },
  headerLogoImage: {
    width: 90,
    height: 90,
    transform: [{ scale: 1.22 }],
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

  /* --------------------------- Modal Picker UI --------------------------- */

  modalWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  modalCard: {
    padding: 14,
    borderRadius: 18,
    maxHeight: "78%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },

  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.black,
  },

  modalSubtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  modalCloseBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  modalCloseText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.sm,
  },

  searchWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },

  searchInput: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.md,
    padding: 0,
  },

  pickList: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.14)",
    overflow: "hidden",
  },

  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  pickRowActive: {
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  pickRowText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.black,
    paddingRight: 10,
  },

  pickRowTextActive: {
    color: theme.colors.primary,
  },

  pickTick: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
    marginLeft: 10,
  },

  clearBtn: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 12,
    alignItems: "center",
  },

  clearBtnText: {
    color: "rgba(255,255,255,0.70)",
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },

  /* -------------------------- Alerts Toggle (Budget) -------------------------- */

  alertToggleWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 26,
    alignItems: "center",
  },

  alertToggle: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.40)",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  alertToggleOn: {
    borderColor: "rgba(0,255,136,0.30)",
  },

  alertToggleText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },
});
