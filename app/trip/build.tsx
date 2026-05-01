import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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

const FREE_TRIP_CAP = 5;
const WINDOW_DAYS = 90;
const LOAD_MORE_STEP = 12;
const NEARBY_FIXTURE_LIMIT = 5;

type RouteParams = {
  tripId: string | null;
  fixtureId: string | null;
  cityArea: string | null;
  from: string | null;
  to: string | null;
  city: string | null;
  leagueId: number | null;
  season: number | null;
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

  return {
    tripId: paramString(params.tripId),
    fixtureId: paramString(params.fixtureId),
    cityArea: paramString(params.cityArea),
    from: paramString(params.from),
    to: paramString(params.to),
    city: paramString(params.city),
    leagueId: paramNumber(params.leagueId),
    season,
  };
}

function fixtureIdStr(r: FixtureListRow | null): string {
  const id = r?.fixture?.id;
  return id != null ? String(id) : "";
}

function fixtureDateOnly(r: FixtureListRow | null): string | null {
  const raw = r?.fixture?.date;
  if (!raw) return null;
  const m = String(raw).match(/^(\d{4}-\d{2}-\d{2})/);
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

function addDaysToIsoDate(iso: string, offset: number): string | null {
  const d = parseIsoToDate(iso);
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

  const rawStart = addDaysToIsoDate(dateOnly, -1);
  const end = addDaysToIsoDate(dateOnly, 1);

  return {
    start: rawStart ? clampFromIsoToTomorrow(rawStart) : null,
    end,
  };
}

function normalizeIsoInput(value: string): string {
  return value.replace(/[^\d-]/g, "").slice(0, 10);
}

function daysBetweenIso(aIso: string, bIso: string): number | null {
  const a = parseIsoToDate(aIso);
  const b = parseIsoToDate(bIso);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatFriendlyIso(iso?: string | null): string {
  const d = parseIsoToDate(iso);
  if (!d) return cleanText(iso) || "TBC";

  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function safeUri(u: unknown): string | null {
  const s = String(u ?? "").trim();
  if (!s || !/^https?:\/\//i.test(s)) return null;
  return s;
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

function findLeagueOptionByLeagueId(
  leagueId?: number | null,
  season?: number | null
): LeagueOption | null {
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

function certaintyLabel(state: FixtureCertaintyState): string {
  if (state === "confirmed") return "Kickoff confirmed";
  if (state === "changed") return "Kickoff changed";
  if (state === "likely_tbc") return "Likely placeholder";
  return "Kickoff TBC";
}

function formatRoundLabel(round?: string | null): string {
  const value = cleanText(round);
  if (!value) return "";

  return value
    .replace(/\bRegular Season\b/gi, "Matchday")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactCompetitionLabel(fx: FixtureListRow | null): string {
  const league = cleanText(fx?.league?.name);
  const round = formatRoundLabel(fx?.league?.round);

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

function buildNearbyFixturesTitle(city: string, startIso: string, endIso: string): string {
  return `Other matches in ${city} • ${formatFriendlyIso(startIso)} → ${formatFriendlyIso(endIso)}`;
}

function PrimaryButton({
  label,
  subLabel,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  subLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryBtn,
        (disabled || loading) && styles.primaryBtnDisabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? <ActivityIndicator color={theme.colors.text} /> : null}
      <Text style={styles.primaryBtnText}>{label}</Text>
      {subLabel ? <Text style={styles.primaryBtnSub}>{subLabel}</Text> : null}
    </Pressable>
  );
}

function PlanTile({
  icon,
  title,
  subtitle,
  status,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  status: string;
}) {
  return (
    <View style={styles.planTile}>
      <View style={styles.planTileIcon}>
        <Ionicons name={icon} size={18} color={theme.colors.emeraldSoft} />
      </View>

      <View style={styles.planTileText}>
        <Text style={styles.planTileTitle}>{title}</Text>
        <Text style={styles.planTileSub}>{subtitle}</Text>
      </View>

      <Text style={styles.planTileStatus}>{status}</Text>
    </View>
  );
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
  const hasExplicitRouteDates = isIsoDateOnly(params.from) || isIsoDateOnly(params.to);

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
  const [hasManualDateOverride, setHasManualDateOverride] = useState<boolean>(
    hasExplicitRouteDates
  );

  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [existingMatchIds, setExistingMatchIds] = useState<string[]>([]);
  const [existingPrimaryId, setExistingPrimaryId] = useState<string | null>(null);
  const [setAsPrimaryOnSave, setSetAsPrimaryOnSave] = useState(false);

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

  const effectiveSeason = useMemo(
    () => validSeasonOrNull(params.season) ?? selectedLeague.season ?? DEFAULT_SEASON,
    [params.season, selectedLeague]
  );

  const setNotesIfEmpty = useCallback((text: string) => {
    const t = cleanText(text);
    if (!t) return;
    setNotes((prev) => (cleanText(prev) ? prev : t));
  }, []);

  useEffect(() => {
    if (params.city) setNotesIfEmpty(`City: ${params.city}`);
  }, [params.city, setNotesIfEmpty]);

  useEffect(() => {
    if (isPrefilledFlow) return;

    const opt = findLeagueOptionByLeagueId(params.leagueId, params.season);
    if (opt) setSelectedLeague(opt);
    else if (params.leagueId === 0) setSelectedLeague(ALL_LEAGUES);
  }, [params.leagueId, params.season, isPrefilledFlow, ALL_LEAGUES]);

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
        setNotes(t.notes ?? "");

        if (hasExplicitRouteDates) {
          setStartIso(routeWindow.from);
          setEndIso(routeWindow.to);
          setHasManualDateOverride(true);
        }

        const loadId = primary || (mids[0] ? String(mids[0]) : "");

        if (loadId) {
          const fx = await getFixtureById(String(loadId));
          if (cancelled) return;

          setSelectedFixture(fx);

          const ids = await computePlaceholderIdsForFixture(fx, params.season);
          if (!cancelled) setPlaceholderTbcIds(ids);

          const opt = findLeagueOptionByLeagueId(
            typeof fx?.league?.id === "number" ? fx.league.id : null,
            params.season
          );

          if (opt) setSelectedLeague(opt);

          if (!hasExplicitRouteDates) {
            const d0 = fixtureDateOnly(fx);
            const derived = defaultTripWindowFromFixtureDate(d0);

            if (derived.start) setStartIso(derived.start);
            if (derived.end) setEndIso(derived.end);
            setHasManualDateOverride(false);
          }
        } else {
          setSelectedFixture(null);
          setPlaceholderTbcIds(new Set());

          if (!hasExplicitRouteDates) {
            setStartIso(t.startDate);
            setEndIso(t.endDate);
            setHasManualDateOverride(true);
          }
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
  }, [params.tripId, params.season, routeWindow, hasExplicitRouteDates]);

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

        if (hasExplicitRouteDates) {
          setStartIso(routeWindow.from);
          setEndIso(routeWindow.to);
          setHasManualDateOverride(true);
        } else {
          const d0 = fixtureDateOnly(r);
          const derived = defaultTripWindowFromFixtureDate(d0);

          if (derived.start) setStartIso(derived.start);
          if (derived.end) setEndIso(derived.end);

          setHasManualDateOverride(false);
        }

        if (params.cityArea) setNotesIfEmpty(`Stay area: ${params.cityArea}`);

        const opt = findLeagueOptionByLeagueId(
          typeof r?.league?.id === "number" ? r.league.id : null,
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
    params.season,
    routeWindow,
    hasExplicitRouteDates,
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

  useEffect(() => {
    if (!selectedFixture) return;
    if (hasManualDateOverride || hasExplicitRouteDates) return;

    const d0 = fixtureDateOnly(selectedFixture);
    const derived = defaultTripWindowFromFixtureDate(d0);

    if (derived.start) setStartIso(derived.start);
    if (derived.end) setEndIso(derived.end);

    if (isEditing) setSetAsPrimaryOnSave(false);
  }, [selectedFixture, hasManualDateOverride, hasExplicitRouteDates, isEditing]);

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
    setEndIso(normalizeIsoInput(value));
  }, []);

  const onResetToFixtureWindow = useCallback(() => {
    if (!selectedFixture) return;

    const d0 = fixtureDateOnly(selectedFixture);
    const derived = defaultTripWindowFromFixtureDate(d0);

    if (derived.start) setStartIso(derived.start);
    if (derived.end) setEndIso(derived.end);

    setHasManualDateOverride(false);
    setError(null);
  }, [selectedFixture]);

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

  const selectedHomeLogo = useMemo(
    () => safeUri(selectedFixture?.teams?.home?.logo),
    [selectedFixture]
  );

  const selectedAwayLogo = useMemo(
    () => safeUri(selectedFixture?.teams?.away?.logo),
    [selectedFixture]
  );

  const selectedFixtureId = useMemo(() => fixtureIdStr(selectedFixture), [selectedFixture]);

  const tripLength = useMemo(() => {
    const d = daysBetweenIso(startIso, endIso);
    if (d == null) return null;

    const nights = Math.max(0, d);
    const days = nights + 1;

    return `${nights} night${nights === 1 ? "" : "s"} • ${days} day${
      days === 1 ? "" : "s"
    }`;
  }, [startIso, endIso]);

  const headerTitle = useMemo(() => (isEditing ? "Edit trip" : "Plan trip"), [isEditing]);

  const isAlreadyInTrip = useMemo(() => {
    if (!isEditing) return false;
    if (!selectedFixtureId) return false;
    return existingMatchIds.includes(String(selectedFixtureId).trim());
  }, [isEditing, selectedFixtureId, existingMatchIds]);

  const showPickerMode = !isPrefilledFlow;

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
        const baseNotes =
          params.cityArea && !cleanText(notes) ? `Stay area: ${params.cityArea}` : cleanText(notes);

        await tripsStore.updateTrip(params.tripId, {
          startDate: startIso,
          endDate: endIso,
          notes: baseNotes || undefined,
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
                pressed && styles.pressed,
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
            paddingTop: 96,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl + insets.bottom,
            gap: theme.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {(loading || prefillLoading) && (
            <GlassCard level="subtle" style={styles.loadingCard}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading trip…</Text>
            </GlassCard>
          )}

          {!prefillLoading && error ? (
            <GlassCard level="subtle">
              <EmptyState title="Problem" message={error} />
            </GlassCard>
          ) : null}

          {!prefillLoading && selectedFixture ? (
            <>
              <GlassCard level="default" style={styles.matchCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.eyebrow}>Selected match</Text>

                  {weekendHint(selectedFixture?.fixture?.date) ? (
                    <View style={styles.softBadge}>
                      <Text style={styles.softBadgeText}>
                        {weekendHint(selectedFixture?.fixture?.date)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.matchMainRow}>
                  <View style={styles.crestStack}>
                    {selectedHomeLogo ? (
                      <Image source={{ uri: selectedHomeLogo }} style={styles.crest} />
                    ) : (
                      <View style={styles.crestFallback} />
                    )}

                    {selectedAwayLogo ? (
                      <Image
                        source={{ uri: selectedAwayLogo }}
                        style={[styles.crest, styles.crestOverlap]}
                      />
                    ) : (
                      <View style={[styles.crestFallback, styles.crestOverlap]} />
                    )}
                  </View>

                  <View style={styles.matchCopy}>
                    <Text style={styles.matchTitle} numberOfLines={2}>
                      {selectedTitle}
                    </Text>
                    <Text style={styles.matchMeta}>{selectedKickLine}</Text>
                    <Text style={styles.matchMeta}>{selectedVenueLine}</Text>
                    <Text style={styles.matchMeta}>{selectedCompetitionLine}</Text>
                  </View>
                </View>

                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      selectedCertainty === "confirmed"
                        ? styles.badgeConfirmed
                        : styles.badgeTbc,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        selectedCertainty === "confirmed"
                          ? styles.badgeTextConfirmed
                          : styles.badgeTextTbc,
                      ]}
                    >
                      {certaintyLabel(selectedCertainty)}
                    </Text>
                  </View>

                  {isEditing ? (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>
                        {isAlreadyInTrip ? "Already in trip" : "Ready to add"}
                      </Text>
                    </View>
                  ) : null}

                  {editTrip && existingPrimaryId && selectedFixtureId === existingPrimaryId ? (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>Main match</Text>
                    </View>
                  ) : null}
                </View>
              </GlassCard>

              <GlassCard level="default" style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.headerCopy}>
                    <Text style={styles.sectionTitle}>Trip dates</Text>
                    <Text style={styles.sectionHint}>
                      Default is 1 day before the match to 1 day after. Edit these dates before
                      adding flights and hotels.
                    </Text>
                  </View>
                </View>

                <View style={styles.dateSummaryRow}>
                  <View style={styles.dateSummaryBox}>
                    <Text style={styles.dateSummaryLabel}>From</Text>
                    <Text style={styles.dateSummaryValue}>{formatFriendlyIso(startIso)}</Text>
                  </View>

                  <View style={styles.dateArrow}>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.textSecondary} />
                  </View>

                  <View style={styles.dateSummaryBox}>
                    <Text style={styles.dateSummaryLabel}>To</Text>
                    <Text style={styles.dateSummaryValue}>{formatFriendlyIso(endIso)}</Text>
                  </View>
                </View>

                <Text style={styles.tripLengthText}>
                  {tripLength ? `Trip length: ${tripLength}` : "Enter valid dates"}
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

                <Pressable onPress={onResetToFixtureWindow} style={styles.resetDateBtn}>
                  <Ionicons name="refresh" size={14} color={theme.colors.text} />
                  <Text style={styles.resetDateBtnText}>Reset to default match window</Text>
                </Pressable>
              </GlassCard>

              <GlassCard level="default" style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Plan this trip</Text>
                <Text style={styles.sectionHint}>
                  Save the trip first, then add the real booking pieces from the trip workspace.
                </Text>

                <View style={styles.planGrid}>
                  <PlanTile
                    icon="ticket-outline"
                    title="Tickets"
                    subtitle="Compare ticket options"
                    status="After save"
                  />
                  <PlanTile
                    icon="airplane-outline"
                    title="Flights"
                    subtitle="Use your trip dates"
                    status="After save"
                  />
                  <PlanTile
                    icon="bed-outline"
                    title="Hotel"
                    subtitle="Stay for the chosen nights"
                    status="After save"
                  />
                  <PlanTile
                    icon="map-outline"
                    title="Things to do"
                    subtitle={`Explore ${selectedCity}`}
                    status="Guide"
                  />
                  <PlanTile
                    icon="wallet-outline"
                    title="Wallet"
                    subtitle="Store bookings later"
                    status="Empty"
                  />
                </View>
              </GlassCard>

              {nearbyLoading || nearbyFixtures.length > 0 ? (
                <GlassCard level="default" style={styles.sectionCard}>
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

                              if (!hasManualDateOverride && !hasExplicitRouteDates) {
                                const d0 = fixtureDateOnly(r);
                                const derived = defaultTripWindowFromFixtureDate(d0);

                                if (derived.start) setStartIso(derived.start);
                                if (derived.end) setEndIso(derived.end);
                              }
                            }}
                            style={({ pressed }) => [styles.nearbyCard, pressed && styles.pressed]}
                          >
                            <View style={styles.nearbyCopy}>
                              <Text style={styles.nearbyTitle} numberOfLines={1}>
                                {home} vs {away}
                              </Text>
                              <Text style={styles.nearbyMeta}>{kick}</Text>
                            </View>

                            <View
                              style={[
                                styles.statusBadge,
                                cert === "confirmed" ? styles.badgeConfirmed : styles.badgeTbc,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
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
                <GlassCard level="default" style={styles.sectionCard}>
                  <View style={styles.primaryMatchRow}>
                    <View style={styles.primaryMatchCopy}>
                      <Text style={styles.sectionTitle}>Main match</Text>
                      <Text style={styles.sectionHint}>
                        Set this match as the headline fixture for the trip.
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => setSetAsPrimaryOnSave((prev) => !prev)}
                      style={[
                        styles.togglePill,
                        setAsPrimaryOnSave && styles.togglePillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.togglePillText,
                          setAsPrimaryOnSave && styles.togglePillTextActive,
                        ]}
                      >
                        {setAsPrimaryOnSave ? "Yes" : "No"}
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              ) : null}

              <GlassCard level="default" style={styles.sectionCard}>
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
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Anything useful to remember for this trip..."
                    placeholderTextColor={theme.colors.textSecondary}
                    style={styles.notes}
                    multiline
                  />
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
            <GlassCard level="default" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {isEditing ? "Add another match" : "Choose your match"}
              </Text>
              <Text style={styles.sectionHint}>
                Pick the fixture this trip should be built around.
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.leaguePillScroll}
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

              <View style={styles.fixtureList}>
                {visibleRows.map((r, i) => {
                  const id = fixtureIdStr(r);
                  const selected = fixtureIdStr(selectedFixture) === id;

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

                        if (!hasManualDateOverride && !hasExplicitRouteDates) {
                          const d0 = fixtureDateOnly(r);
                          const derived = defaultTripWindowFromFixtureDate(d0);

                          if (derived.start) setStartIso(derived.start);
                          if (derived.end) setEndIso(derived.end);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.fxCard,
                        selected && styles.fxCardSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.fxMainRow}>
                        <View style={styles.crestStack}>
                          {homeLogo ? (
                            <Image source={{ uri: homeLogo }} style={styles.crestSm} />
                          ) : (
                            <View style={styles.crestFallbackSm} />
                          )}

                          {awayLogo ? (
                            <Image
                              source={{ uri: awayLogo }}
                              style={[styles.crestSm, styles.crestOverlapSm]}
                            />
                          ) : (
                            <View style={[styles.crestFallbackSm, styles.crestOverlapSm]} />
                          )}
                        </View>

                        <View style={styles.fxCopy}>
                          <Text style={styles.fxTitle} numberOfLines={1}>
                            {home} vs {away}
                          </Text>
                          <Text style={styles.fxMeta} numberOfLines={1}>
                            {kick}
                          </Text>
                          {vc ? (
                            <Text style={styles.fxMetaMuted} numberOfLines={1}>
                              {vc}
                            </Text>
                          ) : null}
                          <Text style={styles.fxMetaMuted} numberOfLines={1}>
                            {leagueName || "League"}
                          </Text>
                        </View>

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

          <PrimaryButton
            label={saving ? "Saving…" : isEditing ? "Update trip" : "Save trip"}
            subLabel={
              selectedFixture
                ? "Then continue to tickets, flights, hotels and wallet."
                : "Select a match first"
            }
            onPress={onSave}
            loading={saving}
            disabled={prefillLoading || !selectedFixture}
          />

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

  loadingCard: {
    padding: 16,
    borderRadius: 22,
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

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  headerCopy: {
    flex: 1,
    gap: 4,
  },

  eyebrow: {
    color: theme.colors.emeraldSoft,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  matchCard: {
    borderRadius: 28,
    padding: 16,
    gap: 14,
  },

  matchMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  crestStack: {
    flexDirection: "row",
    alignItems: "center",
  },

  crest: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  crestOverlap: {
    marginLeft: -12,
  },

  crestFallback: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  matchCopy: {
    flex: 1,
    minWidth: 0,
  },

  matchTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 21,
    lineHeight: 25,
  },

  matchMeta: {
    color: theme.colors.textSecondary,
    marginTop: 6,
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 17,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  softBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  softBadgeText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 11,
  },

  statusBadge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  statusBadgeText: {
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

  sectionCard: {
    borderRadius: 24,
    padding: 16,
    gap: 13,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: theme.colors.text,
  },

  sectionHint: {
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 18,
  },

  dateSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  dateSummaryBox: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.20)",
    padding: 12,
  },

  dateSummaryLabel: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  dateSummaryValue: {
    marginTop: 5,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 15,
  },

  dateArrow: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  tripLengthText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
  },

  dateInputsRow: {
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

  resetDateBtn: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  resetDateBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  planGrid: {
    gap: 10,
  },

  planTile: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  planTileIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(75,158,57,0.12)",
    borderWidth: 1,
    borderColor: "rgba(75,158,57,0.28)",
  },

  planTileText: {
    flex: 1,
    minWidth: 0,
  },

  planTileTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 14,
  },

  planTileSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
  },

  planTileStatus: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
  },

  nearbyList: {
    gap: 10,
  },

  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },

  nearbyCopy: {
    flex: 1,
    minWidth: 0,
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

  primaryMatchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  primaryMatchCopy: {
    flex: 1,
  },

  togglePill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  togglePillActive: {
    borderColor: "rgba(75,158,57,0.45)",
    backgroundColor: "rgba(75,158,57,0.14)",
  },

  togglePillText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
  },

  togglePillTextActive: {
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
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 18,
  },

  notesEmpty: {
    color: theme.colors.textTertiary,
    fontWeight: "700",
    fontSize: 12,
  },

  leaguePillScroll: {
    paddingRight: 12,
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
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    padding: 12,
    color: theme.colors.text,
  },

  fixtureList: {
    gap: 10,
  },

  fxCard: {
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

  fxMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  crestSm: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  crestOverlapSm: {
    marginLeft: -10,
  },

  crestFallbackSm: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  fxCopy: {
    flex: 1,
    minWidth: 0,
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

  fxMetaMuted: {
    color: theme.colors.textTertiary,
    marginTop: 4,
    fontWeight: "800",
    fontSize: 12,
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
  },

  moreBtn: {
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

  primaryBtn: {
    marginTop: 2,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(75,158,57,0.55)",
    backgroundColor: "rgba(75,158,57,0.18)",
    alignItems: "center",
    gap: 6,
  },

  primaryBtnDisabled: {
    opacity: 0.55,
  },

  primaryBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
  },

  primaryBtnSub: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 11,
    textAlign: "center",
  },

  err: {
    marginTop: 10,
    color: "rgba(255,80,80,0.95)",
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
