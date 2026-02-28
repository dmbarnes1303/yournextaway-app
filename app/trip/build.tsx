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
  const m = now.getMonth();
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
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
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

/* -------------------------------------------------------------------------- */
/* screen                                                                      */
/* -------------------------------------------------------------------------- */

export default function TripBuildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const routeTripId = useMemo(() => paramString((params as any)?.tripId), [params]);
  const routeFixtureId = useMemo(() => paramString((params as any)?.fixtureId), [params]);

  const isEditing = !!routeTripId;
  const isPrefilledFlow = !!routeFixtureId && !isEditing;

  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [placeholderTbcIds, setPlaceholderTbcIds] = useState<Set<string>>(new Set());
  const [selectedFixture, setSelectedFixture] = useState<FixtureListRow | null>(null);

  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(14);

  const [startIso, setStartIso] = useState(clampFromIsoToTomorrow(new Date().toISOString().slice(0, 10)));
  const [endIso, setEndIso] = useState(addDaysIso(startIso, 2));
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  /* ------------------------------------------------------------------ */
  /* Prefill selected fixture                                           */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!routeFixtureId) return;

    let cancelled = false;

    (async () => {
      try {
        const fx = await getFixtureById(routeFixtureId);
        if (cancelled) return;

        setSelectedFixture(fx);

        const ids = await computePlaceholderIdsForFixture(fx);
        if (!cancelled) setPlaceholderTbcIds(ids);

        const d0 = fixtureDateOnly(fx);
        if (d0) {
          const start = clampFromIsoToTomorrow(d0);
          setStartIso(start);
          setEndIso(addDaysIso(start, 2));
        }

        const lid = fx?.league?.id ?? null;
        const opt = findLeagueOptionByLeagueId(typeof lid === "number" ? lid : null);
        if (opt) setSelectedLeague(opt);
      } catch {
        if (!cancelled) setError("Couldn’t load that fixture.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeFixtureId]);

  /* ------------------------------------------------------------------ */
  /* Load fixtures list                                                 */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (isPrefilledFlow) return;

    let cancelled = false;

    (async () => {
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
          setRows(res);
        }
      } catch {
        if (!cancelled) setError("Failed to load fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedLeague, isPrefilledFlow]);

  /* ------------------------------------------------------------------ */
  /* Save trip                                                          */
  /* ------------------------------------------------------------------ */

  const onSave = useCallback(async () => {
    if (!selectedFixture?.fixture?.id) {
      setError("Select a match first.");
      return;
    }

    setSaving(true);
    setError(null);

    const snap = buildTripSnapshot(selectedFixture, placeholderTbcIds);

    try {
      if (!tripsStore.getState().loaded) await tripsStore.loadTrips();

      const patch: any = {
        cityId: snap.cityId,
        startDate: startIso,
        endDate: endIso,
        matchIds: [snap.fixtureIdPrimary],
        fixtureIdPrimary: snap.fixtureIdPrimary,
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

      const t = await tripsStore.addTrip(patch);
      router.replace({ pathname: "/trip/[id]", params: { id: t.id } } as any);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }, [selectedFixture, placeholderTbcIds, startIso, endIso, notes, router]);

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const h = String(r?.teams?.home?.name ?? "").toLowerCase();
      const a = String(r?.teams?.away?.name ?? "").toLowerCase();
      const c = String(r?.fixture?.venue?.city ?? "").toLowerCase();
      return h.includes(q) || a.includes(q) || c.includes(q);
    });
  }, [rows, search]);

  const visibleRows = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.86}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Plan trip",
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
        >
          {loading && (
            <GlassCard>
              <ActivityIndicator />
              <Text style={{ color: theme.colors.textSecondary }}>Loading fixtures…</Text>
            </GlassCard>
          )}

          {!loading && (
            <GlassCard>
              <Text style={{ fontWeight: "900", color: theme.colors.text }}>Pick a match</Text>

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search team / city"
                placeholderTextColor={theme.colors.textSecondary}
                style={{
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 12,
                  padding: 12,
                  color: theme.colors.text,
                }}
              />

              {visibleRows.map((r) => {
                const id = fixtureIdStr(r);
                const selected = fixtureIdStr(selectedFixture) === id;
                const home = r?.teams?.home?.name;
                const away = r?.teams?.away?.name;

                return (
                  <Pressable
                    key={id}
                    onPress={() => setSelectedFixture(r)}
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                    }}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: "900" }}>
                      {home} vs {away}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary }}>
                      {formatUkDateTimeMaybe(r?.fixture?.date) || "Kickoff TBC"}
                    </Text>
                  </Pressable>
                );
              })}
            </GlassCard>
          )}

          <Pressable
            onPress={onSave}
            disabled={!selectedFixture || saving}
            style={{
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.primary,
              alignItems: "center",
              opacity: !selectedFixture || saving ? 0.6 : 1,
            }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: "900" }}>
              {saving ? "Saving…" : "Save trip"}
            </Text>
          </Pressable>

          {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}
