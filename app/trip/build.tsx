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

import {
  LEAGUES,
  DEFAULT_SEASON,
  getRollingWindowIso,
  normalizeWindowIso,
  clampFromIsoToTomorrow,
  type LeagueOption,
  type RollingWindowIso,
} from "@/src/constants/football";

import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { computeLikelyPlaceholderTbcIds, isKickoffTbc } from "@/src/utils/kickoffTbc";

import rankTrips from "@/src/features/tripFinder/rankTrips";
import type { RankedTrip, TravelDifficulty } from "@/src/features/tripFinder/types";

/* -------------------------------------------------------------------------- */
/* config                                                                      */
/* -------------------------------------------------------------------------- */

const FREE_TRIP_CAP = 5;
const WINDOW_DAYS = 90;

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */
/* -------------------------------------------------------------------------- */

function paramString(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || null;
  return null;
}

function paramNumber(v: unknown): number | null {
  const s = paramString(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isIsoDateOnly(s?: string | null): boolean {
  const v = String(s ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
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

function validSeasonOrNull(n: number | null): number | null {
  if (!n || !Number.isFinite(n)) return null;
  if (n < 2000) return null;
  if (n > new Date().getFullYear() + 1) return null;
  return n;
}

function findLeagueOptionByLeagueId(leagueId?: number | null, season?: number | null) {
  if (!leagueId) return null;
  const byId = LEAGUES.find((l) => l.leagueId === leagueId) ?? null;
  if (!byId) return null;

  if (season && typeof byId.season === "number" && byId.season !== season) {
    return { ...byId, season } as LeagueOption;
  }
  return byId;
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

async function computePlaceholderIdsForFixture(
  fx: FixtureListRow | null,
  seasonOverride?: number | null
): Promise<Set<string>> {
  if (!fx) return new Set();

  const leagueId = fx?.league?.id ?? null;
  const season =
    seasonOverride ??
    (typeof (fx as any)?.league?.season === "number" ? (fx as any).league.season : DEFAULT_SEASON);

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

function difficultyLabel(v?: TravelDifficulty | null) {
  if (v === "easy") return "Easy";
  if (v === "moderate") return "Moderate";
  if (v === "hard") return "Hard";
  if (v === "complex") return "Complex";
  return "Unknown";
}

function prefWindowLabel(v?: string | null) {
  if (v === "wknd") return "This Weekend";
  if (v === "d7") return "Next 7 Days";
  if (v === "d14") return "Next 14 Days";
  if (v === "d30") return "Next 30 Days";
  return null;
}

function prefLengthLabel(v?: string | null) {
  if (v === "day") return "Day Trip";
  if (v === "1") return "1 Night";
  if (v === "2") return "2 Nights";
  if (v === "3") return "3 Nights";
  return null;
}

function prefVibeLabel(v: string) {
  if (v === "easy") return "Easy Travel";
  if (v === "big") return "Big Match";
  if (v === "hidden") return "Different";
  if (v === "nightlife") return "Nightlife";
  if (v === "culture") return "Culture";
  if (v === "warm") return "Warm-ish";
  return v;
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

  const routeFrom = useMemo(() => paramString((params as any)?.from), [params]);
  const routeTo = useMemo(() => paramString((params as any)?.to), [params]);
  const routeCity = useMemo(() => paramString((params as any)?.city), [params]);
  const routeLeagueId = useMemo(() => paramNumber((params as any)?.leagueId), [params]);
  const routeSeasonRaw = useMemo(() => paramNumber((params as any)?.season), [params]);
  const routeSeason = useMemo(() => validSeasonOrNull(routeSeasonRaw), [routeSeasonRaw]);

  const prefMode = useMemo(() => paramString((params as any)?.prefMode), [params]);
  const prefFrom = useMemo(() => paramString((params as any)?.prefFrom), [params]);
  const prefWindow = useMemo(() => paramString((params as any)?.prefWindow), [params]);
  const prefLength = useMemo(() => paramString((params as any)?.prefLength), [params]);
  const prefVibesRaw = useMemo(() => paramString((params as any)?.prefVibes), [params]);

  const prefVibes = useMemo(
    () =>
      String(prefVibesRaw ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    [prefVibesRaw]
  );

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

  /* ------------------------------------------------------------------------ */
  /* Window (football.ts contract)                                             */
  /* ------------------------------------------------------------------------ */

  const defaultWindow = useMemo(() => getRollingWindowIso({ days: WINDOW_DAYS }), []);

  const routeWindow = useMemo<RollingWindowIso>(() => {
    if (!isIsoDateOnly(routeFrom) && !isIsoDateOnly(routeTo)) return defaultWindow;

    const fromSeed = isIsoDateOnly(routeFrom) ? String(routeFrom) : defaultWindow.from;
    const toSeed = isIsoDateOnly(routeTo) ? String(routeTo) : defaultWindow.to;

    return normalizeWindowIso({ from: fromSeed, to: toSeed }, WINDOW_DAYS);
  }, [routeFrom, routeTo, defaultWindow]);

  const [startIso, setStartIso] = useState(routeWindow.from);
  const [endIso, setEndIso] = useState(routeWindow.to);
  const [notes, setNotes] = useState("");

  const [endTouched, setEndTouched] = useState<boolean>(Boolean(isIsoDateOnly(routeTo)));

  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [existingMatchIds, setExistingMatchIds] = useState<string[]>([]);
  const [existingPrimaryId, setExistingPrimaryId] = useState<string | null>(null);

  const [setAsPrimaryOnSave, setSetAsPrimaryOnSave] = useState(false);

  useEffect(() => {
    if (isIsoDateOnly(routeTo)) return;
    if (endTouched) return;

    const d = parseIsoToDate(startIso);
    if (!d) return;
    const d2 = new Date(d);
    d2.setDate(d2.getDate() + 2);
    const y = d2.getFullYear();
    const m = String(d2.getMonth() + 1).padStart(2, "0");
    const day = String(d2.getDate()).padStart(2, "0");
    setEndIso(`${y}-${m}-${day}`);
  }, [startIso, endTouched, routeTo]);

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
      season: LEAGUES[0]?.season ?? DEFAULT_SEASON,
      countryCode: "EU",
      key: "all",
    }),
    []
  );

  const leagueOptions = useMemo(() => [ALL_LEAGUES, ...LEAGUES], [ALL_LEAGUES]);

  const [selectedLeague, setSelectedLeague] = useState<LeagueOption>(() => {
    const opt = findLeagueOptionByLeagueId(routeLeagueId, routeSeason);
    return opt ?? ALL_LEAGUES;
  });

  useEffect(() => {
    if (isPrefilledFlow) return;
    const opt = findLeagueOptionByLeagueId(routeLeagueId, routeSeason);
    if (opt) setSelectedLeague(opt);
    else if (routeLeagueId === 0) setSelectedLeague(ALL_LEAGUES);
  }, [routeLeagueId, routeSeason, isPrefilledFlow, ALL_LEAGUES]);

  const effectiveSeason = useMemo(() => routeSeason ?? selectedLeague.season ?? DEFAULT_SEASON, [routeSeason, selectedLeague]);

  /* ------------------------------------------------------------------------ */
  /* Apply route city to notes                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (routeCity) setNotesIfEmpty(`City: ${routeCity}`);
  }, [routeCity, setNotesIfEmpty]);

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

        if (isIsoDateOnly(routeFrom) || isIsoDateOnly(routeTo)) {
          setStartIso(routeWindow.from);
          setEndIso(routeWindow.to);
          setEndTouched(true);
        } else {
          setStartIso(t.startDate);
          setEndIso(t.endDate);
          setEndTouched(true);
        }

        setNotes((t as any).notes ?? "");

        const loadId = primary || (mids[0] ? String(mids[0]) : "");
        if (loadId) {
          const fx = await getFixtureById(String(loadId));
          if (cancelled) return;

          setSelectedFixture(fx);

          const ids = await computePlaceholderIdsForFixture(fx, routeSeason);
          if (!cancelled) setPlaceholderTbcIds(ids);

          const lid = fx?.league?.id ?? null;
          const opt = findLeagueOptionByLeagueId(typeof lid === "number" ? lid : null, routeSeason);
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
  }, [routeTripId, routeFrom, routeTo, routeSeason, routeWindow]);

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

        const ids = await computePlaceholderIdsForFixture(r, routeSeason);
        if (!cancelled) setPlaceholderTbcIds(ids);

        const hasFrom = isIsoDateOnly(routeFrom);
        const hasTo = isIsoDateOnly(routeTo);

        if (hasFrom || hasTo) {
          setStartIso(routeWindow.from);
          setEndIso(routeWindow.to);
          setEndTouched(true);
        } else {
          const d0 = fixtureDateOnly(r);
          if (d0) setStartIso(clampFromIsoToTomorrow(d0));
          setEndTouched(false);
        }

        if (routeCityArea) setNotesIfEmpty(`Stay area: ${routeCityArea}`);

        const lid = r?.league?.id ?? null;
        const opt = findLeagueOptionByLeagueId(typeof lid === "number" ? lid : null, routeSeason);
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
  }, [routeFixtureId, isPrefilledFlow, routeCityArea, setNotesIfEmpty, routeFrom, routeTo, routeSeason, routeWindow]);

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
        const from = routeWindow.from;
        const to = routeWindow.to;

        let res: FixtureListRow[] = [];

        if (selectedLeague.leagueId === 0) {
          const batches = await Promise.all(
            LEAGUES.map((l) =>
              getFixtures({
                league: l.leagueId,
                season: routeSeason ?? l.season,
                from,
                to,
              })
            )
          );
          res = batches.flat();
        } else {
          res =
            (await getFixtures({
              league: selectedLeague.leagueId,
              season: effectiveSeason,
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
  }, [selectedLeague, isPrefilledFlow, routeWindow, effectiveSeason, routeSeason]);

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

    if (!isIsoDateOnly(routeFrom) && !isIsoDateOnly(routeTo)) {
      const d0 = fixtureDateOnly(selectedFixture);
      if (d0) {
        const start = clampFromIsoToTomorrow(d0);
        setStartIso(start);
        setEndTouched(false);
      }
    }

    if (isEditing) setSetAsPrimaryOnSave(false);
  }, [selectedFixture, isEditing, routeFrom, routeTo]);

  /* ------------------------------------------------------------------------ */
  /* Trip intelligence                                                         */
  /* ------------------------------------------------------------------------ */

  const selectedRankedTrip = useMemo<RankedTrip | null>(() => {
    if (!selectedFixture) return null;
    const ranked = rankTrips([selectedFixture]);
    return ranked[0] ?? null;
  }, [selectedFixture]);

  const visibleRankMap = useMemo(() => {
    const ranked = rankTrips(visibleRows);
    return new Map<string, RankedTrip>(ranked.map((trip) => [fixtureIdStr(trip.fixture), trip]));
  }, [visibleRows]);

  const discoverSummary = useMemo(() => {
    const parts: string[] = [];

    if (prefMode === "surprise") parts.push("Surprise me");
    if (prefMode === "hidden") parts.push("Hidden gems");

    const w = prefWindowLabel(prefWindow);
    if (w) parts.push(w);

    const l = prefLengthLabel(prefLength);
    if (l) parts.push(l);

    if (prefFrom) parts.push(`From ${prefFrom}`);

    if (prefVibes.length) {
      parts.push(prefVibes.map(prefVibeLabel).join(" • "));
    }

    return parts;
  }, [prefMode, prefWindow, prefLength, prefFrom, prefVibes]);

  /* ------------------------------------------------------------------------ */
  /* Save                                                                      */
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
      return `Update dates/notes and add more matches to this trip. (${n} match${n === 1 ? "" : "es"})`;
    }
    return "Pick a match, then we’ll save a trip with dates, notes, and planning links.";
  }, [isEditing, existingMatchIds.length]);

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

  const showPickerMode = !isPrefilledFlow;

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

            {discoverSummary.length > 0 ? (
              <View style={styles.prefBar}>
                <Text style={styles.prefBarLabel}>Discover brief</Text>
                <Text style={styles.prefBarText}>{discoverSummary.join(" • ")}</Text>
              </View>
            ) : null}

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

          {!prefillLoading && selectedFixture ? (
            <GlassCard level="default">
              <Text style={styles.h1}>Selected match</Text>

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
                  <View style={[styles.badge, styles.badgeTbc]}>
                    <Text style={[styles.badgeText, styles.badgeTextTbc]}>Kickoff TBC</Text>
                  </View>
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
                    <Text style={styles.badgeText}>{isAlreadyInTrip ? "Already in trip" : "Will be added"}</Text>
                  </View>
                ) : null}
              </View>

              {selectedRankedTrip ? (
                <View style={styles.intelCard}>
                  <View style={styles.intelTopRow}>
                    <View style={styles.intelScoreBox}>
                      <Text style={styles.intelScoreValue}>{selectedRankedTrip.breakdown.combinedScore}</Text>
                      <Text style={styles.intelScoreLabel}>Trip score</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.intelTitle}>Trip intelligence</Text>
                      <Text style={styles.intelSub}>
                        {difficultyLabel(selectedRankedTrip.breakdown.travelDifficulty)} travel •{" "}
                        {selectedRankedTrip.city || cleanText(selectedFixture?.fixture?.venue?.city) || "City pending"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.intelPillRow}>
                    <View style={styles.intelPill}>
                      <Text style={styles.intelPillKicker}>Atmosphere</Text>
                      <Text style={styles.intelPillValue}>{selectedRankedTrip.breakdown.atmosphereScore}</Text>
                    </View>
                    <View style={styles.intelPill}>
                      <Text style={styles.intelPillKicker}>Match</Text>
                      <Text style={styles.intelPillValue}>{selectedRankedTrip.breakdown.matchInterestScore}</Text>
                    </View>
                    <View style={styles.intelPill}>
                      <Text style={styles.intelPillKicker}>Travel</Text>
                      <Text style={styles.intelPillValue}>{selectedRankedTrip.breakdown.travelScore}</Text>
                    </View>
                    <View style={styles.intelPill}>
                      <Text style={styles.intelPillKicker}>Difficulty</Text>
                      <Text style={styles.intelPillValue}>{difficultyLabel(selectedRankedTrip.breakdown.travelDifficulty)}</Text>
                    </View>
                  </View>

                  {selectedRankedTrip.breakdown.reasonLines?.length ? (
                    <View style={styles.reasonBox}>
                      <Text style={styles.reasonTitle}>Why this trip ranks like this</Text>
                      {selectedRankedTrip.breakdown.reasonLines.slice(0, 4).map((line, idx) => (
                        <Text key={`${line}-${idx}`} style={styles.reasonText}>
                          • {line}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {isEditing ? (
                <View style={styles.primaryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.primaryTitle}>Set as primary match</Text>
                    <Text style={styles.primarySub}>
                      Primary match drives kickoff banner + stay guidance + planning defaults.
                    </Text>
                  </View>
                  <Switch value={setAsPrimaryOnSave} onValueChange={setSetAsPrimaryOnSave} />
                </View>
              ) : null}

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

          {showPickerMode && !prefillLoading && !error ? (
            <GlassCard level="default">
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

              <View style={{ marginTop: 10 }}>
                {visibleRows.map((r, i) => {
                  const id = fixtureIdStr(r);
                  const selected = fixtureIdStr(selectedFixture) === id;
                  const ranked = visibleRankMap.get(id) ?? null;

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
                        const ids = await computePlaceholderIdsForFixture(r, routeSeason);
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
                          {ranked ? (
                            <View style={styles.rowScoreBox}>
                              <Text style={styles.rowScoreValue}>{ranked.breakdown.combinedScore}</Text>
                            </View>
                          ) : null}
                          {leagueFlag ? <Image source={{ uri: leagueFlag }} style={styles.flag} /> : null}
                          <Text style={styles.fxLeague} numberOfLines={1}>
                            {leagueName || "League"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.badgeRow}>
                        {tbc ? (
                          <View style={[styles.badge, styles.badgeTbc]}>
                            <Text style={[styles.badgeText, styles.badgeTextTbc]}>Kickoff TBC</Text>
                          </View>
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

                        {ranked ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{difficultyLabel(ranked.breakdown.travelDifficulty)} travel</Text>
                          </View>
                        ) : null}

                        {isEditing && existingMatchIds.includes(String(id).trim()) ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>Already in trip</Text>
                          </View>
                        ) : null}
                      </View>

                      {ranked?.breakdown?.reasonLines?.length ? (
                        <View style={styles.rowReasonBox}>
                          <Text style={styles.rowReasonText} numberOfLines={2}>
                            {ranked.breakdown.reasonLines.slice(0, 2).join(" • ")}
                          </Text>
                        </View>
                      ) : null}

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
            </GlassCard>
          ) : null}

          <Pressable
            onPress={onSave}
            disabled={saving || prefillLoading || !selectedFixture}
            style={[styles.saveBtn, (!selectedFixture || saving || prefillLoading) && { opacity: 0.55 }]}
          >
            <Text style={styles.saveText}>{saving ? "Saving…" : isEditing ? "Update trip" : "Save trip"}</Text>
            <Text style={styles.saveSub}>
              {selectedFixture
                ? isEditing
                  ? setAsPrimaryOnSave
                    ? "This match becomes the trip primary."
                    : "This match will be added to the trip."
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

  prefBar: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  prefBarLabel: { color: theme.colors.textTertiary, fontWeight: "900", fontSize: 11 },
  prefBarText: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12, lineHeight: 16 },

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

  intelCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  intelTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  intelScoreBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(75,158,57,0.35)",
    backgroundColor: "rgba(75,158,57,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  intelScoreValue: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 24,
    lineHeight: 28,
  },
  intelScoreLabel: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 10,
  },
  intelTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 15 },
  intelSub: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  intelPillRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  intelPill: {
    minWidth: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  intelPillKicker: { color: theme.colors.textTertiary, fontWeight: "900", fontSize: 10 },
  intelPillValue: { marginTop: 4, color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  reasonBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  reasonTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
  reasonText: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12, lineHeight: 16 },

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
    marginTop: 6,
  },
  fxLeague: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "900", fontSize: 11, textAlign: "right" },

  rowScoreBox: {
    minWidth: 34,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(75,158,57,0.35)",
    backgroundColor: "rgba(75,158,57,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowScoreValue: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  fxTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 15 },
  fxMeta: { color: theme.colors.textSecondary, marginTop: 5, fontWeight: "800", fontSize: 12 },
  fxMeta2: { color: theme.colors.textTertiary, marginTop: 4, fontWeight: "800", fontSize: 12 },

  rowReasonBox: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  rowReasonText: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 11, lineHeight: 15 },

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
