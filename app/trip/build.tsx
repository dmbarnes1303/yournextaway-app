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

import {
  getFixtures,
  getFixtureById,
  getFixturesByRound,
  type FixtureListRow,
} from "@/src/services/apiFootball";
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
import { computeLikelyPlaceholderTbcIds } from "@/src/utils/kickoffTbc";
import {
  getFixtureCertainty,
  type FixtureCertaintyState,
} from "@/src/utils/fixtureCertainty";

import rankTrips from "@/src/features/tripFinder/rankTrips";
import type { RankedTrip, TravelDifficulty } from "@/src/features/tripFinder/types";

/* -------------------------------------------------------------------------- */
/* config                                                                     */
/* -------------------------------------------------------------------------- */

const FREE_TRIP_CAP = 5;
const WINDOW_DAYS = 90;

/* -------------------------------------------------------------------------- */
/* helpers                                                                    */
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

function safeCityDisplay(cityRaw?: string | null): string {
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

function isTbcLikeCertainty(state: FixtureCertaintyState): boolean {
  return state === "tbc" || state === "likely_tbc";
}

function certaintyOrder(state: FixtureCertaintyState): number {
  if (state === "confirmed") return 0;
  if (state === "changed") return 1;
  if (state === "likely_tbc") return 2;
  return 3;
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

  const certainty = getFixtureCertainty(selectedFixture, { placeholderIds: placeholderTbcIds });
  const kickoffTbc = isTbcLikeCertainty(certainty);

  const leagueId =
    typeof selectedFixture?.league?.id === "number" ? selectedFixture.league.id : undefined;
  const homeTeamId =
    typeof selectedFixture?.teams?.home?.id === "number"
      ? selectedFixture.teams.home.id
      : undefined;
  const awayTeamId =
    typeof selectedFixture?.teams?.away?.id === "number"
      ? selectedFixture.teams.away.id
      : undefined;

  return {
    cityId,
    displayCity,
    fixtureIdPrimary:
      selectedFixture?.fixture?.id != null ? String(selectedFixture.fixture.id) : undefined,
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
    (typeof (fx as any)?.league?.season === "number"
      ? (fx as any).league.season
      : DEFAULT_SEASON);

  const round = cleanText(fx?.league?.round);

  if (!leagueId || !season || !round) return new Set();

  try {
    const roundRows = await getFixturesByRound({ leagueId, season, round });
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

function certaintyLabel(state: FixtureCertaintyState) {
  if (state === "confirmed") return "Kickoff confirmed";
  if (state === "changed") return "Kickoff changed";
  if (state === "likely_tbc") return "Likely placeholder";
  return "Kickoff TBC";
}

function prefWindowLabel(v?: string | null) {
  if (v === "wknd") return "This weekend";
  if (v === "d7") return "Next 7 days";
  if (v === "d14") return "Next 14 days";
  if (v === "d30") return "Next 30 days";
  return null;
}

function prefLengthLabel(v?: string | null) {
  if (v === "day") return "Day trip";
  if (v === "1") return "1 night";
  if (v === "2") return "2 nights";
  if (v === "3") return "3 nights";
  return null;
}

function prefVibeLabel(v: string) {
  if (v === "easy") return "Easy travel";
  if (v === "big") return "Big match";
  if (v === "hidden") return "Different";
  if (v === "nightlife") return "Nightlife";
  if (v === "culture") return "Culture";
  if (v === "warm") return "Warm";
  return v;
}

function scoreTone(score?: number | null) {
  const value = typeof score === "number" ? score : 0;
  if (value >= 78) return styles.scoreStrong;
  if (value >= 62) return styles.scoreOkay;
  return styles.scoreWeak;
}

function bookingReadinessLabel(row: RankedTrip | null) {
  if (!row) return "Good starting point for a trip";
  const difficulty = difficultyLabel(row.breakdown.travelDifficulty);
  return `${difficulty} travel route`;
}

function selectedFlowSummary(isEditing: boolean, setAsPrimaryOnSave: boolean) {
  if (isEditing) {
    return setAsPrimaryOnSave
      ? "This match will become the main match for this trip."
      : "This match will be added to the trip.";
  }

  return "Save this match as a trip, then sort tickets, flights, hotel and extras around it.";
}

function buildPageSubtitle(isEditing: boolean, matchCount: number) {
  if (isEditing) {
    return `Update trip dates or add another match. Current matches: ${matchCount}.`;
  }
  return "Choose the match you want to build the trip around.";
}

/* -------------------------------------------------------------------------- */
/* screen                                                                     */
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

  const ALL_LEAGUES = useMemo(
    () =>
      ({
        label: "All leagues",
        leagueId: 0,
        season: LEAGUES[0]?.season ?? DEFAULT_SEASON,
        countryCode: "EU",
        key: "all",
      }) as LeagueOption & { key: string },
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

  const effectiveSeason = useMemo(
    () => routeSeason ?? selectedLeague.season ?? DEFAULT_SEASON,
    [routeSeason, selectedLeague]
  );

  useEffect(() => {
    if (routeCity) setNotesIfEmpty(`City: ${routeCity}`);
  }, [routeCity, setNotesIfEmpty]);

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
  }, [
    routeFixtureId,
    isPrefilledFlow,
    routeCityArea,
    setNotesIfEmpty,
    routeFrom,
    routeTo,
    routeSeason,
    routeWindow,
  ]);

