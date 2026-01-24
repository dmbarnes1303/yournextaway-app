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
  Modal,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, getFixtureById } from "@/src/services/apiFootball";
import tripsStore, { type Trip } from "@/src/state/trips";

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
    if (!can) throw new Error("Cannot open URL");
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn’t open link", "Your device could not open that link.");
  }
}

/**
 * Android-safe “sheet” card (no blur, no transforms, no overflow tricks).
 */
function SheetCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.sheetCard}>
      <View pointerEvents="none" style={styles.sheetTint} />
      <View style={styles.sheetContent}>{children}</View>
    </View>
  );
}

type EditSnapshot = {
  fixture: any | null;
  startIso: string;
  endIso: string;
  notes: string;
};

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
  const routeTripId = useMemo(() => paramString((params as any)?.tripId), [params]);
  const isEditing = !!routeTripId;

  const routeFixtureId = useMemo(() => paramString((params as any)?.fixtureId), [params]);
  const routeLeagueId = useMemo(() => paramNumber((params as any)?.leagueId), [params]);
  const routeSeason = useMemo(() => paramNumber((params as any)?.season), [params]);
  const fromParam = useMemo(() => paramString((params as any)?.from), [params]);
  const toParam = useMemo(() => paramString((params as any)?.to), [params]);

  const from = useMemo(() => clampIsoToTomorrow(fromParam ?? defaultFrom), [fromParam, defaultFrom]);
  const to = useMemo(() => toParam ?? defaultTo, [toParam, defaultTo]);

  const [selectedLeague, setSelectedLeague] = useState<LeagueOption>(LEAGUES[0]);

  // Apply league/season from route params (for fixtures list browsing)
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

  // Edit mode state
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const editTripMatchId = useMemo(() => (editTrip?.matchIds?.[0] ? String(editTrip.matchIds[0]) : null), [editTrip]);

  // Dates + notes
  // Baseline: align to route "from" as a 2-night mini-break when no match selected
  const [startIso, setStartIso] = useState(from);
  const [endIso, setEndIso] = useState(addDaysIso(from, 2));
  const [notes, setNotes] = useState("");

  // Prevent “kickoff default” from overwriting loaded edit-trip dates for the same fixture.
  const editDatesLockRef = useRef(false);

  // Edit snapshot for “Close = discard changes”
  const editSnapshotRef = useRef<EditSnapshot | null>(null);

  const [picker, setPicker] = useState<{ which: "start" | "end"; open: boolean }>({
    which: "start",
    open: false,
  });

  function validateDateOrder(start: string, end: string): boolean {
    const a = parseIsoDateOnly(start);
    const b = parseIsoDateOnly(end);
    if (!a || !b) return false;
    return b.getTime() > a.getTime();
  }

  function closeSheet() {
    if (isEditing && editSnapshotRef.current) {
      const snap = editSnapshotRef.current;
      setStartIso(snap.startIso);
      setEndIso(snap.endIso);
      setNotes(snap.notes);
      setSelectedFixture(snap.fixture);
      setError(null);
      return;
    }

    setSelectedFixture(null);
    setError(null);
  }

  // Keep date fields aligned to route from (ONLY when not editing)
  useEffect(() => {
    if (isEditing) return;
    setStartIso(from);
    setEndIso(addDaysIso(from, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, isEditing]);

  /**
   * EDIT MODE: load trip + prefill fields + load its fixture.
   */
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!routeTripId) return;

      setError(null);
      setPrefillLoading(true);

      try {
        if (!tripsStore.getState().loaded) {
          await tripsStore.loadTrips();
        }

        if (cancelled) return;

        const s = tripsStore.getState();
        const t = s.trips.find((x) => x.id === routeTripId) ?? null;

        if (!t) {
          setEditTrip(null);
          editSnapshotRef.current = null;
          setError("Trip not found. It may not exist on this device.");
          return;
        }

        setEditTrip(t);

        const nextNotes = t.notes ?? "";
        const nextStart = t.startDate ? clampIsoToTomorrow(String(t.startDate)) : clampIsoToTomorrow(from);
        const nextEnd = t.endDate ? String(t.endDate) : addDaysIso(nextStart, 2);

        setNotes(nextNotes);
        setStartIso(nextStart);
        setEndIso(nextEnd);

        editDatesLockRef.current = true;

        const firstMatchId = t.matchIds?.[0] ? String(t.matchIds[0]) : null;
        if (!firstMatchId) {
          setSelectedFixture(null);
          editSnapshotRef.current = { fixture: null, startIso: nextStart, endIso: nextEnd, notes: nextNotes };
          return;
        }

        const r = await getFixtureById(firstMatchId);
        if (cancelled) return;

        if (!r) {
          setError("Couldn’t load the match linked to this trip. You can still select one from the list.");
          setSelectedFixture(null);
          editSnapshotRef.current = { fixture: null, startIso: nextStart, endIso: nextEnd, notes: nextNotes };
          return;
        }

        setSelectedFixture(r);

        // Snapshot for “Close = discard changes”
        editSnapshotRef.current = { fixture: r, startIso: nextStart, endIso: nextEnd, notes: nextNotes };

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
        setError(e?.message ?? "Couldn’t load this trip for editing.");
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [routeTripId, routeSeason, from]);

  /**
   * CREATE MODE (Plan Trip): if fixtureId is provided, fetch fixture directly.
   */
  useEffect(() => {
    let cancelled = false;

    async function prefill() {
      if (isEditing) return;
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
  }, [isEditing, routeFixtureId, routeSeason]);

  // Load fixtures list whenever league/from/to change
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setLoading(true);
      setRows([]);
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
   * When a fixture is selected, prefill dates as a 2-night mini-break:
   * - arrival: 1 day before matchday
   * - departure: 1 day after matchday
   *
   * In EDIT MODE: do not overwrite the saved dates when the selected fixture is the trip’s own fixture.
   */
  useEffect(() => {
    const iso = selectedFixture?.fixture?.date as string | undefined;
    if (!selectedFixture || !iso) return;

    const fixtureId = selectedFixture?.fixture?.id != null ? String(selectedFixture.fixture.id) : null;

    // If we loaded an existing trip and this is that same match, keep saved dates once.
    if (isEditing && editDatesLockRef.current && editTripMatchId && fixtureId === editTripMatchId) {
      editDatesLockRef.current = false;

      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ y: 0, animated: true });
      });
      return;
    }

    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return;

    const matchDay = toIsoDate(d);

    const start = clampIsoToTomorrow(addDaysIso(matchDay, -1));
    const end = addDaysIso(matchDay, 1);

    setStartIso(start);

    const startDt = parseIsoDateOnly(start);
    const endDt = parseIsoDateOnly(end);

    if (startDt && endDt && endDt.getTime() <= startDt.getTime()) {
      setEndIso(addDaysIso(start, 2));
    } else {
      setEndIso(end);
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [selectedFixture, isEditing, editTripMatchId]);

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
      const nextStart = parseIsoDateOnly(iso);

      if (end && nextStart && end.getTime() <= nextStart.getTime()) {
        setEndIso(addDaysIso(iso, 2));
      }
    } else {
      setEndIso(iso);

      const start = parseIsoDateOnly(startIso);
      const nextEnd = parseIsoDateOnly(iso);

      if (start && nextEnd && nextEnd.getTime() <= start.getTime()) {
        // Keep it simple: bump to start + 2 nights
        setEndIso(addDaysIso(startIso, 2));
      }
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
    if (!validateDateOrder(startIso, endIso)) {
      setError("End date must be after start date.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const fixtureId = String(selectedFixture.fixture.id);
      const venueCityRaw = (selectedFixture?.fixture?.venue?.city as string | undefined)?.trim() || "";
      const venueCity = venueCityRaw || "Trip";

      const patch: Partial<Omit<Trip, "id">> = {
        cityId: venueCity,
        matchIds: [fixtureId],
        startDate: startIso,
        endDate: endIso,
        notes: notes.trim(),
      };

      // If we have a real venue city, allow slug migration; otherwise keep it generic.
      if (venueCityRaw) {
        (patch as any).citySlug = venueCityRaw;
      }

      if (isEditing && routeTripId) {
        await tripsStore.updateTrip(routeTripId, patch);

        // Update snapshot so subsequent Close behaves sensibly after a save
        editSnapshotRef.current = { fixture: selectedFixture, startIso, endIso, notes: notes.trim() };

        setSelectedFixture(null);
        router.replace({ pathname: "/trip/[id]", params: { id: routeTripId } });
        return;
      }

      const t = await tripsStore.addTrip({
        ...(patch as any),
        ...(venueCityRaw ? { citySlug: venueCityRaw } : {}),
      });

      setSelectedFixture(null);
      router.replace({ pathname: "/trip/[id]", params: { id: t.id } });
    } catch (e: any) {
      setError(e?.message ?? (isEditing ? "Failed to update trip." : "Failed to save trip."));
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

  const currentMatchBlock = useMemo(() => {
    if (!isEditing || !editSnapshotRef.current?.fixture) return null;
    const f = editSnapshotRef.current.fixture;
    const home = f?.teams?.home?.name ?? "Home";
    const away = f?.teams?.away?.name ?? "Away";
    const kick = formatUkDateTimeMaybe(f?.fixture?.date);
    const venue = f?.fixture?.venue?.name ?? "";
    const city = f?.fixture?.venue?.city ?? "";
    const extra = [venue, city].filter(Boolean).join(" • ");
    return { home, away, kick, extra };
  }, [isEditing, prefillLoading]);

  return (
    <Background imageUrl={getBackground("trips")}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isEditing ? "Edit Trip" : "Build Trip",
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
            <Text style={styles.h1}>{isEditing ? "Edit trip match" : "Pick a match"}</Text>
            <Text style={styles.muted}>
              {isEditing
                ? "Select a fixture to update this trip. Save inside the sheet."
                : "Tap a fixture to open trip details. Save inside the sheet."}
            </Text>

            {isEditing && currentMatchBlock ? (
              <View style={styles.currentBlock}>
                <Text style={styles.currentKicker}>Current match</Text>
                <Text style={styles.currentTitle}>
                  {currentMatchBlock.home} vs {currentMatchBlock.away}
                </Text>
                <Text style={styles.currentSub}>
                  {currentMatchBlock.kick}
                  {currentMatchBlock.extra ? ` • ${currentMatchBlock.extra}` : ""}
                </Text>
                <Text style={styles.currentHint}>Pick another fixture below to change it.</Text>
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
                <Text style={styles.muted}>{isEditing ? "Loading your trip…" : "Prefilling your match…"}</Text>
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

            {!loading && !error && filteredRows.length > 0 ? (
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
                        onPress={() => {
                          // If user picks a different fixture in edit mode, allow kickoff default to apply.
                          if (isEditing) editDatesLockRef.current = false;
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
                        {selected ? <Text style={styles.selectedHint}>Trip details opened</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>

                {visibleCount < filteredRows.length ? (
                  <Pressable onPress={() => setVisibleCount((n) => n + 12)} style={styles.moreBtn}>
                    <Text style={styles.moreText}>
Show more
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </GlassCard>
        </ScrollView>

        {/* Native Modal sheet (Android-stable) */}
        <Modal
          visible={!!selectedFixture}
          transparent
          animationType="slide"
          onRequestClose={closeSheet}
        >
          <View style={styles.modalWrap}>
            <Pressable style={styles.modalBackdrop} onPress={closeSheet} />

            <SafeAreaView edges={["bottom"]} style={[styles.sheetWrap, { paddingBottom: insets.bottom }]}>
              <SheetCard>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetKicker}>{isEditing ? "Edit trip details" : "Trip details"}</Text>
                    <Text style={styles.sheetTitle} numberOfLines={1}>
                      {selHome && selAway ? `${selHome} vs ${selAway}` : "Selected match"}
                    </Text>
                    <Text style={styles.sheetSub} numberOfLines={2}>
                      {selKick}
                      {selVenue ? ` • ${selVenue}` : ""}
                      {selCity ? ` • ${selCity}` : ""}
                    </Text>
                  </View>

                  <Pressable onPress={closeSheet} style={styles.closeBtn} hitSlop={10}>
                    <Text style={styles.closeText}>Close</Text>
                  </Pressable>
                </View>

                <ScrollView
                  style={{ maxHeight: 520 }}
                  contentContainerStyle={{ paddingBottom: theme.spacing.md }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
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
                      placeholder="Notes (hotel, trains, plans, etc.)"
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
                    <Text style={styles.saveText}>
                      {saving ? "Saving…" : isEditing ? "Update Trip" : "Save Trip"}
                    </Text>
                  </Pressable>

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
                </ScrollView>
              </SheetCard>
            </SafeAreaView>
          </View>
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

  currentBlock: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  currentKicker: { color: theme.colors.primary, fontWeight: "900", fontSize: theme.fontSize.xs },
  currentTitle: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  currentSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
  currentHint: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },

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

  // Modal sheet
  modalWrap: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },

  sheetWrap: { paddingHorizontal: theme.spacing.lg },
  sheetCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.38)",
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(26, 31, 46, 0.60)" },
  sheetContent: { padding: theme.spacing.md },

  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 10,
  },

  sheetHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  sheetKicker: { color: theme.colors.primary, fontWeight: "900", fontSize: theme.fontSize.xs },
  sheetTitle: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg },
  sheetSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  closeText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  dateRow: { marginTop: 12, flexDirection: "row", gap: 10 },

  datePill: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "800" },
  dateValue: { marginTop: 6, color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "900" },

  cityBlock: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
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
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignSelf: "flex-start",
  },
  taBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  thingsList: { marginTop: 10, gap: 10 },
  thingRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  thingIdx: { width: 18, color: theme.colors.primary, fontWeight: "900" },
  thingTitle: { color: theme.colors.text, fontWeight: "900" },
  thingDesc: { marginTop: 4, color: theme.colors.textSecondary, lineHeight: 18 },

  moreInline: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  tipsBlock: { marginTop: 12 },
  tipsTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm, marginBottom: 6 },
  tipLine: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  fallbackNote: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
  },
  textarea: { minHeight: 90 },

  errText: { marginTop: 10, color: "rgba(255, 80, 80, 0.95)", fontWeight: "800" },

  saveBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
  },
  saveText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
});                      
