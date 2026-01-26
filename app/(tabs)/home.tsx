// app/(tabs)/home.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

import { LEAGUES, getRollingWindowIso, parseIsoDateOnly, toIsoDate, type LeagueOption } from "@/src/constants/football";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

import { buildSearchIndex, querySearchIndex, type SearchResult } from "@/src/services/searchIndex";
import { getCityGuide } from "@/src/data/cityGuides";
import { hasTeamGuide } from "@/src/data/teamGuides";

function tripSummaryLine(t: Trip) {
  const a = formatUkDateOnly(t.startDate);
  const b = formatUkDateOnly(t.endDate);
  const n = t.matchIds?.length ?? 0;
  return `${a} → ${b} • ${n} match${n === 1 ? "" : "es"}`;
}

function fixtureLine(r: FixtureListRow) {
  const home = r?.teams?.home?.name ?? "Home";
  const away = r?.teams?.away?.name ?? "Away";
  const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
  const venue = r?.fixture?.venue?.name ?? "";
  const city = r?.fixture?.venue?.city ?? "";
  const extra = [venue, city].filter(Boolean).join(" • ");
  return {
    title: `${home} vs ${away}`,
    meta: extra ? `${kickoff} • ${extra}` : kickoff,
  };
}

function splitSearchBuckets(results: SearchResult[]) {
  const teams: SearchResult[] = [];
  const cities: SearchResult[] = [];
  const venues: SearchResult[] = [];
  const countries: SearchResult[] = [];
  const leagues: SearchResult[] = [];

  for (const r of results) {
    if (r.type === "team") teams.push(r);
    else if (r.type === "city") cities.push(r);
    else if (r.type === "venue") venues.push(r);
    else if (r.type === "country") countries.push(r);
    else if (r.type === "league") leagues.push(r);
  }

  return { teams, cities, venues, countries, leagues };
}

