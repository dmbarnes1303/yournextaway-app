// app/(tabs)/home.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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

import {
  buildSearchIndex,
  searchAll,
  type SearchResult,
  type TeamResult,
  type CityResult,
  type CountryResult,
  type LeagueResult,
  type VenueResult,
  type MatchResult,
} from "@/src/services/searchIndex";

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

function isAfterToday(iso: string, todayMidnight: Date): boolean {
  const d = iso ? parseIsoDateOnly(iso) : null;
  if (!d) return false;
  return d.getTime() > todayMidnight.getTime();
}

export default function HomeScreen() {
  const router = useRouter();

  const [league, setLeague] = useState<LeagueOption>(LEAGUES[0]);

  // Central rolling window (single source of truth) — tomorrow onwards
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
      .filter((t) => !!t.startDate)
      .filter((t) => isAfterToday(String(t.startDate), todayMidnight))
      .sort((a, b) => {
        const da = parseIsoDateOnly(String(a.startDate))?.getTime() ?? 0;
        const db = parseIsoDateOnly(String(b.startDate))?.getTime() ?? 0;
        return da - db;
      });
  }, [trips, todayMidnight]);

  const nextTrip = useMemo(() => upcomingTrips[0] ?? null, [upcomingTrips]);
  const topTrips = useMemo(() => trips.slice(0, 3), [trips]);

  // Fixtures (used for fixtures preview AND as the data source for search index)
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

  // Search
  const [q, setQ] = useState("");
  const qNorm = useMemo(() => q.trim(), [q]);
  const showSearchResults = qNorm.length > 0;

  const searchIndex = useMemo(() => buildSearchIndex(fxRows), [fxRows]);
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!qNorm) return [];
    return searchAll(searchIndex, qNorm, {
      maxTeams: 6,
      maxCities: 6,
      maxStatic: 6,
      maxVenues: 6,
      maxMatches: 6,
    });
  }, [searchIndex, qNorm]);

  // Split results by kind for sectioned UI
  const byKind = useMemo(() => {
    const teams: TeamResult[] = [];
    const cities: CityResult[] = [];
    const countries: CountryResult[] = [];
    const leagues: LeagueResult[] = [];
    const venues: VenueResult[] = [];
    const matches: MatchResult[] = [];

    for (const r of searchResults) {
      if (r.kind === "team") teams.push(r);
      else if (r.kind === "city") cities.push(r);
      else if (r.kind === "country") countries.push(r);
      else if (r.kind === "league") leagues.push(r);
      else if (r.kind === "venue") venues.push(r);
      else if (r.kind === "match") matches.push(r);
    }

    return { teams, cities, countries, leagues, venues, matches };
  }, [searchResults]);

  const tripsCountLabel = useMemo(() => {
    if (!loadedTrips) return "—";
    return `${trips.length} trip${trips.length === 1 ? "" : "s"}`;
  }, [loadedTrips, trips.length]);

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

  function openFixturesWithLeague(leagueId: number, season: number) {
    router.push({
      pathname: "/(tabs)/fixtures",
      params: { leagueId: String(leagueId), season: String(season), from: fromIso, to: toIso },
    } as any);
  }

  function onPressSearchResult(r: SearchResult) {
    Keyboard.dismiss();

    if (r.kind === "team") {
      router.push({ pathname: "/team/[slug]", params: { slug: r.teamKey } } as any);
      return;
    }

    if (r.kind === "city") {
      router.push({ pathname: "/city/[slug]", params: { slug: r.cityKey } } as any);
      return;
    }

    if (r.kind === "country") {
      if (r.leagueId && r.season) {
        openFixturesWithLeague(r.leagueId, r.season);
      } else {
        router.push({ pathname: "/(tabs)/fixtures", params: { from: fromIso, to: toIso } } as any);
      }
      return;
    }

    if (r.kind === "league") {
      openFixturesWithLeague(r.leagueId, r.season);
      return;
    }

    if (r.kind === "venue") {
      // V1: venue routes to fixtures (we don't have a venue guide yet)
      router.push({
        pathname: "/(tabs)/fixtures",
        params: { leagueId: String(league.leagueId), season: String(league.season), from: fromIso, to: toIso },
      } as any);
      return;
    }

    if (r.kind === "match") {
      router.push({ pathname: "/match/[id]", params: { id: r.fixtureId } } as any);
      return;
    }
  }

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* HERO */}
          <GlassCard style={styles.heroCard} intensity={26}>
            <Text style={styles.heroKicker}>PLAN • STAY • WATCH • REPEAT</Text>
            <Text style={styles.heroTitle}>Build match-led mini breaks.</Text>

            <View style={styles.heroSearchWrap}>
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search a country, city, club, venue…"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.heroSearch}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {!showSearchResults ? (
                <Text style={styles.heroHint}>Try “Austria”, “Madrid”, “Arsenal”, or a stadium name.</Text>
              ) : null}
            </View>

            {showSearchResults ? (
              <View style={styles.searchResults}>
                {/* Teams */}
                <View>
                  <Text style={styles.searchSectionTitle}>Teams</Text>
                  {byKind.teams.length === 0 ? (
                    <Text style={styles.searchEmpty}>No teams found.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {byKind.teams.map((t) => (
                        <Pressable key={t.key} onPress={() => onPressSearchResult(t)} style={styles.row}>
                          <Text style={styles.rowTitle}>{t.title}</Text>
                          <Text style={styles.rowMeta}>{t.subtitle}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Cities */}
                <View>
                  <Text style={styles.searchSectionTitle}>Cities</Text>
                  {byKind.cities.length === 0 ? (
                    <Text style={styles.searchEmpty}>No cities found.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {byKind.cities.map((c) => (
                        <Pressable key={c.key} onPress={() => onPressSearchResult(c)} style={styles.row}>
                          <Text style={styles.rowTitle}>{c.title}</Text>
                          <Text style={styles.rowMeta}>{c.subtitle}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Country / League */}
                <View>
                  <Text style={styles.searchSectionTitle}>Countries & leagues</Text>
                  {byKind.countries.length === 0 && byKind.leagues.length === 0 ? (
                    <Text style={styles.searchEmpty}>No country/league matches.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {byKind.countries.map((c) => (
                        <Pressable key={c.key} onPress={() => onPressSearchResult(c)} style={styles.row}>
                          <Text style={styles.rowTitle}>{c.title}</Text>
                          <Text style={styles.rowMeta}>{c.subtitle}</Text>
                        </Pressable>
                      ))}
                      {byKind.leagues.map((l) => (
                        <Pressable key={l.key} onPress={() => onPressSearchResult(l)} style={styles.row}>
                          <Text style={styles.rowTitle}>{l.title}</Text>
                          <Text style={styles.rowMeta}>{l.subtitle}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Venues */}
                <View>
                  <Text style={styles.searchSectionTitle}>Venues</Text>
                  {byKind.venues.length === 0 ? (
                    <Text style={styles.searchEmpty}>No venues found.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {byKind.venues.map((v) => (
                        <Pressable key={v.key} onPress={() => onPressSearchResult(v)} style={styles.row}>
                          <Text style={styles.rowTitle}>{v.title}</Text>
                          <Text style={styles.rowMeta}>{v.subtitle}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Matches */}
                <View>
                  <Text style={styles.searchSectionTitle}>Matches</Text>

                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Searching fixtures…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && fxError ? <EmptyState title="Fixtures unavailable" message={fxError} /> : null}

                  {!fxLoading && !fxError && byKind.matches.length === 0 ? (
                    <Text style={styles.searchEmpty}>No matches found.</Text>
                  ) : null}

                  {!fxLoading && !fxError && byKind.matches.length > 0 ? (
                    <View style={styles.resultList}>
                      {byKind.matches.map((m) => (
                        <View key={m.key} style={styles.resultRow}>
                          <Pressable onPress={() => onPressSearchResult(m)} style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>{m.title}</Text>
                            <Text style={styles.rowMeta}>{m.subtitle}</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => goBuildTripWithContext(m.fixtureId)}
                            style={styles.planPill}
                            hitSlop={6}
                          >
                            <Text style={styles.planPillText}>Plan</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/fixtures",
                        params: {
                          leagueId: String(league.leagueId),
                          season: String(league.season),
                          from: fromIso,
                          to: toIso,
                        },
                      } as any)
                    }
                    style={styles.linkBtn}
                  >
                    <Text style={styles.linkText}>Open Fixtures</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </GlassCard>

          {/* QUICK ACTIONS */}
          <GlassCard style={styles.quickCard} intensity={24}>
            <Text style={styles.quickTitle}>Quick actions</Text>
            <Text style={styles.quickSub}>
              {league.label} • {formatUkDateOnly(fromIso)} → {formatUkDateOnly(toIso)} • {tripsCountLabel}
            </Text>

            <Pressable onPress={() => goBuildTripWithContext()} style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnPrimaryText}>Build Trip</Text>
              <Text style={styles.btnPrimaryMeta}>Select a match → set dates → save</Text>
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
            <GlassCard style={styles.card} intensity={22}>
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
            <SectionHeader
              title="Next fixtures"
              subtitle={`${league.label} • ${formatUkDateOnly(fromIso)} → ${formatUkDateOnly(toIso)}`}
            />
            <GlassCard style={styles.card} intensity={22}>
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
                <View style={styles.list}>
                  {fxPreview.map((r, idx) => {
                    const id = r?.fixture?.id;
                    const fixtureId = id ? String(id) : null;
                    const line = fixtureLine(r);

                    return (
                      <View key={fixtureId ?? `fx-${idx}`} style={styles.fixtureCardRow}>
                        <Pressable
                          onPress={() =>
                            fixtureId ? router.push({ pathname: "/match/[id]", params: { id: fixtureId } }) : null
                          }
                          style={{ flex: 1 }}
                        >
                          <Text style={styles.rowTitle}>{line.title}</Text>
                          <Text style={styles.rowMeta}>{line.meta}</Text>
                        </Pressable>

                        <Pressable
                          disabled={!fixtureId}
                          onPress={() => (fixtureId ? goBuildTripWithContext(fixtureId) : null)}
                          style={[styles.planBtn, !fixtureId && { opacity: 0.5 }]}
                        >
                          <Text style={styles.planBtnText}>Plan</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/fixtures",
                    params: {
                      leagueId: String(league.leagueId),
                      season: String(league.season),
                      from: fromIso,
                      to: toIso,
                    },
                  } as any)
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
            <GlassCard style={styles.card} intensity={22}>
              {!loadedTrips ? <EmptyState title="Loading trips" message="One moment…" /> : null}

              {loadedTrips && trips.length === 0 ? (
                <EmptyState title="No trips yet" message="Build your first trip in under a minute." />
              ) : null}

              {loadedTrips && nextTrip ? (
                <Pressable
                  onPress={() => router.push({ pathname: "/trip/[id]", params: { id: nextTrip.id } })}
                  style={styles.nextTrip}
                >
                  <Text style={styles.nextTripKicker}>Next up</Text>
                  <Text style={styles.nextTripTitle}>{nextTrip.cityId || "Trip"}</Text>
                  <Text style={styles.nextTripMeta}>{tripSummaryLine(nextTrip)}</Text>
                </Pressable>
              ) : null}

              {loadedTrips && trips.length > 0 ? (
                <View style={[styles.list, { marginTop: 10 }]}>
                  {topTrips.map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => router.push({ pathname: "/trip/[id]", params: { id: t.id } })}
                      style={styles.row}
                    >
                      <Text style={styles.rowTitle}>{t.cityId || "Trip"}</Text>
                      <Text style={styles.rowMeta}>{tripSummaryLine(t)}</Text>
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

  muted: { marginTop: 8, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  center: { paddingVertical: 12, alignItems: "center", gap: 10 },

  list: { marginTop: 10, gap: 10 },

  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowTitle: { color: theme.colors.text, fontWeight: "800", fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  linkBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  linkText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  /* HERO */
  heroCard: { marginTop: theme.spacing.lg },
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

  heroSearchWrap: { marginTop: 12 },
  heroSearch: {
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.28)",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
  },
  heroHint: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },

  searchResults: { marginTop: 14, gap: 16 },
  searchSectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
    marginBottom: 6,
  },
  searchEmpty: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginTop: 6 },

  resultList: { marginTop: 8 },
  resultRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  planPill: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  planPillText: { color: theme.colors.text, fontSize: theme.fontSize.xs, fontWeight: "900" },

  /* QUICK ACTIONS */
  quickCard: {},
  quickTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  quickSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },

  btn: { borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  btnPrimary: {
    marginTop: 12,
    paddingVertical: 14,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  btnPrimaryMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: "700",
  },

  quickRow: { marginTop: 10, flexDirection: "row", gap: 10 },
  btnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  btnSecondaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  /* LEAGUES */
  leagueWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  leaguePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  leaguePillActive: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.30)" },
  leaguePillText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "700" },
  leaguePillTextActive: { color: theme.colors.text, fontWeight: "900" },

  /* FIXTURES */
  fixtureCardRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  planBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  planBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  /* NEXT TRIP */
  nextTrip: {
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.35)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  nextTripKicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  nextTripTitle: { marginTop: 6, color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: "900" },
  nextTripMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
});
