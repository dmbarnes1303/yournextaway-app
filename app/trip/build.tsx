// app/trip/build.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
import Button from "@/src/components/Button";
import Input from "@/src/components/Input";
import Chip from "@/src/components/Chip";

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

function buildTripSnapshot(selectedFixture: FixtureListRow, placeholderTbcIds: Set<string>) {
  const displayCity = safeCityDisplay(selectedFixture?.fixture?.venue?.city);
  const cityId = slugifyCityId(displayCity);

  const homeName = cleanText(selectedFixture?.teams?.home?.name);
  const awayName = cleanText(selectedFixture?.teams?.away?.name);
  const leagueName = cleanText(selectedFixture?.league?.name);
  const venueName = cleanText(selectedFixture?.fixture?.venue?.name);
  const venueCity = cleanText(selectedFixture?.fixture?.venue?.city);

  const kickoffIsoRaw = selectedFixture?.fixture?.date ? String(selectedFixture.fixture.date) : "";
  const kickoffIso = cleanText(kickoffIsoRaw) || undefined;

  const kickoffTbc = isKickoffTbc(selectedFixture, placeholderTbcIds);

  const leagueId = typeof selectedFixture?.league?.id === "number" ? selectedFixture.league.id : undefined;
  const homeTeamId = typeof selectedFixture?.teams?.home?.id === "number" ? selectedFixture.teams.home.id : undefined;
  const awayTeamId = typeof selectedFixture?.teams?.away?.id === "number" ? selectedFixture.teams.away.id : undefined;

  return {
    cityId,
    displayCity,

    fixtureIdPrimary: selectedFixture?.fixture?.id != null ? String(selectedFixture.fixture.id) : undefined,

    homeTeamId,
    awayTeamId,

    homeName: homeName || undefined,
    awayName: awayName || undefined,

    leagueId,
    leagueName: leagueName || undefined,

    kickoffIso,
    kickoffTbc,

    venueName: venueName || undefined,
    venueCity: venueCity || undefined,
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
  const day = d.getDay();
  if (day === 0 || day === 6) return "Weekend";
  return "Midweek";
}

function findExistingTripIdForFixture(fixtureId: string): string | null {
  return tripsStore.getTripIdByMatchId(String(fixtureId).trim());
}

function chipVariantForKickoff(tbc: boolean): "success" | "primary" | "default" {
  // confirmed = success, tbc = primary (attention but not alarm)
  return tbc ? "primary" : "success";
}

function dateWindowLine(startIso: string, endIso: string) {
  const d = daysBetweenIso(startIso, endIso);
  const nights = d == null ? null : Math.max(0, d);
  const suffix = nights == null ? "" : ` • ${nights} night${nights === 1 ? "" : "s"}`;
  return `${startIso} → ${endIso}${suffix}`;
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

  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [existingMatchIds, setExistingMatchIds] = useState<string[]>([]);
  const [existingPrimaryId, setExistingPrimaryId] = useState<string | null>(null);

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

        const mids = Array.isArray((t as any)?.matchIds)
          ? (t as any).matchIds.map((x: any) => String(x).trim()).filter(Boolean)
          : [];
        setExistingMatchIds(mids);

        const primary = cleanText((t as any)?.fixtureIdPrimary) || (mids[0] ? String(mids[0]) : "");
        setExistingPrimaryId(primary || null);

        setStartIso(t.startDate);
        setEndIso(t.endDate);
        setEndTouched(true);
        setNotes((t as any).notes ?? "");

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
  /* Load fixtures (picker mode)                                               */
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
            if (aConf !== bConf) return aConf - bConf;
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

  useEffect(() => {
    if (!selectedFixture) return;

    const d0 = fixtureDateOnly(selectedFixture);
    if (d0) {
      const start = clampFromIsoToTomorrow(d0);
      setStartIso(start);
      setEndTouched(false);
    }

    if (isEditing) setSetAsPrimaryOnSave(false);
  }, [selectedFixture, isEditing]);

  /* ------------------------------------------------------------------------ */
  /* Save                                                                       */
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

      // EDIT
      if (isEditing && routeTripId) {
        const basePatch: any = {
          startDate: startIso,
          endDate: endIso,
          notes: cleanText(notes),
        };

        if (routeCityArea && !cleanText(basePatch.notes)) {
          basePatch.notes = `Stay area: ${routeCityArea}`;
        }

        await tripsStore.updateTrip(routeTripId, basePatch);

        await tripsStore.addMatchToTrip(routeTripId, fixtureId, { setPrimary: !!setAsPrimaryOnSave });

        if (setAsPrimaryOnSave) {
          const primaryPatch: any = {
            cityId: snap.cityId,
            displayCity: snap.displayCity,
            fixtureIdPrimary: fixtureId,

            homeTeamId: snap.homeTeamId,
            awayTeamId: snap.awayTeamId,
            homeName: snap.homeName,
            awayName: snap.awayName,

            leagueId: snap.leagueId,
            leagueName: snap.leagueName,

            kickoffIso: snap.kickoffIso,
            kickoffTbc: snap.kickoffTbc,

            venueName: snap.venueName,
            venueCity: snap.venueCity,
          };

          await tripsStore.updateTrip(routeTripId, primaryPatch);
        }

        router.replace({ pathname: "/trip/[id]", params: { id: routeTripId } } as any);
        return;
      }

      // NEW: dedupe by fixture
      const existingId = findExistingTripIdForFixture(fixtureId);
      if (existingId) {
        Alert.alert("Trip already exists", "You already have a trip for this match — opening it now.");
        router.replace({ pathname: "/trip/[id]", params: { id: existingId } } as any);
        return;
      }

      const tripCount = tripsStore.getState().trips?.length ?? 0;
      if (tripCount >= FREE_TRIP_CAP) {
        Alert.alert(
          "Free plan limit reached",
          `You can save up to ${FREE_TRIP_CAP} trips on the free plan.\n\nDelete an old trip or upgrade to Pro (coming next).`
        );
        return;
      }

      const patch: any = {
        cityId: snap.cityId,
        startDate: startIso,
        endDate: endIso,

        matchIds: [fixtureId],
        fixtureIdPrimary: fixtureId,

        notes: cleanText(notes),

        displayCity: snap.displayCity,

        homeTeamId: snap.homeTeamId,
        awayTeamId: snap.awayTeamId,

        homeName: snap.homeName,
        awayName: snap.awayName,

        leagueId: snap.leagueId,
        leagueName: snap.leagueName,

        kickoffIso: snap.kickoffIso,
        kickoffTbc: snap.kickoffTbc,

        venueName: snap.venueName,
        venueCity: snap.venueCity,
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

  const headerTitle = useMemo(() => (isEditing ? "Edit trip" : "Plan trip"), [isEditing]);

  const intentSub = useMemo(() => {
    if (isEditing) {
      const n = existingMatchIds.length;
      return `Update dates/notes and add more matches. (${n} match${n === 1 ? "" : "es"})`;
    }
    return "Pick a match, confirm dates, add notes — then we’ll build your Trip Workspace.";
  }, [isEditing, existingMatchIds.length]);

  const selectedLeagueLabel = useMemo(() => {
    if (selectedLeague.leagueId === 0) return "All leagues";
    return selectedLeague.label;
  }, [selectedLeague]);

  const selectedTitle = useMemo(() => {
    const h = cleanText(selectedFixture?.teams?.home?.name) || "Home";
    const a = cleanText(selectedFixture?.teams?.away?.name) || "Away";
    return `${h} vs ${a}`;
  }, [selectedFixture]);

  const selectedKickLine = useMemo(() => {
    if (!selectedFixture) return "TBC";
    const tbc = isKickoffTbc(selectedFixture, placeholderTbcIds);
    if (tbc) return "Kickoff time not confirmed";
    const f = formatUkDateTimeMaybe(selectedFixture?.fixture?.date);
    return f ? f : "TBC";
  }, [selectedFixture, placeholderTbcIds]);

  const selectedVenueLine = useMemo(() => {
    if (!selectedFixture) return "Venue TBD";
    const v = cleanText(selectedFixture?.fixture?.venue?.name);
    const c = cleanText(selectedFixture?.fixture?.venue?.city);
    const parts = [v, c].filter(Boolean);
    return parts.length ? parts.join(" • ") : "Venue TBD";
  }, [selectedFixture]);

  const selectedHomeLogo = useMemo(() => safeUri(selectedFixture?.teams?.home?.logo), [selectedFixture]);
  const selectedAwayLogo = useMemo(() => safeUri(selectedFixture?.teams?.away?.logo), [selectedFixture]);
  const selectedFixtureId = useMemo(() => fixtureIdStr(selectedFixture), [selectedFixture]);

  const isAlreadyInTrip = useMemo(() => {
    if (!isEditing) return false;
    if (!selectedFixtureId) return false;
    return existingMatchIds.includes(String(selectedFixtureId).trim());
  }, [isEditing, selectedFixtureId, existingMatchIds]);

  const kickoffTbc = useMemo(() => {
    if (!selectedFixture) return true;
    return isKickoffTbc(selectedFixture, placeholderTbcIds);
  }, [selectedFixture, placeholderTbcIds]);

  const showPickerMode = !isPrefilledFlow;

  const saveDisabled = saving || prefillLoading || !selectedFixture;

  const saveSubtitle = useMemo(() => {
    if (!selectedFixture) return "Select a match to continue";
    if (isEditing) return setAsPrimaryOnSave ? "This match becomes the trip primary." : "This match will be added to the trip.";
    return "Keep links, notes, and bookings in one place";
  }, [selectedFixture, isEditing, setAsPrimaryOnSave]);

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
          headerTintColor: theme.colors.textPrimary,
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
          {/* Hero / context */}
          <GlassCard level="default" variant="matte" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.heroTitle}>{isEditing ? "Edit your trip" : "Plan your trip"}</Text>
              <Text style={styles.heroSub}>{intentSub}</Text>

              <View style={styles.heroMetaRow}>
                <View style={styles.heroMeta}>
                  <Text style={styles.heroMetaKicker}>DATES</Text>
                  <Text style={styles.heroMetaValue}>{dateWindowLine(startIso, endIso)}</Text>
                </View>
                <View style={styles.heroMeta}>
                  <Text style={styles.heroMetaKicker}>LEAGUE</Text>
                  <Text style={styles.heroMetaValue} numberOfLines={1}>
                    {selectedLeagueLabel}
                  </Text>
                </View>
              </View>

              {!isEditing ? (
                <View style={styles.heroCap}>
                  <Text style={styles.heroCapText}>Free plan: up to {FREE_TRIP_CAP} saved trips.</Text>
                </View>
              ) : null}
            </View>
          </GlassCard>

          {/* Loading / error */}
          {(loading || prefillLoading) && (
            <GlassCard level="default" variant="matte" style={styles.block} noPadding>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading…</Text>
              </View>
            </GlassCard>
          )}

          {!prefillLoading && error && (
            <GlassCard level="default" variant="matte" style={styles.block} noPadding>
              <View style={{ padding: 12 }}>
                <EmptyState title="Problem" message={error} />
              </View>
            </GlassCard>
          )}

          {/* Selected match + trip inputs */}
          {!prefillLoading && selectedFixture ? (
            <GlassCard level="default" variant="matte" style={styles.block} noPadding>
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.h1}>Selected match</Text>
                </View>

                <View style={styles.matchRow}>
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

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.matchTitle} numberOfLines={1}>
                      {selectedTitle}
                    </Text>
                    <Text style={styles.matchMeta} numberOfLines={1}>
                      {selectedKickLine}
                    </Text>
                    <Text style={styles.matchMeta} numberOfLines={1}>
                      {selectedVenueLine}
                    </Text>
                  </View>
                </View>

                <View style={styles.chipsRow}>
                  <Chip
                    label={kickoffTbc ? "Kickoff TBC" : "Kickoff confirmed"}
                    variant={chipVariantForKickoff(kickoffTbc)}
                  />
                  {weekendHint(selectedFixture?.fixture?.date) ? (
                    <Chip label={String(weekendHint(selectedFixture?.fixture?.date))} variant="default" />
                  ) : null}
                  {isEditing ? <Chip label={isAlreadyInTrip ? "Already in trip" : "Will be added"} variant="default" /> : null}
                </View>

                {isEditing ? (
                  <View style={styles.primaryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.primaryTitle}>Set as primary match</Text>
                      <Text style={styles.primarySub}>
                        Primary drives the kickoff banner, stay guidance, and planning defaults.
                      </Text>
                    </View>
                    <Switch value={setAsPrimaryOnSave} onValueChange={setSetAsPrimaryOnSave} />
                  </View>
                ) : null}

                {routeCityArea ? (
                  <View style={styles.infoBar}>
                    <Text style={styles.infoText}>
                      Prefilled stay area:{" "}
                      <Text style={{ fontWeight: theme.fontWeight.black, color: theme.colors.textPrimary }}>
                        {routeCityArea}
                      </Text>
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.label}>Notes (optional)</Text>
                <Input
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Anything you want to remember…"
                  multiline
                  style={{ minHeight: 92 }}
                />
              </View>
            </GlassCard>
          ) : null}

          {/* Picker */}
          {showPickerMode && !prefillLoading && !error ? (
            <GlassCard level="default" variant="matte" style={styles.block} noPadding>
              <View style={styles.section}>
                <Text style={styles.h1}>{isEditing ? "Add a match" : "Pick a match"}</Text>
                <Text style={styles.hint}>
                  {isEditing ? "Select another match to add it to this trip." : "Choose a match to start a trip around it."}
                </Text>

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
                        style={({ pressed }) => [
                          styles.leaguePill,
                          active && styles.leaguePillActive,
                          pressed && { opacity: 0.92 },
                        ]}
                        android_ripple={{ color: "rgba(255,255,255,0.04)" }}
                      >
                        <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>{l.label}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Input
                  value={search}
                  onChangeText={(t) => {
                    setSearch(t);
                    setVisibleCount(14);
                  }}
                  placeholder="Search team / city / venue / league"
                />

                <View style={{ marginTop: 12, gap: 10 }}>
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
                          styles.fxPress,
                          pressed && { opacity: 0.94 },
                        ]}
                        android_ripple={{ color: "rgba(255,255,255,0.04)" }}
                      >
                        <GlassCard
                          level="default"
                          variant={selected ? "glow" : "matte"}
                          style={[styles.fxCard, selected && styles.fxCardSelected]}
                          noPadding
                        >
                          <View style={styles.fxInner}>
                            <View style={styles.fxTop}>
                              <View style={styles.fxLeft}>
                                <View style={styles.crestStack}>
                                  {homeLogo ? <Image source={{ uri: homeLogo }} style={styles.crestSm} /> : <View style={styles.crestFallbackSm} />}
                                  {awayLogo ? (
                                    <Image source={{ uri: awayLogo }} style={[styles.crestSm, { marginLeft: -8 }]} />
                                  ) : (
                                    <View style={[styles.crestFallbackSm, { marginLeft: -8 }]} />
                                  )}
                                </View>

                                <View style={{ flex: 1, minWidth: 0 }}>
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
                                <Text style={styles.fxLeague} numberOfLines={2}>
                                  {leagueName || "League"}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.fxBottomRow}>
                              <View style={styles.chipsRow}>
                                <Chip label={tbc ? "Kickoff TBC" : "Confirmed"} variant={chipVariantForKickoff(tbc)} />
                                {weekendHint(r?.fixture?.date) ? (
                                  <Chip label={String(weekendHint(r?.fixture?.date))} variant="default" />
                                ) : null}
                                {isEditing && existingMatchIds.includes(String(id).trim()) ? (
                                  <Chip label="Already in trip" variant="default" />
                                ) : null}
                              </View>

                              <Chip label={selected ? "Selected" : "Select"} variant={selected ? "success" : "default"} />
                            </View>
                          </View>
                        </GlassCard>
                      </Pressable>
                    );
                  })}
                </View>

                {visibleCount < filtered.length ? (
                  <View style={{ marginTop: 12 }}>
                    <Button label="Show more" tone="secondary" onPress={() => setVisibleCount((n) => n + 14)} />
                  </View>
                ) : null}
              </View>
            </GlassCard>
          ) : null}

          {/* CTA */}
          <GlassCard level="default" variant="matte" style={styles.ctaCard} noPadding>
            <View style={styles.ctaInner}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.ctaTitle}>{isEditing ? "Update trip" : "Save trip"}</Text>
                <Text style={styles.ctaSub} numberOfLines={2}>
                  {saveSubtitle}
                </Text>
                {error ? <Text style={styles.err}>{error}</Text> : null}
              </View>

              <View style={{ width: 150 }}>
                <Button
                  label={saving ? "Saving…" : isEditing ? "Update" : "Save"}
                  tone="primary"
                  glow
                  disabled={saveDisabled}
                  onPress={onSave}
                />
              </View>
            </View>
          </GlassCard>

          {/* spacing */}
          <View style={{ height: 4 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* styles                                                                      */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  hero: {
    borderRadius: theme.borderRadius.sheet,
    overflow: "hidden",
  },
  heroInner: {
    padding: 14,
    gap: 10,
  },
  heroTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },
  heroSub: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    lineHeight: 18,
    fontSize: 13,
  },
  heroMetaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  heroMeta: {
    flex: 1,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  heroMetaKicker: {
    color: theme.colors.textMuted,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  heroMetaValue: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
  },
  heroCap: {
    marginTop: 2,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  heroCapText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontSize: 12,
  },

  block: {
    borderRadius: theme.borderRadius.sheet,
    overflow: "hidden",
  },
  section: {
    padding: 14,
    gap: 10,
  },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.semibold },

  h1: {
    fontSize: 16,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    letterSpacing: 0.2,
  },
  hint: {
    marginTop: -4,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontSize: 13,
    lineHeight: 18,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  matchRow: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 4 },

  crestStack: { flexDirection: "row", alignItems: "center" },
  crest: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  crestFallback: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  matchTitle: { color: theme.colors.textPrimary, fontWeight: theme.fontWeight.black, fontSize: 16 },
  matchMeta: { color: theme.colors.textSecondary, marginTop: 4, fontWeight: theme.fontWeight.medium, fontSize: 12 },

  chipsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },

  primaryRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  primaryTitle: { color: theme.colors.textPrimary, fontWeight: theme.fontWeight.black, fontSize: 12 },
  primarySub: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium, fontSize: 11, lineHeight: 14 },

  infoBar: {
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  infoText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium, fontSize: 12, lineHeight: 16 },

  label: { marginTop: 2, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.semibold },

  leaguePill: {
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
    overflow: "hidden",
  },
  leaguePillActive: {
    borderColor: "rgba(87,162,56,0.32)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },
  leaguePillText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 12 },
  leaguePillTextActive: { color: theme.colors.textPrimary },

  fxPress: { borderRadius: theme.borderRadius.sheet },
  fxCard: {
    borderRadius: theme.borderRadius.sheet,
  },
  fxCardSelected: {
    borderColor: "rgba(87,162,56,0.28)",
  },
  fxInner: { padding: 12, gap: 10 },

  fxTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  fxLeft: { flex: 1, flexDirection: "row", gap: 12, alignItems: "center" },
  fxRight: { width: 100, alignItems: "flex-end" },

  crestSm: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  crestFallbackSm: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  flag: {
    width: 22,
    height: 14,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  fxLeague: { marginTop: 6, color: theme.colors.textMuted, fontWeight: theme.fontWeight.black, fontSize: 11, textAlign: "right" },

  fxTitle: { color: theme.colors.textPrimary, fontWeight: theme.fontWeight.black, fontSize: 15 },
  fxMeta: { color: theme.colors.textSecondary, marginTop: 5, fontWeight: theme.fontWeight.medium, fontSize: 12 },
  fxMeta2: { color: theme.colors.textMuted, marginTop: 4, fontWeight: theme.fontWeight.medium, fontSize: 12 },

  fxBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },

  ctaCard: {
    borderRadius: theme.borderRadius.sheet,
    overflow: "hidden",
  },
  ctaInner: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ctaTitle: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  ctaSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  err: { marginTop: 8, color: "rgba(214,69,69,0.95)", fontWeight: theme.fontWeight.black, fontSize: 12 },
});
