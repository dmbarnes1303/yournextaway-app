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

import { LEAGUES, DEFAULT_SEASON, getRollingWindowIso, parseIsoDateOnly, toIsoDate, type LeagueOption } from "@/src/constants/football";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

import { cityGuides as CITY_GUIDES_REGISTRY } from "@/src/data/cityGuides";
import { normalizeCityKey } from "@/src/utils/city";

/**
 * Search design (v1):
 * - Results order: Teams → Cities → Countries/Leagues → Venues → Matches
 * - Teams/Cities route to their guide screens (which will contain fixtures inside the guide).
 * - Countries/Leagues route to Fixtures (correct).
 * - Venues route to Fixtures (v1 best-effort; passes a venue query param for future filtering).
 *
 * Notes:
 * - For "powerful" search without exploding API calls, we cache fixtures per league for the rolling window.
 * - When the user types, we opportunistically warm a few leagues in the background and search across cached rows.
 */

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
    fixtureId: r?.fixture?.id ? String(r.fixture.id) : null,
    title: `${home} vs ${away}`,
    meta: extra ? `${kickoff} • ${extra}` : kickoff,
    home,
    away,
    venue,
    city,
  };
}

function normalizeTeamKey(input: string) {
  const s = String(input ?? "").trim().toLowerCase();
  if (!s) return "";
  return s
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeQuery(input: string) {
  return String(input ?? "").trim().toLowerCase();
}

function uniqBy<T>(arr: T[], keyFn: (t: T) => string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

type SearchLeague = LeagueOption & { aliases: string[] };

function buildSearchLeagues(): SearchLeague[] {
  // Keep LEAGUES as the canonical UI list, but allow search to include extra
  // country→league mappings without forcing you to expand LEAGUES yet.
  const base: SearchLeague[] = LEAGUES.map((l) => {
    const label = l.label.toLowerCase();
    const aliases: string[] = [label];

    // Common country aliases for top leagues (v1).
    if (label.includes("premier league")) aliases.push("england", "english", "uk", "united kingdom");
    if (label.includes("la liga")) aliases.push("spain", "spanish");
    if (label.includes("serie a")) aliases.push("italy", "italian");
    if (label.includes("bundesliga") && !label.includes("austrian")) aliases.push("germany", "german");
    if (label.includes("ligue 1")) aliases.push("france", "french");

    return { ...l, aliases };
  });

  // Austria mapping (requested): user types “Austria” and expects Austrian Bundesliga.
  // We add it to SEARCH only, so you don't have to commit it into LEAGUES yet.
  const hasAustria = base.some((x) => x.leagueId === 218 || x.label.toLowerCase().includes("austrian"));
  if (!hasAustria) {
    base.push({
      label: "Austrian Bundesliga",
      leagueId: 218,
      season: DEFAULT_SEASON ?? (LEAGUES[0]?.season ?? 2025),
      aliases: ["austria", "austrian", "austrian bundesliga", "bundesliga austria"],
    });
  }

  return base;
}

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
      // exclude past + today (strictly after today)
      .filter((x) => x.d.getTime() > todayMidnight.getTime())
      .sort((a, b) => a.d.getTime() - b.d.getTime())
      .map((x) => x.t);
  }, [trips, todayMidnight]);

  const nextTrip = useMemo(() => upcomingTrips[0] ?? null, [upcomingTrips]);
  const topTrips = useMemo(() => trips.slice(0, 3), [trips]);

  const tripsCountLabel = useMemo(() => {
    if (!loadedTrips) return "—";
    return `${trips.length} trip${trips.length === 1 ? "" : "s"}`;
  }, [loadedTrips, trips.length]);

  function goBuildTripWithContext(fixtureId?: string, ctxLeague?: LeagueOption) {
    const l = ctxLeague ?? league;
    router.push({
      pathname: "/trip/build",
      params: {
        ...(fixtureId ? { fixtureId } : {}),
        leagueId: String(l.leagueId),
        season: String(l.season),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }

  // --- Fixtures cache (per league) for search ---
  const SEARCH_LEAGUES = useMemo(() => buildSearchLeagues(), []);
  const leagueKey = (l: { leagueId: number; season: number }) => `${l.leagueId}:${l.season}`;

  const [fixturesByLeague, setFixturesByLeague] = useState<Record<string, FixtureListRow[]>>({});
  const [fixturesLoadingByLeague, setFixturesLoadingByLeague] = useState<Record<string, boolean>>({});
  const [fixturesErrorByLeague, setFixturesErrorByLeague] = useState<Record<string, string | null>>({});

  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxRows, setFxRows] = useState<FixtureListRow[]>([]);

  async function ensureLeagueFixturesLoaded(l: LeagueOption) {
    const key = leagueKey(l);

    if (fixturesByLeague[key]?.length) return;
    if (fixturesLoadingByLeague[key]) return;

    setFixturesLoadingByLeague((m) => ({ ...m, [key]: true }));
    setFixturesErrorByLeague((m) => ({ ...m, [key]: null }));

    try {
      const rows = await getFixtures({ league: l.leagueId, season: l.season, from: fromIso, to: toIso });
      setFixturesByLeague((m) => ({ ...m, [key]: Array.isArray(rows) ? rows : [] }));
    } catch (e: any) {
      setFixturesErrorByLeague((m) => ({ ...m, [key]: e?.message ?? "Failed to load fixtures." }));
    } finally {
      setFixturesLoadingByLeague((m) => ({ ...m, [key]: false }));
    }
  }

  // Load current league fixtures for previews + initial cache
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

        const list = Array.isArray(rows) ? rows : [];
        setFxRows(list);

        // Cache it for search
        const key = leagueKey(league);
        setFixturesByLeague((m) => ({ ...m, [key]: list }));
        setFixturesErrorByLeague((m) => ({ ...m, [key]: null }));
      } catch (e: any) {
        if (cancelled) return;
        const msg = e?.message ?? "Failed to load fixtures.";
        setFxError(msg);

        const key = leagueKey(league);
        setFixturesErrorByLeague((m) => ({ ...m, [key]: msg }));
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

  // --- Search ---
  const [q, setQ] = useState("");
  const qNorm = useMemo(() => normalizeQuery(q), [q]);
  const showSearchResults = qNorm.length > 0;

  // Background warmup when user searches (keeps it responsive, reduces API spam)
  const warmupAbortRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const [searchWarmLoading, setSearchWarmLoading] = useState(false);

  useEffect(() => {
    warmupAbortRef.current.cancelled = false;

    async function warm() {
      if (!qNorm || qNorm.length < 2) {
        setSearchWarmLoading(false);
        return;
      }

      // Warm the most likely candidates first:
      // - current league
      // - leagues whose aliases match the query
      // - a small cap to avoid overfetching
      const candidates = uniqBy(
        [
          { ...league, aliases: [] as string[] } as any,
          ...SEARCH_LEAGUES.filter((l) => l.aliases.some((a) => a.includes(qNorm) || qNorm.includes(a))),
          ...SEARCH_LEAGUES,
        ],
        (x: any) => `${x.leagueId}:${x.season}`
      ).slice(0, 4);

      setSearchWarmLoading(true);

      for (const l of candidates) {
        if (warmupAbortRef.current.cancelled) return;
        // eslint-disable-next-line no-await-in-loop
        await ensureLeagueFixturesLoaded(l);
      }

      if (!warmupAbortRef.current.cancelled) setSearchWarmLoading(false);
    }

    warm();

    return () => {
      warmupAbortRef.current.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qNorm, league.leagueId, league.season, fromIso, toIso]);

  const allCachedRows = useMemo(() => {
    const all: FixtureListRow[] = [];
    Object.values(fixturesByLeague).forEach((rows) => {
      if (Array.isArray(rows)) all.push(...rows);
    });
    return all;
  }, [fixturesByLeague]);

  const teamResults = useMemo(() => {
    if (!qNorm) return [];

    const teams = allCachedRows
      .flatMap((r) => [
        String(r?.teams?.home?.name ?? "").trim(),
        String(r?.teams?.away?.name ?? "").trim(),
      ])
      .filter(Boolean);

    const filtered = teams.filter((t) => t.toLowerCase().includes(qNorm));
    const unique = uniqBy(filtered, (t) => normalizeTeamKey(t));
    return unique.slice(0, 6).map((name) => ({ name, teamKey: normalizeTeamKey(name) }));
  }, [allCachedRows, qNorm]);

  const cityResults = useMemo(() => {
    if (!qNorm) return [];

    const entries = Object.entries(CITY_GUIDES_REGISTRY ?? {});
    const hits = entries
      .map(([key, guide]) => ({
        cityKey: key,
        name: guide?.name ?? key,
        country: guide?.country ?? "",
      }))
      .filter((x) => {
        const a = x.name.toLowerCase();
        const b = x.country.toLowerCase();
        const c = String(x.cityKey ?? "").toLowerCase();
        return a.includes(qNorm) || b.includes(qNorm) || c.includes(qNorm);
      });

    // Prefer exact-ish starts
    hits.sort((x, y) => {
      const ax = x.name.toLowerCase().startsWith(qNorm) ? 0 : 1;
      const ay = y.name.toLowerCase().startsWith(qNorm) ? 0 : 1;
      if (ax !== ay) return ax - ay;
      return x.name.localeCompare(y.name);
    });

    return hits.slice(0, 6);
  }, [qNorm]);

  const leagueCountryResults = useMemo(() => {
    if (!qNorm) return [];

    const hits = SEARCH_LEAGUES.filter((l) => {
      const label = l.label.toLowerCase();
      return label.includes(qNorm) || l.aliases.some((a) => a.includes(qNorm) || qNorm.includes(a));
    });

    // Keep output stable + dedupe by id/season
    return uniqBy(hits, (x) => `${x.leagueId}:${x.season}`).slice(0, 6);
  }, [qNorm, SEARCH_LEAGUES]);

  const venueResults = useMemo(() => {
    if (!qNorm) return [];

    const venues = allCachedRows
      .map((r) => ({
        venue: String(r?.fixture?.venue?.name ?? "").trim(),
        city: String(r?.fixture?.venue?.city ?? "").trim(),
      }))
      .filter((x) => x.venue);

    const filtered = venues.filter((x) => {
      const a = x.venue.toLowerCase();
      const b = x.city.toLowerCase();
      return a.includes(qNorm) || b.includes(qNorm);
    });

    const unique = uniqBy(filtered, (x) => `${x.venue.toLowerCase()}|${x.city.toLowerCase()}`);
    return unique.slice(0, 6);
  }, [allCachedRows, qNorm]);

  const matchResults = useMemo(() => {
    if (!qNorm) return [];

    const res = allCachedRows.filter((r) => {
      const home = String(r?.teams?.home?.name ?? "").toLowerCase();
      const away = String(r?.teams?.away?.name ?? "").toLowerCase();
      const venue = String(r?.fixture?.venue?.name ?? "").toLowerCase();
      const city = String(r?.fixture?.venue?.city ?? "").toLowerCase();
      return home.includes(qNorm) || away.includes(qNorm) || venue.includes(qNorm) || city.includes(qNorm);
    });

    return res.slice(0, 8);
  }, [allCachedRows, qNorm]);

  const tripResults = useMemo(() => {
    if (!qNorm) return [];
    const res = trips.filter((t) => {
      const city = String(t.cityId ?? "").toLowerCase();
      const notes = String(t.notes ?? "").toLowerCase();
      return city.includes(qNorm) || notes.includes(qNorm);
    });
    return res.slice(0, 4);
  }, [trips, qNorm]);

  function openFixturesWithLeague(l: LeagueOption, extra?: { q?: string }) {
    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        leagueId: String(l.leagueId),
        season: String(l.season),
        from: fromIso,
        to: toIso,
        ...(extra?.q ? { q: extra.q } : {}),
      },
    } as any);
  }

  function openCityGuide(cityInput: string) {
    const cityKey = normalizeCityKey(cityInput);
    router.push({ pathname: "/city/[cityKey]", params: { cityKey } } as any);
  }

  function openTeamGuide(teamName: string) {
    const teamKey = normalizeTeamKey(teamName);
    // This screen doesn't exist yet (you confirmed). We'll create it next.
    router.push({ pathname: "/team/[teamKey]", params: { teamKey, teamName } } as any);
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
                <Text style={styles.heroHint}>Tip: Try “Austria”, “Madrid”, “Anfield”, or a club name.</Text>
              ) : null}
            </View>

            {showSearchResults ? (
              <View style={styles.searchResults}>
                {/* Optional warmup indicator */}
                {searchWarmLoading ? (
                  <View style={styles.searchLoadingRow}>
                    <ActivityIndicator />
                    <Text style={styles.muted}>Searching across leagues…</Text>
                  </View>
                ) : null}

                {/* TEAMS */}
                <View>
                  <Text style={styles.searchSectionTitle}>Teams</Text>
                  {teamResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No teams found.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {teamResults.map((t) => (
                        <Pressable key={t.teamKey} onPress={() => openTeamGuide(t.name)} style={styles.row}>
                          <Text style={styles.rowTitle}>{t.name}</Text>
                          <Text style={styles.rowMeta}>Open team guide</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* CITIES */}
                <View>
                  <Text style={styles.searchSectionTitle}>Cities</Text>
                  {cityResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No cities found.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {cityResults.map((c) => (
                        <Pressable
                          key={c.cityKey}
                          onPress={() => openCityGuide(c.cityKey)}
                          style={styles.row}
                        >
                          <Text style={styles.rowTitle}>{c.name}</Text>
                          <Text style={styles.rowMeta}>{c.country ? c.country : "Open city guide"}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* COUNTRIES / LEAGUES */}
                <View>
                  <Text style={styles.searchSectionTitle}>Countries / leagues</Text>
                  {leagueCountryResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No leagues found.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {leagueCountryResults.map((l) => (
                        <Pressable
                          key={`${l.leagueId}:${l.season}`}
                          onPress={() => openFixturesWithLeague(l)}
                          style={styles.row}
                        >
                          <Text style={styles.rowTitle}>{l.label}</Text>
                          <Text style={styles.rowMeta}>
                            Open fixtures • {formatUkDateOnly(fromIso)} → {formatUkDateOnly(toIso)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* VENUES */}
                <View>
                  <Text style={styles.searchSectionTitle}>Venues</Text>
                  {venueResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No venues found.</Text>
                  ) : (
                    <View style={styles.resultList}>
                      {venueResults.map((v, idx) => {
                        const key = `${v.venue}-${v.city}-${idx}`;
                        const label = v.city ? `${v.venue} • ${v.city}` : v.venue;

                        return (
                          <Pressable
                            key={key}
                            onPress={() => openFixturesWithLeague(league, { q: v.venue })}
                            style={styles.row}
                          >
                            <Text style={styles.rowTitle}>{label}</Text>
                            <Text style={styles.rowMeta}>Open fixtures (v1)</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* MATCHES */}
                <View>
                  <Text style={styles.searchSectionTitle}>Matches</Text>

                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Loading fixtures…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && (fxError || Object.values(fixturesErrorByLeague).some(Boolean)) ? (
                    <EmptyState title="Fixtures unavailable" message={fxError ?? "Some leagues could not be searched right now."} />
                  ) : null}

                  {!fxLoading && matchResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No matches found.</Text>
                  ) : null}

                  {!fxLoading && matchResults.length > 0 ? (
                    <View style={styles.resultList}>
                      {matchResults.map((r, idx) => {
                        const line = fixtureLine(r);
                        const fixtureId = line.fixtureId;
                        const key = fixtureId ?? `m-${idx}`;

                        return (
                          <View key={key} style={styles.resultRow}>
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

                {/* TRIPS (optional, keeps your v1 feature) */}
                <View>
                  <Text style={styles.searchSectionTitle}>Trips</Text>

                  {!loadedTrips ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Searching trips…</Text>
                    </View>
                  ) : null}

                  {loadedTrips && tripResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No trips found.</Text>
                  ) : null}

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
            <SectionHeader title="Next fixtures" subtitle={`${league.label} • ${formatUkDateOnly(fromIso)} → ${formatUkDateOnly(toIso)}`} />
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
                    const line = fixtureLine(r);
                    const fixtureId = line.fixtureId;
                    const key = fixtureId ?? `fx-${idx}`;

                    return (
                      <View key={key} style={styles.fixtureCardRow}>
                        <Pressable
                          onPress={() => (fixtureId ? router.push({ pathname: "/match/[id]", params: { id: fixtureId } }) : null)}
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

  searchLoadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },

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
