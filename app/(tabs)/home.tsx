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
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

import {
  LEAGUES,
  getRollingWindowIso,
  parseIsoDateOnly,
  toIsoDate,
  type LeagueOption,
} from "@/src/constants/football";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

import {
  buildSearchIndex,
  querySearchIndex,
  type SearchResult,
} from "@/src/services/searchIndex";
import { hasTeamGuide } from "@/src/data/teamGuides";
import { getCityGuide } from "@/src/data/cityGuides";
import { getFlagEmoji } from "@/src/utils/flags";

function tripSummaryLine(t: Trip) {
  const a = t.startDate ? formatUkDateOnly(t.startDate) : "—";
  const b = t.endDate ? formatUkDateOnly(t.endDate) : "—";
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

type CityChip = { name: string; countryCode: string };

export default function HomeScreen() {
  const router = useRouter();

  // Context league (kept for fixture preview + deep links)
  const [league, setLeague] = useState<LeagueOption>(LEAGUES[0]);

  // Central rolling window (default now 90 days, from football.ts)
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
      .filter((x) => x.d.getTime() >= todayMidnight.getTime())
      .sort((a, b) => a.d.getTime() - b.d.getTime())
      .map((x) => x.t);
  }, [trips, todayMidnight]);

  const nextTrip = useMemo(() => upcomingTrips[0] ?? null, [upcomingTrips]);

  // Fixtures preview
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

  const fxPreview = useMemo(() => fxRows.slice(0, 4), [fxRows]);

  // -------------------------
  // SEARCH (offline index)
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
    return querySearchIndex(idx, qNorm, { limit: 24 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qNorm, searchIndexBuiltAt]);

  const buckets = useMemo(() => splitSearchBuckets(rawSearchResults), [rawSearchResults]);

  const clearSearch = useCallback(() => {
    setQ("");
    Keyboard.dismiss();
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // -------------------------
  // Navigation helpers
  // -------------------------
  const goBuildTripWithContext = useCallback(
    (fixtureId?: string) => {
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
    },
    [router, league.leagueId, league.season, fromIso, toIso]
  );

  const goMatchWithContext = useCallback(
    (fixtureId: string) => {
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
    },
    [router, league.leagueId, league.season, fromIso, toIso]
  );

  const goFixturesWithContext = useCallback(
    (params?: { leagueId?: number; season?: number; venue?: string }) => {
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
    },
    [router, league.leagueId, league.season, fromIso, toIso]
  );

  const onPressSearchResult = useCallback(
    (r: SearchResult) => {
      const p: any = r.payload;

      if (p?.kind === "team") {
        router.push({
          pathname: "/team/[teamKey]",
          params: { teamKey: p.slug, from: fromIso, to: toIso },
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
    },
    [router, fromIso, toIso, goFixturesWithContext, league.leagueId, league.season]
  );

  const resultMeta = useCallback((r: SearchResult): string => {
    const p: any = r.payload;

    if (r.type === "team" && p?.kind === "team") {
      return hasTeamGuide(p.slug) ? "Team guide available" : "Team guide coming soon";
    }

    if (r.type === "city" && p?.kind === "city") {
      return getCityGuide(p.slug) ? "City guide available" : "City guide coming soon";
    }

    if (r.type === "venue") return r.subtitle ?? "Venue";
    if (r.type === "country") return r.subtitle ?? "Country";
    if (r.type === "league") return r.subtitle ?? "League";

    return r.subtitle ?? "";
  }, []);

  // Popular city chips now include explicit country codes for flags
  const popularCityChips = useMemo<CityChip[]>(
    () => [
      { name: "Madrid", countryCode: "ES" },
      { name: "Barcelona", countryCode: "ES" },
      { name: "Milan", countryCode: "IT" },
      { name: "Lisbon", countryCode: "PT" },
      { name: "Amsterdam", countryCode: "NL" },
      { name: "Berlin", countryCode: "DE" },
    ],
    []
  );

  const inspiration = useMemo(
    () => [
      { title: "Weekend trips that just work", sub: "Low-stress planning across Europe" },
      { title: "Pick a match, build the break", sub: "Dates, stay, transport — in one hub" },
      { title: "Shortlist cities fast", sub: "Search by team, city, stadium, or country" },
    ],
    []
  );

  return (
    <Background imageSource={getBackground("home")} overlayOpacity={0.74}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <GlassCard style={styles.heroCard} strength="strong" noPadding>
            <View style={styles.heroShell}>
              {/* Brand edge accents */}
              <View pointerEvents="none" style={styles.heroEdgeLeft} />
              <View pointerEvents="none" style={styles.heroEdgeTop} />
              <View pointerEvents="none" style={styles.heroGoldDot} />

              {/* Orb killer mask (keeps transparency but removes ugly bokeh circle) */}
              <View pointerEvents="none" style={styles.heroOrbMask} />
              <View pointerEvents="none" style={styles.heroOrbMask2} />

              {/* Header meta */}
              <View style={styles.heroMetaRow}>
                <View style={styles.brandDot} />
                <Text style={styles.heroBrand}>YOURNEXTAWAY</Text>
                <Text style={styles.heroSep}>•</Text>
                <Text style={styles.heroMetaText}>
                  Rolling window: {formatUkDateOnly(fromIso)} → {formatUkDateOnly(toIso)}
                </Text>
              </View>

              <Text style={styles.heroTitle}>Plan your next European football trip</Text>

              <Text style={styles.heroSub}>
                Search countries, cities, teams, or venues — then jump into fixtures or build a trip.
              </Text>

              <View style={styles.searchBox}>
                <View style={styles.searchIcon} />
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="Search country, city, team, or venue"
                  placeholderTextColor={theme.colors.textTertiary}
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
                ) : (
                  <View style={styles.euPill} pointerEvents="none">
                    <Text style={styles.euPillText}>EU</Text>
                  </View>
                )}
              </View>

              {/* Popular city chips (quick-fill search) */}
              {!showSearchResults ? (
                <View style={styles.chipsRow}>
                  {popularCityChips.map((c) => {
                    const flag = getFlagEmoji(c.countryCode);
                    return (
                      <Pressable key={c.name} onPress={() => setQ(c.name)} style={styles.chip}>
                        <Text style={styles.chipText}>
                          {flag} {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {/* SEARCH RESULTS */}
              {showSearchResults ? (
                <View style={styles.searchResults}>
                  {searchLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Preparing search…</Text>
                    </View>
                  ) : null}

                  {!searchLoading && searchError ? (
                    <EmptyState title="Search unavailable" message={searchError} />
                  ) : null}

                  {!searchLoading && !searchError ? (
                    <>
                      {/* Teams & Cities */}
                      <View style={styles.group}>
                        <View style={styles.groupHeader}>
                          <Text style={styles.groupTitle}>Teams & Cities</Text>
                          <Text style={styles.groupMeta}>Tap to open</Text>
                        </View>

                        {buckets.teams.length === 0 && buckets.cities.length === 0 ? (
                          <Text style={styles.groupEmpty}>No teams or cities found.</Text>
                        ) : (
                          <View style={styles.resultList}>
                            {[...buckets.teams.slice(0, 6), ...buckets.cities.slice(0, 6)]
                              .slice(0, 10)
                              .map((r, idx) => (
                                <Pressable
                                  key={`${r.key}-${idx}`}
                                  onPress={() => onPressSearchResult(r)}
                                  style={styles.rowPress}
                                >
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
                        )}
                      </View>

                      {/* Venues / Countries / Leagues */}
                      <View style={styles.group}>
                        <View style={styles.groupHeader}>
                          <Text style={styles.groupTitle}>Venues, Countries & Leagues</Text>
                          <Text style={styles.groupMeta}>Routes to Fixtures</Text>
                        </View>

                        {buckets.venues.length === 0 &&
                        buckets.countries.length === 0 &&
                        buckets.leagues.length === 0 ? (
                          <Text style={styles.groupEmpty}>No venues/countries/leagues found.</Text>
                        ) : (
                          <View style={styles.resultList}>
                            {[...buckets.venues.slice(0, 5), ...buckets.countries.slice(0, 5), ...buckets.leagues.slice(0, 5)]
                              .slice(0, 10)
                              .map((r, idx) => (
                                <Pressable
                                  key={`${r.key}-${idx}`}
                                  onPress={() => onPressSearchResult(r)}
                                  style={styles.rowPress}
                                >
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
                        )}

                        <Pressable onPress={() => goFixturesWithContext()} style={styles.linkBtn}>
                          <Text style={styles.linkText}>Open Fixtures</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : null}
                </View>
              ) : null}
            </View>
          </GlassCard>

          {/* UPCOMING MATCHES */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming matches</Text>
              <Text style={styles.sectionMeta}>
                {league.label} • {formatUkDateOnly(fromIso)} → {formatUkDateOnly(toIso)}
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
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
            </ScrollView>

            <GlassCard style={styles.card} strength="default">
              {fxLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading fixtures…</Text>
                </View>
              ) : null}

              {!fxLoading && fxError ? <EmptyState title="Fixtures unavailable" message={fxError} /> : null}

              {!fxLoading && !fxError && fxPreview.length === 0 ? (
                <EmptyState title="No fixtures found" message="Try another league or try again later." />
              ) : null}

              {!fxLoading && !fxError && fxPreview.length > 0 ? (
                <View style={styles.matchList}>
                  {fxPreview.map((r, idx) => {
                    const id = r?.fixture?.id;
                    const fixtureId = id ? String(id) : null;
                    const line = fixtureLine(r);

                    return (
                      <Pressable
                        key={fixtureId ?? `fx-${idx}`}
                        onPress={() => (fixtureId ? goMatchWithContext(fixtureId) : null)}
                        disabled={!fixtureId}
                        style={styles.matchRowPress}
                      >
                        <GlassCard strength="subtle" noPadding style={styles.matchRowCard}>
                          <View style={styles.matchRowInner}>
                            <View style={styles.thumb} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.matchTitle}>{line.title}</Text>
                              <Text style={styles.matchMeta}>{line.meta}</Text>
                            </View>
                            <Text style={styles.chev}>›</Text>
                          </View>
                        </GlassCard>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <View style={styles.ctaRow}>
                <Pressable onPress={() => goFixturesWithContext()} style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnGhostText}>Fixtures</Text>
                </Pressable>

                <Pressable onPress={() => goBuildTripWithContext()} style={[styles.btn, styles.btnPrimary]}>
                  <Text style={styles.btnPrimaryText}>Build trip</Text>
                </Pressable>
              </View>
            </GlassCard>
          </View>

          {/* NEXT TRIP */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trips</Text>
              <Text style={styles.sectionMeta}>Your next plan</Text>
            </View>

            <GlassCard style={styles.card} strength="default">
              {!loadedTrips ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading trips…</Text>
                </View>
              ) : null}

              {loadedTrips && !nextTrip ? (
                <>
                  <Text style={styles.emptyTitle}>No trips yet</Text>
                  <Text style={styles.emptyMeta}>Start with a fixture, then build the break in one hub.</Text>

                  <View style={styles.ctaRow}>
                    <Pressable onPress={() => goFixturesWithContext()} style={[styles.btn, styles.btnGhost]}>
                      <Text style={styles.btnGhostText}>Browse fixtures</Text>
                    </Pressable>

                    <Pressable onPress={() => goBuildTripWithContext()} style={[styles.btn, styles.btnPrimary]}>
                      <Text style={styles.btnPrimaryText}>Build trip</Text>
                    </Pressable>
                  </View>
                </>
              ) : null}

              {loadedTrips && nextTrip ? (
                <Pressable
                  onPress={() => router.push({ pathname: "/trip/[id]", params: { id: nextTrip.id } } as any)}
                  style={styles.nextTripPress}
                >
                  <GlassCard strength="subtle" noPadding style={styles.nextTripCard}>
                    <View style={styles.nextTripInner}>
                      <Text style={styles.nextTripKicker}>Next up</Text>
                      <Text style={styles.nextTripTitle}>{nextTrip.cityId || "Trip"}</Text>
                      <Text style={styles.nextTripMeta}>{tripSummaryLine(nextTrip)}</Text>
                    </View>
                  </GlassCard>
                </Pressable>
              ) : null}

              <Pressable onPress={() => router.push("/(tabs)/trips")} style={styles.linkBtn}>
                <Text style={styles.linkText}>Open Trips</Text>
              </Pressable>
            </GlassCard>
          </View>

          {/* INSPIRATION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Inspiration</Text>
              <Text style={styles.sectionMeta}>Editorial shortcuts</Text>
            </View>

            <View style={styles.inspoList}>
              {inspiration.map((x) => (
                <Pressable key={x.title} onPress={() => goFixturesWithContext()} style={styles.inspoPress}>
                  <GlassCard strength="default" noPadding style={styles.inspoCard}>
                    <View style={styles.inspoInner}>
                      <Text style={styles.inspoTitle}>{x.title}</Text>
                      <Text style={styles.inspoSub}>{x.sub}</Text>
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
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

  // HERO
  heroCard: { marginTop: theme.spacing.lg, borderRadius: theme.borderRadius.xl },
  heroShell: { padding: theme.spacing.lg, borderRadius: theme.borderRadius.xl, overflow: "hidden" },

  // Brand edges
  heroEdgeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "rgba(79,224,138,0.65)",
  },
  heroEdgeTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    backgroundColor: "rgba(47,107,255,0.35)",
  },
  heroGoldDot: {
    position: "absolute",
    left: 12,
    top: 12,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(214,181,106,0.78)",
  },

  /**
   * Orb killer:
   * These two layers subtly darken the top-right quadrant
   * so any bright bokeh circle in home.png doesn’t scream through.
   * Keeps the rest transparent.
   */
  heroOrbMask: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(15,17,19,0.68)",
  },
  heroOrbMask2: {
    position: "absolute",
    right: -90,
    top: -90,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(15,17,19,0.38)",
  },

  heroMetaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(79,224,138,0.85)",
  },
  heroBrand: {
    color: "rgba(242,244,246,0.78)",
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.2,
  },
  heroSep: { color: "rgba(214,181,106,0.70)", fontSize: 12, fontWeight: theme.fontWeight.black },
  heroMetaText: {
    color: "rgba(242,244,246,0.52)",
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  heroTitle: {
    marginTop: 10,
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: theme.fontWeight.black,
    lineHeight: 30,
  },
  heroSub: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: theme.fontWeight.bold,
  },

  searchBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchIcon: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(47,107,255,0.40)",
    opacity: 0.9,
  },

  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 6 : 4,
    fontWeight: theme.fontWeight.bold,
  },

  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.24)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  clearBtnText: {
    color: "rgba(242,244,246,0.72)",
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    letterSpacing: 0.3,
  },

  euPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(214,181,106,0.30)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  euPillText: {
    color: "rgba(214,181,106,0.90)",
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    letterSpacing: 0.6,
  },

  chipsRow: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipText: {
    color: "rgba(242,244,246,0.78)",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  // Sections
  section: { marginTop: 2 },
  sectionHeader: { gap: 4 },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },
  sectionMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  card: { padding: theme.spacing.md },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  // Search results
  searchResults: { marginTop: 14, gap: 16 },
  group: { gap: 10 },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 10,
  },
  groupTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },
  groupMeta: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },
  groupEmpty: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  resultList: { gap: 10 },

  rowPress: { borderRadius: 16 },
  rowCard: { borderRadius: 16 },
  rowInner: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 15 },
  rowMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },
  chev: { color: theme.colors.textTertiary, fontSize: 24, marginTop: -2 },

  // League selector
  leagueRow: { gap: 10, paddingRight: theme.spacing.lg, marginTop: 10 },
  leaguePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  leaguePillActive: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  leaguePillText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },
  leaguePillTextActive: { color: theme.colors.text, fontWeight: theme.fontWeight.black },

  // Match list
  matchList: { marginTop: 10, gap: 10 },
  matchRowPress: { borderRadius: 16 },
  matchRowCard: { borderRadius: 16 },
  matchRowInner: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  matchTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  matchMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  // CTA row
  ctaRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  btnPrimary: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  btnPrimaryText: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },

  btnGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  btnGhostText: { color: theme.colors.textSecondary, fontSize: 15, fontWeight: theme.fontWeight.black },

  // Link button
  linkBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    alignItems: "center",
  },
  linkText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: theme.fontWeight.black },

  // Trips
  emptyTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  emptyMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  nextTripPress: { borderRadius: 16, marginTop: 2 },
  nextTripCard: { borderRadius: 16 },
  nextTripInner: { paddingVertical: 14, paddingHorizontal: 14 },
  nextTripKicker: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },
  nextTripTitle: { marginTop: 6, color: theme.colors.text, fontSize: 18, fontWeight: theme.fontWeight.black },
  nextTripMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },

  // Inspiration
  inspoList: { gap: 10 },
  inspoPress: { borderRadius: 16 },
  inspoCard: { borderRadius: 16 },
  inspoInner: { paddingVertical: 14, paddingHorizontal: 14 },
  inspoTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  inspoSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    lineHeight: 18,
  },
});
