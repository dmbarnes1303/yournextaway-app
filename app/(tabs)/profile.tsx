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
  ActivityIndicator,
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

import useFollowStore, { type FollowedMatch } from "@/src/state/followStore";
import { refreshFollowedMatches } from "@/src/services/followedMatchesRefresh";
import { ensureNotificationsReady } from "@/src/services/followKickoffNotifications";

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
  } catch {
    // ignore
  }
  return "GB";
}

function safeIsoToUkDateTime(iso?: string | null) {
  if (!iso) return "Kickoff: TBC";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Kickoff: TBC";
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function compactPlace(venue?: string | null, city?: string | null) {
  const v = String(venue ?? "").trim();
  const c = String(city ?? "").trim();
  const parts = [v, c].filter(Boolean);
  return parts.length ? parts.join(" • ") : "Venue: —";
}

function matchTitle(m: FollowedMatch) {
  const h = String((m as any).homeName ?? "").trim();
  const a = String((m as any).awayName ?? "").trim();
  if (h && a) return `${h} vs ${a}`;
  if (h) return `${h} vs —`;
  if (a) return `— vs ${a}`;
  return `Match #${String(m.fixtureId ?? "").trim()}`;
}

function leagueLine(m: FollowedMatch) {
  const ln = String((m as any).leagueName ?? "").trim();
  return ln ? ln : null;
}

function daysUntilIso(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  return (t - Date.now()) / (1000 * 60 * 60 * 24);
}

function isoMinuteKey(iso: string) {
  const s = String(iso ?? "").trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return m?.[1] ?? s.slice(0, 16);
}

function normalizeStr(v: unknown) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

/**
 * Fallback heuristic ONLY when store has kickoffLikelyTbc === null:
 * - If no kickoffIso => TBC
 * - If <= 21 days away => confirmed
 * - Else: if >= 7 followed fixtures in same (leagueId+season+round) share same kickoff minute => likely placeholder => TBC
 */
function computeLikelyPlaceholderTbcIdsFromFollowed(followed: FollowedMatch[]) {
  const CONFIRMED_WITHIN_DAYS = 21;
  const CLUSTER_THRESHOLD = 7;

  const out = new Set<string>();
  if (!Array.isArray(followed) || followed.length === 0) return out;

  const groups = new Map<string, FollowedMatch[]>();

  for (const m of followed) {
    const fixtureId = String(m.fixtureId ?? "").trim();
    const kickoffIso = String(m.kickoffIso ?? "").trim();
    if (!fixtureId) continue;

    if (!kickoffIso) {
      out.add(fixtureId);
      continue;
    }

    if (daysUntilIso(kickoffIso) <= CONFIRMED_WITHIN_DAYS) continue;

    const leagueId = Number((m as any).leagueId ?? 0) || 0;
    const season = Number((m as any).season ?? 0) || 0;
    const round = normalizeStr((m as any).round);

    if (!leagueId || !season || !round) continue;

    const key = `${leagueId}:${season}:${round}`;
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }

  for (const groupRows of groups.values()) {
    if (groupRows.length < CLUSTER_THRESHOLD) continue;

    const counts = new Map<string, number>();
    for (const m of groupRows) {
      const iso = String(m.kickoffIso ?? "").trim();
      if (!iso) continue;
      const k = isoMinuteKey(iso);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }

    let topKey: string | null = null;
    let topCount = 0;
    for (const [k, c] of counts.entries()) {
      if (c > topCount) {
        topKey = k;
        topCount = c;
      }
    }

    if (!topKey || topCount < CLUSTER_THRESHOLD) continue;

    for (const m of groupRows) {
      const id = String(m.fixtureId ?? "").trim();
      const iso = String(m.kickoffIso ?? "").trim();
      if (!id || !iso) continue;
      if (isoMinuteKey(iso) === topKey) out.add(id);
    }
  }

  return out;
}

function kickoffStateForFollowed(m: FollowedMatch, fallbackLikelyTbcIds: Set<string>) {
  const storeFlag = (m as any)?.kickoffLikelyTbc;
  if (storeFlag === true) return { isTbc: true, secondary: "TV schedule pending" };
  if (storeFlag === false) return { isTbc: false, secondary: null };

  const id = String(m.fixtureId ?? "").trim();
  const iso = String(m.kickoffIso ?? "").trim();

  if (!iso) return { isTbc: true, secondary: "Kickoff time not set yet" };

  if (daysUntilIso(iso) <= 21) return { isTbc: false, secondary: null };

  if (id && fallbackLikelyTbcIds.has(id)) return { isTbc: true, secondary: "TV schedule pending" };

  return { isTbc: true, secondary: "Kickoff may change" };
}

function formatLastRefreshed(ms: number | null) {
  if (!ms) return "Last refreshed: —";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "Last refreshed: —";
  return `Last refreshed: ${d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
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

/* -------------------------------------------------------------------------- */
/* Storage keys (keep your existing storage for non-origin prefs) */
/* -------------------------------------------------------------------------- */

const STORAGE_KEYS = {
  seenLanding: "yna:seenLanding",
  setupComplete: "yna:setupComplete",
  plan: "yna:plan",
  currency: "yna:profile.currency",
  language: "yna:profile.language",
  budgetTarget: "yna:profile.budgetTarget",
  alerts: "yna:profile.alerts",
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

  // South West / nearby
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

function planLabel(plan: PlanValue) {
  if (plan === "free") return "Free";
  if (plan === "premium") return "Premium";
  return "Not set";
}

/* -------------------------------------------------------------------------- */
/* Screen */
/* -------------------------------------------------------------------------- */

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const LOGO = useMemo(() => require("@/src/yna-logo.png"), []);
  const displayName = useMemo(() => "Guest Traveller", []);
  const email = useMemo(() => "Not Signed In", []);

  const followed = useFollowStore((s) => s.followed);
  const followingCount = followed.length;

  const unfollow = useFollowStore((s) => s.unfollow);
  const setKickoffConfirmedDefaultAndAll = useFollowStore((s) => s.setKickoffConfirmedDefaultAndAll);
  const defaultAlerts = useFollowStore((s) => s.defaultAlerts);

  const [kickoffToggleBusy, setKickoffToggleBusy] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [refreshSummary, setRefreshSummary] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const countryCode = useMemo(() => getCountryCodeBestEffort(), []);
  const originOptions = useMemo(
    () => (countryCode === "GB" ? UK_ORIGIN_OPTIONS : EURO_ORIGIN_OPTIONS),
    [countryCode]
  );

  // ✅ Preferences store (preferred origin IATA)
  const [originIata, setOriginIata] = useState<string>(preferencesStore.getPreferredOriginIata());
  const [originLoaded, setOriginLoaded] = useState<boolean>(preferencesStore.getState().loaded);

  const [plan, setPlan] = useState<PlanValue>("not_set");
  const [currency, setCurrency] = useState(countryCode === "GB" ? "GBP" : "EUR");
  const [language, setLanguage] = useState("English");
  const [budgetTarget, setBudgetTarget] = useState("Not Set");
  const [alerts, setAlerts] = useState<AlertsValue>("Off");
  const [setupComplete, setSetupComplete] = useState(false);

  const [activePicker, setActivePicker] = useState<null | "origin" | "currency" | "language" | "budget" | "plan">(null);
  const closePicker = useCallback(() => setActivePicker(null), []);

  const logoSize = useMemo(() => {
    const max = 86;
    const min = 62;
    if (width < 360) return min;
    if (width < 410) return 76;
    return max;
  }, [width]);

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

  const followedSorted = useMemo(() => {
    const copy = [...followed];
    copy.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    return copy;
  }, [followed]);

  const followedPreview = useMemo(() => followedSorted.slice(0, 6), [followedSorted]);
  const fallbackLikelyTbcIds = useMemo(() => computeLikelyPlaceholderTbcIdsFromFollowed(followed), [followed]);

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
        const [storedSetup, storedPlan, storedCurrency, storedLanguage, storedBudget, storedAlerts] =
          await Promise.all([
            storage.getString(STORAGE_KEYS.setupComplete),
            storage.getString(STORAGE_KEYS.plan),
            storage.getString(STORAGE_KEYS.currency),
            storage.getString(STORAGE_KEYS.language),
            storage.getString(STORAGE_KEYS.budgetTarget),
            storage.getString(STORAGE_KEYS.alerts),
          ]);

        if (!mounted) return;

        setSetupComplete(storedSetup === "true");
        if (storedPlan === "free" || storedPlan === "premium") setPlan(storedPlan);
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

  // Persist non-origin changes
  useEffect(() => {
    if (loading) return;

    (async () => {
      try {
        await Promise.all([
          storage.setString(STORAGE_KEYS.plan, plan),
          storage.setString(STORAGE_KEYS.currency, currency),
          storage.setString(STORAGE_KEYS.language, language),
          storage.setString(STORAGE_KEYS.budgetTarget, budgetTarget),
          storage.setString(STORAGE_KEYS.alerts, alerts),
        ]);
      } catch {
        // ignore
      }
    })();
  }, [alerts, budgetTarget, currency, language, loading, plan]);

  const finishSetup = useCallback(async () => {
    try {
      await storage.setString(STORAGE_KEYS.setupComplete, "true");
    } catch {
      // ignore
    } finally {
      setSetupComplete(true);
      router.replace("/(tabs)/home");
    }
  }, [router]);

  const resetSetup = useCallback(() => {
    Alert.alert("Reset setup?", "This will make the app show Landing again on next launch.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          try {
            await Promise.all([
              storage.setString(STORAGE_KEYS.seenLanding, "false"),
              storage.setString(STORAGE_KEYS.setupComplete, "false"),
              storage.setString(STORAGE_KEYS.plan, "not_set"),
              storage.setString(STORAGE_KEYS.currency, countryCode === "GB" ? "GBP" : "EUR"),
              storage.setString(STORAGE_KEYS.language, "English"),
              storage.setString(STORAGE_KEYS.budgetTarget, "Not Set"),
              storage.setString(STORAGE_KEYS.alerts, "Off"),
              preferencesStore.setPreferredOriginIata("LON"),
            ]);

            setSetupComplete(false);
            setPlan("not_set");
            setCurrency(countryCode === "GB" ? "GBP" : "EUR");
            setLanguage("English");
            setBudgetTarget("Not Set");
            setAlerts("Off");
            setOriginIata("LON");

            Alert.alert("Reset complete", "Landing will show again next time you open the app.");
          } catch {
            Alert.alert("Reset failed", "Couldn’t reset setup status.");
          }
        },
      },
    ]);
  }, [countryCode]);

  /* ------------------------------- info/legal ------------------------------ */

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

  const planSummary = useMemo(() => planLabel(plan), [plan]);

  const originSummary = useMemo(() => {
    if (!originLoaded) return "Loading…";
    return labelForIata(originOptions, originIata);
  }, [originIata, originLoaded, originOptions]);

  const openMatch = useCallback(
    (fixtureId: string) => {
      const id = String(fixtureId ?? "").trim();
      if (!id) return;
      router.push({ pathname: "/match/[id]", params: { id } } as any);
    },
    [router]
  );

  const confirmUnfollow = useCallback(
    (m: FollowedMatch) => {
      const id = String(m.fixtureId ?? "").trim();
      if (!id) return;

      Alert.alert("Unfollow match?", "You’ll stop getting kickoff alerts for this match.", [
        { text: "Cancel", style: "cancel" },
        { text: "Unfollow", style: "destructive", onPress: () => unfollow(id) },
      ]);
    },
    [unfollow]
  );

  const onRefreshFollowing = useCallback(async () => {
    if (refreshing) return;

    if (followingCount === 0) {
      setRefreshSummary("Nothing to refresh — you’re not following any matches.");
      setLastRefreshedAt(Date.now());
      return;
    }

    setRefreshing(true);
    setRefreshSummary(null);

    try {
      const rows = await refreshFollowedMatches({ limit: 25, concurrency: 3 });
      setLastRefreshedAt(Date.now());

      const refreshed = rows.filter((r: any) => r?.refreshed).length;
      const notified = rows.filter((r: any) => r?.notified).length;
      setRefreshSummary(`Checked ${refreshed} • Kickoff notifications ${notified}`);
    } catch {
      setLastRefreshedAt(Date.now());
      setRefreshSummary("Refresh failed (network or rate limit). Try again.");
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, followingCount]);

  const onToggleKickoffDefault = useCallback(
    async (nextValue: boolean) => {
      if (kickoffToggleBusy) return;

      if (!nextValue) {
        setKickoffConfirmedDefaultAndAll(false);
        return;
      }

      setKickoffToggleBusy(true);

      try {
        const ok = await ensureNotificationsReady({ request: true });

        if (!ok) {
          setKickoffConfirmedDefaultAndAll(false);

          Alert.alert(
            "Notifications disabled",
            "To enable kickoff alerts, allow notifications for YourNextAway in your phone settings, then toggle this on again.",
            [{ text: "OK" }],
            { cancelable: true }
          );
          return;
        }

        setKickoffConfirmedDefaultAndAll(true);
      } finally {
        setKickoffToggleBusy(false);
      }
    },
    [kickoffToggleBusy, setKickoffConfirmedDefaultAndAll]
  );

  const onSelectOrigin = useCallback(async (v: string) => {
    const code = cleanUpper3(v, "LON");
    setOriginIata(code); // optimistic

    try {
      await preferencesStore.setPreferredOriginIata(code);
    } catch {
      // best-effort
    }
  }, []);

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
                style={{ width: logoSize, height: logoSize, transform: [{ scale: 1.18 }] }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* IDENTITY */}
          <GlassCard style={styles.card} strength="default">
            <View style={styles.identityTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.meta}>{email}</Text>

                <View style={styles.followingPill}>
                  <Text style={styles.followingKicker}>Following</Text>
                  <Text style={styles.followingValue}>{followingCount} matches</Text>
                </View>
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
                <Text style={styles.sectionHint}>Set your defaults. You can change them anytime.</Text>
              </View>

              <View style={styles.setupStatusPill}>
                <Text style={styles.setupStatusKicker}>Status</Text>
                <Text style={styles.setupStatusValue}>{setupComplete ? "Complete" : "Incomplete"}</Text>
              </View>
            </View>

            <View style={styles.primaryActions}>
              <Pressable onPress={finishSetup} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Finish setup</Text>
                <Text style={styles.btnMeta}>Save & continue</Text>
              </Pressable>

              <Pressable onPress={resetSetup} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Reset</Text>
                <Text style={styles.btnMeta}>Show Landing next launch</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* FOLLOWING */}
          <GlassCard style={[styles.card, { padding: 0 }]} strength="subtle" noPadding>
            <View style={styles.listHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionH}>Following</Text>
                <Text style={styles.listSub}>
                  Kickoff alerts (local notifications). {followingCount ? `${followingCount} saved.` : "None yet."}
                </Text>
              </View>

              <View style={styles.followingDefaultsPill}>
                <Text style={styles.followingDefaultsKicker}>Default alert</Text>
                <View style={styles.followingDefaultsRow}>
                  <Text style={styles.followingDefaultsValue}>Kickoff</Text>
                  <Switch
                    value={!!defaultAlerts.kickoffConfirmed}
                    onValueChange={onToggleKickoffDefault}
                    disabled={kickoffToggleBusy}
                  />
                </View>
              </View>
            </View>

            <View style={styles.refreshBar}>
              <Pressable
                onPress={onRefreshFollowing}
                disabled={refreshing}
                style={({ pressed }) => [
                  styles.refreshBtn,
                  refreshing && styles.refreshBtnDisabled,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
              >
                {refreshing ? <ActivityIndicator /> : <Text style={styles.refreshBtnText}>Refresh Following</Text>}
              </Pressable>

              <View style={{ flex: 1 }}>
                <Text style={styles.refreshMeta}>{formatLastRefreshed(lastRefreshedAt)}</Text>
                {refreshSummary ? <Text style={styles.refreshMeta2}>{refreshSummary}</Text> : null}
              </View>
            </View>

            {followedPreview.length === 0 ? (
              <View style={styles.followEmpty}>
                <Text style={styles.followEmptyTitle}>You’re not following any matches</Text>
                <Text style={styles.followEmptyBody}>
                  Open a match and tap <Text style={{ fontWeight: "900", color: theme.colors.text }}>Follow</Text>. We’ll
                  notify you if kickoff changes.
                </Text>
              </View>
            ) : (
              <>
                {followedPreview.map((m, idx) => {
                  const last = idx === followedPreview.length - 1;
                  const title = matchTitle(m);
                  const league = leagueLine(m);
                  const ko = kickoffStateForFollowed(m, fallbackLikelyTbcIds);

                  return (
                    <View key={m.fixtureId} style={[styles.followRow, last && styles.followRowLast]}>
                      <Pressable
                        onPress={() => openMatch(m.fixtureId)}
                        style={({ pressed }) => [styles.followRowMain, { opacity: pressed ? 0.85 : 1 }]}
                      >
                        <Text style={styles.followRowTitle} numberOfLines={1}>
                          {title}
                        </Text>

                        {league ? (
                          <Text style={styles.followRowLeague} numberOfLines={1}>
                            {league}
                          </Text>
                        ) : null}

                        <Text style={styles.followRowSub} numberOfLines={1}>
                          {safeIsoToUkDateTime(m.kickoffIso)}
                          {" • "}
                          {compactPlace(m.venue, m.city)}
                        </Text>

                        <View style={styles.followTagRow}>
                          {ko.isTbc ? (
                            <>
                              <View style={[styles.followTag, styles.followTagTbc]}>
                                <Text style={[styles.followTagText, styles.followTagTextTbc]}>Kickoff TBC</Text>
                              </View>
                              {ko.secondary ? (
                                <View style={styles.followTag}>
                                  <Text style={styles.followTagText}>{ko.secondary}</Text>
                                </View>
                              ) : null}
                            </>
                          ) : (
                            <View style={[styles.followTag, styles.followTagConfirmed]}>
                              <Text style={[styles.followTagText, styles.followTagTextConfirmed]}>Kickoff confirmed</Text>
                            </View>
                          )}

                          {m.alerts?.kickoffConfirmed ? (
                            <View style={[styles.followTag, styles.followTagOn]}>
                              <Text style={[styles.followTagText, styles.followTagTextOn]}>Alert on</Text>
                            </View>
                          ) : (
                            <View style={styles.followTag}>
                              <Text style={styles.followTagText}>Alert off</Text>
                            </View>
                          )}
                        </View>
                      </Pressable>

                      <Pressable onPress={() => confirmUnfollow(m)} style={styles.unfollowBtn}>
                        <Text style={styles.unfollowText}>Unfollow</Text>
                      </Pressable>
                    </View>
                  );
                })}

                {followingCount > followedPreview.length ? (
                  <View style={styles.followFooterNote}>
                    <Text style={styles.followFooterText}>
                      Showing {followedPreview.length} of {followingCount}. (Add “View all” later.)
                    </Text>
                  </View>
                ) : null}
              </>
            )}
          </GlassCard>

          {/* DEFAULTS */}
          <GlassCard style={[styles.card, { padding: 0 }]} strength="subtle" noPadding>
            <View style={styles.listHeader}>
              <Text style={styles.sectionH}>Your defaults</Text>
              <Text style={styles.listSub}>{`Region: ${countryCode}`}</Text>
            </View>

            <Row
              title="Departure city"
              subtitle="Used to prefill flight searches (IATA city code)"
              value={originSummary}
              onPress={() => setActivePicker("origin")}
            />

            <Row title="Plan" subtitle="Free or Premium" value={planSummary} onPress={() => setActivePicker("plan")} />
            <Row
              title="Currency"
              subtitle="Budgets and comparisons"
              value={currency}
              onPress={() => setActivePicker("currency")}
            />
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
                  <Switch value={alerts === "On"} onValueChange={(v) => setAlerts(v ? "On" : "Off")} />
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
          subtitle={budgetSummary}
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

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */

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
  meta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },

  followingPill: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.24)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  followingKicker: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.black },
  followingValue: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.black },

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

  btnPrimary: { borderColor: "rgba(0,255,136,0.50)", backgroundColor: "rgba(0,0,0,0.30)" },
  btnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  btnGhost: { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.18)" },
  btnGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  btnMeta: { color: theme.colors.textTertiary, fontSize: theme.fontSize.xs, fontWeight: "800" },

  listHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 10,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
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

  /* ------------------------------ Following UI ----------------------------- */

  followingDefaultsPill: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 165,
  },
  followingDefaultsKicker: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.black },
  followingDefaultsRow: { marginTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  followingDefaultsValue: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  refreshBar: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  refreshBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtnDisabled: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  refreshBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },
  refreshMeta: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: theme.fontSize.xs },
  refreshMeta2: { marginTop: 4, color: theme.colors.textTertiary, fontWeight: "800", fontSize: theme.fontSize.xs },

  followEmpty: { paddingHorizontal: theme.spacing.lg, paddingTop: 6, paddingBottom: theme.spacing.lg },
  followEmptyTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  followEmptyBody: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", lineHeight: 18, fontSize: theme.fontSize.sm },

  followRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  followRowLast: {},

  followRowMain: { flex: 1 },
  followRowTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  followRowLeague: { marginTop: 6, color: theme.colors.primary, fontWeight: "900", fontSize: theme.fontSize.xs, opacity: 0.92 },
  followRowSub: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", fontSize: theme.fontSize.sm },

  followTagRow: { marginTop: 10, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  followTag: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  followTagOn: { borderColor: "rgba(79,224,138,0.35)", backgroundColor: "rgba(79,224,138,0.10)" },
  followTagText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.xs },
  followTagTextOn: { color: "rgba(79,224,138,0.92)" },

  followTagTbc: { borderColor: "rgba(255,200,0,0.22)", backgroundColor: "rgba(255,200,0,0.06)" },
  followTagTextTbc: { color: "rgba(255,220,140,0.92)" },

  followTagConfirmed: { borderColor: "rgba(0,255,136,0.28)", backgroundColor: "rgba(0,255,136,0.08)" },
  followTagTextConfirmed: { color: "rgba(79,224,138,0.92)" },

  unfollowBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  unfollowText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.xs },

  followFooterNote: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
  },
  followFooterText: { color: theme.colors.textTertiary, fontWeight: "800", fontSize: theme.fontSize.xs },

  footerNote: {
    textAlign: "center",
    color: "rgba(0,255,136,0.80)",
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
    marginTop: 2,
  },
});
