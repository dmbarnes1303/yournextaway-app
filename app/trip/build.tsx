// app/trip/build.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  Dimensions,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, getFixtureById } from "@/src/services/apiFootball";
import tripsStore from "@/src/state/trips";

import {
  LEAGUES,
  getRollingWindowIso,
  toIsoDate,
  parseIsoDateOnly,
  addDaysIso,
  type LeagueOption,
} from "@/src/constants/football";

import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getTopThingsToDoForTrip } from "@/src/data/cityGuides";

/**
 * Expo Router params can be string | string[] | undefined.
 * Keep parsing local + deterministic (Android vs web differences are real).
 */
function paramString(v: unknown): string | null {
  if (typeof v === "string") {
    const s = v.trim();
    return s ? s : null;
  }
  if (Array.isArray(v) && typeof v[0] === "string") {
    const s = v[0].trim();
    return s ? s : null;
  }
  return null;
}

function paramNumber(v: unknown): number | null {
  const s = paramString(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function tomorrowIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return toIsoDate(d);
}

function clampIsoToTomorrow(iso: string): string {
  const tmr = tomorrowIso();
  const a = parseIsoDateOnly(iso);
  const b = parseIsoDateOnly(tmr);
  if (!a || !b) return tmr;
  return a.getTime() < b.getTime() ? tmr : iso;
}

function safeCityName(input: unknown): string {
  const s = String(input ?? "").trim();
  return s || "your destination";
}

async function safeOpenUrl(url: string) {
  try {
    const can = await Linking.canOpenURL(url);
    if (can) await Linking.openURL(url);
  } catch {
    // never crash
  }
}

export default function TripBuildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const listRef = useRef<ScrollView | null>(null);

  // Optional DateTimePicker (native). If not installed, we fall back gracefully.
  const DateTimePicker: any = useMemo(() => {
    if (Platform.OS === "web") return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("@react-native-community/datetimepicker");
      return mod?.default ?? mod;
    } catch {
      return null;
    }
  }, []);

  // Central rolling window defaults
  const rolling = useMemo(() => getRollingWindowIso(), []);
  const defaultFrom = useMemo(() => clampIsoToTomorrow(rolling.from), [rolling.from]);
  const defaultTo = rolling.to;

  // Route params
  const routeFixtureId = useMemo(() => paramString(params.fixtureId), [params.fixtureId]);
  const routeLeagueId = useMemo(() => paramNumber(params.leagueId), [params.leagueId]);
  const routeSeason = useMemo(() => paramNumber(params.season), [params.season]);
  const fromParam = useMemo(() => paramString(params.from), [params.from]);
  const toParam = useMemo(() => paramString(params.to), [params.to]);

  const from = useMemo(() => clampIsoToTomorrow(fromParam ?? defaultFrom), [fromParam, defaultFrom]);
  const to = useMemo(() => toParam ?? defaultTo, [toParam, defaultTo]);

  const [selectedLeague, setSelectedLeague] = useState<LeagueOption>(LEAGUES[0]);

  // Apply league/season from route params
  useEffect(() => {
    if (!routeLeagueId) return;

    const match = LEAGUES.find((l) => l.leagueId === routeLeagueId);
    if (!match) return;

    const season = routeSeason ?? match.season;
    setSelectedLeague((cur) => {
      if (cur.leagueId === match.leagueId && cur.season === season) return cur;
      return { ...match, season };
    });
  }, [routeLeagueId, routeSeason]);

  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  const [selectedFixture, setSelectedFixture] = useState<any | null>(null);

  // Dates
  const [startIso, setStartIso] = useState(from);
  const [endIso, setEndIso] = useState(addDaysIso(from, 2));
  const [notes, setNotes] = useState("");

  const [picker, setPicker] = useState<{ which: "start" | "end"; open: boolean }>({
    which: "start",
    open: false,
  });

  // Animation
  const panelAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const { height: screenH } = Dimensions.get("window");

  // Header-safe sizing (prevents top overlap + prevents backdrop stealing Back taps)
  const HEADER_ESTIMATE = 56;
  const headerBlock = insets.top + HEADER_ESTIMATE;

  const PANEL_MAX = Math.min(420, Math.round(screenH * 0.62));
  const panelMaxHeight = Math.min(PANEL_MAX, Math.max(260, screenH - headerBlock - 20));

  const panelOpen = !!selectedFixture;

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [panelMaxHeight + 90, 0],
  });

  const panelOpacity = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const backdropOpacity = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  // Keep date fields aligned to route from
  useEffect(() => {
    setStartIso(from);
    setEndIso(addDaysIso(from, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);

  /**
   * CRITICAL FIX:
   * If fixtureId is provided (Plan Trip), fetch the fixture directly.
   * Do NOT depend on it being present in the fixtures list window.
   */
  useEffect(() => {
    let cancelled = false;

    async function prefill() {
      if (!routeFixtureId) return;

      setError(null);
      setPrefillLoading(true);

      try {
        const r = await getFixtureById(routeFixtureId);
        if (cancelled) return;

        if (!r) {
          setError("Couldn’t load that match. Try selecting it from the list.");
          return;
        }

        setSelectedFixture(r);

        // Sync league selection when possible
        const apiLeagueId = r?.league?.id;
        if (typeof apiLeagueId === "number") {
          const match = LEAGUES.find((l) => l.leagueId === apiLeagueId);
          if (match) {
            const season = routeSeason ?? match.season;
            setSelectedLeague({ ...match, season });
          }
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Couldn’t prefill that match.");
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    }

    prefill();
    return () => {
      cancelled = true;
    };
  }, [routeFixtureId, routeSeason]);

  // Load fixtures list whenever league/from/to change
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setLoading(true);
      setRows([]);
      setSearch("");
      setVisibleCount(12);

      try {
        const res = await getFixtures({
          league: selectedLeague.leagueId,
          season: selectedLeague.season,
          from,
          to,
        });

        if (cancelled) return;
        setRows(Array.isArray(res) ? res : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedLeague, from, to]);

  /**
   * Panel open/close animation + prefill dates from kickoff
   *
   * IMPORTANT ANDROID/EXPO GO NOTE:
   * - expo-blur + Animated transform with useNativeDriver:true can cause children not to render.
   * - Therefore, we intentionally use useNativeDriver:false for the panel animation.
   */
  useEffect(() => {
    const iso = selectedFixture?.fixture?.date as string | undefined;

    if (!selectedFixture) {
      Animated.timing(panelAnim, {
        toValue: 0,
        duration: 170,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false, // <-- critical fix
      }).start();
      return;
    }

    if (iso) {
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) {
        const start = clampIsoToTomorrow(toIsoDate(d));
        setStartIso(start);
        setEndIso(addDaysIso(start, 2));
      }
    }

    Animated.timing(panelAnim, {
      toValue: 1,
      duration: 230,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // <-- critical fix
    }).start();

    flashAnim.setValue(0);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();

    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [selectedFixture, panelAnim, flashAnim]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const home = String(r?.teams?.home?.name ?? "").toLowerCase();
      const away = String(r?.teams?.away?.name ?? "").toLowerCase();
      const venue = String(r?.fixture?.venue?.name ?? "").toLowerCase();
      const city = String(r?.fixture?.venue?.city ?? "").toLowerCase();
      return home.includes(q) || away.includes(q) || venue.includes(q) || city.includes(q);
    });
  }, [rows, search]);

  const visibleRows = useMemo(() => filteredRows.slice(0, visibleCount), [filteredRows, visibleCount]);

  function openPicker(which: "start" | "end") {
    if (Platform.OS === "web" || !DateTimePicker) return;
    setPicker({ which, open: true });
  }

  function onPickerChange(_: any, date?: Date) {
    if (!date) {
      setPicker((p) => ({ ...p, open: false }));
      return;
    }

    const iso = clampIsoToTomorrow(toIsoDate(date));

    if (picker.which === "start") {
      setStartIso(iso);
      const end = parseIsoDateOnly(endIso);
      if (end && end.getTime() < date.getTime()) setEndIso(addDaysIso(iso, 2));
    } else {
      setEndIso(iso);
    }

    if (Platform.OS === "android") setPicker((p) => ({ ...p, open: false }));
  }

  async function onSave() {
    if (!selectedFixture?.fixture?.id) {
      setError("Select a fixture first.");
      return;
    }
    if (!startIso || !endIso) {
      setError("Start/end dates are required.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const fixtureId = String(selectedFixture.fixture.id);
      const venueCity =
        (selectedFixture?.fixture?.venue?.city as string | undefined)?.trim() ||
        (selectedFixture?.league?.name as string | undefined)?.trim() ||
        "Trip";

      const t = await tripsStore.addTrip({
        cityId: venueCity,
        matchIds: [fixtureId],
        startDate: startIso,
        endDate: endIso,
        notes: notes.trim(),
      });

      router.replace({ pathname: "/trip/[id]", params: { id: t.id } });
    } catch (e: any) {
      setError(e?.message ?? "Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }

  const selHome = selectedFixture?.teams?.home?.name ?? "";
  const selAway = selectedFixture?.teams?.away?.name ?? "";
  const selKick = formatUkDateTimeMaybe(selectedFixture?.fixture?.date);
  const selVenue = selectedFixture?.fixture?.venue?.name ?? "";
  const selCity = selectedFixture?.fixture?.venue?.city ?? "";

  const destinationCity = useMemo(() => {
    if (!selectedFixture) return "";
    return safeCityName(
      (selectedFixture?.fixture?.venue?.city as string | undefined)?.trim() ||
        (selectedFixture?.league?.country as string | undefined)?.trim() ||
        (selectedFixture?.league?.name as string | undefined)?.trim()
    );
  }, [selectedFixture]);

  const cityBundle = useMemo(() => {
    if (!destinationCity) return null;
    return getTopThingsToDoForTrip(destinationCity);
  }, [destinationCity]);

  const bottomPad = panelOpen ? panelMaxHeight + theme.spacing.xl : theme.spacing.xxl;

  const DEV_DEBUG = __DEV__ === true;

  return (
    <Background imageUrl={getBackground("trips")}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Build Trip",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          ref={(r) => (listRef.current = r)}
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard style={styles.card}>
            <Text style={styles.h1}>Pick a match</Text>
            <Text style={styles.muted}>Tap a fixture to open trip details. Save from the bottom panel.</Text>

            {DEV_DEBUG ? (
              <View style={styles.devBox}>
                <Text style={styles.devText}>fixtureId param: {String(params?.fixtureId ?? "NONE")}</Text>
                <Text style={styles.devText}>leagueId param: {String(params?.leagueId ?? "NONE")}</Text>
                <Text style={styles.devText}>season param: {String(params?.season ?? "NONE")}</Text>
                <Text style={styles.devText}>
                  from/to param: {String(params?.from ?? "NONE")} → {String(params?.to ?? "NONE")}
                </Text>
                <View style={styles.devDivider} />
                <Text style={styles.devText}>selectedFixture id: {String(selectedFixture?.fixture?.id ?? "NONE")}</Text>
                <Text style={styles.devText}>panelOpen: {String(!!selectedFixture)}</Text>
                <Text style={styles.devText}>error: {String(error ?? "NONE")}</Text>
              </View>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
              {LEAGUES.map((l) => {
                const active = l.leagueId === selectedLeague.leagueId;
                return (
                  <Pressable
                    key={l.leagueId}
                    onPress={() => setSelectedLeague(l)}
                    style={[styles.leaguePill, active && styles.leaguePillActive]}
                  >
                    <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>{l.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.searchWrap}>
              <TextInput
                value={search}
                onChangeText={(t) => {
                  setSearch(t);
                  setVisibleCount(12);
                }}
                placeholder="Search team / venue / city…"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.search}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              <Text style={styles.searchMeta}>
                Showing {Math.min(visibleCount, filteredRows.length)} of {filteredRows.length}
              </Text>
            </View>

            {prefillLoading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Prefilling your match…</Text>
              </View>
            ) : null}

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? (
              <View style={{ marginTop: 12 }}>
                <EmptyState title="Notice" message={error} />
              </View>
            ) : null}

            {!loading && !error && filteredRows.length === 0 ? (
              <View style={{ marginTop: 12 }}>
                <EmptyState title="No fixtures found" message="Try a different league, date window, or search." />
              </View>
            ) : null}

            {!loading && filteredRows.length > 0 ? (
              <>
                <View style={styles.list}>
                  {visibleRows.map((r, idx) => {
                    const fixtureId = r?.fixture?.id;
                    const home = r?.teams?.home?.name ?? "Home";
                    const away = r?.teams?.away?.name ?? "Away";
                    const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
                    const venue = r?.fixture?.venue?.name ?? "";
                    const city = r?.fixture?.venue?.city ?? "";
                    const extra = [venue, city].filter(Boolean).join(" • ");
                    const line2 = extra ? `${kickoff} • ${extra}` : kickoff;

                    const selected = String(selectedFixture?.fixture?.id ?? "") === String(fixtureId ?? "");

                    return (
                      <Pressable
                        key={String(fixtureId ?? idx)}
                        onPress={() => setSelectedFixture(r)}
                        style={[styles.pickRow, selected && styles.pickRowSelected]}
                      >
                        <View style={styles.pickRowTop}>
                          <Text style={styles.rowTitle}>
                            {home} vs {away}
                          </Text>
                          {selected ? <Text style={styles.selectedTag}>Selected</Text> : null}
                        </View>
                        <Text style={styles.rowMeta}>{line2}</Text>
                        {selected ? <Text style={styles.selectedHint}>Trip details opened below</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>

                {visibleCount < filteredRows.length ? (
                  <Pressable onPress={() => setVisibleCount((n) => n + 12)} style={styles.moreBtn}>
                    <Text style={styles.moreText}>Show more</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}

            {!panelOpen ? (
              <View style={{ marginTop: 14 }}>
                <Text style={styles.hint}>Tip: After selecting a match, use the bottom panel to set dates and save.</Text>
              </View>
            ) : null}
          </GlassCard>
        </ScrollView>

        {/* Backdrop: MUST NOT cover header zone or it steals BackButton taps */}
        {panelOpen ? (
          <Animated.View
            pointerEvents="auto"
            style={[
              styles.backdropWrap,
              {
                top: headerBlock,
                opacity: backdropOpacity,
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedFixture(null)}>
              <View style={styles.backdrop} />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Panel */}
        <Animated.View
          pointerEvents={panelOpen ? "auto" : "none"}
          collapsable={false}
          renderToHardwareTextureAndroid
          needsOffscreenAlphaCompositing
          style={[
            styles.panelWrap,
            {
              opacity: panelOpacity,
              transform: [{ translateY: panelTranslateY }],
            },
          ]}
        >
          <GlassCard style={[styles.panel, { maxHeight: panelMaxHeight }]} intensity={30}>
            <Animated.View pointerEvents="none" style={[styles.panelFlash, { opacity: flashAnim }]} />

            <View style={styles.handle} />

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: theme.spacing.md }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.panelTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.panelKicker}>Trip details</Text>
                  <Text style={styles.panelTitle} numberOfLines={1}>
                    {selHome && selAway ? `${selHome} vs ${selAway}` : "Selected match"}
                  </Text>
                  <Text style={styles.panelSub} numberOfLines={2}>
                    {selKick}
                    {selVenue ? ` • ${selVenue}` : ""}
                    {selCity ? ` • ${selCity}` : ""}
                  </Text>
                </View>

                <Pressable onPress={() => setSelectedFixture(null)} style={styles.clearBtn} hitSlop={10}>
                  <Text style={styles.clearText}>Change</Text>
                </Pressable>
              </View>

              <View style={styles.dateRow}>
                <Pressable onPress={() => openPicker("start")} style={styles.datePill}>
                  <Text style={styles.dateLabel}>Start</Text>
                  <Text style={styles.dateValue}>{formatUkDateOnly(startIso)}</Text>
                </Pressable>

                <Pressable onPress={() => openPicker("end")} style={styles.datePill}>
                  <Text style={styles.dateLabel}>End</Text>
                  <Text style={styles.dateValue}>{formatUkDateOnly(endIso)}</Text>
                </Pressable>
              </View>

              {/* CITY GUIDE / TRIPADVISOR BLOCK */}
              {destinationCity ? (
                <View style={styles.cityBlock}>
                  <View style={styles.cityBlockTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cityBlockKicker}>In {destinationCity}</Text>
                      <Text style={styles.cityBlockTitle}>Top things to do</Text>
                      <Text style={styles.cityBlockSub}>
                        {cityBundle?.hasGuide
                          ? "Curated picks + quick tips. Link out for more."
                          : "No curated guide yet — link out for the best current picks."}
                      </Text>
                    </View>

                    {cityBundle?.tripAdvisorUrl ? (
                      <Pressable onPress={() => safeOpenUrl(cityBundle.tripAdvisorUrl)} style={styles.taBtn}>
                        <Text style={styles.taBtnText}>TripAdvisor</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  {cityBundle?.hasGuide && (cityBundle.items?.length ?? 0) > 0 ? (
                    <View style={styles.thingsList}>
                      {cityBundle.items.slice(0, 6).map((it, idx) => (
                        <View key={`${it.title}-${idx}`} style={styles.thingRow}>
                          <Text style={styles.thingIdx}>{idx + 1}.</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.thingTitle}>{it.title}</Text>
                            {it.description ? <Text style={styles.thingDesc}>{it.description}</Text> : null}
                          </View>
                        </View>
                      ))}
                      {(cityBundle.items?.length ?? 0) > 6 ? (
                        <Text style={styles.moreInline}>More in the full city guide.</Text>
                      ) : null}
                    </View>
                  ) : null}

                  {cityBundle?.hasGuide && (cityBundle.quickTips?.length ?? 0) > 0 ? (
                    <View style={styles.tipsBlock}>
                      <Text style={styles.tipsTitle}>Quick tips</Text>
                      {cityBundle.quickTips.slice(0, 5).map((t, idx) => (
                        <Text key={`${t}-${idx}`} style={styles.tipLine}>
                          • {t}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {Platform.OS === "web" || !DateTimePicker ? (
                <View style={{ marginTop: 10, gap: 8 }}>
                  <Text style={styles.fallbackNote}>Date picker not available here. Edit ISO dates (YYYY-MM-DD).</Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput
                      value={startIso}
                      onChangeText={setStartIso}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.colors.textSecondary}
                      style={[styles.input, { flex: 1 }]}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TextInput
                      value={endIso}
                      onChangeText={setEndIso}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.colors.textSecondary}
                      style={[styles.input, { flex: 1 }]}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              ) : null}

              <View style={{ marginTop: 10 }}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Notes (hotel, trains, pubs, mates, etc.)"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[styles.input, styles.textarea]}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {error ? (
                <Text style={styles.errText} numberOfLines={3}>
                  {error}
                </Text>
              ) : null}

              <Pressable onPress={onSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.7 }]}>
                <Text style={styles.saveText}>{saving ? "Saving…" : "Save Trip"}</Text>
              </Pressable>

              {DateTimePicker && picker.open ? (
                <View style={{ marginTop: 10 }}>
                  <DateTimePicker
                    value={parseIsoDateOnly(picker.which === "start" ? (startIso as any) : (endIso as any)) ?? new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={onPickerChange}
                  />
                </View>
              ) : null}
            </ScrollView>
          </GlassCard>
        </Animated.View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  card: { padding: theme.spacing.lg },

  h1: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: 6,
  },
  muted: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },

  devBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.8)",
    backgroundColor: "rgba(0,0,0,0.35)",
    gap: 6,
  },
  devText: { color: "white", fontWeight: "900" },
  devDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 6 },

  leagueRow: { gap: 10, paddingRight: theme.spacing.lg, marginTop: 12 },

  leaguePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  leaguePillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  leaguePillText:: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" } as any,
  leaguePillTextActive: { color: theme.colors.text },

  searchWrap: { marginTop: 12 },
  search: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
  },
  searchMeta: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },

  center: { paddingVertical: 14, alignItems: "center", gap: 10, marginTop: 10 },

  list: { marginTop: 12, gap: 10 },

  pickRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  pickRowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  pickRowTop: { flexDirection: "row", alignItems: "center", gap: 10 },

  rowTitle: { flex: 1, color: theme.colors.text, fontWeight: "800", fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  selectedTag: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  selectedHint: { marginTop: 6, color: "rgba(0,255,136,0.85)", fontSize: theme.fontSize.xs, fontWeight: "800" },

  moreBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
  },
  moreText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  hint: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  backdropWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    elevation: 10,
  },
  backdrop: { flex: 1, backgroundColor: "#000" },

  panelWrap: {
    position: "absolute",
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    zIndex: 20,
    elevation: 20,
  },

  panel: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.38)",
    backgroundColor: "rgba(0,0,0,0.22)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },

  panelFlash: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    backgroundColor: "rgba(0,255,136,0.95)",
  },

  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginBottom: 10,
  },

  panelTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },

  panelKicker: { color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: "900", letterSpacing: 0.4 },
  panelTitle: { marginTop: 4, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg },
  panelSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.55)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  clearText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  dateRow: { marginTop: 12, flexDirection: "row", gap: 10 },

  datePill: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "800" },
  dateValue: { marginTop: 6, color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "900" },

  cityBlock: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    padding: 12,
  },
  cityBlockTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  cityBlockKicker: { color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: "900" },
  cityBlockTitle: { marginTop: 4, color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "900" },
  cityBlockSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, lineHeight: 16 },

  taBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.40)",
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  taBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  thingsList: { marginTop: 10, gap: 8 },
  thingRow: { flexDirection: "row", gap: 8 },
  thingIdx: { width: 20, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "900" },
  thingTitle: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "800" },
  thingDesc: { marginTop: 2, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, lineHeight: 16 },
  moreInline: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },

  tipsBlock: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.10)" },
  tipsTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  tipLine: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, lineHeight: 16 },

  fallbackNote: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },

  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
  },
  textarea: { minHeight: 70, paddingTop: 12 },

  errText: { marginTop: 10, color: theme.colors.error, fontSize: theme.fontSize.sm, fontWeight: "700" },

  saveBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.40)",
    alignItems: "center",
  },
  saveText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
});
