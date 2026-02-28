// app/trip/build.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, getFixtureById, getFixturesByRound, type FixtureListRow } from "@/src/services/apiFootball";
import tripsStore, { type Trip } from "@/src/state/trips";

import { LEAGUES, addDaysIso, clampFromIsoToTomorrow, type LeagueOption } from "@/src/constants/football";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { computeLikelyPlaceholderTbcIds, isKickoffTbc } from "@/src/utils/kickoffTbc";

/* -------------------------------------------------------------------------- */
/* config                                                                      */
/* -------------------------------------------------------------------------- */

const FREE_TRIP_CAP = 5;

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

function currentFootballSeasonStartYear(now = new Date()): number {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0=Jan
  return m >= 6 ? y : y - 1;
}

function paramString(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || null;
  return null;
}

function fixtureIdStr(r: any): string {
  const id = r?.fixture?.id;
  return id != null ? String(id) : "";
}

function fixtureDateOnly(r: FixtureListRow | null): string | null {
  const raw = r?.fixture?.date;
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function cleanText(v: unknown): string {
  return String(v ?? "").trim();
}

function slugifyCityId(cityRaw: string): string {
  const s = String(cityRaw ?? "").trim().toLowerCase();
  if (!s) return "trip";
  return (
    s
      .replace(/&/g, "and")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "trip"
  );
}

function safeCityDisplay(cityRaw: string): string {
  const s = cleanText(cityRaw);
  return s || "Trip";
}

function parseIsoToDate(iso?: string | null): Date | null {
  const s = cleanText(iso);
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function daysBetweenIso(aIso: string, bIso: string) {
  const a = parseIsoToDate(aIso);
  const b = parseIsoToDate(bIso);
  if (!a || !b) return null;
  const d = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return d;
}

function findLeagueOptionByLeagueId(leagueId?: number | null) {
  if (!leagueId) return null;
  return LEAGUES.find((l) => l.leagueId === leagueId) ?? null;
}

function findCountryCodeForLeagueId(leagueId: number | null | undefined): string | undefined {
  if (typeof leagueId !== "number") return undefined;
  const l = LEAGUES.find((x) => x.leagueId === leagueId);
  const cc = String(l?.countryCode ?? "").trim().toUpperCase();
  return cc && cc.length === 2 ? cc : undefined;
}

/**
 * Snapshot builder for trip readability + durability.
 *
 * Stores:
 * - cityId (slug) + displayCity (human)
 * - home/away/league/venue + kickoffIso/kickoffTbc
 * - leagueId/season/countryCode + homeTeamId (for Home visuals without guessing)
 *
 * NOTE: This is trip-level snapshot (primary match). Secondary matches are stored via matchIds only for now.
 */
function buildTripSnapshot(selectedFixture: FixtureListRow, placeholderTbcIds: Set<string>) {
  const displayCity = safeCityDisplay(selectedFixture?.fixture?.venue?.city);
  const cityId = slugifyCityId(displayCity);

  const homeName = cleanText(selectedFixture?.teams?.home?.name);
  const awayName = cleanText(selectedFixture?.teams?.away?.name);
  const leagueName = cleanText(selectedFixture?.league?.name);
  const venueName = cleanText(selectedFixture?.fixture?.venue?.name);

  const kickoffIsoRaw = selectedFixture?.fixture?.date ? String(selectedFixture.fixture.date) : "";
  const kickoffIso = cleanText(kickoffIsoRaw) || undefined;

  const kickoffTbc = isKickoffTbc(selectedFixture, placeholderTbcIds);

  const leagueId = typeof selectedFixture?.league?.id === "number" ? selectedFixture.league.id : undefined;
  const seasonRaw = (selectedFixture as any)?.league?.season;
  const season = seasonRaw != null ? String(seasonRaw) : String(currentFootballSeasonStartYear());

  const countryCode = findCountryCodeForLeagueId(leagueId);
  const homeTeamId = typeof selectedFixture?.teams?.home?.id === "number" ? selectedFixture.teams.home.id : undefined;

  return {
    cityId,
    displayCity,
    homeName: homeName || undefined,
    awayName: awayName || undefined,
    leagueName: leagueName || undefined,
    venueName: venueName || undefined,
    kickoffIso,
    kickoffTbc,

    leagueId: leagueId != null ? String(leagueId) : undefined,
    season,
    countryCode,
    homeTeamId,
  };
}

async function computePlaceholderIdsForFixture(fx: FixtureListRow | null): Promise<Set<string>> {
  if (!fx) return new Set();

  const leagueId = fx?.league?.id ?? null;
  const season = (fx as any)?.league?.season ?? currentFootballSeasonStartYear();
  const round = cleanText(fx?.league?.round);

  if (!leagueId || !season || !round) return new Set();

  try {
    const roundRows = await getFixturesByRound({ league: leagueId, season, round });
    return computeLikelyPlaceholderTbcIds(roundRows || []);
  } catch {
    return new Set();
  }
}

function safeUri(u: unknown): string | null {
  const s = String(u ?? "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return null;
  return s;
}

function weekendHint(isoMaybe: unknown): "Weekend" | "Midweek" | null {
  const d = parseIsoToDate(String(isoMaybe ?? ""));
  if (!d) return null;
  const day = d.getDay(); // 0 Sun ... 6 Sat
  if (day === 0 || day === 6) return "Weekend";
  return "Midweek";
}

function findExistingTripIdForFixture(fixtureId: string): string | null {
  const s = tripsStore.getState();
  const trips = Array.isArray(s.trips) ? s.trips : [];
  const fid = String(fixtureId).trim();
  if (!fid) return null;

  const hit = trips.find((t: any) => {
    const ids = Array.isArray(t?.matchIds) ? t.matchIds : [];
    return ids.some((x: any) => String(x).trim() === fid);
  });

  return hit?.id ?? null;
}

/* -------------------------------------------------------------------------- */
/* screen                                                                      */
/* -------------------------------------------------------------------------- */

export default function TripBuildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const routeTripId = useMemo(() => paramString((params as any)?.tripId), [params]);
  const isEditing = !!routeTripId;

  const routeFixtureId = useMemo(() => paramString((params as any)?.fixtureId), [params]);
  const routeCityArea = useMemo(() => paramString((params as any)?.cityArea), [params]);

  const isPrefilledFlow = !!routeFixtureId && !isEditing;

  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [placeholderTbcIds, setPlaceholderTbcIds] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(14);

  const [selectedFixture, setSelectedFixture] = useState<FixtureListRow | null>(null);

  const [startIso, setStartIso] = useState(clampFromIsoToTomorrow(new Date().toISOString().slice(0, 10)));
  const [endIso, setEndIso] = useState(addDaysIso(startIso, 2));
  const [notes, setNotes] = useState("");

  const [endTouched, setEndTouched] = useState(false);

  // Edit-trip context (so we can ADD matches without overwriting)
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [existingMatchIds, setExistingMatchIds] = useState<string[]>([]);
  const [existingPrimaryId, setExistingPrimaryId] = useState<string | null>(null);

  // Edit-only: optionally set the newly selected fixture as Primary
  const [setAsPrimaryOnSave, setSetAsPrimaryOnSave] = useState(false);

  useEffect(() => {
    if (endTouched) return;
    setEndIso(addDaysIso(startIso, 2));
  }, [startIso, endTouched]);

  const setNotesIfEmpty = useCallback((text: string) => {
    const t = cleanText(text);
    if (!t) return;
    setNotes((prev) => (cleanText(prev) ? prev : t));
  }, []);

  /* ------------------------------------------------------------------------ */
  /* League options                                                            */
  /* ------------------------------------------------------------------------ */

  const ALL_LEAGUES: LeagueOption & { key: string } = useMemo(
    () => ({
      label: "All leagues",
      leagueId: 0,
      season: LEAGUES[0].season,
      countryCode: "EU",
      key: "all",
    }),
    []
  );

  const leagueOptions = useMemo(() => [ALL_LEAGUES, ...LEAGUES], [ALL_LEAGUES]);
  const [selectedLeague, setSelectedLeague] = useState<LeagueOption>(ALL_LEAGUES);

  /* ------------------------------------------------------------------------ */
  /* Load edit trip                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!routeTripId) return;

    let cancelled = false;

    async function run() {
      setPrefillLoading(true);
      setError(null);

      try {
        if (!tripsStore.getState().loaded) await tripsStore.loadTrips();
        if (cancelled) return;

        const t = tripsStore.getState().trips.find((x) => x.id === routeTripId) ?? null;

        if (!t) {
          setError("Trip not found.");
          return;
        }

        setEditTrip(t);

        const mids = Array.isArray((t as any)?.matchIds) ? (t as any).matchIds.map((x: any) => String(x).trim()).filter(Boolean) : [];
        setExistingMatchIds(mids);

        const primary = cleanText((t as any)?.fixtureIdPrimary) || (mids[0] ? String(mids[0]) : "");
        setExistingPrimaryId(primary || null);

        setStartIso(t.startDate);
        setEndIso(t.endDate);
        setEndTouched(true);
        setNotes((t as any).notes ?? "");

        // Load the PRIMARY match for context (not just matchIds[0])
        const loadId = primary || (mids[0] ? String(mids[0]) : "");
        if (loadId) {
          const fx = await getFixtureById(String(loadId));
          if (cancelled) return;

          setSelectedFixture(fx);

          const ids = await computePlaceholderIdsForFixture(fx);
          if (!cancelled) setPlaceholderTbcIds(ids);

          const lid = fx?.league?.id ?? null;
          const opt = findLeagueOptionByLeagueId(typeof lid === "number" ? lid : null);
          if (opt) setSelectedLeague(opt);
        } else {
          setSelectedFixture(null);
          setPlaceholderTbcIds(new Set());
        }

        // default: don’t change primary unless user explicitly toggles it
        setSetAsPrimaryOnSave(false);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load trip.");
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [routeTripId]);

  /* ------------------------------------------------------------------------ */
  /* Prefill fixture (new trip)                                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!isPrefilledFlow) return;
    if (!routeFixtureId) return;

    let cancelled = false;

    async function run() {
      setPrefillLoading(true);
      setError(null);

      try {
        const r = await getFixtureById(routeFixtureId);
        if (cancelled) return;

        setSelectedFixture(r);

        const ids = await computePlaceholderIdsForFixture(r);
        if (!cancelled) setPlaceholderTbcIds(ids);

        const d0 = fixtureDateOnly(r);
        if (d0) {
          const start = clampFromIsoToTomorrow(d0);
          setStartIso(start);
          setEndTouched(false);
        }

        if (routeCityArea) setNotesIfEmpty(`Stay area: ${routeCityArea}`);

        const lid = r?.league?.id ?? null;
        const opt = findLeagueOptionByLeagueId(typeof lid === "number" ? lid : null);
        if (opt) setSelectedLeague(opt);
      } catch {
        if (!cancelled) setError("Couldn’t load that fixture.");
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [routeFixtureId, isPrefilledFlow, routeCityArea, setNotesIfEmpty]);

  /* ------------------------------------------------------------------------ */
  /* Load fixtures (picker mode only)                                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (isPrefilledFlow) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const from = clampFromIsoToTomorrow(new Date().toISOString().slice(0, 10));
        const to = addDaysIso(from, 30);

        let res: FixtureListRow[] = [];

        if (selectedLeague.leagueId === 0) {
          const batches = await Promise.all(
            LEAGUES.map((l) => getFixtures({ league: l.leagueId, season: l.season, from, to }))
          );
          res = batches.flat();
        } else {
          res =
            (await getFixtures({
              league: selectedLeague.leagueId,
              season: selectedLeague.season,
              from,
              to,
            })) || [];
        }

        if (!cancelled) {
          const placeholder = computeLikelyPlaceholderTbcIds(res);
          setPlaceholderTbcIds(placeholder);

          const scored = res.map((r) => {
            const iso = String(r?.fixture?.date ?? "");
            const tbc = isKickoffTbc(r, placeholder);
            return { r, iso, tbc };
          });

          scored.sort((a, b) => {
            const aConf = a.tbc ? 1 : 0;
            const bConf = b.tbc ? 1 : 0;
            if (aConf !== bConf) return aConf - bConf; // confirmed first
            return String(a.iso).localeCompare(String(b.iso));
          });

          setRows(scored.map((x) => x.r));
        }
      } catch {
        if (!cancelled) setError("Failed to load fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedLeague, isPrefilledFlow]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const h = String(r?.teams?.home?.name ?? "").toLowerCase();
      const a = String(r?.teams?.away?.name ?? "").toLowerCase();
      const v = String(r?.fixture?.venue?.name ?? "").toLowerCase();
      const c = String(r?.fixture?.venue?.city ?? "").toLowerCase();
      const l = String(r?.league?.name ?? "").toLowerCase();
      return h.includes(q) || a.includes(q) || v.includes(q) || c.includes(q) || l.includes(q);
    });
  }, [rows, search]);

  const visibleRows = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  /* ------------------------------------------------------------------------ */
  /* Selection side effects (dates)                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!selectedFixture) return;

    const d0 = fixtureDateOnly(selectedFixture);
    if (d0) {
      const start = clampFromIsoToTomorrow(d0);
      setStartIso(start);
      setEndTouched(false);
    }

    // In edit mode, if user selects a different fixture, keep the toggle default OFF.
    if (isEditing) setSetAsPrimaryOnSave(false);
  }, [selectedFixture, isEditing]);

  /* ------------------------------------------------------------------------ */
  /* Save trip                                                                  */
  /* ------------------------------------------------------------------------ */

  const validateDateOrder = useCallback((): string | null => {
    const a = parseIsoToDate(startIso);
    const b = parseIsoToDate(endIso);
    if (!a || !b) return "Invalid trip dates.";
    if (b.getTime() < a.getTime()) return "End date must be on/after start date.";
    return null;
  }, [startIso, endIso]);

  const onSave = useCallback(async () => {
    if (!selectedFixture?.fixture?.id) {
      setError("Select a match first.");
      return;
    }

    const dateError = validateDateOrder();
    if (dateError) {
      setError(dateError);
      return;
    }

    setSaving(true);
    setError(null);

    const fixtureId = String(selectedFixture.fixture.id).trim();
    const snap = buildTripSnapshot(selectedFixture, placeholderTbcIds);

    try {
      if (!tripsStore.getState().loaded) await tripsStore.loadTrips();

      // EDIT FLOW (multi-match safe)
      if (isEditing && routeTripId) {
        const current = tripsStore.getState().trips.find((x) => x.id === routeTripId) as any;
        const currentMatchIds: string[] = Array.isArray(current?.matchIds)
          ? current.matchIds.map((x: any) => String(x).trim()).filter(Boolean)
          : [];

        const alreadyHas = currentMatchIds.includes(fixtureId);

        // Always update dates + notes
        const basePatch: any = {
          startDate: startIso,
          endDate: endIso,
          notes: cleanText(notes),
        };

        if (routeCityArea && !cleanText(basePatch.notes)) {
          basePatch.notes = `Stay area: ${routeCityArea}`;
        }

        // If user toggles "Set as primary", we:
        // - ensure match is added
        // - set fixtureIdPrimary
        // - overwrite trip-level snapshot fields to match new primary
        if (setAsPrimaryOnSave) {
          const mergedMatchIds = alreadyHas ? currentMatchIds : [...currentMatchIds, fixtureId];

          basePatch.matchIds = mergedMatchIds;
          basePatch.fixtureIdPrimary = fixtureId;

          basePatch.cityId = snap.cityId;
          basePatch.displayCity = snap.displayCity;
          basePatch.homeName = snap.homeName;
          basePatch.awayName = snap.awayName;
          basePatch.leagueName = snap.leagueName;
          basePatch.venueName = snap.venueName;
          basePatch.kickoffIso = snap.kickoffIso;
          basePatch.kickoffTbc = snap.kickoffTbc;

          basePatch.leagueId = snap.leagueId;
          basePatch.season = snap.season;
          basePatch.countryCode = snap.countryCode;
          basePatch.homeTeamId = snap.homeTeamId;

          await tripsStore.updateTrip(routeTripId, basePatch);
          router.replace({ pathname: "/trip/[id]", params: { id: routeTripId } } as any);
          return;
        }

        // Otherwise: add as secondary match (if not already in trip),
        // and DO NOT overwrite trip-level primary snapshot.
        await tripsStore.updateTrip(routeTripId, basePatch);

        if (!alreadyHas) {
          await tripsStore.addMatchToTrip(routeTripId, fixtureId, { setPrimary: false });
        }

        router.replace({ pathname: "/trip/[id]", params: { id: routeTripId } } as any);
        return;
      }

      // NEW TRIP FLOW: dedupe by fixtureId
      const existingId = findExistingTripIdForFixture(fixtureId);
      if (existingId) {
        Alert.alert("Trip already exists", "You already have a trip for this match — opening it now.");
        router.replace({ pathname: "/trip/[id]", params: { id: existingId } } as any);
        return;
      }

      // Free cap
      const tripCount = tripsStore.getState().trips?.length ?? 0;
      if (tripCount >= FREE_TRIP_CAP) {
        Alert.alert(
          "Free plan limit reached",
          `You can save up to ${FREE_TRIP_CAP} trips on the free plan.\n\nDelete an old trip or upgrade to Pro (coming next).`
        );
        return;
      }

      // Create (primary = selected)
      const patch: any = {
        cityId: snap.cityId,
        startDate: startIso,
        endDate: endIso,
        matchIds: [fixtureId],
        fixtureIdPrimary: fixtureId,
        notes: cleanText(notes),

        // snapshot fields (durable UI) for PRIMARY
        displayCity: snap.displayCity,
        homeName: snap.homeName,
        awayName: snap.awayName,
        leagueName: snap.leagueName,
        venueName: snap.venueName,
        kickoffIso: snap.kickoffIso,
        kickoffTbc: snap.kickoffTbc,

        leagueId: snap.leagueId,
        season: snap.season,
        countryCode: snap.countryCode,
        homeTeamId: snap.homeTeamId,
      };

      if (routeCityArea && !cleanText(patch.notes)) {
        patch.notes = `Stay area: ${routeCityArea}`;
      }

      const t = await tripsStore.addTrip(patch);
      router.replace({ pathname: "/trip/[id]", params: { id: t.id } } as any);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }, [
    selectedFixture,
    validateDateOrder,
    placeholderTbcIds,
    startIso,
    endIso,
    notes,
    routeCityArea,
    isEditing,
    routeTripId,
    router,
    setAsPrimaryOnSave,
  ]);

  /* ------------------------------------------------------------------------ */
  /* UI computed                                                               */
  /* ------------------------------------------------------------------------ */

  const selectedTitle = useMemo(() => {
    const h = cleanText(selectedFixture?.teams?.home?.name) || "Home";
    const a = cleanText(selectedFixture?.teams?.away?.name) || "Away";
    return `${h} vs ${a}`;
  }, [selectedFixture]);

  const selectedKickLine = useMemo(() => {
    if (!selectedFixture) return "Kickoff: TBC";
    const tbc = isKickoffTbc(selectedFixture, placeholderTbcIds);
    if (tbc) return "Kickoff: TBC";
    const f = formatUkDateTimeMaybe(selectedFixture?.fixture?.date);
    return f ? `Kickoff: ${f}` : "Kickoff: TBC";
  }, [selectedFixture, placeholderTbcIds]);

  const selectedVenueLine = useMemo(() => {
    if (!selectedFixture) return "Venue: —";
    const v = cleanText(selectedFixture?.fixture?.venue?.name);
    const c = cleanText(selectedFixture?.fixture?.venue?.city);
    const parts = [v, c].filter(Boolean);
    return parts.length ? parts.join(" • ") : "Venue: —";
  }, [selectedFixture]);

  const tripLength = useMemo(() => {
    const d = daysBetweenIso(startIso, endIso);
    if (d == null) return null;
    const nights = Math.max(0, d);
    return `${nights} night${nights === 1 ? "" : "s"}`;
  }, [startIso, endIso]);

  const headerTitle = useMemo(() => (isEditing ? "Edit trip" : "Plan trip"), [isEditing]);

  const intentSub = useMemo(() => {
    if (isEditing) {
      const n = existingMatchIds.length;
      const p = existingPrimaryId ? `Primary match set.` : `No primary match set.`;
      return `Update dates/notes, and add more matches to this trip. (${n} match${n === 1 ? "" : "es"} • ${p})`;
    }
    return "Pick a match, then we’ll save a trip with dates, notes, and planning links.";
  }, [isEditing, existingMatchIds.length, existingPrimaryId]);

  const selectedLeagueLabel = useMemo(() => {
    if (selectedLeague.leagueId === 0) return "All leagues";
    return selectedLeague.label;
  }, [selectedLeague]);

  const dateWindowLabel = useMemo(() => {
    const nights = tripLength ? ` • ${tripLength}` : "";
    return `${startIso} → ${endIso}${nights}`;
  }, [startIso, endIso, tripLength]);

  const selectedHomeLogo = useMemo(() => safeUri(selectedFixture?.teams?.home?.logo), [selectedFixture]);
  const selectedAwayLogo = useMemo(() => safeUri(selectedFixture?.teams?.away?.logo), [selectedFixture]);

  const selectedFixtureId = useMemo(() => fixtureIdStr(selectedFixture), [selectedFixture]);
  const isAlreadyInTrip = useMemo(() => {
    if (!isEditing) return false;
    if (!selectedFixtureId) return false;
    return existingMatchIds.includes(String(selectedFixtureId).trim());
  }, [isEditing, selectedFixtureId, existingMatchIds]);

  const showPickerMode = !isPrefilledFlow; // allow picker even in edit mode (to add matches)

  /* ------------------------------------------------------------------------ */
  /* render                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.86}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: headerTitle,
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: 100,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl + insets.bottom,
            gap: theme.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* INTENT HEADER */}
          <GlassCard style={styles.headerCard} level="subtle">
            <Text style={styles.bigTitle}>{isEditing ? "Edit your trip" : "Plan your trip"}</Text>
            <Text style={styles.bigSub}>{intentSub}</Text>

            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipKicker}>Dates</Text>
                <Text style={styles.chipValue}>{dateWindowLabel}</Text>
              </View>

              <View style={styles.chip}>
                <Text style={styles.chipKicker}>League</Text>
                <Text style={styles.chipValue} numberOfLines={1}>
                  {selectedLeagueLabel}
                </Text>
              </View>
            </View>

            {!isEditing ? (
              <View style={styles.capBar}>
                <Text style={styles.capText}>Free plan: up to {FREE_TRIP_CAP} saved trips.</Text>
              </View>
            ) : null}
          </GlassCard>

          {(loading || prefillLoading) && (
            <GlassCard level="subtle">
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading…</Text>
              </View>
            </GlassCard>
          )}

          {!prefillLoading && error && (
            <GlassCard level="subtle">
              <EmptyState title="Problem" message={error} />
            </GlassCard>
          )}

          {/* SELECTED SUMMARY */}
          {!prefillLoading && selectedFixture ? (
            <GlassCard level="default">
              <Text style={styles.h1}>Selected match</Text>

              <View style={styles.selectedRow}>
                <View style={styles.selectedLeft}>
                  <View style={styles.teamRow}>
                    <View style={styles.crestStack}>
                      {selectedHomeLogo ? (
                        <Image source={{ uri: selectedHomeLogo }} style={styles.crest} />
                      ) : (
                        <View style={styles.crestFallback} />
                      )}
                      {selectedAwayLogo ? (
                        <Image source={{ uri: selectedAwayLogo }} style={[styles.crest, { marginLeft: -10 }]} />
                      ) : (
                        <View style={[styles.crestFallback, { marginLeft: -10 }]} />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedTitle} numberOfLines={1}>
                        {selectedTitle}
                      </Text>

                      <Text style={styles.selectedMeta}>{selectedKickLine}</Text>
                      <Text style={styles.selectedMeta}>{selectedVenueLine}</Text>
                    </View>
                  </View>

                  <View style={styles.badgeRow}>
                    {isKickoffTbc(selectedFixture, placeholderTbcIds) ? (
                      <>
                        <View style={[styles.badge, styles.badgeTbc]}>
                          <Text style={[styles.badgeText, styles.badgeTextTbc]}>Kickoff TBC</Text>
                        </View>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>TV schedule pending</Text>
                        </View>
                      </>
                    ) : (
                      <View style={[styles.badge, styles.badgeConfirmed]}>
                        <Text style={[styles.badgeText, styles.badgeTextConfirmed]}>Kickoff confirmed</Text>
                      </View>
                    )}

                    {weekendHint(selectedFixture?.fixture?.date) ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{weekendHint(selectedFixture?.fixture?.date)}</Text>
                      </View>
                    ) : null}

                    {isEditing ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {isAlreadyInTrip ? "Already in trip" : "Will be added to trip"}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Edit-only: set as primary toggle */}
                  {isEditing ? (
                    <View style={styles.primaryRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.primaryTitle}>Set as primary match</Text>
                        <Text style={styles.primarySub}>
                          Primary match drives kickoff banner + stay guidance + smart booking defaults.
                        </Text>
                      </View>
                      <Switch
                        value={setAsPrimaryOnSave}
                        onValueChange={setSetAsPrimaryOnSave}
                      />
                    </View>
                  ) : null}
                </View>
              </View>

              {routeCityArea ? (
                <View style={styles.infoBar}>
                  <Text style={styles.infoText}>
                    Prefilled stay area:{" "}
                    <Text style={{ fontWeight: "900", color: theme.colors.text }}>{routeCityArea}</Text>
                  </Text>
                </View>
              ) : null}

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Anything you want to remember…"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.notes}
                multiline
              />
            </GlassCard>
          ) : null}

          {/* PICKER MODE (also in edit mode so you can add matches) */}
          {showPickerMode && !prefillLoading && !error ? (
            <GlassCard level="default">
              <Text style={styles.h1}>{isEditing ? "Add a match" : "Pick a match"}</Text>
              <Text style={styles.hint}>
                {isEditing ? "Select another match to add it to this trip." : "Choose a match to start a trip around it."}
              </Text>

              {/* League chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
                {leagueOptions.map((l) => {
                  const active = l.leagueId === selectedLeague.leagueId;
                  return (
                    <Pressable
                      key={(l as any).key ?? String(l.leagueId)}
                      onPress={() => {
                        setSelectedLeague(l);
                        setVisibleCount(14);
                      }}
                      style={[styles.leaguePill, active && styles.leaguePillActive]}
                    >
                      <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>{l.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <TextInput
                value={search}
                onChangeText={(t) => {
                  setSearch(t);
                  setVisibleCount(14);
                }}
                placeholder="Search team / city / venue / league"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.search}
              />

              {visibleRows.length === 0 && !loading ? (
                <View style={{ marginTop: 10 }}>
                  <EmptyState title="No fixtures" message="Try another league or search term." />
                </View>
              ) : null}

              {/* Fixture cards */}
              <View style={{ marginTop: 10 }}>
                {visibleRows.map((r, i) => {
                  const id = fixtureIdStr(r);
                  const selected = fixtureIdStr(selectedFixture) === id;

                  const home = cleanText(r?.teams?.home?.name) || "Home";
                  const away = cleanText(r?.teams?.away?.name) || "Away";

                  const tbc = isKickoffTbc(r, placeholderTbcIds);
                  const kick = tbc ? "Kickoff: TBC" : `Kickoff: ${formatUkDateTimeMaybe(r?.fixture?.date) || "TBC"}`;

                  const v = cleanText(r?.fixture?.venue?.name);
                  const c = cleanText(r?.fixture?.venue?.city);
                  const vc = [v, c].filter(Boolean).join(" • ");

                  const leagueName = cleanText(r?.league?.name);
                  const leagueFlag = safeUri((r as any)?.league?.flag);

                  const homeLogo = safeUri(r?.teams?.home?.logo);
                  const awayLogo = safeUri(r?.teams?.away?.logo);

                  return (
                    <Pressable
                      key={id || String(i)}
                      onPress={async () => {
                        setSelectedFixture(r);
                        const ids = await computePlaceholderIdsForFixture(r);
                        setPlaceholderTbcIds(ids);
                        setError(null);
                      }}
                      style={({ pressed }) => [
                        styles.fxCard,
                        selected && styles.fxCardSelected,
                        { opacity: pressed ? 0.9 : 1 },
                      ]}
                    >
                      <View style={styles.fxTop}>
                        <View style={styles.fxLeft}>
                          <View style={styles.crestStack}>
                            {homeLogo ? <Image source={{ uri: homeLogo }} style={styles.crest} /> : <View style={styles.crestFallback} />}
                            {awayLogo ? (
                              <Image source={{ uri: awayLogo }} style={[styles.crest, { marginLeft: -10 }]} />
                            ) : (
                              <View style={[styles.crestFallback, { marginLeft: -10 }]} />
                            )}
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text style={styles.fxTitle} numberOfLines={1}>
                              {home} vs {away}
                            </Text>

                            <Text style={styles.fxMeta} numberOfLines={1}>
                              {kick}
                            </Text>

                            {vc ? (
                              <Text style={styles.fxMeta2} numberOfLines={1}>
                                {vc}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <View style={styles.fxRight}>
                          {leagueFlag ? <Image source={{ uri: leagueFlag }} style={styles.flag} /> : null}
                          <Text style={styles.fxLeague} numberOfLines={1}>
                            {leagueName || "League"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.badgeRow}>
                        {tbc ? (
                          <>
                            <View style={[styles.badge, styles.badgeTbc]}>
                              <Text style={[styles.badgeText, styles.badgeTextTbc]}>Kickoff TBC</Text>
                            </View>
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>May change</Text>
                            </View>
                          </>
                        ) : (
                          <View style={[styles.badge, styles.badgeConfirmed]}>
                            <Text style={[styles.badgeText, styles.badgeTextConfirmed]}>Kickoff confirmed</Text>
                          </View>
                        )}

                        {weekendHint(r?.fixture?.date) ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{weekendHint(r?.fixture?.date)}</Text>
                          </View>
                        ) : null}

                        {isEditing && existingMatchIds.includes(String(id).trim()) ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>Already in trip</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.fxSelectRow}>
                        <View style={{ flex: 1 }} />
                        <View style={[styles.selectPill, selected && styles.selectPillActive]}>
                          <Text style={[styles.selectPillText, selected && styles.selectPillTextActive]}>
                            {selected ? "Selected" : "Select"}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {visibleCount < filtered.length ? (
                <Pressable onPress={() => setVisibleCount((n) => n + 14)} style={styles.moreBtn}>
                  <Text style={styles.moreText}>Show more</Text>
                </Pressable>
              ) : null}

              {!selectedFixture ? (
                <View style={styles.pickEmptyHint}>
                  <Text style={styles.pickEmptyHintT}>Select a match to continue.</Text>
                </View>
              ) : null}
            </GlassCard>
          ) : null}

          {/* PRIMARY CTA */}
          <Pressable
            onPress={onSave}
            disabled={saving || prefillLoading || !selectedFixture}
            style={[styles.saveBtn, (!selectedFixture || saving || prefillLoading) && { opacity: 0.55 }]}
          >
            <Text style={styles.saveText}>
              {saving ? "Saving…" : isEditing ? "Update trip" : "Save trip"}
            </Text>
            <Text style={styles.saveSub}>
              {selectedFixture
                ? isEditing
                  ? (setAsPrimaryOnSave ? "This match will become the trip’s primary." : "This match will be added to the trip.")
                  : "Keep links, notes, and bookings in one place"
                : "Select a match to continue"}
            </Text>
          </Pressable>

          {error ? <Text style={styles.err}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* styles                                                                      */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  headerCard: { padding: theme.spacing.lg },

  bigTitle: { fontSize: 22, fontWeight: "900", color: theme.colors.text, letterSpacing: 0.2 },
  bigSub: { marginTop: 8, color: theme.colors.textSecondary, fontWeight: "700", lineHeight: 18, fontSize: 13 },

  chipRow: { marginTop: 14, flexDirection: "row", gap: 10 },
  chip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipKicker: { color: theme.colors.textTertiary, fontWeight: "900", fontSize: 11 },
  chipValue: { marginTop: 4, color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  capBar: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  capText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  h1: { fontSize: theme.fontSize.lg, fontWeight: "900", color: theme.colors.text, marginBottom: 8 },
  hint: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 13, lineHeight: 18 },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontWeight: "800" },

  selectedRow: { marginTop: 6 },
  selectedLeft: { flex: 1 },

  teamRow: { flexDirection: "row", gap: 12, alignItems: "center" },

  crestStack: { flexDirection: "row", alignItems: "center" },
  crest: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  crestFallback: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  selectedTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  selectedMeta: { color: theme.colors.textSecondary, marginTop: 6, fontWeight: "700", fontSize: 13 },

  badgeRow: { marginTop: 10, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  badge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 11 },

  badgeTbc: { borderColor: "rgba(255,200,0,0.22)", backgroundColor: "rgba(255,200,0,0.06)" },
  badgeTextTbc: { color: "rgba(255,220,140,0.92)" },

  badgeConfirmed: { borderColor: "rgba(75,158,57,0.35)", backgroundColor: "rgba(75,158,57,0.10)" },
  badgeTextConfirmed: { color: "rgba(140,255,190,0.92)" },

  primaryRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primaryTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
  primarySub: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 11, lineHeight: 14 },

  infoBar: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  infoText: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

  label: { marginTop: 14, color: theme.colors.textSecondary, fontWeight: "800" },

  notes: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    minHeight: 84,
    textAlignVertical: "top",
    ...(Platform.OS === "ios" ? { paddingTop: 12 } : null),
  },

  leaguePill: {
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  leaguePillActive: { borderColor: theme.colors.primary, backgroundColor: "rgba(0,0,0,0.45)" },
  leaguePillText: { color: theme.colors.textSecondary, fontWeight: "900" },
  leaguePillTextActive: { color: theme.colors.text },

  search: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
  },

  fxCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  fxCardSelected: { borderColor: "rgba(75,158,57,0.55)", backgroundColor: "rgba(0,0,0,0.35)" },

  fxTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  fxLeft: { flex: 1, flexDirection: "row", gap: 12, alignItems: "center" },
  fxRight: { width: 96, alignItems: "flex-end" },

  flag: {
    width: 22,
    height: 14,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  fxLeague: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "900", fontSize: 11, textAlign: "right" },

  fxTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 15 },
  fxMeta: { color: theme.colors.textSecondary, marginTop: 5, fontWeight: "800", fontSize: 12 },
  fxMeta2: { color: theme.colors.textTertiary, marginTop: 4, fontWeight: "800", fontSize: 12 },

  fxSelectRow: { marginTop: 10, flexDirection: "row", alignItems: "center" },
  selectPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  selectPillActive: { borderColor: "rgba(75,158,57,0.55)", backgroundColor: "rgba(75,158,57,0.10)" },
  selectPillText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
  selectPillTextActive: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  pickEmptyHint: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pickEmptyHintT: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  moreBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  moreText: { color: theme.colors.text, fontWeight: "900" },

  saveBtn: {
    marginTop: 2,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(75,158,57,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
  },
  saveText: { color: theme.colors.text, fontWeight: "900", fontSize: 15 },
  saveSub: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 11 },

  err: { marginTop: 10, color: "rgba(255,80,80,0.95)", fontWeight: "900" },
});
