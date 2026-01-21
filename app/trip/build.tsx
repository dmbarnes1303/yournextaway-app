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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { getFixtures } from "@/src/services/apiFootball";
import tripsStore from "@/src/state/trips";

type LeagueOption = { label: string; leagueId: number; season: number };

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIsoDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDaysIso(baseIso: string, days: number): string {
  const d = parseIsoDate(baseIso) ?? new Date();
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

function formatUkDate(iso: string | undefined): string {
  const d = iso ? parseIsoDate(iso) : null;
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function formatUkDateTimeMaybe(iso: string | undefined): string {
  if (!iso) return "TBC";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBC";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function normalizeParam(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

export default function TripBuildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fixtureIdParam = normalizeParam((params as any)?.fixtureId);
  const fixtureIdWanted = fixtureIdParam ? String(fixtureIdParam) : undefined;

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

  const leagues: LeagueOption[] = useMemo(
    () => [
      { label: "Premier League", leagueId: 39, season: 2025 },
      { label: "La Liga", leagueId: 140, season: 2025 },
      { label: "Serie A", leagueId: 135, season: 2025 },
      { label: "Bundesliga", leagueId: 78, season: 2025 },
      { label: "Ligue 1", leagueId: 61, season: 2025 },
    ],
    []
  );

  const [selectedLeague, setSelectedLeague] = useState<LeagueOption>(leagues[0]);

  const from = useMemo(() => toIsoDate(new Date()), []);
  const to = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toIsoDate(d);
  }, []);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  const [selectedFixture, setSelectedFixture] = useState<any | null>(null);

  // Store dates as ISO internally, show dd/mm/yyyy in UI.
  const [startIso, setStartIso] = useState(from);
  const [endIso, setEndIso] = useState(addDaysIso(from, 2));
  const [notes, setNotes] = useState("");

  const [picker, setPicker] = useState<{ which: "start" | "end"; open: boolean }>({
    which: "start",
    open: false,
  });

  // Deep-link handling guards
  const deepLinkHandledRef = useRef(false);
  const deepLinkSearchingRef = useRef(false);

  // Panel animation (make it unmissable)
  const panelAnim = useRef(new Animated.Value(0)).current; // 0 closed, 1 open
  const flashAnim = useRef(new Animated.Value(0)).current; // brief “opened” flash

  const screenH = Dimensions.get("window").height;
  const PANEL_MAX = Math.min(360, Math.round(screenH * 0.44));
  const panelOpen = !!selectedFixture;

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PANEL_MAX + 60, 0],
  });
  const panelOpacity = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const backdropOpacity = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  // Helper: find fixture in a rows array
  function findFixtureInRows(rws: any[], wantedId?: string) {
    if (!wantedId) return null;
    const w = String(wantedId);
    return rws.find((r) => String(r?.fixture?.id ?? "") === w) ?? null;
  }

  // Load fixtures for currently selected league
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setLoading(true);
      setRows([]);
      setSelectedFixture(null);
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

  // Deep-link: if fixtureId provided, try to auto-select it.
  // Strategy:
  // 1) After any load completes, try to find it in current rows.
  // 2) If not found and not yet searched, scan other leagues to locate it and switch.
  useEffect(() => {
    if (!fixtureIdWanted) return;
    if (loading) return;

    // If already selected, we are done.
    if (String(selectedFixture?.fixture?.id ?? "") === String(fixtureIdWanted)) {
      deepLinkHandledRef.current = true;
      return;
    }

    // Try in current rows first.
    const hit = findFixtureInRows(rows, fixtureIdWanted);
    if (hit) {
      setSelectedFixture(hit);

      // Make it visible in the list by narrowing search to teams/venue text
      const home = String(hit?.teams?.home?.name ?? "").trim();
      const away = String(hit?.teams?.away?.name ?? "").trim();
      const venue = String(hit?.fixture?.venue?.name ?? "").trim();
      const seed = home || away || venue;
      if (seed) setSearch(seed);

      deepLinkHandledRef.current = true;

      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ y: 0, animated: true });
      });
      return;
    }

    // If we already handled (or already scanning), do nothing.
    if (deepLinkHandledRef.current) return;
    if (deepLinkSearchingRef.current) return;

    // Scan leagues quickly to find the fixture.
    deepLinkSearchingRef.current = true;

    (async () => {
      try {
        for (const l of leagues) {
          // Skip current league (already checked)
          if (l.leagueId === selectedLeague.leagueId) continue;

          const res = await getFixtures({
            league: l.leagueId,
            season: l.season,
            from,
            to,
          });

          const rws = Array.isArray(res) ? res : [];
          const found = findFixtureInRows(rws, fixtureIdWanted);

          if (found) {
            // Switch league; the normal load effect will pull rows for that league.
            setSelectedLeague(l);

            // After league switch loads, we’ll re-run this effect and select.
            deepLinkSearchingRef.current = false;
            return;
          }
        }

        // Not found in any league
        setError(
          "That match isn’t available in the current 30-day window for supported leagues. Try Fixtures and adjust the date range."
        );
        deepLinkHandledRef.current = true;
      } catch (e: any) {
        setError(e?.message ?? "Could not auto-open that fixture.");
        deepLinkHandledRef.current = true;
      } finally {
        deepLinkSearchingRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureIdWanted, loading, rows, selectedLeague, leagues, from, to, selectedFixture]);

  // When selecting fixture: set dates + animate panel open + flash “opened”
  useEffect(() => {
    const iso = selectedFixture?.fixture?.date as string | undefined;

    if (!selectedFixture) {
      Animated.timing(panelAnim, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      return;
    }

    if (iso) {
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) {
        const start = toIsoDate(d);
        setStartIso(start);
        setEndIso(addDaysIso(start, 2));
      }
    }

    setError(null);

    Animated.timing(panelAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
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

    const iso = toIsoDate(date);
    if (picker.which === "start") {
      setStartIso(iso);
      const end = parseIsoDate(endIso);
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

  const bottomPad = panelOpen ? PANEL_MAX + theme.spacing.xl : theme.spacing.xxl;

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
            <Text style={styles.muted}>Tap a fixture to open trip details. Save from the panel.</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
              {leagues.map((l) => {
                const active = l.leagueId === selectedLeague.leagueId;
                return (
                  <Pressable
                    key={l.leagueId}
                    onPress={() => {
                      deepLinkHandledRef.current = true; // user is manually overriding deep-link behavior
                      setSelectedLeague(l);
                    }}
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

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? (
              <View style={{ marginTop: 12 }}>
                <EmptyState title="Couldn’t load fixtures" message={error} />
              </View>
            ) : null}

            {!loading && !error && filteredRows.length === 0 ? (
              <View style={{ marginTop: 12 }}>
                <EmptyState title="No fixtures found" message="Try a different league, date window, or search." />
              </View>
            ) : null}

            {!loading && !error && filteredRows.length > 0 ? (
              <>
                <View style={styles.list}>
                  {visibleRows.map((r, idx) => {
                    const fixtureId = r?.fixture?.id;
                    const home = r?.teams?.home?.name ?? "Home";
                    const away = r?.teams?.away?.name ?? "Away";
                    const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
                    const venue = r?.fixture?.venue?.name ?? "";
                    const line2 = venue ? `${kickoff} • ${venue}` : kickoff;

                    const selected = String(selectedFixture?.fixture?.id ?? "") === String(fixtureId ?? "");

                    return (
                      <Pressable
                        key={String(fixtureId ?? idx)}
                        onPress={() => {
                          deepLinkHandledRef.current = true;
                          setSelectedFixture(r);
                        }}
                        style={[styles.pickRow, selected && styles.pickRowSelected]}
                      >
                        <View style={styles.pickRowTop}>
                          <Text style={styles.rowTitle}>{home} vs {away}</Text>
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

        {panelOpen ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedFixture(null)}
            accessibilityRole="button"
            accessibilityLabel="Close trip details panel"
          >
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </Pressable>
        ) : null}

        <Animated.View
          pointerEvents={panelOpen ? "auto" : "none"}
          style={[
            styles.panelWrap,
            {
              opacity: panelOpacity,
              transform: [{ translateY: panelTranslateY }],
            },
          ]}
        >
          <GlassCard style={styles.panel} intensity={30}>
            <Animated.View pointerEvents="none" style={[styles.panelFlash, { opacity: flashAnim }]} />

            <View style={styles.handle} />

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
                <Text style={styles.dateValue}>{formatUkDate(startIso)}</Text>
              </Pressable>

              <Pressable onPress={() => openPicker("end")} style={styles.datePill}>
                <Text style={styles.dateLabel}>End</Text>
                <Text style={styles.dateValue}>{formatUkDate(endIso)}</Text>
              </Pressable>
            </View>

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
              <Text style={styles.errText} numberOfLines={2}>
                {error}
              </Text>
            ) : null}

            <Pressable onPress={onSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.7 }]}>
              <Text style={styles.saveText}>{saving ? "Saving…" : "Save Trip"}</Text>
            </Pressable>
          </GlassCard>

          {DateTimePicker && picker.open ? (
            <View style={{ marginTop: 10 }}>
              <DateTimePicker
                value={parseIsoDate(picker.which === "start" ? startIso : endIso) ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={onPickerChange}
              />
            </View>
          ) : null}
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

  pickRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

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

  selectedHint: {
    marginTop: 6,
    color: "rgba(0,255,136,0.85)",
    fontSize: theme.fontSize.xs,
    fontWeight: "800",
  },

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

  backdrop: {
    flex: 1,
    backgroundColor: "#000",
  },

  panelWrap: {
    position: "absolute",
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
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
    elevation: 14,
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

  panelKicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  panelTitle: {
    marginTop: 4,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.lg,
  },
  panelSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },

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
