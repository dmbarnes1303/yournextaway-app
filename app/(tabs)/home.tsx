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
  parseIsoDateOnly,
  toIsoDate,
  clampFromIsoToTomorrow,
  type LeagueOption,
} from "@/src/constants/football";

import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { normalizeCityKey } from "@/src/utils/city";
import { cityGuides } from "@/src/data/cityGuides";
import { teamGuides } from "@/src/data/teamGuides";

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
    city,
    venue,
    home,
    away,
  };
}

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function includes(haystack: string, needle: string) {
  return haystack.includes(needle);
}

function leagueMatchesQuery(l: LeagueOption, qNorm: string) {
  const label = norm(l.label);
  if (!qNorm) return false;
  // Loose matches for common phrases
  if (includes(label, qNorm)) return true;
  if (includes(qNorm, label)) return true;

  // Common country synonyms (keep minimal, stable)
  const synonyms: Record<string, string[]> = {
    "premier league": ["england", "english", "uk", "britain", "british"],
    "la liga": ["spain", "spanish"],
    "serie a": ["italy", "italian"],
    bundesliga: ["germany", "german"],
    "ligue 1": ["france", "french"],
  };

  const syn = synonyms[label] ?? [];
  return syn.some((s) => includes(qNorm, s) || includes(s, qNorm));
}

function bestLeagueForQuery(qNorm: string): LeagueOption | null {
  if (!qNorm) return null;

  // Exact-ish detection first
  for (const l of LEAGUES) {
    if (leagueMatchesQuery(l, qNorm)) return l;
  }

  // Fuzzy fallback: if query contains a league keyword fragment
  const fragments: Array<{ fragment: string; leagueLabel: string }> = [
    { fragment: "prem", leagueLabel: "Premier League" },
    { fragment: "epl", leagueLabel: "Premier League" },
    { fragment: "la liga", leagueLabel: "La Liga" },
    { fragment: "serie", leagueLabel: "Serie A" },
    { fragment: "bundes", leagueLabel: "Bundesliga" },
    { fragment: "ligue", leagueLabel: "Ligue 1" },
  ];

  const hit = fragments.find((f) => includes(qNorm, f.fragment));
  if (hit) return LEAGUES.find((l) => l.label === hit.leagueLabel) ?? null;

  return null;
}

type SearchCard =
  | {
      kind: "city";
      cityKey: string;
      title: string;
      subtitle: string;
      hasGuide: boolean;
      country?: string;
      rawCityName?: string;
      fixturesCount: number;
    }
  | {
      kind: "team";
      teamKey: string;
      title: string;
      subtitle: string;
      fixturesCount: number;
    }
  | {
      kind: "venue";
      venue: string;
      city?: string;
      title: string;
      subtitle: string;
      fixturesCount: number;
    }
  | {
      kind: "league";
      league: LeagueOption;
      title: string;
      subtitle: string;
      fixturesCount: number;
    };

