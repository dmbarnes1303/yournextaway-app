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
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";

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

function parseIsoDateOnly(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDaysIso(baseIso: string, days: number): string {
  const d = parseIsoDateOnly(baseIso) ?? new Date();
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

function formatUkDate(iso: string | undefined): string {
  const d = iso ? parseIsoDateOnly(iso) : null;
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
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

function coerceString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim()) return v[0].trim();
  return null;
}

function coerceNumber(v: unknown): number | null {
  const s = coerceString(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function safeId(x: unknown): string {
  const s = String(x ?? "");
  return s;
}

export default function TripBuildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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

  // Route params (power “Plan Trip” deep links)
  const routeFixtureId = useMemo(() => coerceString(params.fixtureId), [params.fixtureId]);
  const routeLeagueId = useMemo(() => coerceNumber(params.leagueId), [params.leagueId]);
  const routeSeason = useMemo(() => coerceNumber(params.season), [params.season]);
  const routeFrom = useMemo(() => coerceString(params.from), [params.from]);
  const routeTo = useMemo(() => coerceString(params.to), [params.to]);

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const defaultToIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toIsoDate(d);
  }, []);

  const from = useMemo(() => routeFrom ?? todayIso, [routeFrom, todayIso]);
  const to = useMemo(() => routeTo ?? defaultToIso, [routeTo, defaultToIso]);

  const [selectedLeague, setSelectedLeague] = useState<LeagueOption>(leagues[0]);

  // Apply league/season from route params (if provided)
  useEffect(() => {
    if (!routeLeagueId) return;

    const match = leagues.find((l) => l.leagueId === routeLeagueId);
    if (!match) return;

    const season = routeSeason ?? match.season;

    setSelectedLeague((cur) => {
      if (cur.leagueId === match.leagueId && cur.season === season) return cur;
      return { ...match, season };
    });
  }, [routeLeagueId, routeSeason, leagues]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  const [selectedFixture, setSelectedFixture] = useState<any | null>(null);

  // Dates + notes
  const [startIso, setStartIso] = useState(from);
  const [endIso, setEndIso] = useState(addDaysIso(from, 2));
  const [notes, setNotes] = useState("");

  // Keep date defaults in sync when from param changes (rare, but correct)
  useEffect(() => {
    setStartIso(from);
    setEndIso(addDaysIso(from, 2));
  }, [from]);

  const [picker, setPicker] = useState<{ which: "start" | "end"; open: boolean }>({
    which: "start",
    open: false,
  });

  // Panel animation
  const panelAnim = useRef(new Animated.Value(0)).current; // 0 closed, 1 open
  const flashAnim = useRef(new Animated.Value(0)).current;

  const screenH = Dimensions.get("window").height;
  const PANEL_MAX = Math.min(380, Math.round(screenH * 0.46));
  const panelOpen = !!selectedFixture;

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PANEL_MAX + 80, 0],
  });
  const panelOpacity = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Backdrop is a plain View with a Pressable ABOVE it (so touches always work)
  const backdropOpacity = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.38],
  });

  // --- Load fixtures ---
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setNotice(null);
      setLoading(true);
      setRows([]);
      setSearch("");
      setVisibleCount(12);
      setSelectedFixture(null);

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
        setNotice(e?.message ?? "Failed to load fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedLeague, from, to]);

  // Auto-select fixture if fixtureId is provided AND present in this fetch window.
  // IMPORTANT: we do NOT keep re-triggering this once the user has interacted.
  const [autoApplied, setAutoApplied] = useState(false);

  useEffect(() => {
    if (autoApplied) return;
    if (!routeFixtureId) return;
    if (!rows.length) return;

    const found = rows.find((r) => safeId(r?.fixture?.id) === safeId(routeFixtureId));
    if (found) {
      setSelectedFixture(found);
      setAutoApplied(true);
      return;
    }

    // Not found in current list: show a *notice* but allow manual selection.
    setNotice(
      "That match isn’t in the current list. It may be outside the 30-day window or in a different league. Select it manually or switch league."
    );
    setAutoApplied(true);
  }, [autoApplied, routeFixtureId, rows]);

  // Panel open/close animations + date prefill (from fixture kickoff)
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

    // Prefill dates based on kickoff, but do not overwrite if user already typed notes/dates in-session
    if (iso) {
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) {
        const start = toIsoDate(d);
        setStartIso(start);
        setEndIso(addDaysIso(start, 2));
      }
    }

    setNotice(null);

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

    // Ensure the top content stays visible behind the header + reduce “where did it come from” confusion
    requestAnimationFrame(() => listRef.current?.scrollTo({ y: 0, animated: true }));
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
      const end = parseIsoDateOnly(endIso);
      if (end && end.getTime() < date.getTime()) setEndIso(addDaysIso(iso, 2));
    } else {
      setEndIso(iso);
    }

    if (Platform.OS === "android") setPicker((p) => ({ ...p, open: false }));
  }

  function closePanel() {
    Keyboard.dismiss();
    setSelectedFixture(null);
  }

  async function onSave() {
    if (!selectedFixture?.fixture?.id) {
      setNotice("Select a fixture first.");
      return;
    }
    if (!startIso || !endIso) {
      setNotice("Start/end dates are required.");
      return;
    }

    setNotice(null);
    setSaving(true);

    try {
      const fixtureId = safeId(selectedFixture.fixture.id);
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
      setNotice(e?.message ?? "Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }

  const selHome = selectedFixture?.teams?.home?.name ?? "";
  const selAway = selectedFixture?.teams?.away?.name ?? "";
  const selKick = formatUkDateTimeMaybe(selectedFixture?.fixture?.date);
  const selVenue = selectedFixture?.fixture?.venue?.name ?? "";
  const selCity = selectedFixture?.fixture?.venue?.city ?? "";

  // Reserve space so list isn’t hidden by panel
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
          <GlassCard style={styles.card} intensity={26}>
            <Text style={styles.h1}>Pick a match</Text>
            <Text style={styles.muted}>Tap a fixture to open trip details. Save from the panel.</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
              {leagues.map((l) => {
                const active = l.leagueId === selectedLeague.leagueId;
                return (
                  <Pressable
                    key={l.leagueId}
                    onPress={() => {
                      setAutoApplied(false); // allow new routeFixtureId attempts when user changes context
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

            {!loading && notice ? (
              <View style={{ marginTop: 12 }}>
                <EmptyState title="Notice" message={notice} />
              </View>
            ) : null}

            {!loading && !notice && filteredRows.length === 0 ? (
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

                    const selected = safeId(selectedFixture?.fixture?.id) === safeId(fixtureId);

                    return (
                      <Pressable
                        key={fixtureId ? safeId(fixtureId) : `idx-${idx}`}
                        onPress={() => {
                          setNotice(null);
                          setSelectedFixture(r);
                        }}
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

        {/* Backdrop: MUST NOT steal panel touches.
            We render it BELOW the panel (earlier) and only allow close taps on the backdrop area. */}
        {panelOpen ? (
          <Animated.View pointerEvents="auto" style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closePanel} accessibilityRole="button">
              <View style={styles.backdrop} />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Bottom panel (above backdrop) */}
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

              {/* This MUST work: it now sits above the backdrop, and nothing overlays it. */}
              <Pressable onPress={closePanel} style={styles.clearBtn} hitSlop={12} accessibilityRole="button">
                <Text style={styles.clearText}>Change</Text>
              </Pressable>
            </View>

            <View style={styles.dateRow}>
              <Pressable onPress={() => openPicker("start")} style={styles.datePill} accessibilityRole="button">
                <Text style={styles.dateLabel}>Start</Text>
                <Text style={styles.dateValue}>{formatUkDate(startIso)}</Text>
              </Pressable>

              <Pressable onPress={() => openPicker("end")} style={styles.datePill} accessibilityRole="button">
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

            {notice ? (
              <Text style={styles.errText} numberOfLines={3}>
                {notice}
              </Text>
            ) : null}

            <Pressable onPress={onSave} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.7 }]}>
              <Text style={styles.saveText}>{saving ? "Saving…" : "Save Trip"}</Text>
            </Pressable>
          </GlassCard>

          {DateTimePicker && picker.open ? (
            <View style={{ marginTop: 10 }}>
              <DateTimePicker
                value={parseIsoDateOnly(picker.which === "start" ? startIso : endIso) ?? new Date()}
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

  backdrop: { flex: 1, backgroundColor: "#000" },

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
