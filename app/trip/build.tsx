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
import tripsStore, {
  type Trip,
  type TripSnapshotPatch,
} from "@/src/state/trips";

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

const FREE_TRIP_CAP = 5;
const WINDOW_DAYS = 90;
const LOAD_MORE_STEP = 12;
const NEARBY_FIXTURE_LIMIT = 6;

type RouteParams = {
  tripId: string | null;
  fixtureId: string | null;
  cityArea: string | null;
  from: string | null;
  to: string | null;
  city: string | null;
  leagueId: number | null;
  season: number | null;
  prefMode: string | null;
  prefFrom: string | null;
  prefWindow: string | null;
  prefLength: string | null;
  prefVibes: string[];
};

function cleanText(v: unknown): string {
  return String(v ?? "").trim();
}

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
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? "").trim());
}

function parseRouteParams(params: Record<string, unknown>): RouteParams {
  const seasonRaw = paramNumber(params.season);
  const season =
    seasonRaw &&
    Number.isFinite(seasonRaw) &&
    seasonRaw >= 2000 &&
    seasonRaw <= new Date().getFullYear() + 1
      ? seasonRaw
      : null;

  const prefVibesRaw = paramString(params.prefVibes);

  return {
    tripId: paramString(params.tripId),
    fixtureId: paramString(params.fixtureId),
    cityArea: paramString(params.cityArea),
    from: paramString(params.from),
    to: paramString(params.to),
    city: paramString(params.city),
    leagueId: paramNumber(params.leagueId),
    season,
    prefMode: paramString(params.prefMode),
    prefFrom: paramString(params.prefFrom),
    prefWindow: paramString(params.prefWindow),
    prefLength: paramString(params.prefLength),
    prefVibes: String(prefVibesRaw ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  };
}

function fixtureIdStr(r: FixtureListRow | null): string {
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

function parseIsoToDate(iso?: string | null): Date | null {
  const s = cleanText(iso);
  if (!s) return null;

  if (isIsoDateOnly(s)) {
    const d = new Date(`${s}T00:00:00`);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function isoDateOnlyToLocalDate(iso?: string | null): Date | null {
  const s = cleanText(iso);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isFinite(d.getTime()) ? d : null;
}

function addDaysToIsoDate(iso: string, offset: number): string | null {
  const d = isoDateOnlyToLocalDate(iso);
  if (!d) return null;
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultTripWindowFromFixtureDate(iso: string | null): {
  start: string | null;
  end: string | null;
} {
  const dateOnly = cleanText(iso);
  if (!dateOnly) return { start: null, end: null };

  const start = addDaysToIsoDate(dateOnly, -1);
  const end = addDaysToIsoDate(dateOnly, 1);

  return {
    start: start ? clampFromIsoToTomorrow(start) : null,
    end,
  };
}

function normalizeIsoInput(value: string): string {
  return value.replace(/[^\d-]/g, "").slice(0, 10);
}

function daysBetweenIso(aIso: string, bIso: string) {
  const a = parseIsoToDate(aIso);
  const b = parseIsoToDate(bIso);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function safeUri(u: unknown): string | null {
  const s = String(u ?? "").trim();
  if (!s || !/^https?:\/\//i.test(s)) return null;
  return s;
}

function slugifyCityId(cityRaw: string) {
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

function weekendHint(isoMaybe: unknown): "Weekend" | "Midweek" | null {
  const d = parseIsoToDate(String(isoMaybe ?? ""));
  if (!d) return null;
  const day = d.getDay();
  return day === 0 || day === 6 ? "Weekend" : "Midweek";
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

function buildPrimarySnapshotFromFixture(
  selectedFixture: FixtureListRow,
  placeholderTbcIds: Set<string>
): { cityId: string; snapshot: TripSnapshotPatch } {
  const displayCity = safeCityDisplay(selectedFixture?.fixture?.venue?.city);
  const cityId = slugifyCityId(displayCity);

  const homeName = cleanText(selectedFixture?.teams?.home?.name);
  const awayName = cleanText(selectedFixture?.teams?.away?.name);
  const leagueName = cleanText(selectedFixture?.league?.name);
  const round = cleanText(selectedFixture?.league?.round);
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
    snapshot: {
      displayCity,
      fixtureIdPrimary:
        selectedFixture?.fixture?.id != null ? String(selectedFixture.fixture.id) : undefined,
      homeTeamId,
      awayTeamId,
      homeName: homeName || undefined,
      awayName: awayName || undefined,
      leagueId,
      leagueName: leagueName || undefined,
      round: round || undefined,
      kickoffIso,
      kickoffTbc,
      venueName: venueName || undefined,
      venueCity: venueCity || undefined,
    },
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
    (typeof fx?.league?.season === "number" ? fx.league.season : DEFAULT_SEASON);
  const round = cleanText(fx?.league?.round);

  if (!leagueId || !season || !round) return new Set();

  try {
    const roundRows = await getFixturesByRound({ leagueId, season, round });
    return computeLikelyPlaceholderTbcIds(roundRows || []);
  } catch {
    return new Set();
  }
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

function scoreTone(score?: number | null) {
  const value = typeof score === "number" ? score : 0;
  if (value >= 78) return "strong";
  if (value >= 62) return "okay";
  return "weak";
}

function bookingReadinessLabel(row: RankedTrip | null) {
  if (!row) return "Good starting point for a trip";
  const difficulty = difficultyLabel(row.breakdown.travelDifficulty);
  return `${difficulty} travel route`;
}

function buildPageSubtitle(isEditing: boolean, matchCount: number) {
  if (isEditing) {
    return `Update trip dates or add another match. Current matches: ${matchCount}.`;
  }
  return "Build the trip around one clear match, then book tickets, travel and stay around those dates.";
}

function compactCompetitionLabel(fx: FixtureListRow | null): string {
  const league = cleanText(fx?.league?.name);
  const round = cleanText(fx?.league?.round);
  if (league && round) return `${league} • ${round}`;
  return league || round || "Competition TBC";
}

function compactKickoffLabel(
  fx: FixtureListRow | null,
  certainty: FixtureCertaintyState
): string {
  if (!fx) return "Kickoff TBC";
  if (isTbcLikeCertainty(certainty)) return "Kickoff TBC";
  return formatUkDateTimeMaybe(fx?.fixture?.date) || "Kickoff TBC";
}

function buildNearbyFixturesTitle(city: string, startIso: string, endIso: string) {
  return `Also during ${city} • ${startIso} → ${endIso}`;
}

export default function TripBuildScreen() {
  const router = useRouter();
  const rawParams = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const params = useMemo(
    () => parseRouteParams(rawParams as Record<string, unknown>),
    [rawParams]
  );

  const isEditing = !!params.tripId;
  const isPrefilledFlow = !!params.fixtureId && !isEditing;

  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [placeholderTbcIds, setPlaceholderTbcIds] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(LOAD_MORE_STEP);
  const [selectedFixture, setSelectedFixture] = useState<FixtureListRow | null>(null);

  const [nearbyFixtures, setNearbyFixtures] = useState<FixtureListRow[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const defaultWindow = useMemo(() => getRollingWindowIso({ days: WINDOW_DAYS }), []);
  const routeWindow = useMemo<RollingWindowIso>(() => {
    if (!isIsoDateOnly(params.from) && !isIsoDateOnly(params.to)) return defaultWindow;

    const fromSeed = isIsoDateOnly(params.from) ? String(params.from) : defaultWindow.from;
    const toSeed = isIsoDateOnly(params.to) ? String(params.to) : defaultWindow.to;

    return normalizeWindowIso({ from: fromSeed, to: toSeed }, WINDOW_DAYS);
  }, [params.from, params.to, defaultWindow]);

  const [startIso, setStartIso] = useState(routeWindow.from);
  const [endIso, setEndIso] = useState(routeWindow.to);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [endTouched, setEndTouched] = useState<boolean>(Boolean(isIsoDateOnly(params.to)));
  const [hasManualDateOverride, setHasManualDateOverride] = useState<boolean>(
    Boolean(isIsoDateOnly(params.from) || isIsoDateOnly(params.to))
  );

  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [existingMatchIds, setExistingMatchIds] = useState<string[]>([]);
  const [existingPrimaryId, setExistingPrimaryId] = useState<string | null>(null);
  const [setAsPrimaryOnSave, setSetAsPrimaryOnSave] = useState(false);

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
    const opt = findLeagueOptionByLeagueId(params.leagueId, params.season);
    return opt ?? ALL_LEAGUES;
  });

  useEffect(() => {
    if (isIsoDateOnly(params.to)) return;
    if (endTouched) return;

    const d = parseIsoToDate(startIso);
    if (!d) return;

    const d2 = new Date(d);
    d2.setDate(d2.getDate() + 2);

    const y = d2.getFullYear();
    const m = String(d2.getMonth() + 1).padStart(2, "0");
    const day = String(d2.getDate()).padStart(2, "0");
    setEndIso(`${y}-${m}-${day}`);
  }, [startIso, endTouched, params.to]);

  useEffect(() => {
    if (isPrefilledFlow) return;
    const opt = findLeagueOptionByLeagueId(params.leagueId, params.season);
    if (opt) setSelectedLeague(opt);
    else if (params.leagueId === 0) setSelectedLeague(ALL_LEAGUES);
  }, [params.leagueId, params.season, isPrefilledFlow, ALL_LEAGUES]);

  const effectiveSeason = useMemo(
    () => validSeasonOrNull(params.season) ?? selectedLeague.season ?? DEFAULT_SEASON,
    [params.season, selectedLeague]
  );

  useEffect(() => {
    if (params.city) setNotesIfEmpty(`City: ${params.city}`);
  }, [params.city, setNotesIfEmpty]);

  useEffect(() => {
    if (!params.tripId) return;

    let cancelled = false;

    async function run() {
      setPrefillLoading(true);
      setError(null);

      try {
        if (!tripsStore.getState().loaded) await tripsStore.loadTrips();
        if (cancelled) return;

        const t = tripsStore.getState().trips.find((x) => x.id === params.tripId) ?? null;
        if (!t) {
          setError("Trip not found.");
          return;
        }

        setEditTrip(t);

        const mids = Array.isArray(t.matchIds)
          ? t.matchIds.map((x) => String(x).trim()).filter(Boolean)
          : [];
        setExistingMatchIds(mids);

        const primary = cleanText(t.fixtureIdPrimary) || (mids[0] ? String(mids[0]) : "");
        setExistingPrimaryId(primary || null);

        if (isIsoDateOnly(params.from) || isIsoDateOnly(params.to)) {
          setStartIso(routeWindow.from);
          setEndIso(routeWindow.to);
          setEndTouched(true);
          setHasManualDateOverride(true);
        } else {
          setStartIso(t.startDate);
          setEndIso(t.endDate);
          setEndTouched(true);
          setHasManualDateOverride(true);
        }

        setNotes(t.notes ?? "");

        const loadId = primary || (mids[0] ? String(mids[0]) : "");
        if (loadId) {
          const fx = await getFixtureById(String(loadId));
          if (cancelled) return;

          setSelectedFixture(fx);

          const ids = await computePlaceholderIdsForFixture(fx, params.season);
          if (!cancelled) setPlaceholderTbcIds(ids);

          const lid = fx?.league?.id ?? null;
          const opt = findLeagueOptionByLeagueId(
            typeof lid === "number" ? lid : null,
            params.season
          );
          if (opt) setSelectedLeague(opt);
        } else {
          setSelectedFixture(null);
          setPlaceholderTbcIds(new Set());
        }

        setSetAsPrimaryOnSave(false);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load trip.");
        }
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [params.tripId, params.from, params.to, params.season, routeWindow]);

  useEffect(() => {
    if (!isPrefilledFlow || !params.fixtureId) return;

    let cancelled = false;

    async function run() {
      setPrefillLoading(true);
      setError(null);

      try {
        const r = await getFixtureById(params.fixtureId);
        if (cancelled) return;

        setSelectedFixture(r);

        const ids = await computePlaceholderIdsForFixture(r, params.season);
        if (!cancelled) setPlaceholderTbcIds(ids);

        const hasFrom = isIsoDateOnly(params.from);
        const hasTo = isIsoDateOnly(params.to);

        if (hasFrom || hasTo) {
          setStartIso(routeWindow.from);
          setEndIso(routeWindow.to);
          setEndTouched(true);
          setHasManualDateOverride(true);
        } else {
          const d0 = fixtureDateOnly(r);
          const derived = defaultTripWindowFromFixtureDate(d0);

          if (derived.start) setStartIso(derived.start);
          if (derived.end) setEndIso(derived.end);

          setEndTouched(false);
          setHasManualDateOverride(false);
        }

        if (params.cityArea) setNotesIfEmpty(`Stay area: ${params.cityArea}`);

        const lid = r?.league?.id ?? null;
        const opt = findLeagueOptionByLeagueId(
          typeof lid === "number" ? lid : null,
          params.season
        );
        if (opt) setSelectedLeague(opt);
      } catch {
        if (!cancelled) setError("Couldn’t load that fixture.");
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    params.fixtureId,
    isPrefilledFlow,
    params.cityArea,
    setNotesIfEmpty,
    params.from,
    params.to,
    params.season,
    routeWindow,
  ]);

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
                season: params.season ?? l.season,
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
            const certainty = getFixtureCertainty(r, { placeholderIds: placeholder });
            return { r, iso, certainty };
          });

          scored.sort((a, b) => {
            const aOrder = certaintyOrder(a.certainty);
            const bOrder = certaintyOrder(b.certainty);
            if (aOrder !== bOrder) return aOrder - bOrder;
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

    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedLeague, isPrefilledFlow, routeWindow, effectiveSeason, params.season]);

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

    if (
      isEditing ||
      hasManualDateOverride ||
      isIsoDateOnly(params.from) ||
      isIsoDateOnly(params.to)
    ) {
      if (isEditing) setSetAsPrimaryOnSave(false);
      return;
    }

    const d0 = fixtureDateOnly(selectedFixture);
    const derived = defaultTripWindowFromFixtureDate(d0);

    if (derived.start) setStartIso(derived.start);
    if (derived.end) setEndIso(derived.end);

    setEndTouched(false);
  }, [selectedFixture, isEditing, hasManualDateOverride, params.from, params.to]);

  const selectedRankedTrip = useMemo<RankedTrip | null>(() => {
    if (!selectedFixture) return null;
    const ranked = rankTrips([selectedFixture] as never[]);
    return ranked[0] ?? null;
  }, [selectedFixture]);

  const visibleRankMap = useMemo(() => {
    const ranked = rankTrips(visibleRows as never[]);
    return new Map<string, RankedTrip>(
      ranked.map((trip) => [
        fixtureIdStr((trip as unknown as { fixture: FixtureListRow }).fixture),
        trip,
      ])
    );
  }, [visibleRows]);

  const validateDateOrder = useCallback((): string | null => {
    if (!isIsoDateOnly(startIso) || !isIsoDateOnly(endIso)) {
      return "Trip dates must be in YYYY-MM-DD format.";
    }

    const a = parseIsoToDate(startIso);
    const b = parseIsoToDate(endIso);
    if (!a || !b) return "Invalid trip dates.";
    if (b.getTime() < a.getTime()) return "End date must be on or after start date.";
    return null;
  }, [startIso, endIso]);

  const onChangeStartDate = useCallback((value: string) => {
    setHasManualDateOverride(true);
    setStartIso(normalizeIsoInput(value));
  }, []);

  const onChangeEndDate = useCallback((value: string) => {
    setHasManualDateOverride(true);
    setEndTouched(true);
    setEndIso(normalizeIsoInput(value));
  }, []);

  const onResetToFixtureWindow = useCallback(() => {
    if (!selectedFixture) return;

    const d0 = fixtureDateOnly(selectedFixture);
    const derived = defaultTripWindowFromFixtureDate(d0);

    if (derived.start) setStartIso(derived.start);
    if (derived.end) setEndIso(derived.end);

    setHasManualDateOverride(false);
    setEndTouched(false);
    setError(null);
  }, [selectedFixture]);

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
    const { cityId, snapshot } = buildPrimarySnapshotFromFixture(
      selectedFixture,
      placeholderTbcIds
    );

    try {
      if (!tripsStore.getState().loaded) await tripsStore.loadTrips();

      if (isEditing && params.tripId) {
        const basePatch = {
          startDate: startIso,
          endDate: endIso,
          notes: cleanText(notes) || undefined,
        };

        const baseNotes =
          params.cityArea && !cleanText(basePatch.notes)
            ? `Stay area: ${params.cityArea}`
            : basePatch.notes;

        await tripsStore.updateTrip(params.tripId, {
          ...basePatch,
          notes: baseNotes,
        });

        const alreadyInTrip = existingMatchIds.includes(fixtureId);

        if (setAsPrimaryOnSave) {
          await tripsStore.updateTrip(params.tripId, {
            cityId,
            displayCity: snapshot.displayCity,
          });

          await tripsStore.applyPrimaryMatchSelection(params.tripId, fixtureId, snapshot);
        } else if (!alreadyInTrip) {
          await tripsStore.addMatchToTrip(params.tripId, fixtureId, {
            setPrimary: false,
          });
        }

        router.replace({ pathname: "/trip/[id]", params: { id: params.tripId } } as never);
        return;
      }

      const existingId = findExistingTripIdForFixture(fixtureId);
      if (existingId) {
        Alert.alert(
          "Trip already exists",
          "You already have a trip for this match — opening it now."
        );
        router.replace({ pathname: "/trip/[id]", params: { id: existingId } } as never);
        return;
      }

      const tripCount = tripsStore.getState().trips?.length ?? 0;
      if (tripCount >= FREE_TRIP_CAP) {
        Alert.alert(
          "Free plan limit reached",
          `You can save up to ${FREE_TRIP_CAP} trips on the free plan.\n\nDelete an old trip or upgrade to Pro later.`
        );
        return;
      }

      const finalNotes =
        params.cityArea && !cleanText(notes)
          ? `Stay area: ${params.cityArea}`
          : cleanText(notes) || undefined;

      const t = await tripsStore.addTrip({
        cityId,
        displayCity: snapshot.displayCity,
        startDate: startIso,
        endDate: endIso,
        matchIds: [fixtureId],
        fixtureIdPrimary: fixtureId,
        notes: finalNotes,
        ...snapshot,
      });

      router.replace({ pathname: "/trip/[id]", params: { id: t.id } } as never);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save trip.");
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
    params.cityArea,
    isEditing,
    params.tripId,
    router,
    setAsPrimaryOnSave,
    existingMatchIds,
  ]);

  const selectedTitle = useMemo(() => {
    const h = cleanText(selectedFixture?.teams?.home?.name) || "Home";
    const a = cleanText(selectedFixture?.teams?.away?.name) || "Away";
    return `${h} vs ${a}`;
  }, [selectedFixture]);

  const selectedCertainty = useMemo<FixtureCertaintyState>(() => {
    return getFixtureCertainty(selectedFixture, { placeholderIds: placeholderTbcIds });
  }, [selectedFixture, placeholderTbcIds]);

  const selectedKickLine = useMemo(() => {
    return compactKickoffLabel(selectedFixture, selectedCertainty);
  }, [selectedFixture, selectedCertainty]);

  const selectedVenueLine = useMemo(() => {
    if (!selectedFixture) return "Venue TBC";
    const v = cleanText(selectedFixture?.fixture?.venue?.name);
    const c = cleanText(selectedFixture?.fixture?.venue?.city);
    const parts = [v, c].filter(Boolean);
    return parts.length ? parts.join(" • ") : "Venue TBC";
  }, [selectedFixture]);

  const selectedCompetitionLine = useMemo(() => {
    return compactCompetitionLabel(selectedFixture);
  }, [selectedFixture]);

  const selectedCity = useMemo(() => {
    return safeCityDisplay(selectedFixture?.fixture?.venue?.city);
  }, [selectedFixture]);

  const tripLength = useMemo(() => {
    const d = daysBetweenIso(startIso, endIso);
    if (d == null) return null;
    const nights = Math.max(0, d);
    return `${nights} night${nights === 1 ? "" : "s"}`;
  }, [startIso, endIso]);

  const headerTitle = useMemo(() => (isEditing ? "Edit trip" : "Plan trip"), [isEditing]);

  const selectedHomeLogo = useMemo(
    () => safeUri(selectedFixture?.teams?.home?.logo),
    [selectedFixture]
  );
  const selectedAwayLogo = useMemo(
    () => safeUri(selectedFixture?.teams?.away?.logo),
    [selectedFixture]
  );

  const selectedFixtureId = useMemo(() => fixtureIdStr(selectedFixture), [selectedFixture]);

  const isAlreadyInTrip = useMemo(() => {
    if (!isEditing) return false;
    if (!selectedFixtureId) return false;
    return existingMatchIds.includes(String(selectedFixtureId).trim());
  }, [isEditing, selectedFixtureId, existingMatchIds]);

  const showPickerMode = !isPrefilledFlow;

  const selectedFlowSteps = useMemo(() => {
    return [
      "Save this trip",
      "Compare ticket options",
      "Add travel for these dates",
      "Choose where to stay",
      "Store proof in Wallet",
    ];
  }, []);

  const tripSummaryCards = useMemo(() => {
    return [
      { label: "City", value: selectedCity },
      { label: "Competition", value: selectedCompetitionLine },
      { label: "Kickoff", value: selectedKickLine },
      { label: "Trip dates", value: `${startIso} → ${endIso}${tripLength ? ` • ${tripLength}` : ""}` },
    ];
  }, [selectedCity, selectedCompetitionLine, selectedKickLine, startIso, endIso, tripLength]);

  useEffect(() => {
    let cancelled = false;

    async function runNearby() {
      if (!selectedFixture) {
        if (!cancelled) setNearbyFixtures([]);
        return;
      }

      const city = cleanText(selectedFixture?.fixture?.venue?.city).toLowerCase();
      if (!city || !isIsoDateOnly(startIso) || !isIsoDateOnly(endIso)) {
        if (!cancelled) setNearbyFixtures([]);
        return;
      }

      setNearbyLoading(true);

      try {
        const leagueRows =
          selectedLeague.leagueId === 0
            ? rows
            : rows.length > 0
              ? rows
              : await getFixtures({
                  league: selectedLeague.leagueId,
                  season: effectiveSeason,
                  from: startIso,
                  to: endIso,
                });

        const currentId = fixtureIdStr(selectedFixture);

        const matches = (leagueRows || [])
          .filter((row) => fixtureIdStr(row) !== currentId)
          .filter((row) => {
            const rowCity = cleanText(row?.fixture?.venue?.city).toLowerCase();
            const rowDate = fixtureDateOnly(row);
            return rowCity === city && !!rowDate && rowDate >= startIso && rowDate <= endIso;
          })
          .sort((a, b) =>
            String(a?.fixture?.date ?? "").localeCompare(String(b?.fixture?.date ?? ""))
          )
          .slice(0, NEARBY_FIXTURE_LIMIT);

        if (!cancelled) setNearbyFixtures(matches);
      } catch {
        if (!cancelled) setNearbyFixtures([]);
      } finally {
        if (!cancelled) setNearbyLoading(false);
      }
    }

    void runNearby();

    return () => {
      cancelled = true;
    };
  }, [selectedFixture, selectedLeague, rows, startIso, endIso, effectiveSeason]);

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.84}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: headerTitle,
          headerTransparent: true,
          headerTintColor: theme.colors.text,
          headerRight: () => (
            <Pressable
              onPress={onSave}
              disabled={saving || prefillLoading || !selectedFixture}
              hitSlop={8}
              style={({ pressed }) => [
                styles.headerSaveBtn,
                (!selectedFixture || saving || prefillLoading) && styles.headerSaveBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.headerSaveBtnText}>{saving ? "Saving…" : "Save"}</Text>
            </Pressable>
          ),
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
            <Text style={styles.bigTitle}>{isEditing ? "Edit trip" : "Build your trip"}</Text>
            <Text style={styles.bigSub}>
              {buildPageSubtitle(isEditing, existingMatchIds.length)}
            </Text>

            {selectedFixture ? (
              <View style={styles.heroSummaryWrap}>
                <Text style={styles.heroSummaryMatch} numberOfLines={1}>
                  {selectedTitle}
                </Text>
                <View style={styles.heroSummaryGrid}>
                  {tripSummaryCards.map((item) => (
                    <View key={item.label} style={styles.heroSummaryCard}>
                      <Text style={styles.heroSummaryLabel}>{item.label}</Text>
                      <Text style={styles.heroSummaryValue} numberOfLines={2}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {!isEditing ? (
              <View style={styles.capBar}>
                <Text style={styles.capText}>Free plan: save up to {FREE_TRIP_CAP} trips.</Text>
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

          {!prefillLoading && error ? (
            <GlassCard level="subtle">
              <EmptyState title="Problem" message={error} />
            </GlassCard>
          ) : null}

          {!prefillLoading && selectedFixture ? (
            <>
              <GlassCard level="default" style={styles.selectedCard}>
                <Text style={styles.sectionTitle}>Selected match</Text>

                <View style={styles.teamRow}>
                  <View style={styles.crestStack}>
                    {selectedHomeLogo ? (
                      <Image source={{ uri: selectedHomeLogo }} style={styles.crest} />
                    ) : (
                      <View style={styles.crestFallback} />
                    )}
                    {selectedAwayLogo ? (
                      <Image
                        source={{ uri: selectedAwayLogo }}
                        style={[styles.crest, { marginLeft: -10 }]}
                      />
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
                    <Text style={styles.selectedMeta}>{selectedCompetitionLine}</Text>
                  </View>
                </View>

                <View style={styles.badgeRow}>
                  {selectedCertainty === "confirmed" ? (
                    <View style={[styles.badge, styles.badgeConfirmed]}>
                      <Text style={[styles.badgeText, styles.badgeTextConfirmed]}>
                        {certaintyLabel(selectedCertainty)}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.badge, styles.badgeTbc]}>
                      <Text style={[styles.badgeText, styles.badgeTextTbc]}>
                        {certaintyLabel(selectedCertainty)}
                      </Text>
                    </View>
                  )}

                  {weekendHint(selectedFixture?.fixture?.date) ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {weekendHint(selectedFixture?.fixture?.date)}
                      </Text>
                    </View>
                  ) : null}

                  {isEditing ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {isAlreadyInTrip ? "Already in this trip" : "Ready to add"}
                      </Text>
                    </View>
                  ) : null}

                  {editTrip && existingPrimaryId && selectedFixtureId === existingPrimaryId ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Main match</Text>
                    </View>
                  ) : null}
                </View>
              </GlassCard>

              <GlassCard level="default">
                <Text style={styles.sectionTitle}>Trip dates</Text>
                <Text style={styles.sectionHint}>
                  This is the actual trip window. Flights and hotels should follow these dates.
                </Text>

                <View style={styles.dateInputsRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.dateFieldLabel}>Start date</Text>
                    <TextInput
                      value={startIso}
                      onChangeText={onChangeStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.colors.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="numbers-and-punctuation"
                      style={styles.dateInput}
                    />
                  </View>

                  <View style={styles.dateField}>
                    <Text style={styles.dateFieldLabel}>End date</Text>
                    <TextInput
                      value={endIso}
                      onChangeText={onChangeEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={theme.colors.textSecondary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="numbers-and-punctuation"
                      style={styles.dateInput}
                    />
                  </View>
                </View>

                <View style={styles.tripDateFooterRow}>
                  <Text style={styles.dateHint}>
                    {tripLength ? `Current trip length: ${tripLength}` : "Enter valid dates"}
                  </Text>

                  <Pressable onPress={onResetToFixtureWindow} style={styles.resetDateBtn}>
                    <Text style={styles.resetDateBtnText}>Reset to match window</Text>
                  </Pressable>
                </View>
              </GlassCard>

              {selectedRankedTrip ? (
                <GlassCard level="default">
                  <Text style={styles.sectionTitle}>Trip fit</Text>

                  <View style={styles.intelTopRow}>
                    <View
                      style={[
                        styles.intelScoreBox,
                        scoreTone(selectedRankedTrip.breakdown.combinedScore) === "strong"
                          ? styles.scoreStrong
                          : scoreTone(selectedRankedTrip.breakdown.combinedScore) === "okay"
                            ? styles.scoreOkay
                            : styles.scoreWeak,
                      ]}
                    >
                      <Text style={styles.intelScoreValue}>
                        {selectedRankedTrip.breakdown.combinedScore}
                      </Text>
                      <Text style={styles.intelScoreLabel}>Trip score</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.intelTitle}>How this trip looks</Text>
                      <Text style={styles.intelSub}>
                        {difficultyLabel(selectedRankedTrip.breakdown.travelDifficulty)} travel •{" "}
                        {selectedRankedTrip.city ||
                          cleanText(selectedFixture?.fixture?.venue?.city) ||
                          "City"}
                      </Text>
                      <Text style={styles.intelSubAlt}>
                        {bookingReadinessLabel(selectedRankedTrip)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.intelPillRow}>
                    <View style={styles.intelPill}>
                      <Text style={styles.intelPillKicker}>Atmosphere</Text>
                      <Text style={styles.intelPillValue}>
                        {selectedRankedTrip.breakdown.atmosphereScore}
                      </Text>
                    </View>
                    <View style={styles.intelPill}>
                      <Text style={styles.intelPillKicker}>Match</Text>
                      <Text style={styles.intelPillValue}>
                        {selectedRankedTrip.breakdown.matchInterestScore}
                      </Text>
                    </View>
                    <View style={styles.intelPill}>
                      <Text style={styles.intelPillKicker}>Travel</Text>
                      <Text style={styles.intelPillValue}>
                        {selectedRankedTrip.breakdown.travelDifficultyScore}
                      </Text>
                    </View>
                  </View>

                  {selectedRankedTrip.breakdown.reasonLines?.length ? (
                    <View style={styles.reasonBox}>
                      <Text style={styles.reasonTitle}>Why this works</Text>
                      {selectedRankedTrip.breakdown.reasonLines.slice(0, 3).map((line, idx) => (
                        <Text key={`${line}-${idx}`} style={styles.reasonText}>
                          • {line}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </GlassCard>
              ) : null}

              <GlassCard level="default">
                <Text style={styles.sectionTitle}>What happens next</Text>
                <Text style={styles.sectionHint}>
                  Stop explaining the app. Tell the user what to do.
                </Text>

                <View style={styles.nextStepList}>
                  {selectedFlowSteps.map((step, idx) => (
                    <View key={step} style={styles.nextStepRow}>
                      <View style={styles.nextStepIndex}>
                        <Text style={styles.nextStepIndexText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.nextStepRowText}>{step}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>

              {nearbyLoading || nearbyFixtures.length > 0 ? (
                <GlassCard level="default">
                  <Text style={styles.sectionTitle}>Nearby fixtures</Text>
                  <Text style={styles.sectionHint}>
                    {buildNearbyFixturesTitle(selectedCity, startIso, endIso)}
                  </Text>

                  {nearbyLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Checking nearby fixtures…</Text>
                    </View>
                  ) : (
                    <View style={styles.nearbyList}>
                      {nearbyFixtures.map((r) => {
                        const id = fixtureIdStr(r);
                        const home = cleanText(r?.teams?.home?.name) || "Home";
                        const away = cleanText(r?.teams?.away?.name) || "Away";
                        const kick = formatUkDateTimeMaybe(r?.fixture?.date) || "Kickoff TBC";
                        const cert = getFixtureCertainty(r, { placeholderIds: placeholderTbcIds });

                        return (
                          <Pressable
                            key={id}
                            onPress={async () => {
                              setSelectedFixture(r);
                              const ids = await computePlaceholderIdsForFixture(r, params.season);
                              setPlaceholderTbcIds(ids);
                              setError(null);
                            }}
                            style={styles.nearbyCard}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={styles.nearbyTitle} numberOfLines={1}>
                                {home} vs {away}
                              </Text>
                              <Text style={styles.nearbyMeta}>{kick}</Text>
                            </View>

                            <View
                              style={[
                                styles.badge,
                                cert === "confirmed" ? styles.badgeConfirmed : styles.badgeTbc,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.badgeText,
                                  cert === "confirmed"
                                    ? styles.badgeTextConfirmed
                                    : styles.badgeTextTbc,
                                ]}
                              >
                                {cert === "confirmed" ? "Confirmed" : "TBC"}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </GlassCard>
              ) : null}

              {isEditing ? (
                <GlassCard level="default">
                  <View style={styles.primaryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.primaryTitle}>Make this the main match</Text>
                      <Text style={styles.primarySub}>
                        The main match controls the headline trip details later.
                      </Text>
                    </View>
                    <Switch value={setAsPrimaryOnSave} onValueChange={setSetAsPrimaryOnSave} />
                  </View>
                </GlassCard>
              ) : null}

              {params.cityArea ? (
                <GlassCard level="default">
                  <View style={styles.infoBar}>
                    <Text style={styles.infoText}>
                      Prefilled stay area:{" "}
                      <Text style={styles.infoTextStrong}>{params.cityArea}</Text>
                    </Text>
                  </View>
                </GlassCard>
              ) : null}

              <GlassCard level="default">
                <Pressable
                  onPress={() => setShowNotes((prev) => !prev)}
                  style={styles.notesToggle}
                >
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.notesToggleText}>
                    {showNotes ? "Hide" : cleanText(notes) ? "Edit" : "Add"}
                  </Text>
                </Pressable>

                {showNotes ? (
                  <>
                    <Text style={styles.sectionHint}>
                      Low priority. Keep it if useful, otherwise ignore it.
                    </Text>
                    <TextInput
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Add anything worth keeping with this trip..."
                      placeholderTextColor={theme.colors.textSecondary}
                      style={styles.notes}
                      multiline
                    />
                  </>
                ) : cleanText(notes) ? (
                  <Text style={styles.notesPreview} numberOfLines={3}>
                    {cleanText(notes)}
                  </Text>
                ) : (
                  <Text style={styles.notesEmpty}>No notes added.</Text>
                )}
              </GlassCard>
            </>
          ) : null}

          {showPickerMode && !prefillLoading && !error ? (
            <GlassCard level="default">
              <Text style={styles.sectionTitle}>
                {isEditing ? "Choose another match" : "Choose your match"}
              </Text>
              <Text style={styles.sectionHint}>
                {isEditing
                  ? "Use this only if you want to add another match."
                  : "Pick the match you want the trip built around."}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 12 }}
              >
                {leagueOptions.map((l) => {
                  const active = l.leagueId === selectedLeague.leagueId;
                  return (
                    <Pressable
                      key={String((l as LeagueOption & { key?: string }).key ?? l.leagueId)}
                      onPress={() => {
                        setSelectedLeague(l);
                        setVisibleCount(LOAD_MORE_STEP);
                      }}
                      style={[styles.leaguePill, active && styles.leaguePillActive]}
                    >
                      <Text
                        style={[styles.leaguePillText, active && styles.leaguePillTextActive]}
                      >
                        {l.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <TextInput
                value={search}
                onChangeText={(t) => {
                  setSearch(t);
                  setVisibleCount(LOAD_MORE_STEP);
                }}
                placeholder="Search team, city, venue or league"
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

                  const certainty = getFixtureCertainty(r, { placeholderIds: placeholderTbcIds });
                  const kick = isTbcLikeCertainty(certainty)
                    ? "Kickoff TBC"
                    : formatUkDateTimeMaybe(r?.fixture?.date) || "Kickoff TBC";

                  const v = cleanText(r?.fixture?.venue?.name);
                  const c = cleanText(r?.fixture?.venue?.city);
                  const vc = [v, c].filter(Boolean).join(" • ");

                  const leagueName = cleanText(r?.league?.name);
                  const leagueFlag = safeUri(r?.league?.flag);

                  const homeLogo = safeUri(r?.teams?.home?.logo);
                  const awayLogo = safeUri(r?.teams?.away?.logo);

                  return (
                    <Pressable
                      key={id || String(i)}
                      onPress={async () => {
                        setSelectedFixture(r);

                        const ids = await computePlaceholderIdsForFixture(r, params.season);
                        setPlaceholderTbcIds(ids);
                        setError(null);

                        if (
                          !isEditing &&
                          !hasManualDateOverride &&
                          !isIsoDateOnly(params.from) &&
                          !isIsoDateOnly(params.to)
                        ) {
                          const d0 = fixtureDateOnly(r);
                          const derived = defaultTripWindowFromFixtureDate(d0);

                          if (derived.start) setStartIso(derived.start);
                          if (derived.end) setEndIso(derived.end);
                          setEndTouched(false);
                        }
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
                            {homeLogo ? (
                              <Image source={{ uri: homeLogo }} style={styles.crest} />
                            ) : (
                              <View style={styles.crestFallback} />
                            )}
                            {awayLogo ? (
                              <Image
                                source={{ uri: awayLogo }}
                                style={[styles.crest, { marginLeft: -10 }]}
                              />
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

                            <Text style={styles.fxFlowMeta} numberOfLines={1}>
                              Select match, set dates, then save trip
                            </Text>
                          </View>
                        </View>

                        <View style={styles.fxRight}>
                          {ranked ? (
                            <View
                              style={[
                                styles.rowScoreBox,
                                scoreTone(ranked.breakdown.combinedScore) === "strong"
                                  ? styles.scoreStrong
                                  : scoreTone(ranked.breakdown.combinedScore) === "okay"
                                    ? styles.scoreOkay
                                    : styles.scoreWeak,
                              ]}
                            >
                              <Text style={styles.rowScoreValue}>
                                {ranked.breakdown.combinedScore}
                              </Text>
                            </View>
                          ) : null}

                          {leagueFlag ? (
                            <Image source={{ uri: leagueFlag }} style={styles.flag} />
                          ) : null}

                          <Text style={styles.fxLeague} numberOfLines={1}>
                            {leagueName || "League"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.badgeRow}>
                        {certainty === "confirmed" ? (
                          <View style={[styles.badge, styles.badgeConfirmed]}>
                            <Text style={[styles.badgeText, styles.badgeTextConfirmed]}>
                              {certaintyLabel(certainty)}
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.badge, styles.badgeTbc]}>
                            <Text style={[styles.badgeText, styles.badgeTextTbc]}>
                              {certaintyLabel(certainty)}
                            </Text>
                          </View>
                        )}

                        {weekendHint(r?.fixture?.date) ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{weekendHint(r?.fixture?.date)}</Text>
                          </View>
                        ) : null}

                        {ranked ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                              {difficultyLabel(ranked.breakdown.travelDifficulty)} travel
                            </Text>
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
                          <Text
                            style={[
                              styles.selectPillText,
                              selected && styles.selectPillTextActive,
                            ]}
                          >
                            {selected ? "Selected" : "Select"}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {visibleCount < filtered.length ? (
                <Pressable
                  onPress={() => setVisibleCount((n) => n + LOAD_MORE_STEP)}
                  style={styles.moreBtn}
                >
                  <Text style={styles.moreText}>Show more</Text>
                </Pressable>
              ) : null}
            </GlassCard>
          ) : null}

          <Pressable
            onPress={onSave}
            disabled={saving || prefillLoading || !selectedFixture}
            style={[
              styles.saveBtn,
              (!selectedFixture || saving || prefillLoading) && { opacity: 0.55 },
            ]}
          >
            <Text style={styles.saveText}>
              {saving ? "Saving…" : isEditing ? "Update trip" : "Save trip"}
            </Text>
            <Text style={styles.saveSub}>
              {selectedFixture
                ? isEditing
                  ? setAsPrimaryOnSave
                    ? "This match will become the main match for this trip."
                    : "This match will be added to the trip."
                  : "Save the trip now, then move into tickets, travel and stay."
                : "Select a match first"}
            </Text>
          </Pressable>

          {error ? <Text style={styles.err}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  headerSaveBtn: {
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  headerSaveBtnDisabled: {
    opacity: 0.45,
  },

  headerSaveBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  headerCard: {
    padding: theme.spacing.lg,
    borderRadius: 28,
  },

  bigTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: 0.2,
  },

  bigSub: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontWeight: "700",
    lineHeight: 18,
    fontSize: 13,
  },

  heroSummaryWrap: {
    marginTop: 14,
    gap: 10,
  },

  heroSummaryMatch: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 18,
  },

  heroSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  heroSummaryCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  heroSummaryLabel: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  heroSummaryValue: {
    marginTop: 4,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 16,
  },

  capBar: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  capText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 8,
  },

  sectionHint: {
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 18,
  },

  center: {
    paddingVertical: 14,
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
  },

  selectedCard: {
    borderRadius: 24,
  },

  teamRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  crestStack: {
    flexDirection: "row",
    alignItems: "center",
  },

  crest: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  crestFallback: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  selectedTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 17,
  },

  selectedMeta: {
    color: theme.colors.textSecondary,
    marginTop: 6,
    fontWeight: "700",
    fontSize: 13,
  },

  badgeRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  badge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  badgeText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 11,
  },

  badgeTbc: {
    borderColor: "rgba(255,200,0,0.22)",
    backgroundColor: "rgba(255,200,0,0.06)",
  },

  badgeTextTbc: {
    color: "rgba(255,220,140,0.92)",
  },

  badgeConfirmed: {
    borderColor: "rgba(75,158,57,0.35)",
    backgroundColor: "rgba(75,158,57,0.10)",
  },

  badgeTextConfirmed: {
    color: "rgba(140,255,190,0.92)",
  },

  dateInputsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

  dateField: {
    flex: 1,
  },

  dateFieldLabel: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 6,
  },

  dateInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    padding: 12,
    color: theme.colors.text,
    fontWeight: "800",
  },

  tripDateFooterRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  dateHint: {
    flex: 1,
    color: theme.colors.textTertiary,
    fontWeight: "800",
    fontSize: 11,
    lineHeight: 15,
  },

  resetDateBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  resetDateBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  intelTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  intelScoreBox: {
    width: 76,
    height: 76,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  scoreStrong: {
    borderColor: "rgba(75,158,57,0.35)",
    backgroundColor: "rgba(75,158,57,0.10)",
  },

  scoreOkay: {
    borderColor: "rgba(242,201,76,0.28)",
    backgroundColor: "rgba(242,201,76,0.10)",
  },

  scoreWeak: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
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

  intelTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 15,
  },

  intelSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },

  intelSubAlt: {
    marginTop: 4,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
  },

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

  intelPillKicker: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 10,
  },

  intelPillValue: {
    marginTop: 4,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  reasonBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 6,
  },

  reasonTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  reasonText: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  nextStepList: {
    marginTop: 8,
    gap: 10,
  },

  nextStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  nextStepIndex: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(75,158,57,0.14)",
    borderWidth: 1,
    borderColor: "rgba(75,158,57,0.30)",
  },

  nextStepIndexText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 11,
  },

  nextStepRowText: {
    flex: 1,
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 18,
  },

  nearbyList: {
    marginTop: 8,
    gap: 10,
  },

  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },

  nearbyTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
  },

  nearbyMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
  },

  primaryRow: {
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

  primaryTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  primarySub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 11,
    lineHeight: 14,
  },

  infoBar: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  infoText: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  infoTextStrong: {
    fontWeight: "900",
    color: theme.colors.text,
  },

  notesToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  notesToggleText: {
    color: theme.colors.accent,
    fontWeight: "900",
    fontSize: 12,
  },

  notes: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    padding: 12,
    color: theme.colors.text,
    minHeight: 84,
    textAlignVertical: "top",
    ...(Platform.OS === "ios" ? { paddingTop: 12 } : null),
  },

  notesPreview: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 18,
  },

  notesEmpty: {
    marginTop: 8,
    color: theme.colors.textTertiary,
    fontWeight: "700",
    fontSize: 12,
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

  leaguePillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  leaguePillText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
  },

  leaguePillTextActive: {
    color: theme.colors.text,
  },

  search: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    padding: 12,
    color: theme.colors.text,
  },

  fxCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  fxCardSelected: {
    borderColor: "rgba(75,158,57,0.55)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  fxTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },

  fxLeft: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  fxRight: {
    width: 96,
    alignItems: "flex-end",
  },

  flag: {
    width: 22,
    height: 14,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginTop: 6,
  },

  fxLeague: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 11,
    textAlign: "right",
  },

  rowScoreBox: {
    minWidth: 34,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  rowScoreValue: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  fxTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 15,
  },

  fxMeta: {
    color: theme.colors.textSecondary,
    marginTop: 5,
    fontWeight: "800",
    fontSize: 12,
  },

  fxMeta2: {
    color: theme.colors.textTertiary,
    marginTop: 4,
    fontWeight: "800",
    fontSize: 12,
  },

  fxFlowMeta: {
    color: theme.colors.textTertiary,
    marginTop: 6,
    fontWeight: "900",
    fontSize: 11,
  },

  rowReasonBox: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.14)",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  rowReasonText: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 11,
    lineHeight: 15,
  },

  fxSelectRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  selectPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 7,
    paddingHorizontal: 12,
  },

  selectPillActive: {
    borderColor: "rgba(75,158,57,0.55)",
    backgroundColor: "rgba(75,158,57,0.10)",
  },

  selectPillText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
  },

  selectPillTextActive: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  moreBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },

  moreText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  saveBtn: {
    marginTop: 2,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(75,158,57,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
  },

  saveText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 15,
  },

  saveSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 11,
    textAlign: "center",
    paddingHorizontal: 18,
  },

  err: {
    marginTop: 10,
    color: "rgba(255,80,80,0.95)",
    fontWeight: "900",
  },
});
