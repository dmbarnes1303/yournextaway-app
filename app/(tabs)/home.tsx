// app/(tabs)/home.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Platform,
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

import {
  LEAGUES,
  getRollingWindowIso,
  type LeagueOption,
} from "@/src/constants/football";

import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import cityGuides from "@/src/data/cityGuides/cityGuides";
import { normalizeCityKey } from "@/src/utils/city";

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

type SearchHit =
  | { type: "city"; key: string; name: string; country?: string }
  | { type: "team"; key: string; name: string; leagueLabel?: string }
  | { type: "country"; key: string; name: string; leagueId?: number; leagueLabel?: string }
  | { type: "venue"; key: string; name: string };

function uniqBy<T>(items: T[], keyFn: (t: T) => string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const k = keyFn(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

/**
 * V1 country->league mapping. Brutally simple:
 * If you want “country search” to be useful in V1, you need a deterministic route.
 * Expand later (multiple leagues per country, competitions, cups, etc).
 */
const COUNTRY_TO_LEAGUE: Array<{ country: string; leagueId: number; label: string }> = [
  { country: "england", leagueId: 39, label: "Premier League" },
  { country: "spain", leagueId: 140, label: "La Liga" },
  { country: "italy", leagueId: 135, label: "Serie A" },
  { country: "germany", leagueId: 78, label: "Bundesliga" },
  { country: "france", leagueId: 61, label: "Ligue 1" },
];

function guessCountryHit(qNorm: string): SearchHit[] {
  if (!qNorm) return [];
  const hits = COUNTRY_TO_LEAGUE
    .filter((c) => c.country.includes(qNorm))
    .slice(0, 5)
    .map((c) => ({
      type: "country" as const,
      key: `country:${c.country}`,
      name: c.country[0].toUpperCase() + c.country.slice(1),
      leagueId: c.leagueId,
      leagueLabel: c.label,
    }));
  return hits;
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

  const upcomingTrips = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    return trips
      .map((t) => {
        const d = t.startDate ? new Date(`${t.startDate}T00:00:00`) : null;
        return { t, d: d && !Number.isNaN(d.getTime()) ? d : null };
      })
      .filter((x): x is { t: Trip; d: Date } => !!x.d)
      .filter((x) => x.d.getTime() > today.getTime())
      .sort((a, b) => a.d.getTime() - b.d.getTime())
      .map((x) => x.t);
  }, [trips]);

  const nextTrip = useMemo(() => upcomingTrips[0] ?? null, [upcomingTrips]);
  const topTrips = useMemo(() => trips.slice(0, 3), [trips]);

  // Fixtures for previews + team/venue search (V1)
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
  const qNorm = useMemo(() => q.trim().toLowerCase(), [q]);
  const showSearchResults = qNorm.length > 0;

  /**
   * City search = authoritative from registry (works even if fixtures don’t include it).
   */
  const cityResults = useMemo<SearchHit[]>(() => {
    if (!qNorm) return [];
    const entries = Object.entries(cityGuides);
    const hits = entries
      .map(([key, g]) => {
        const n = norm(g.name);
        const c = norm((g as any).country);
        const id = norm((g as any).cityId) || key;
        const k = norm(key);
        const ok = n.includes(qNorm) || c.includes(qNorm) || id.includes(qNorm) || k.includes(qNorm);
        if (!ok) return null;
        return { type: "city" as const, key, name: g.name, country: (g as any).country };
      })
      .filter(Boolean) as SearchHit[];
    return hits.slice(0, 6);
  }, [qNorm]);

  /**
   * Team search = derived from currently loaded fixtures (V1 pragmatic).
   * This is why “club” works for you today. We keep it, but make it deterministic and clickable.
   */
  const teamResults = useMemo<SearchHit[]>(() => {
    if (!qNorm) return [];
    const teams = fxRows.flatMap((r) => [
      { name: String(r?.teams?.home?.name ?? "").trim() },
      { name: String(r?.teams?.away?.name ?? "").trim() },
    ]);
    const hits = teams
      .map((t) => t.name)
      .filter(Boolean)
      .filter((name) => norm(name).includes(qNorm))
      .slice(0, 30)
      .map((name) => ({
        type: "team" as const,
        key: `team:${norm(name)}`,
        name,
        leagueLabel: league.label,
      }));
    return uniqBy(hits, (h) => h.key).slice(0, 6);
  }, [fxRows, qNorm, league.label]);

  /**
   * Venue search = derived from fixtures (stadiums).
   */
  const venueResults = useMemo<SearchHit[]>(() => {
    if (!qNorm) return [];
    const venues = fxRows
      .map((r) => String(r?.fixture?.venue?.name ?? "").trim())
      .filter(Boolean)
      .filter((v) => norm(v).includes(qNorm))
      .map((v) => ({ type: "venue" as const, key: `venue:${norm(v)}`, name: v }));
    return uniqBy(venues, (h) => h.key).slice(0, 6);
  }, [fxRows, qNorm]);

  /**
   * Country search = lightweight mapping (V1).
   * If it hits, we take them to Fixtures pre-filtered by the mapped league.
   */
  const countryResults = useMemo<SearchHit[]>(() => {
    if (!qNorm) return [];
    return guessCountryHit(qNorm);
  }, [qNorm]);

  /**
   * Matches (actual fixtures) = still useful.
   */
  const matchResults = useMemo(() => {
    if (!qNorm) return [];
    const res = fxRows.filter((r) => {
      const home = norm(r?.teams?.home?.name);
      const away = norm(r?.teams?.away?.name);
      const venue = norm(r?.fixture?.venue?.name);
      const city = norm(r?.fixture?.venue?.city);
      return home.includes(qNorm) || away.includes(qNorm) || venue.includes(qNorm) || city.includes(qNorm);
    });
    return res.slice(0, 6);
  }, [fxRows, qNorm]);

  const tripResults = useMemo(() => {
    if (!qNorm) return [];
    const res = trips.filter((t) => {
      const city = norm(t.cityId);
      const notes = norm(t.notes);
      return city.includes(qNorm) || notes.includes(qNorm);
    });
    return res.slice(0, 4);
  }, [trips, qNorm]);

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

  // NOTE: adjust these routes if your actual route files differ
  function goCity(cityKey: string) {
    router.push({ pathname: "/city/[id]", params: { id: cityKey } } as any);
  }

  function goTeam(teamName: string) {
    router.push({ pathname: "/team/[id]", params: { id: normalizeCityKey(teamName) } } as any);
  }

  function goFixturesForLeagueId(leagueId?: number) {
    const l = leagueId ? LEAGUES.find((x) => x.leagueId === leagueId) : null;
    const useLeague = l ?? league;

    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        leagueId: String(useLeague.leagueId),
        season: String(useLeague.season),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }

  return (
    <Background imageUrl={getBackground("home")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* HERO */}
          <GlassCard style={styles.heroCard} intensity={26}>
            <Text style={styles.heroKicker}>PLAN • FLY • WATCH • REPEAT</Text>
            <Text style={styles.heroTitle}>Build European Football Trips Your Way.</Text>

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
                <Text style={styles.heroHint}>Tip: Try “London”, “Madrid”, “Anfield”, or a team name.</Text>
              ) : null}
            </View>

            {showSearchResults ? (
              <View style={styles.searchResults}>
                {/* CITIES */}
                <View>
                  <Text style={styles.searchSectionTitle}>Cities</Text>

                  {cityResults.length === 0 ? <Text style={styles.searchEmpty}>No city guides found.</Text> : null}

                  {cityResults.length > 0 ? (
                    <View style={styles.resultList}>
                      {cityResults.map((h) => (
                        <Pressable key={h.key} onPress={() => goCity(h.key)} style={styles.row}>
                          <Text style={styles.rowTitle}>{h.name}</Text>
                          <Text style={styles.rowMeta}>{h.country ? h.country : "City guide"}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* TEAMS */}
                <View>
                  <Text style={styles.searchSectionTitle}>Teams</Text>

                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Searching teams…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && teamResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No team matches in this league window.</Text>
                  ) : null}

                  {!fxLoading && teamResults.length > 0 ? (
                    <View style={styles.resultList}>
                      {teamResults.map((h) => (
                        <Pressable key={h.key} onPress={() => goTeam(h.name)} style={styles.row}>
                          <Text style={styles.rowTitle}>{h.name}</Text>
                          <Text style={styles.rowMeta}>{h.leagueLabel ? `From ${h.leagueLabel}` : "Team guide"}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* COUNTRIES */}
                <View>
                  <Text style={styles.searchSectionTitle}>Countries</Text>

                  {countryResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No country shortcuts found.</Text>
                  ) : null}

                  {countryResults.length > 0 ? (
                    <View style={styles.resultList}>
                      {countryResults.map((h) => (
                        <View key={h.key} style={styles.resultRow}>
                          <Pressable onPress={() => goFixturesForLeagueId((h as any).leagueId)} style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>{h.name}</Text>
                            <Text style={styles.rowMeta}>
                              {(h as any).leagueLabel ? `Open fixtures: ${(h as any).leagueLabel}` : "Open fixtures"}
                            </Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* VENUES */}
                <View>
                  <Text style={styles.searchSectionTitle}>Venues</Text>

                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Searching venues…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && venueResults.length === 0 ? <Text style={styles.searchEmpty}>No venues found.</Text> : null}

                  {!fxLoading && venueResults.length > 0 ? (
                    <View style={styles.resultList}>
                      {venueResults.map((h) => (
                        <View key={h.key} style={styles.resultRow}>
                          <Pressable onPress={() => goFixturesForLeagueId()} style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>{h.name}</Text>
                            <Text style={styles.rowMeta}>Open fixtures and filter by venue</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* MATCHES */}
                <View>
                  <Text style={styles.searchSectionTitle}>Matches</Text>

                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Searching fixtures…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && fxError ? <EmptyState title="Fixtures unavailable" message={fxError} /> : null}

                  {!fxLoading && !fxError && matchResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No matches found.</Text>
                  ) : null}

                  {!fxLoading && !fxError && matchResults.length > 0 ? (
                    <View style={styles.resultList}>
                      {matchResults.map((r, idx) => {
                        const id = r?.fixture?.id;
                        const fixtureId = id ? String(id) : null;
                        const line = fixtureLine(r);

                        return (
                          <View key={fixtureId ?? `m-${idx}`} style={styles.resultRow}>
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
                              style={[styles.planPill, !fixtureId && { opacity: 0.5 }]}
                            >
                              <Text style={styles.planPillText}>Plan trip</Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}

                  <Pressable onPress={() => goFixturesForLeagueId()} style={styles.linkBtn}>
                    <Text style={styles.linkText}>Open Fixtures</Text>
                  </Pressable>
                </View>

                {/* TRIPS */}
                <View>
                  <Text style={styles.searchSectionTitle}>Trips</Text>

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
              <Text style={styles.btnPrimaryMeta}>Select a fixture → set dates → save</Text>
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
                          <Text style={styles.planBtnText}>Plan Trip</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <Pressable onPress={() => goFixturesForLeagueId()} style={styles.linkBtn}>
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

  resultList: { marginTop: 8, gap: 10 },
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
