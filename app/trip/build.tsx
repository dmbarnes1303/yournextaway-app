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
  Dimensions,
  Linking,
  Modal,
  KeyboardAvoidingView,
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

function isoFromDatePicker(date?: Date) {
  if (!date) return null;
  return clampIsoToTomorrow(toIsoDate(date));
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
      // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  const modalOpen = !!selectedFixture;

  // Dates + notes
  const [startIso, setStartIso] = useState(from);
  const [endIso, setEndIso] = useState(addDaysIso(from, 2));
  const [notes, setNotes] = useState("");

  const [picker, setPicker] = useState<{ which: "start" | "end"; open: boolean }>({
    which: "start",
    open: false,
  });

  // Keep date fields aligned to route from
  useEffect(() => {
    setStartIso(from);
    setEndIso(addDaysIso(from, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);

  /**
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

  // When selecting a fixture, prefill dates from kickoff (best effort)
  useEffect(() => {
    const iso = selectedFixture?.fixture?.date as string | undefined;
    if (!selectedFixture) return;

    if (iso) {
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) {
        const start = clampIsoToTomorrow(toIsoDate(d));
        setStartIso(start);
        setEndIso(addDaysIso(start, 2));
      }
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [selectedFixture]);

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

    const iso = isoFromDatePicker(date);
    if (!iso) {
      setPicker((p) => ({ ...p, open: false }));
      return;
    }

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

      // Close modal before routing (prevents Android visual glitches)
      setSelectedFixture(null);
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

  const { height: screenH } = Dimensions.get("window");
  const sheetMaxH = Math.min(560, Math.round(screenH * 0.78));

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
          contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.xxl + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard style={styles.card}>
            <Text style={styles.h1}>Pick a match</Text>
            <Text style={styles.muted}>Tap a fixture to open trip details. Save inside the sheet.</Text>

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
                        {selected ? <Text style={styles.selectedHint}>Trip details opened</Text> : null}
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
          </GlassCard>
        </ScrollView>

        {/* MODAL SHEET: Android-safe. No transforms. No compositing issues. */}
        <Modal
          visible={modalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedFixture(null)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedFixture(null)} />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalWrap}
          >
            <View style={[styles.sheet, { maxHeight: sheetMaxH, paddingBottom: theme.spacing.md + insets.bottom }]}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetKicker}>Trip details</Text>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    {selHome && selAway ? `${selHome} vs ${selAway}` : "Selected match"}
                  </Text>
                  <Text style={styles.sheetSub} numberOfLines={2}>
                    {selKick}
                    {selVenue ? ` • ${selVenue}` : ""}
                    {selCity ? ` • ${selCity}` : ""}
                  </Text>
                </View>

                <Pressable onPress={() => setSelectedFixture(null)} style={styles.closeBtn} hitSlop={10}>
                  <Text style={styles.closeText}>Close</Text>
                </Pressable>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: theme.spacing.md }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
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
                    placeholder="Notes (hotel, trains, itinerary, etc.)"
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
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  leaguePillText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },
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

  // Modal sheet
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalWrap: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: theme.spacing.lg,
  },
  sheet: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.38)",
    backgroundColor: "rgba(0,0,0,0.72)",
    overflow: "hidden",
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  sheetKicker: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.xs,
    letterSpacing: 0.2,
  },
  sheetTitle: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg },
  sheetSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  closeText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  dateRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  datePill: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dateLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "800" },
  dateValue: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  cityBlock: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.20)",
    padding: 12,
  },
  cityBlockTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  cityBlockKicker: { color: theme.colors.primary, fontWeight: "900", fontSize: theme.fontSize.xs },
  cityBlockTitle: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  cityBlockSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  taBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,0,0,0.30)",
    alignSelf: "flex-start",
  },
  taBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  thingsList: { marginTop: 12, gap: 10 },
  thingRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  thingIdx: { width: 20, color: theme.colors.primary, fontWeight: "900" },
  thingTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  thingDesc: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
  moreInline: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  tipsBlock: { marginTop: 12 },
  tipsTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  tipLine: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  fallbackNote: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
  },
  textarea: { minHeight: 96 },

  errText: { marginTop: 10, color: "rgba(255, 90, 90, 0.95)", fontWeight: "800" },

  saveBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.34)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
});