export default function HomeScreen() {
  const router = useRouter();

  const [league, setLeague] = useState<LeagueOption>(LEAGUES[0]);

  // Central rolling window (single source of truth) — tomorrow onwards
  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromIso = useMemo(() => clampFromIsoToTomorrow(rolling.from), [rolling.from]);
  const toIso = useMemo(() => rolling.to, [rolling.to]);

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

  // Fixtures (loaded once per selected league/window, used for previews + search)
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

  // Search state
  const [q, setQ] = useState("");
  const qNorm = useMemo(() => q.trim().toLowerCase(), [q]);
  const showSearchResults = qNorm.length > 0;

  // Build lightweight indices from the fixtures already loaded.
  // This is v1-correct: search is powerful, but limited to the currently-loaded league/window.
  const fixtureIndex = useMemo(() => {
    // City → count + sample
    const byCity = new Map<string, { count: number; sampleCity: string }>();
    // Venue → count + city sample
    const byVenue = new Map<string, { count: number; venue: string; city?: string }>();
    // Team → count (both home+away)
    const byTeam = new Map<string, { count: number; teamName: string }>();

    for (const r of fxRows) {
      const cityRaw = String(r?.fixture?.venue?.city ?? "").trim();
      const venueRaw = String(r?.fixture?.venue?.name ?? "").trim();
      const homeRaw = String(r?.teams?.home?.name ?? "").trim();
      const awayRaw = String(r?.teams?.away?.name ?? "").trim();

      if (cityRaw) {
        const key = normalizeCityKey(cityRaw);
        const cur = byCity.get(key);
        byCity.set(key, { count: (cur?.count ?? 0) + 1, sampleCity: cityRaw });
      }

      if (venueRaw) {
        const key = venueRaw.toLowerCase();
        const cur = byVenue.get(key);
        byVenue.set(key, {
          count: (cur?.count ?? 0) + 1,
          venue: venueRaw,
          city: cur?.city ?? (cityRaw || undefined),
        });
      }

      const addTeam = (teamName: string) => {
        if (!teamName) return;
        const key = teamName.toLowerCase();
        const cur = byTeam.get(key);
        byTeam.set(key, { count: (cur?.count ?? 0) + 1, teamName });
      };

      addTeam(homeRaw);
      addTeam(awayRaw);
    }

    return { byCity, byVenue, byTeam };
  }, [fxRows]);

  const searchCards = useMemo<SearchCard[]>(() => {
    if (!qNorm) return [];

    const cards: SearchCard[] = [];

    // 1) City guide first (if city matches), per your decision.
    // We match cities from two places:
    // - fixture city index (most common)
    // - guide registry itself (even if no fixture in current window, it still must route somewhere)
    const cityHits: Array<{ cityKey: string; rawCityName?: string; fixturesCount: number }> = [];

    // From fixtures
    for (const [cityKey, v] of fixtureIndex.byCity.entries()) {
      const display = norm(v.sampleCity);
      if (includes(display, qNorm) || includes(qNorm, display)) {
        cityHits.push({ cityKey, rawCityName: v.sampleCity, fixturesCount: v.count });
      }
    }

    // From guides (ensure typing cities does something even if fixture window doesn't contain it)
    for (const cityKey of Object.keys(cityGuides ?? {})) {
      const guide = (cityGuides as any)[cityKey];
      const guideName = norm(guide?.name ?? cityKey);
      const guideKey = norm(cityKey);
      if (includes(guideName, qNorm) || includes(guideKey, qNorm)) {
        // Avoid duplicates if already present
        if (!cityHits.some((x) => x.cityKey === cityKey)) {
          cityHits.push({ cityKey, rawCityName: guide?.name ?? cityKey, fixturesCount: 0 });
        }
      }
    }

    // Sort city hits: prefer those with guides, then higher fixture counts, then alpha
    cityHits
      .map((x) => {
        const g = (cityGuides as any)?.[x.cityKey];
        const hasGuide = !!g;
        const title = g?.name ?? x.rawCityName ?? x.cityKey;
        const country = g?.country;
        const subtitle = hasGuide
          ? `Open city guide${country ? ` • ${country}` : ""}`
          : "No city guide yet • Open fixtures";

        return {
          kind: "city" as const,
          cityKey: x.cityKey,
          title,
          subtitle,
          hasGuide,
          country,
          rawCityName: x.rawCityName,
          fixturesCount: x.fixturesCount,
        };
      })
      .sort((a, b) => {
        if (a.hasGuide !== b.hasGuide) return a.hasGuide ? -1 : 1;
        if (a.fixturesCount !== b.fixturesCount) return b.fixturesCount - a.fixturesCount;
        return a.title.localeCompare(b.title);
      })
      .slice(0, 3)
      .forEach((c) => cards.push(c));

    // 2) Team guide (club)
    const teamHits: Array<{ teamKey: string; teamName: string; fixturesCount: number; hasGuide: boolean }> = [];
    for (const [teamKey, v] of fixtureIndex.byTeam.entries()) {
      const nameNorm = norm(v.teamName);
      if (includes(nameNorm, qNorm) || includes(qNorm, nameNorm)) {
        const hasGuide = !!(teamGuides as any)?.[teamKey];
        teamHits.push({ teamKey, teamName: v.teamName, fixturesCount: v.count, hasGuide });
      }
    }

    // Also allow direct team guide key match even if not in fixtures window
    for (const teamKey of Object.keys(teamGuides ?? {})) {
      if (teamHits.some((x) => x.teamKey === teamKey)) continue;
      const guide = (teamGuides as any)[teamKey];
      const display = norm(guide?.name ?? guide?.teamName ?? teamKey);
      const keyNorm = norm(teamKey);
      if (includes(display, qNorm) || includes(keyNorm, qNorm)) {
        teamHits.push({
          teamKey,
          teamName: guide?.name ?? guide?.teamName ?? teamKey,
          fixturesCount: 0,
          hasGuide: true,
        });
      }
    }

    teamHits
      .sort((a, b) => {
        // Prefer those with guides, then fixture counts, then alpha
        if (a.hasGuide !== b.hasGuide) return a.hasGuide ? -1 : 1;
        if (a.fixturesCount !== b.fixturesCount) return b.fixturesCount - a.fixturesCount;
        return a.teamName.localeCompare(b.teamName);
      })
      .slice(0, 3)
      .forEach((t) => {
        cards.push({
          kind: "team",
          teamKey: t.teamKey,
          title: t.teamName,
          subtitle: t.hasGuide ? "Open team guide" : "No team guide yet • Open fixtures",
          fixturesCount: t.fixturesCount,
        });
      });

    // 3) Venue (stadium)
    const venueHits: Array<{ venue: string; city?: string; fixturesCount: number }> = [];
    for (const [, v] of fixtureIndex.byVenue.entries()) {
      const vNorm = norm(v.venue);
      const cNorm = norm(v.city);
      if (includes(vNorm, qNorm) || includes(qNorm, vNorm) || (cNorm && includes(cNorm, qNorm))) {
        venueHits.push({ venue: v.venue, city: v.city, fixturesCount: v.count });
      }
    }

    venueHits
      .sort((a, b) => {
        if (a.fixturesCount !== b.fixturesCount) return b.fixturesCount - a.fixturesCount;
        return a.venue.localeCompare(b.venue);
      })
      .slice(0, 3)
      .forEach((v) => {
        cards.push({
          kind: "venue",
          venue: v.venue,
          city: v.city,
          title: v.venue,
          subtitle: v.city ? `Open fixtures • ${v.city}` : "Open fixtures",
          fixturesCount: v.fixturesCount,
        });
      });

    // 4) League / Country → fixtures
    const bestLeague = bestLeagueForQuery(qNorm);
    if (bestLeague) {
      // Estimate count from currently loaded league fixtures if it matches current selected league.
      // If it’s a different league, we don’t know count without fetching; keep it simple.
      const fixturesCount = bestLeague.leagueId === league.leagueId ? fxRows.length : 0;

      cards.push({
        kind: "league",
        league: bestLeague,
        title: bestLeague.label,
        subtitle: "Open fixtures for this league",
        fixturesCount,
      });
    }

    // Deduplicate by stable signature (kind + key)
    const seen = new Set<string>();
    return cards.filter((c) => {
      const key =
        c.kind === "city"
          ? `city:${c.cityKey}`
          : c.kind === "team"
          ? `team:${c.teamKey}`
          : c.kind === "venue"
          ? `venue:${c.venue.toLowerCase()}`
          : `league:${c.league.leagueId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [qNorm, fixtureIndex, fxRows.length, league.leagueId]);

  const matchResults = useMemo(() => {
    if (!qNorm) return [];
    const res = fxRows.filter((r) => {
      const home = norm(r?.teams?.home?.name);
      const away = norm(r?.teams?.away?.name);
      const venue = norm(r?.fixture?.venue?.name);
      const city = norm(r?.fixture?.venue?.city);
      return includes(home, qNorm) || includes(away, qNorm) || includes(venue, qNorm) || includes(city, qNorm);
    });
    return res.slice(0, 6);
  }, [fxRows, qNorm]);

  const tripResults = useMemo(() => {
    if (!qNorm) return [];
    const res = trips.filter((t) => {
      const city = norm(t.cityId);
      const notes = norm(t.notes);
      return includes(city, qNorm) || includes(notes, qNorm);
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

  function openFixturesWithContext(nextLeague: LeagueOption, extra?: { venue?: string; cityKey?: string }) {
    // v1: fixtures screen doesn’t accept venue/city filters yet; it accepts league+window.
    // We still pass venue/cityKey so v2 can pick it up without rewriting this.
    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        leagueId: String(nextLeague.leagueId),
        season: String(nextLeague.season),
        from: fromIso,
        to: toIso,
        ...(extra?.venue ? { venue: extra.venue } : {}),
        ...(extra?.cityKey ? { cityKey: extra.cityKey } : {}),
      },
    } as any);
  }

  function openCityGuideOrFallback(cityKey: string) {
    const g = (cityGuides as any)?.[cityKey];

    if (g) {
      router.push({ pathname: "/city/[id]", params: { id: cityKey } } as any);
      return;
    }

    // Fallback to fixtures (per your rule 3)
    openFixturesWithContext(league, { cityKey });
  }

  function openTeamGuideOrFallback(teamKey: string) {
    const g = (teamGuides as any)?.[teamKey];

    if (g) {
      router.push({ pathname: "/team/[id]", params: { id: teamKey } } as any);
      return;
    }

    openFixturesWithContext(league);
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
                <Text style={styles.heroHint}>Tip: Try “Madrid”, “Anfield”, or a club name.</Text>
              ) : null}
            </View>

            {showSearchResults ? (
              <View style={styles.searchResults}>
                {/* DIRECT NAV RESULTS */}
                <View>
                  <Text style={styles.searchSectionTitle}>Top results</Text>

                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Searching…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && fxError ? <EmptyState title="Fixtures unavailable" message={fxError} /> : null}

                  {!fxLoading && !fxError && searchCards.length === 0 ? (
                    <Text style={styles.searchEmpty}>No results yet. Try a city, club, stadium, or league.</Text>
                  ) : null}

                  {!fxLoading && !fxError && searchCards.length > 0 ? (
                    <View style={styles.resultList}>
                      {searchCards.map((c, idx) => {
                        const key =
                          c.kind === "city"
                            ? `city-${c.cityKey}`
                            : c.kind === "team"
                            ? `team-${c.teamKey}`
                            : c.kind === "venue"
                            ? `venue-${c.venue}`
                            : `league-${c.league.leagueId}`;

                        const badge =
                          c.fixturesCount > 0 ? `${c.fixturesCount} fixture${c.fixturesCount === 1 ? "" : "s"}` : "";

                        return (
                          <Pressable
                            key={key ?? `sr-${idx}`}
                            onPress={() => {
                              if (c.kind === "city") return openCityGuideOrFallback(c.cityKey);
                              if (c.kind === "team") return openTeamGuideOrFallback(c.teamKey);
                              if (c.kind === "venue") return openFixturesWithContext(league, { venue: c.venue });
                              // league
                              setLeague(c.league);
                              openFixturesWithContext(c.league);
                            }}
                            style={styles.searchCard}
                          >
                            <View style={styles.searchCardTop}>
                              <Text style={styles.searchCardTitle} numberOfLines={1}>
                                {c.title}
                              </Text>
                              {badge ? <Text style={styles.badge}>{badge}</Text> : null}
                            </View>
                            <Text style={styles.searchCardSub} numberOfLines={2}>
                              {c.subtitle}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>

                {/* MATCHES (IN CURRENT LEAGUE/WINDOW) */}
                <View>
                  <Text style={styles.searchSectionTitle}>Matches</Text>

                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Searching fixtures…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && !fxError && matchResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No matches found in this league window.</Text>
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

                  <Text style={styles.searchFootnote}>
                    Note: v1 search is powerful but limited to the currently loaded league + date window. In v2 we’ll
                    expand to cross-league search and true city/team indexes.
                  </Text>
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

  searchCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.20)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  searchCardTop: { flexDirection: "row", gap: 10, alignItems: "center" },
  searchCardTitle: { flex: 1, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  searchCardSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  badge: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.40)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  searchFootnote: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, lineHeight: 16 },

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
