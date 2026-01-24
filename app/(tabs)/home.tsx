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

import { LEAGUES, getRollingWindowIso, parseIsoDateOnly, toIsoDate, type LeagueOption } from "@/src/constants/football";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

// City guides registry (used for real city search + routing)
import { cityGuides as CITY_GUIDES } from "@/src/data/cityGuides";

function normalizeKey(input: string) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

function normalizeQuery(input: string) {
  return String(input || "").trim().toLowerCase();
}

function includesLoose(haystack: string, needle: string) {
  if (!needle) return false;
  return haystack.includes(needle);
}

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

type SearchResult =
  | { type: "city"; key: string; title: string; subtitle?: string }
  | { type: "team"; key: string; title: string; subtitle?: string }
  | { type: "stadium"; key: string; title: string; subtitle?: string }
  | { type: "league"; league: LeagueOption; title: string; subtitle?: string }
  | { type: "match"; fixtureId: string; title: string; subtitle?: string }
  | { type: "trip"; tripId: string; title: string; subtitle?: string };

export default function HomeScreen() {
  const router = useRouter();

  const [league, setLeague] = useState<LeagueOption>(LEAGUES[0]);

  // Central rolling window (single source of truth) — defaults to TOMORROW onwards
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
      // exclude past + today
      .filter((x) => x.d.getTime() > todayMidnight.getTime())
      .sort((a, b) => a.d.getTime() - b.d.getTime())
      .map((x) => x.t);
  }, [trips, todayMidnight]);

  const nextTrip = useMemo(() => upcomingTrips[0] ?? null, [upcomingTrips]);
  const topTrips = useMemo(() => trips.slice(0, 3), [trips]);

  // Fixtures
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

  // ---- Search: powerful + routes to City / Team / Stadium / Fixtures / Match / Trip ----
  const [q, setQ] = useState("");
  const qNorm = useMemo(() => normalizeQuery(q), [q]);
  const showSearchResults = qNorm.length > 0;

  // country → league mapping (V1: only for leagues that exist in the app)
  const COUNTRY_TO_LEAGUE: Record<string, LeagueOption> = useMemo(
    () => ({
      england: LEAGUES.find((l) => l.label.toLowerCase() === "premier league") ?? LEAGUES[0],
      uk: LEAGUES.find((l) => l.label.toLowerCase() === "premier league") ?? LEAGUES[0],
      spain: LEAGUES.find((l) => l.label.toLowerCase() === "la liga") ?? LEAGUES[0],
      italy: LEAGUES.find((l) => l.label.toLowerCase() === "serie a") ?? LEAGUES[0],
      germany: LEAGUES.find((l) => l.label.toLowerCase() === "bundesliga") ?? LEAGUES[0],
      france: LEAGUES.find((l) => l.label.toLowerCase() === "ligue 1") ?? LEAGUES[0],
    }),
    []
  );

  const cityResults = useMemo<SearchResult[]>(() => {
    if (!qNorm) return [];

    // Match against:
    // - city key (madrid)
    // - city display name (Madrid)
    // - country field in guide (Spain)
    const entries = Object.values(CITY_GUIDES || {});
    const matched = entries
      .filter((g) => {
        const key = normalizeKey(g.cityId);
        const name = String(g.name ?? "").toLowerCase();
        const country = String(g.country ?? "").toLowerCase();
        return (
          includesLoose(key, normalizeKey(qNorm)) ||
          includesLoose(name, qNorm) ||
          includesLoose(country, qNorm)
        );
      })
      .slice(0, 6)
      .map((g) => ({
        type: "city" as const,
        key: normalizeKey(g.cityId),
        title: g.name ?? g.cityId,
        subtitle: g.country ? `${g.country}` : undefined,
      }));

    return matched;
  }, [qNorm]);

  const leagueResults = useMemo<SearchResult[]>(() => {
    if (!qNorm) return [];

    // Match direct league labels ("la liga") + country shortcuts ("spain")
    const out: SearchResult[] = [];

    const byLabel = LEAGUES.filter((l) => includesLoose(l.label.toLowerCase(), qNorm))
      .slice(0, 5)
      .map((l) => ({
        type: "league" as const,
        league: l,
        title: l.label,
        subtitle: "Open fixtures in this league",
      }));
    out.push(...byLabel);

    const byCountry = COUNTRY_TO_LEAGUE[qNorm];
    if (byCountry && !out.some((x) => x.type === "league" && x.league.leagueId === byCountry.leagueId)) {
      out.unshift({
        type: "league",
        league: byCountry,
        title: `${qNorm[0].toUpperCase()}${qNorm.slice(1)} (league)`,
        subtitle: `Open fixtures for ${byCountry.label}`,
      });
    }

    return out.slice(0, 6);
  }, [qNorm, COUNTRY_TO_LEAGUE]);

  const derivedTeamsAndStadiums = useMemo(() => {
    // Derived from the loaded fixtures window (fast + no extra data dependency)
    const teamMap = new Map<string, { name: string; count: number }>();
    const stadiumMap = new Map<string, { name: string; city?: string; count: number }>();

    for (const r of fxRows) {
      const home = String(r?.teams?.home?.name ?? "").trim();
      const away = String(r?.teams?.away?.name ?? "").trim();
      const venue = String(r?.fixture?.venue?.name ?? "").trim();
      const venueCity = String(r?.fixture?.venue?.city ?? "").trim();

      if (home) teamMap.set(home, { name: home, count: (teamMap.get(home)?.count ?? 0) + 1 });
      if (away) teamMap.set(away, { name: away, count: (teamMap.get(away)?.count ?? 0) + 1 });

      if (venue) stadiumMap.set(venue, { name: venue, city: venueCity || undefined, count: (stadiumMap.get(venue)?.count ?? 0) + 1 });
    }

    const teams = Array.from(teamMap.values()).sort((a, b) => b.count - a.count);
    const stadiums = Array.from(stadiumMap.values()).sort((a, b) => b.count - a.count);

    return { teams, stadiums };
  }, [fxRows]);

  const teamResults = useMemo<SearchResult[]>(() => {
    if (!qNorm) return [];
    const res = derivedTeamsAndStadiums.teams
      .filter((t) => includesLoose(t.name.toLowerCase(), qNorm))
      .slice(0, 6)
      .map((t) => ({
        type: "team" as const,
        key: normalizeKey(t.name),
        title: t.name,
        subtitle: "Open team guide",
      }));
    return res;
  }, [qNorm, derivedTeamsAndStadiums.teams]);

  const stadiumResults = useMemo<SearchResult[]>(() => {
    if (!qNorm) return [];
    const res = derivedTeamsAndStadiums.stadiums
      .filter((s) => includesLoose(s.name.toLowerCase(), qNorm) || includesLoose(String(s.city ?? "").toLowerCase(), qNorm))
      .slice(0, 6)
      .map((s) => ({
        type: "stadium" as const,
        key: normalizeKey(s.name),
        title: s.name,
        subtitle: s.city ? `${s.city} • Open stadium guide` : "Open stadium guide",
      }));
    return res;
  }, [qNorm, derivedTeamsAndStadiums.stadiums]);

  const matchResults = useMemo<SearchResult[]>(() => {
    if (!qNorm) return [];

    const res = fxRows
      .filter((r) => {
        const home = String(r?.teams?.home?.name ?? "").toLowerCase();
        const away = String(r?.teams?.away?.name ?? "").toLowerCase();
        const venue = String(r?.fixture?.venue?.name ?? "").toLowerCase();
        const city = String(r?.fixture?.venue?.city ?? "").toLowerCase();
        return home.includes(qNorm) || away.includes(qNorm) || venue.includes(qNorm) || city.includes(qNorm);
      })
      .slice(0, 6)
      .map((r, idx) => {
        const id = r?.fixture?.id;
        const fixtureId = id ? String(id) : `unknown-${idx}`;
        const line = fixtureLine(r);
        return { type: "match" as const, fixtureId, title: line.title, subtitle: line.meta };
      });

    return res;
  }, [fxRows, qNorm]);

  const tripResults = useMemo<SearchResult[]>(() => {
    if (!qNorm) return [];
    const res = trips
      .filter((t) => {
        const city = String(t.cityId ?? "").toLowerCase();
        const notes = String(t.notes ?? "").toLowerCase();
        return city.includes(qNorm) || notes.includes(qNorm);
      })
      .slice(0, 4)
      .map((t) => ({
        type: "trip" as const,
        tripId: t.id,
        title: t.cityId || "Trip",
        subtitle: tripSummaryLine(t),
      }));
    return res;
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

  function openFixturesForLeague(l: LeagueOption) {
    // also set active league pill so the UI stays coherent
    setLeague(l);
    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        leagueId: String(l.leagueId),
        season: String(l.season),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }

  function onResultPress(r: SearchResult) {
    if (r.type === "city") {
      router.push({ pathname: "/city/[slug]", params: { slug: r.key } });
      return;
    }
    if (r.type === "team") {
      router.push({ pathname: "/team/[slug]", params: { slug: r.key } });
      return;
    }
    if (r.type === "stadium") {
      router.push({ pathname: "/stadium/[slug]", params: { slug: r.key } });
      return;
    }
    if (r.type === "league") {
      openFixturesForLeague(r.league);
      return;
    }
    if (r.type === "match") {
      router.push({ pathname: "/match/[id]", params: { id: r.fixtureId } });
      return;
    }
    if (r.type === "trip") {
      router.push({ pathname: "/trip/[id]", params: { id: r.tripId } });
      return;
    }
  }

  function renderResultRow(r: SearchResult, key: string, rightCta?: React.ReactNode) {
    return (
      <View key={key} style={styles.resultRow}>
        <Pressable onPress={() => onResultPress(r)} style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{r.title}</Text>
          {r.subtitle ? <Text style={styles.rowMeta}>{r.subtitle}</Text> : null}
        </Pressable>
        {rightCta ?? null}
      </View>
    );
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
                <Text style={styles.heroHint}>Try “Madrid”, “Spain”, “La Liga”, a team name, or a stadium.</Text>
              ) : null}
            </View>

            {showSearchResults ? (
              <View style={styles.searchResults}>
                {/* Quick feedback row */}
                {fxLoading ? (
                  <View style={styles.centerCompact}>
                    <ActivityIndicator />
                    <Text style={styles.muted}>Updating search data…</Text>
                  </View>
                ) : null}

                {!fxLoading && fxError ? <EmptyState title="Fixtures unavailable" message={fxError} /> : null}

                {/* Cities */}
                <View>
                  <Text style={styles.searchSectionTitle}>Cities</Text>
                  {cityResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No city guides match.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {cityResults.map((r) => renderResultRow(r, `city-${r.key}`))}
                    </View>
                  )}
                </View>

                {/* Leagues / Countries */}
                <View>
                  <Text style={styles.searchSectionTitle}>Leagues</Text>
                  {leagueResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No league match.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {leagueResults.map((r, idx) => {
                        const key =
                          r.type === "league" ? `league-${r.league.leagueId}-${idx}` : `league-${idx}`;
                        return renderResultRow(r, key);
                      })}
                    </View>
                  )}
                </View>

                {/* Teams */}
                <View>
                  <Text style={styles.searchSectionTitle}>Teams</Text>
                  {teamResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No team match in the loaded fixture window.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {teamResults.map((r) => renderResultRow(r, `team-${r.key}`))}
                    </View>
                  )}
                </View>

                {/* Stadiums */}
                <View>
                  <Text style={styles.searchSectionTitle}>Stadiums</Text>
                  {stadiumResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No stadium match in the loaded fixture window.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {stadiumResults.map((r) => renderResultRow(r, `stadium-${r.key}`))}
                    </View>
                  )}
                </View>

                {/* Matches */}
                <View>
                  <Text style={styles.searchSectionTitle}>Matches</Text>
                  {!fxLoading && !fxError && matchResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No matches found.</Text>
                  ) : null}

                  {!fxLoading && !fxError && matchResults.length > 0 ? (
                    <View style={styles.resultList}>
                      {matchResults.map((r, idx) => {
                        if (r.type !== "match") return null;
                        const fixtureId = r.fixtureId;
                        return renderResultRow(
                          r,
                          `m-${fixtureId}-${idx}`,
                          <Pressable
                            onPress={() => goBuildTripWithContext(fixtureId)}
                            style={styles.planPill}
                          >
                            <Text style={styles.planPillText}>Plan trip</Text>
                          </Pressable>
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
                    <Text style={styles.linkText}>Open Fixtures</Text>
                  </Pressable>
                </View>

                {/* Trips */}
                <View>
                  <Text style={styles.searchSectionTitle}>Trips</Text>

                  {!loadedTrips ? (
                    <View style={styles.centerCompact}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Searching trips…</Text>
                    </View>
                  ) : null}

                  {loadedTrips && tripResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No trips found.</Text>
                  ) : null}

                  {loadedTrips && tripResults.length > 0 ? (
                    <View style={styles.resultList}>
                      {tripResults.map((r, idx) => {
                        if (r.type !== "trip") return null;
                        return renderResultRow(r, `trip-${r.tripId}-${idx}`);
                      })}
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

  muted: { marginTop: 0, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  center: { paddingVertical: 12, alignItems: "center", gap: 10 },
  centerCompact: { paddingTop: 6, paddingBottom: 2, alignItems: "center", gap: 8 },

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