export default function HomeScreen() {
  const router = useRouter();
  const [league, setLeague] = useState<LeagueOption>(LEAGUES[0]);

  // Central rolling window (tomorrow onwards; per football.ts)
  const { from: fromIso, to: toIso } = useMemo(() => getRollingWindowIso(), []);

  // Trips
  const [loadedTrips, setLoadedTrips] = useState(tripsStore.getState().loaded);
  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoadedTrips(s.loaded);
      setTrips(s.trips);
    });
    if (!tripsStore.getState().loaded) tripsStore.loadTrips();
    return unsub;
  }, []);

  const todayMidnight = useMemo(() => {
    const iso = toIsoDate(new Date());
    return parseIsoDateOnly(iso) ?? new Date();
  }, []);

  const upcomingTrips = useMemo(() => {
    return trips
      .map((t) => ({ t, d: t.startDate ? parseIsoDateOnly(t.startDate) : null }))
      .filter((x): x is { t: Trip; d: Date } => !!x.d)
      .filter((x) => x.d.getTime() > todayMidnight.getTime())
      .sort((a, b) => a.d.getTime() - b.d.getTime())
      .map((x) => x.t);
  }, [trips, todayMidnight]);

  const nextTrip = useMemo(() => upcomingTrips[0] ?? null, [upcomingTrips]);
  const topTrips = useMemo(() => trips.slice(0, 3), [trips]);

  // Fixtures (for preview + match search)
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxRows, setFxRows] = useState<FixtureListRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setFxLoading(true);
      setFxError(null);
      setFxRows([]);

      try {
        const rows = await getFixtures({
          league: league.leagueId,
          season: league.season,
          from: fromIso,
          to: toIso,
        });

        if (cancelled) return;
        setFxRows(Array.isArray(rows) ? rows : []);
      } catch (e: any) {
        if (cancelled) return;
        setFxError(e?.message ?? "Failed to load fixtures.");
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [league, fromIso, toIso]);

  const fxPreview = useMemo(() => fxRows.slice(0, 6), [fxRows]);

  // -------------------------
  // SEARCH (powerful + offline)
  // -------------------------
  const [q, setQ] = useState("");
  const qNorm = useMemo(() => q.trim(), [q]);
  const showSearchResults = qNorm.length > 0;

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchIndexBuiltAt, setSearchIndexBuiltAt] = useState<number>(0);

  const indexRef = useRef<Awaited<ReturnType<typeof buildSearchIndex>> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function build() {
      setSearchLoading(true);
      setSearchError(null);

      try {
        const idx = await buildSearchIndex({ from: fromIso, to: toIso, leagues: LEAGUES });
        if (cancelled) return;

        indexRef.current = idx;
        setSearchIndexBuiltAt(idx.builtAt);
      } catch (e: any) {
        if (cancelled) return;
        setSearchError(e?.message ?? "Search index failed to build.");
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }

    build();
    return () => {
      cancelled = true;
    };
  }, [fromIso, toIso]);

  const rawSearchResults = useMemo(() => {
    const idx = indexRef.current;
    if (!idx) return [];
    if (!qNorm) return [];
    return querySearchIndex(idx, qNorm, { limit: 30 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qNorm, searchIndexBuiltAt]);

  const buckets = useMemo(() => splitSearchBuckets(rawSearchResults), [rawSearchResults]);

  // Trips “search” stays lightweight (notes + cityId only)
  const tripResults = useMemo(() => {
    const query = qNorm.trim().toLowerCase();
    if (!query) return [];
    const res = trips.filter((t) => {
      const city = String(t.cityId ?? "").toLowerCase();
      const notes = String(t.notes ?? "").toLowerCase();
      return city.includes(query) || notes.includes(query);
    });
    return res.slice(0, 4);
  }, [trips, qNorm]);

  const tripsCountLabel = useMemo(() => {
    if (!loadedTrips) return "—";
    return `${trips.length} trip${trips.length === 1 ? "" : "s"}`;
  }, [loadedTrips, trips.length]);

  const clearSearch = useCallback(() => {
    setQ("");
    Keyboard.dismiss();
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  function goBuildTripWithContext(fixtureId?: string) {
    router.push({
      pathname: "/trip/build",
      params: {
        ...(fixtureId ? { fixtureId } : {}),
        leagueId: String(league.leagueId),
        season: String(league.season),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }

  function goMatchWithContext(fixtureId: string) {
    router.push({
      pathname: "/match/[id]",
      params: {
        id: fixtureId,
        leagueId: String(league.leagueId),
        season: String(league.season),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }

  function goFixturesWithContext(params?: { leagueId?: number; season?: number; venue?: string }) {
    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        leagueId: String(params?.leagueId ?? league.leagueId),
        season: String(params?.season ?? league.season),
        from: fromIso,
        to: toIso,
        ...(params?.venue ? { venue: params.venue } : {}),
      },
    } as any);
  }

  function onPressSearchResult(r: SearchResult) {
    const p: any = r.payload;

    if (p?.kind === "team") {
      router.push({
        pathname: "/team/[slug]",
        params: { slug: p.slug, from: fromIso, to: toIso },
      } as any);
      return;
    }

    if (p?.kind === "city") {
      router.push({
        pathname: "/city/[slug]",
        params: { slug: p.slug, from: fromIso, to: toIso },
      } as any);
      return;
    }

    if (p?.kind === "venue") {
      const venueName = String(r.title ?? "").trim();
      goFixturesWithContext({
        leagueId: league.leagueId,
        season: league.season,
        venue: venueName || String(p.slug ?? "").trim(),
      });
      return;
    }

    if (p?.kind === "country") {
      goFixturesWithContext({ leagueId: p.leagueId, season: p.season });
      return;
    }

    if (p?.kind === "league") {
      goFixturesWithContext({ leagueId: p.leagueId, season: p.season });
      return;
    }
  }

  function resultMeta(r: SearchResult): string {
    const p: any = r.payload;

    if (r.type === "team" && p?.kind === "team") {
      const exists = hasTeamGuide(p.slug);
      return exists ? "Team guide available" : "Team guide (link-out for now)";
    }

    if (r.type === "city" && p?.kind === "city") {
      const guide = getCityGuide(p.slug);
      return guide ? "City guide available" : "City guide (link-out for now)";
    }

    if (r.type === "venue") return r.subtitle ?? "Venue";
    if (r.type === "country") return r.subtitle ?? "Country";
    if (r.type === "league") return r.subtitle ?? "League";

    return r.subtitle ?? "";
  }

  const matchHits = useMemo(() => {
    const query = qNorm.trim().toLowerCase();
    if (!query) return [];

    return fxRows
      .filter((r) => {
        const home = String(r?.teams?.home?.name ?? "").toLowerCase();
        const away = String(r?.teams?.away?.name ?? "").toLowerCase();
        const venue = String(r?.fixture?.venue?.name ?? "").toLowerCase();
        const city = String(r?.fixture?.venue?.city ?? "").toLowerCase();
        return home.includes(query) || away.includes(query) || venue.includes(query) || city.includes(query);
      })
      .slice(0, 6);
  }, [fxRows, qNorm]);

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* HERO */}
          <GlassCard style={styles.heroCard} strength="strong">
            <Text style={styles.heroKicker}>PLAN • FLY • WATCH • REPEAT</Text>

            <Text style={styles.heroTitle}>Plan a football-first city break.</Text>

            <Text style={styles.heroSub}>
              Search clubs, cities, venues, countries, or leagues — then jump straight into fixtures or build a trip.
            </Text>

            <View style={styles.searchBox}>
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search a country, city, club, venue…"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={dismissKeyboard}
              />

              {qNorm.length > 0 ? (
                <Pressable onPress={clearSearch} style={styles.clearBtn} hitSlop={10}>
                  <Text style={styles.clearBtnText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>

            {qNorm.length === 0 ? (
              <Text style={styles.heroHint}>Try “Austria”, “Madrid”, “Arsenal”, or a stadium name.</Text>
            ) : null}

            {/* SEARCH RESULTS */}
            {showSearchResults ? (
              <View style={styles.searchResults}>
                {/* Teams & Cities */}
                <View>
                  <View style={styles.searchHeaderRow}>
                    <Text style={styles.searchSectionTitle}>Teams & Cities</Text>
                    <Text style={styles.searchSectionMeta}>Tap to open</Text>
                  </View>

                  {searchLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Building search…</Text>
                    </View>
                  ) : null}

                  {!searchLoading && searchError ? <EmptyState title="Search unavailable" message={searchError} /> : null}

                  {!searchLoading && !searchError && buckets.teams.length === 0 && buckets.cities.length === 0 ? (
                    <Text style={styles.searchEmpty}>No teams or cities found.</Text>
                  ) : null}

                  {!searchLoading && !searchError && (buckets.teams.length > 0 || buckets.cities.length > 0) ? (
                    <View style={styles.resultList}>
                      {[...buckets.teams.slice(0, 6), ...buckets.cities.slice(0, 6)]
                        .slice(0, 10)
                        .map((r, idx) => (
                          <Pressable key={`${r.key}-${idx}`} onPress={() => onPressSearchResult(r)} style={styles.rowPress}>
                            <GlassCard strength="subtle" noPadding style={styles.rowCard}>
                              <View style={styles.rowInner}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.rowTitle}>{r.title}</Text>
                                  <Text style={styles.rowMeta}>{resultMeta(r)}</Text>
                                </View>
                                <Text style={styles.chev}>›</Text>
                              </View>
                            </GlassCard>
                          </Pressable>
                        ))}
                    </View>
                  ) : null}
                </View>

                {/* Venues / Countries / Leagues */}
                <View>
                  <View style={styles.searchHeaderRow}>
                    <Text style={styles.searchSectionTitle}>Venues, Countries & Leagues</Text>
                    <Text style={styles.searchSectionMeta}>Routes to Fixtures</Text>
                  </View>

                  {!searchLoading &&
                  !searchError &&
                  buckets.venues.length === 0 &&
                  buckets.countries.length === 0 &&
                  buckets.leagues.length === 0 ? (
                    <Text style={styles.searchEmpty}>No venues/countries/leagues found.</Text>
                  ) : null}

                  {!searchLoading && !searchError ? (
                    <View style={styles.resultList}>
                      {[...buckets.venues.slice(0, 5), ...buckets.countries.slice(0, 5), ...buckets.leagues.slice(0, 5)]
                        .slice(0, 10)
                        .map((r, idx) => (
                          <Pressable key={`${r.key}-${idx}`} onPress={() => onPressSearchResult(r)} style={styles.rowPress}>
                            <GlassCard strength="subtle" noPadding style={styles.rowCard}>
                              <View style={styles.rowInner}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.rowTitle}>{r.title}</Text>
                                  <Text style={styles.rowMeta}>{resultMeta(r)}</Text>
                                </View>
                                <Text style={styles.chev}>›</Text>
                              </View>
                            </GlassCard>
                          </Pressable>
                        ))}
                    </View>
                  ) : null}

                  <Pressable onPress={() => goFixturesWithContext()} style={styles.linkBtn}>
                    <Text style={styles.linkText}>Open Fixtures</Text>
                  </Pressable>
                </View>

                {/* Matches */}
                <View>
                  <View style={styles.searchHeaderRow}>
                    <Text style={styles.searchSectionTitle}>Matches</Text>
                    <Text style={styles.searchSectionMeta}>
                      {league.label} • {formatUkDateOnly(fromIso)} → {formatUkDateOnly(toIso)}
                    </Text>
                  </View>

                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Loading fixtures…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && fxError ? <EmptyState title="Fixtures unavailable" message={fxError} /> : null}

                  {!fxLoading && !fxError && fxRows.length === 0 ? (
                    <Text style={styles.searchEmpty}>No fixtures loaded.</Text>
                  ) : null}

                  {!fxLoading && !fxError && matchHits.length === 0 ? (
                    <Text style={styles.searchEmpty}>No matches found for that query.</Text>
                  ) : null}

                  {!fxLoading && !fxError && matchHits.length > 0 ? (
                    <View style={styles.matchList}>
                      {matchHits.map((r, idx) => {
                        const id = r?.fixture?.id;
                        const fixtureId = id ? String(id) : null;
                        const line = fixtureLine(r);

                        return (
                          <GlassCard key={fixtureId ?? `m-${idx}`} strength="subtle" style={styles.matchCard}>
                            <Pressable
                              onPress={() => (fixtureId ? goMatchWithContext(fixtureId) : null)}
                              disabled={!fixtureId}
                              style={{ paddingHorizontal: 2 }}
                            >
                              <Text style={styles.rowTitle}>{line.title}</Text>
                              <Text style={styles.rowMeta}>{line.meta}</Text>
                            </Pressable>

                            <View style={styles.matchActions}>
                              <Pressable
                                onPress={() => (fixtureId ? goMatchWithContext(fixtureId) : null)}
                                disabled={!fixtureId}
                                style={[styles.smallActionBtn, styles.smallActionGhost, !fixtureId && styles.disabled]}
                              >
                                <Text style={styles.smallActionGhostText}>View match</Text>
                              </Pressable>

                              <Pressable
                                onPress={() => (fixtureId ? goBuildTripWithContext(fixtureId) : null)}
                                disabled={!fixtureId}
                                style={[styles.smallActionBtn, styles.smallActionPrimary, !fixtureId && styles.disabled]}
                              >
                                <Text style={styles.smallActionPrimaryText}>Plan trip</Text>
                              </Pressable>
                            </View>
                          </GlassCard>
                        );
                      })}
                    </View>
                  ) : null}
                </View>

                {/* Trips */}
                <View>
                  <View style={styles.searchHeaderRow}>
                    <Text style={styles.searchSectionTitle}>Trips</Text>
                    <Text style={styles.searchSectionMeta}>Your saved plans</Text>
                  </View>

                  {!loadedTrips ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Searching trips…</Text>
                    </View>
                  ) : null}

                  {loadedTrips && tripResults.length === 0 ? <Text style={styles.searchEmpty}>No trips found.</Text> : null}

                  {loadedTrips && tripResults.length > 0 ? (
                    <View style={styles.resultList}>
                      {tripResults.map((t) => (
                        <Pressable
                          key={t.id}
                          onPress={() => router.push({ pathname: "/trip/[id]", params: { id: t.id } })}
                          style={styles.rowPress}
                        >
                          <GlassCard strength="subtle" noPadding style={styles.rowCard}>
                            <View style={styles.rowInner}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.rowTitle}>{t.cityId || "Trip"}</Text>
                                <Text style={styles.rowMeta}>{tripSummaryLine(t)}</Text>
                              </View>
                              <Text style={styles.chev}>›</Text>
                            </View>
                          </GlassCard>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  <Pressable onPress={() => router.push("/(tabs)/trips")} style={styles.linkBtn}>
                    <Text style={styles.linkText}>Open Trips</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </GlassCard>

          {/* QUICK ACTIONS */}
          <GlassCard style={styles.quickCard} strength="default">
            <Text style={styles.quickTitle}>Quick actions</Text>
            <Text style={styles.quickSub}>
              {league.label} • {formatUkDateOnly(fromIso)} → {formatUkDateOnly(toIso)} • {tripsCountLabel}
            </Text>

            <Pressable onPress={() => goBuildTripWithContext()} style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnPrimaryText}>Build Trip</Text>
              <Text style={styles.btnPrimaryMeta}>Pick a fixture, set dates, save</Text>
            </Pressable>

            <View style={styles.quickRow}>
              <Pressable onPress={() => router.push("/(tabs)/fixtures")} style={[styles.btn, styles.btnSecondary]}>
                <Text style={styles.btnSecondaryText}>Fixtures</Text>
              </Pressable>

              <Pressable onPress={() => router.push("/(tabs)/trips")} style={[styles.btn, styles.btnSecondary]}>
                <Text style={styles.btnSecondaryText}>Trips</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* TOP LEAGUES */}
          <View style={styles.section}>
            <SectionHeader title="Top leagues" subtitle="Pick a league for your next fixtures" />
            <GlassCard style={styles.card} strength="default">
              <View style={styles.leagueWrap}>
                {LEAGUES.map((l) => {
                  const active = l.leagueId === league.leagueId;
                  return (
                    <Pressable
                      key={l.leagueId}
                      onPress={() => setLeague(l)}
                      style={[styles.leaguePill, active && styles.leaguePillActive]}
                    >
                      <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>{l.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </GlassCard>
          </View>

          {/* NEXT FIXTURES */}
          <View style={styles.section}>
            <SectionHeader title="Next fixtures" subtitle={`${league.label} • ${formatUkDateOnly(fromIso)} → ${formatUkDateOnly(toIso)}`} />
            <GlassCard style={styles.card} strength="default">
              {fxLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading fixtures…</Text>
                </View>
              ) : null}

              {!fxLoading && fxError ? <EmptyState title="Couldn’t load fixtures" message={fxError} /> : null}

              {!fxLoading && !fxError && fxRows.length === 0 ? (
                <EmptyState title="No fixtures found" message="Try another league or try again later." />
              ) : null}

              {!fxLoading && !fxError && fxPreview.length > 0 ? (
                <View style={styles.fixtureList}>
                  {fxPreview.map((r, idx) => {
                    const id = r?.fixture?.id;
                    const fixtureId = id ? String(id) : null;
                    const line = fixtureLine(r);

                    return (
                      <GlassCard key={fixtureId ?? `fx-${idx}`} strength="subtle" style={styles.fixtureCard}>
                        <Pressable
                          onPress={() => (fixtureId ? goMatchWithContext(fixtureId) : null)}
                          disabled={!fixtureId}
                          style={{ paddingHorizontal: 2 }}
                        >
                          <Text style={styles.rowTitle}>{line.title}</Text>
                          <Text style={styles.rowMeta}>{line.meta}</Text>
                        </Pressable>

                        <View style={styles.matchActions}>
                          <Pressable
                            onPress={() => (fixtureId ? goMatchWithContext(fixtureId) : null)}
                            disabled={!fixtureId}
                            style={[styles.smallActionBtn, styles.smallActionGhost, !fixtureId && styles.disabled]}
                          >
                            <Text style={styles.smallActionGhostText}>View match</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => (fixtureId ? goBuildTripWithContext(fixtureId) : null)}
                            disabled={!fixtureId}
                            style={[styles.smallActionBtn, styles.smallActionPrimary, !fixtureId && styles.disabled]}
                          >
                            <Text style={styles.smallActionPrimaryText}>Plan trip</Text>
                          </Pressable>
                        </View>
                      </GlassCard>
                    );
                  })}
                </View>
              ) : null}

              <Pressable
                onPress={() =>
                  goFixturesWithContext({
                    leagueId: league.leagueId,
                    season: league.season,
                  })
                }
                style={styles.linkBtn}
              >
                <Text style={styles.linkText}>See all fixtures</Text>
              </Pressable>
            </GlassCard>
          </View>

          {/* YOUR TRIPS */}
          <View style={styles.section}>
            <SectionHeader title="Your trips" subtitle="Your saved plans" />
            <GlassCard style={styles.card} strength="default">
              {!loadedTrips ? <EmptyState title="Loading trips" message="One moment…" /> : null}

              {loadedTrips && trips.length === 0 ? <EmptyState title="No trips yet" message="Build your first trip in under a minute." /> : null}

              {loadedTrips && nextTrip ? (
                <Pressable onPress={() => router.push({ pathname: "/trip/[id]", params: { id: nextTrip.id } })} style={styles.nextTripPress}>
                  <GlassCard strength="subtle" style={styles.nextTripCard}>
                    <Text style={styles.nextTripKicker}>Next up</Text>
                    <Text style={styles.nextTripTitle}>{nextTrip.cityId || "Trip"}</Text>
                    <Text style={styles.nextTripMeta}>{tripSummaryLine(nextTrip)}</Text>
                  </GlassCard>
                </Pressable>
              ) : null}

              {loadedTrips && trips.length > 0 ? (
                <View style={[styles.resultList, { marginTop: 10 }]}>
                  {topTrips.map((t) => (
                    <Pressable key={t.id} onPress={() => router.push({ pathname: "/trip/[id]", params: { id: t.id } })} style={styles.rowPress}>
                      <GlassCard strength="subtle" noPadding style={styles.rowCard}>
                        <View style={styles.rowInner}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>{t.cityId || "Trip"}</Text>
                            <Text style={styles.rowMeta}>{tripSummaryLine(t)}</Text>
                          </View>
                          <Text style={styles.chev}>›</Text>
                        </View>
                      </GlassCard>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Pressable onPress={() => router.push("/(tabs)/trips")} style={styles.linkBtn}>
                <Text style={styles.linkText}>Open Trips</Text>
              </Pressable>
            </GlassCard>
          </View>

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  section: { marginTop: 2 },
  card: { padding: theme.spacing.md },

  muted: { marginTop: 8, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: "700" },
  center: { paddingVertical: 14, alignItems: "center", gap: 10 },

  /* HERO */
  heroCard: { marginTop: theme.spacing.lg, padding: theme.spacing.md },
  heroKicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroTitle: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
    lineHeight: 30,
  },
  heroSub: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 19,
    fontWeight: "700",
  },

  searchBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.glass.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    paddingVertical: Platform.OS === "ios" ? 6 : 4,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  clearBtnText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.xs },

  heroHint: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "700",
  },

  /* SEARCH RESULTS */
  searchResults: { marginTop: 14, gap: 16 },
  searchHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
  searchSectionTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  searchSectionMeta: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: theme.fontSize.xs },
  searchEmpty: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginTop: 8, fontWeight: "700" },

  resultList: { marginTop: 10, gap: 10 },

  rowPress: { borderRadius: 16 },
  rowCard: { borderRadius: 16 },
  rowInner: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  rowTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },
  chev: { color: theme.colors.textSecondary, fontSize: 24, marginTop: -2 },

  matchList: { marginTop: 10, gap: 10 },
  matchCard: { padding: theme.spacing.md, gap: 10 },

  matchActions: { flexDirection: "row", gap: 10 },
  smallActionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  smallActionPrimary: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  smallActionPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  smallActionGhost: {
    borderColor: theme.glass.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  smallActionGhostText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.sm },

  disabled: { opacity: 0.55 },

  /* LINK BUTTON */
  linkBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    alignItems: "center",
  },
  linkText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  /* QUICK ACTIONS */
  quickCard: { padding: theme.spacing.md },
  quickTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  quickSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: "700",
  },

  btn: { borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  btnPrimary: {
    marginTop: 12,
    paddingVertical: 14,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  btnPrimaryMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "800" },

  quickRow: { marginTop: 10, flexDirection: "row", gap: 10 },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderColor: theme.glass.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnSecondaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  /* LEAGUES */
  leagueWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  leaguePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.glass.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  leaguePillActive: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  leaguePillText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "800" },
  leaguePillTextActive: { color: theme.colors.text, fontWeight: "900" },

  /* FIXTURES */
  fixtureList: { marginTop: 10, gap: 10 },
  fixtureCard: { padding: theme.spacing.md, gap: 10 },

  /* NEXT TRIP */
  nextTripPress: { borderRadius: 16 },
  nextTripCard: { padding: theme.spacing.md },
  nextTripKicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  nextTripTitle: { marginTop: 6, color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "900" },
  nextTripMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },
});
