// app/trip/build.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import * as WebBrowser from "expo-web-browser";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import tripsStore, { type Trip } from "@/src/state/trips";

import {
  LEAGUES,
  getRollingWindowIso,
  toIsoDate,
  parseIsoDateOnly,
  addDaysIso,
  clampFromIsoToTomorrow,
  normalizeWindowIso,
  type LeagueOption,
} from "@/src/constants/football";

import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getTopThingsToDoForTrip } from "@/src/data/cityGuides";
import { buildAffiliateLinks } from "@/src/services/affiliateLinks";

import { computeLikelyPlaceholderTbcIds, isKickoffTbc } from "@/src/utils/kickoffTbc";
import { beginPartnerClick } from "@/src/services/partnerClicks";
import type { PartnerId } from "@/src/core/partners";

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

function paramBool(v: unknown): boolean {
  const s = paramString(v);
  if (!s) return false;
  return s === "1" || s.toLowerCase() === "true" || s.toLowerCase() === "yes";
}

function safeCityName(input: unknown): string {
  const s = String(input ?? "").trim();
  return s || "your destination";
}

async function safeOpenUrl(url: string) {
  const u = String(url ?? "").trim();
  if (!u) return;

  const hasScheme = /^https?:\/\//i.test(u);
  const candidate = hasScheme ? u : `https://${u}`;

  try {
    if (Platform.OS === "web") {
      const can = await Linking.canOpenURL(candidate);
      if (!can) throw new Error("Cannot open URL");
      await Linking.openURL(candidate);
      return;
    }

    await WebBrowser.openBrowserAsync(candidate, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      readerMode: false,
      enableBarCollapsing: true,
      showTitle: true,
    });
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
      <View style={[styles.sheetTint, { pointerEvents: "none" }]} />
      <View style={styles.sheetContent}>{children}</View>
    </View>
  );
}

type EditSnapshot = {
  fixture: FixtureListRow | null;
  startIso: string;
  endIso: string;
  notes: string;
};

type BuildLeague = LeagueOption & { key?: string };

function fixtureIdStr(r: any): string {
  const id = r?.fixture?.id;
  return id != null ? String(id) : "";
}

function kickoffTimeSortValue(r: any, isTbc: boolean): number {
  if (isTbc) return Number.POSITIVE_INFINITY;
  const raw = r?.fixture?.date ? String(r.fixture.date) : "";
  const t = raw ? new Date(raw).getTime() : Number.POSITIVE_INFINITY;
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
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

  // Central rolling window defaults (tomorrow onwards)
  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromParam = useMemo(() => paramString((params as any)?.from), [params]);
  const toParam = useMemo(() => paramString((params as any)?.to), [params]);

  const window = useMemo(() => {
    const w = { from: fromParam ?? rolling.from, to: toParam ?? rolling.to };
    return normalizeWindowIso(w);
  }, [fromParam, toParam, rolling.from, rolling.to]);

  const from = useMemo(() => clampFromIsoToTomorrow(window.from), [window.from]);
  const to = useMemo(() => window.to, [window.to]);

  // Route params
  const routeTripId = useMemo(() => paramString((params as any)?.tripId), [params]);
  const isEditing = !!routeTripId;

  const routeFixtureId = useMemo(() => paramString((params as any)?.fixtureId), [params]);
  const routeLeagueId = useMemo(() => paramNumber((params as any)?.leagueId), [params]);
  const routeSeason = useMemo(() => paramNumber((params as any)?.season), [params]);

  // Global browsing mode (Home shortcuts use this)
  const routeGlobal = useMemo(() => paramBool((params as any)?.global), [params]);

  const ALL_LEAGUES: BuildLeague = useMemo(
    () => ({
      label: "All leagues",
      leagueId: 0,
      season: routeSeason ?? (LEAGUES[0]?.season ?? 2025),
      countryCode: "EU",
      key: "all",
    }),
    [routeSeason]
  );

  const leagueOptions: BuildLeague[] = useMemo(() => [ALL_LEAGUES, ...LEAGUES], [ALL_LEAGUES]);

  const [selectedLeague, setSelectedLeague] = useState<BuildLeague>(
    routeGlobal ? ALL_LEAGUES : leagueOptions[1] ?? ALL_LEAGUES
  );

  // Apply league/season from route params (for fixtures list browsing)
  useEffect(() => {
    if (routeGlobal && !routeLeagueId) {
      setSelectedLeague(ALL_LEAGUES);
      return;
    }

    if (!routeLeagueId) return;

    const match = LEAGUES.find((l) => l.leagueId === routeLeagueId);
    if (!match) return;

    const season = routeSeason ?? match.season;
    setSelectedLeague((cur) => {
      if (cur.leagueId === match.leagueId && cur.season === season) return cur;
      return { ...match, season };
    });
  }, [routeGlobal, routeLeagueId, routeSeason, ALL_LEAGUES]);

  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  const [selectedFixture, setSelectedFixture] = useState<FixtureListRow | null>(null);

  // TBC placeholder detection for current loaded result set
  const [placeholderTbcIds, setPlaceholderTbcIds] = useState<Set<string>>(new Set());

  // Edit mode state
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const editTripMatchId = useMemo(
    () => (editTrip?.matchIds?.[0] ? String(editTrip.matchIds[0]) : null),
    [editTrip]
  );

  // Dates + notes
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

  const isAllLeaguesSelected = useCallback((l: BuildLeague) => l.leagueId === 0, []);

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
      setError(null);
      setSelectedFixture(null);
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
          setSelectedFixture(null);
          setError("Trip not found. It may not exist on this device.");
          return;
        }

        setEditTrip(t);

        const nextNotes = t.notes ?? "";
        const nextStart = t.startDate ? clampFromIsoToTomorrow(String(t.startDate)) : clampFromIsoToTomorrow(from);
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
        editSnapshotRef.current = { fixture: r, startIso: nextStart, endIso: nextEnd, notes: nextNotes };

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

  async function loadFixturesForLeague(l: LeagueOption, fromIso: string, toIso: string) {
    const res = await getFixtures({
      league: l.leagueId,
      season: l.season,
      from: fromIso,
      to: toIso,
    });
    return Array.isArray(res) ? res : [];
  }

  async function loadFixturesGlobal(fromIso: string, toIso: string) {
    const results = await Promise.all(
      LEAGUES.map(async (l) => {
        try {
          return await loadFixturesForLeague(l, fromIso, toIso);
        } catch {
          return [];
        }
      })
    );

    const flat = results.flat();
    const seen = new Set<string>();
    const deduped: FixtureListRow[] = [];
    for (const r of flat) {
      const id = fixtureIdStr(r);
      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      deduped.push(r);
    }
    return deduped;
  }

  // Load fixtures list whenever league/from/to change
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setLoading(true);
      setRows([]);
      setPlaceholderTbcIds(new Set());
      setVisibleCount(12);
      setSearch("");

      try {
        const res = isAllLeaguesSelected(selectedLeague)
          ? await loadFixturesGlobal(from, to)
          : await loadFixturesForLeague(selectedLeague, from, to);

        if (cancelled) return;

        const nextRows = Array.isArray(res) ? res : [];
        setRows(nextRows);
        setPlaceholderTbcIds(computeLikelyPlaceholderTbcIds(nextRows));
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
  }, [selectedLeague, from, to, isAllLeaguesSelected]);

  /**
   * Auto-prefill dates:
   * default: 1 day before matchday to 1 day after matchday
   * if kickoff is TBC: do not auto-adjust
   */
  useEffect(() => {
    const iso = selectedFixture?.fixture?.date as string | undefined;
    if (!selectedFixture || !iso) return;

    const fixtureId = fixtureIdStr(selectedFixture);

    if (isEditing && editDatesLockRef.current && editTripMatchId && fixtureId === editTripMatchId) {
      editDatesLockRef.current = false;
      requestAnimationFrame(() => listRef.current?.scrollTo({ y: 0, animated: true }));
      return;
    }

    const tbc = isKickoffTbc(selectedFixture, placeholderTbcIds);
    if (tbc) {
      requestAnimationFrame(() => listRef.current?.scrollTo({ y: 0, animated: true }));
      return;
    }

    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return;

    const matchDay = toIsoDate(d);
    const start = clampFromIsoToTomorrow(addDaysIso(matchDay, -1));
    const end = addDaysIso(matchDay, 1);

    setStartIso(start);

    const startDt = parseIsoDateOnly(start);
    const endDt = parseIsoDateOnly(end);

    if (startDt && endDt && endDt.getTime() <= startDt.getTime()) setEndIso(addDaysIso(start, 2));
    else setEndIso(end);

    requestAnimationFrame(() => listRef.current?.scrollTo({ y: 0, animated: true }));
  }, [selectedFixture, isEditing, editTripMatchId, placeholderTbcIds]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r: any) => {
      const home = String(r?.teams?.home?.name ?? "").toLowerCase();
      const away = String(r?.teams?.away?.name ?? "").toLowerCase();
      const venue = String(r?.fixture?.venue?.name ?? "").toLowerCase();
      const city = String(r?.fixture?.venue?.city ?? "").toLowerCase();
      const league = String(r?.league?.name ?? "").toLowerCase();
      return home.includes(q) || away.includes(q) || venue.includes(q) || city.includes(q) || league.includes(q);
    });
  }, [rows, search]);

  const sortedFilteredRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((a: any, b: any) => {
      const atbc = isKickoffTbc(a, placeholderTbcIds);
      const btbc = isKickoffTbc(b, placeholderTbcIds);
      const av = kickoffTimeSortValue(a, atbc);
      const bv = kickoffTimeSortValue(b, btbc);
      return av - bv;
    });
    return copy;
  }, [filteredRows, placeholderTbcIds]);

  const visibleRows = useMemo(() => sortedFilteredRows.slice(0, visibleCount), [sortedFilteredRows, visibleCount]);

  function openPicker(which: "start" | "end") {
    if (Platform.OS === "web" || !DateTimePicker) return;
    setPicker({ which, open: true });
  }

  function onPickerChange(_: any, date?: Date) {
    if (!date) {
      setPicker((p) => ({ ...p, open: false }));
      return;
    }

    const iso = clampFromIsoToTomorrow(toIsoDate(date));

    if (picker.which === "start") {
      setStartIso(iso);
      const end = parseIsoDateOnly(endIso);
      const nextStart = parseIsoDateOnly(iso);
      if (end && nextStart && end.getTime() <= nextStart.getTime()) setEndIso(addDaysIso(iso, 2));
    } else {
      setEndIso(iso);
      const start = parseIsoDateOnly(startIso);
      const nextEnd = parseIsoDateOnly(iso);
      if (start && nextEnd && nextEnd.getTime() <= start.getTime()) setEndIso(addDaysIso(startIso, 2));
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

      if (venueCityRaw) (patch as any).citySlug = venueCityRaw;

      if (isEditing && routeTripId) {
        await tripsStore.updateTrip(routeTripId, patch);
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

  // Partner click helper (Phase-1 spine)
  async function openPartner(args: {
    partnerId: PartnerId;
    url: string;
    title: string;
    metadata?: Record<string, any>;
  }) {
    // Must have a real tripId to track pending/booked.
    if (!routeTripId) {
      Alert.alert("Save trip first", "Booking links create trackable items. Save the trip, then open partners from the Trip Hub.");
      return;
    }

    try {
      await beginPartnerClick({
        tripId: routeTripId,
        partnerId: args.partnerId,
        url: args.url,
        title: args.title,
        metadata: args.metadata,
      });
    } catch {
      // fallback: still open the URL so user isn't blocked
      await safeOpenUrl(args.url);
    }
  }

  const selHome = String(selectedFixture?.teams?.home?.name ?? "").trim();
  const selAway = String(selectedFixture?.teams?.away?.name ?? "").trim();
  const selVenue = String(selectedFixture?.fixture?.venue?.name ?? "").trim();
  const selCity = String(selectedFixture?.fixture?.venue?.city ?? "").trim();

  const selectedTbc = useMemo(() => {
    if (!selectedFixture) return false;
    return isKickoffTbc(selectedFixture, placeholderTbcIds);
  }, [selectedFixture, placeholderTbcIds]);

  const selKick = useMemo(() => {
    if (!selectedFixture) return "TBC";
    if (selectedTbc) return "TBC";
    return formatUkDateTimeMaybe(selectedFixture?.fixture?.date) || "TBC";
  }, [selectedFixture, selectedTbc]);

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

  const bookingLinks = useMemo(() => {
    if (!destinationCity) return null;
    return buildAffiliateLinks({
      city: destinationCity,
      startDate: startIso,
      endDate: endIso,
    });
  }, [destinationCity, startIso, endIso]);

  // Prefer a curated guide deep link if present, otherwise fall back to generic affiliate search.
  const thingsToDoUrl = useMemo(() => {
    if (!destinationCity) return null;
    return cityBundle?.thingsToDoUrl || bookingLinks?.experiencesUrl || null;
  }, [destinationCity, cityBundle?.thingsToDoUrl, bookingLinks?.experiencesUrl]);

  const currentMatchBlock = useMemo(() => {
    if (!isEditing || !editSnapshotRef.current?.fixture) return null;
    const f = editSnapshotRef.current.fixture as any;
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
              {leagueOptions.map((l) => {
                const active = l.leagueId === selectedLeague.leagueId;
                return (
                  <Pressable
                    key={l.key ?? String(l.leagueId)}
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
                placeholder="Search team / league / venue / city…"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.search}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              <Text style={styles.searchMeta}>
                Showing {Math.min(visibleCount, sortedFilteredRows.length)} of {sortedFilteredRows.length}
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

            {!loading && !error && sortedFilteredRows.length === 0 ? (
              <View style={{ marginTop: 12 }}>
                <EmptyState title="No fixtures found" message="Try a different league window, or search." />
              </View>
            ) : null}

            {!loading && !error && sortedFilteredRows.length > 0 ? (
              <>
                <View style={styles.list}>
                  {visibleRows.map((r: any, idx: number) => {
                    const id = fixtureIdStr(r);
                    const home = String(r?.teams?.home?.name ?? "").trim() || "Home";
                    const away = String(r?.teams?.away?.name ?? "").trim() || "Away";

                    const tbc = isKickoffTbc(r, placeholderTbcIds);
                    const kickoff = tbc ? "TBC" : formatUkDateTimeMaybe(r?.fixture?.date) || "TBC";

                    const venue = String(r?.fixture?.venue?.name ?? "").trim();
                    const city = String(r?.fixture?.venue?.city ?? "").trim();
                    const leagueName = String(r?.league?.name ?? "").trim();

                    const extra = [leagueName, venue, city].filter(Boolean).join(" • ");
                    const line2 = tbc ? extra || "Kickoff time not confirmed" : extra ? `${kickoff} • ${extra}` : kickoff;

                    const selected = fixtureIdStr(selectedFixture) === id;

                    return (
                      <Pressable
                        key={id || String(idx)}
                        onPress={() => {
                          if (isEditing) editDatesLockRef.current = false;
                          setSelectedFixture(r);
                        }}
                        style={[styles.pickRow, selected && styles.pickRowSelected]}
                      >
                        <View style={styles.pickRowTop}>
                          <Text style={styles.rowTitle}>
                            {home} vs {away}
                          </Text>
                          {tbc ? <Text style={styles.tbcTag}>TBC</Text> : null}
                          {selected ? <Text style={styles.selectedTag}>Selected</Text> : null}
                        </View>
                        <Text style={styles.rowMeta}>{line2}</Text>
                        {selected ? <Text style={styles.selectedHint}>Trip details opened</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>

                {visibleCount < sortedFilteredRows.length ? (
                  <Pressable onPress={() => setVisibleCount((n) => n + 12)} style={styles.moreBtn}>
                    <Text style={styles.moreText}>Show more</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </GlassCard>
        </ScrollView>

        {/* Native Modal sheet (Android-stable) */}
        <Modal visible={!!selectedFixture} transparent animationType="slide" onRequestClose={closeSheet}>
          <View style={styles.modalWrap}>
            <Pressable style={styles.modalBackdrop} onPress={closeSheet} />

            <SafeAreaView edges={["bottom"]} style={[styles.sheetWrap, { paddingBottom: insets.bottom }]}>
              <SheetCard>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetKicker}>{isEditing ? "Edit trip details" : "Trip details"}</Text>

                    <View style={styles.sheetTitleRow}>
                      <Text style={styles.sheetTitle} numberOfLines={1}>
                        {selHome && selAway ? `${selHome} vs ${selAway}` : "Selected match"}
                      </Text>
                      {selectedTbc ? <Text style={styles.tbcTagSheet}>TBC</Text> : null}
                    </View>

                    <Text style={styles.sheetSub} numberOfLines={2}>
                      {selKick}
                      {selVenue ? ` • ${selVenue}` : ""}
                      {selCity ? ` • ${selCity}` : ""}
                    </Text>

                    {selectedTbc ? (
                      <Text style={styles.tbcHint} numberOfLines={2}>
                        Kickoff time isn’t confirmed yet — your dates won’t auto-adjust from matchday.
                      </Text>
                    ) : null}
                  </View>

                  <Pressable onPress={closeSheet} style={styles.closeBtn} hitSlop={10}>
                    <Text style={styles.closeText}>Close</Text>
                  </Pressable>
                </View>

                <ScrollView
                  style={{ maxHeight: 560 }}
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

                  {/* BOOK THIS TRIP (spine-correct) */}
                  {bookingLinks ? (
                    <View style={styles.bookBlock}>
                      <View style={styles.bookTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bookKicker}>BOOK THIS TRIP</Text>
                          <Text style={styles.bookTitle}>Hotels, travel, experiences</Text>
                          <Text style={styles.bookSub}>
                            {isEditing
                              ? `These clicks create trackable items for ${destinationCity}.`
                              : "Save the trip to unlock trackable booking links."}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.bookGrid}>
                        <Pressable
                          onPress={() =>
                            isEditing
                              ? openPartner({
                                  partnerId: "booking",
                                  url: bookingLinks.hotelsUrl,
                                  title: `Hotels in ${destinationCity}`,
                                  metadata: { city: destinationCity },
                                })
                              : onSave()
                          }
                          style={[styles.bookBtn, styles.bookBtnPrimary]}
                        >
                          <Text style={styles.bookBtnText}>{isEditing ? "Hotels" : "Save trip"}</Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            isEditing
                              ? openPartner({
                                  partnerId: "skyscanner",
                                  url: bookingLinks.flightsUrl,
                                  title: `Flights for ${destinationCity}`,
                                  metadata: { city: destinationCity },
                                })
                              : onSave()
                          }
                          style={styles.bookBtn}
                        >
                          <Text style={styles.bookBtnText}>{isEditing ? "Flights" : "Save trip"}</Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            isEditing
                              ? openPartner({
                                  partnerId: "omio",
                                  url: bookingLinks.trainsUrl,
                                  title: `Trains for ${destinationCity}`,
                                  metadata: { city: destinationCity },
                                })
                              : onSave()
                          }
                          style={styles.bookBtn}
                        >
                          <Text style={styles.bookBtnText}>{isEditing ? "Trains" : "Save trip"}</Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            isEditing
                              ? openPartner({
                                  partnerId: "getyourguide",
                                  url: bookingLinks.experiencesUrl,
                                  title: `GetYourGuide: ${destinationCity}`,
                                  metadata: { city: destinationCity },
                                })
                              : onSave()
                          }
                          style={styles.bookBtn}
                        >
                          <Text style={styles.bookBtnText}>{isEditing ? "GetYourGuide" : "Save trip"}</Text>
                        </Pressable>
                      </View>

                      <Pressable
                        onPress={() =>
                          isEditing
                            ? openPartner({
                                partnerId: "googlemaps",
                                url: bookingLinks.mapsUrl,
                                title: `Maps: ${destinationCity}`,
                                metadata: { city: destinationCity },
                              })
                            : onSave()
                        }
                        style={styles.bookInlineLink}
                      >
                        <Text style={styles.bookInlineLinkText}>{isEditing ? "Open Maps search" : "Save trip to continue"}</Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {destinationCity ? (
                    <View style={styles.cityBlock}>
                      <View style={styles.cityBlockTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cityBlockKicker}>In {destinationCity}</Text>
                          <Text style={styles.cityBlockTitle}>Top things to do</Text>
                          <Text style={styles.cityBlockSub}>
                            {cityBundle?.hasGuide ? "Curated picks + quick tips." : "No curated guide yet — use GetYourGuide."}
                          </Text>
                        </View>

                        {thingsToDoUrl ? (
                          <Pressable
                            onPress={() =>
                              isEditing
                                ? openPartner({
                                    partnerId: "getyourguide",
                                    url: thingsToDoUrl,
                                    title: `GetYourGuide: ${destinationCity}`,
                                    metadata: { city: destinationCity },
                                  })
                                : safeOpenUrl(thingsToDoUrl)
                            }
                            style={styles.taBtn}
                          >
                            <Text style={styles.taBtnText}>GetYourGuide</Text>
                          </Pressable>
                        ) : null}
                      </View>

                      {cityBundle?.hasGuide && (cityBundle.items?.length ?? 0) > 0 ? (
                        <View style={styles.thingsList}>
                          {cityBundle.items.slice(0, 6).map((it: any, idx: number) => (
                            <View key={`${it.title}-${idx}`} style={styles.thingRow}>
                              <Text style={styles.thingIdx}>{idx + 1}.</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.thingTitle}>{it.title}</Text>
                                {it.description ? <Text style={styles.thingDesc}>{it.description}</Text> : null}
                              </View>
                            </View>
                          ))}
                          {(cityBundle.items?.length ?? 0) > 6 ? <Text style={styles.moreInline}>More in the full city guide.</Text> : null}
                        </View>
                      ) : null}

                      {cityBundle?.hasGuide && (cityBundle.quickTips?.length ?? 0) > 0 ? (
                        <View style={styles.tipsBlock}>
                          <Text style={styles.tipsTitle}>Quick tips</Text>
                          {cityBundle.quickTips.slice(0, 5).map((t: string, idx: number) => (
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
                    <Text style={styles.saveText}>{saving ? "Saving…" : isEditing ? "Update Trip" : "Save Trip"}</Text>
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
  // (unchanged styles from your current file)
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

  tbcTag: {
    color: "rgba(242,244,246,0.88)",
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

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

  sheetTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  sheetTitle: { flex: 1, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg },

  tbcTagSheet: {
    color: "rgba(242,244,246,0.88)",
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  sheetSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
  tbcHint: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, lineHeight: 16 },

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

  bookBlock: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.20)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  bookTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bookKicker: { color: theme.colors.primary, fontWeight: "900", fontSize: theme.fontSize.xs },
  bookTitle: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  bookSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  bookGrid: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  bookBtn: {
    width: "48%",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  bookBtnPrimary: {
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  bookBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  bookInlineLink: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
  },
  bookInlineLinkText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.sm },

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
