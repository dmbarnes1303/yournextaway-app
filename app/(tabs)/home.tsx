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

type LeagueOption = { label: string; leagueId: number; season: number };

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIsoDateOnly(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatUkDate(iso: string | undefined): string {
  if (!iso) return "TBC";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "TBC";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function formatUkDateTimeMaybe(iso: string | undefined): string {
  if (!iso) return "TBC";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "TBC";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function tripSummaryLine(t: Trip) {
  const a = formatUkDate(t.startDate);
  const b = formatUkDate(t.endDate);
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

export default function HomeScreen() {
  const router = useRouter();

  const leagues: LeagueOption[] = useMemo(
    () => [
      { label: "Premier League", leagueId: 39, season: 2025 },
      { label: "La Liga", leagueId: 140, season: 2025 },
      { label: "Serie A", leagueId: 135, season: 2025 },
      { label: "Bundesliga", leagueId: 78, season: 2025 },
      { label: "Ligue 1", leagueId: 61, season: 2025 },
    ],
    []
  );

  const [league, setLeague] = useState<LeagueOption>(leagues[0]);

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

  const nextTrip = useMemo(() => {
    const withDates = trips
      .map((t) => ({ t, d: parseIsoDateOnly(t.startDate) }))
      .filter((x) => !!x.d) as { t: Trip; d: Date }[];

    withDates.sort((a, b) => a.d.getTime() - b.d.getTime());
    return withDates.length ? withDates[0].t : trips[0] ?? null;
  }, [trips]);

  const topTrips = useMemo(() => trips.slice(0, 3), [trips]);

  // Fixtures
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxRows, setFxRows] = useState<FixtureListRow[]>([]);

  const fromIso = useMemo(() => toIsoDate(new Date()), []);
  const toIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return toIsoDate(d);
  }, []);

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

  // Search
  const [q, setQ] = useState("");

  const qNorm = useMemo(() => q.trim().toLowerCase(), [q]);

  const matchResults = useMemo(() => {
    if (!qNorm) return [];
    const res = fxRows.filter((r) => {
      const home = String(r?.teams?.home?.name ?? "").toLowerCase();
      const away = String(r?.teams?.away?.name ?? "").toLowerCase();
      const venue = String(r?.fixture?.venue?.name ?? "").toLowerCase();
      const city = String(r?.fixture?.venue?.city ?? "").toLowerCase();
      return home.includes(qNorm) || away.includes(qNorm) || venue.includes(qNorm) || city.includes(qNorm);
    });

    // Keep it tight on Home.
    return res.slice(0, 8);
  }, [fxRows, qNorm]);

  const tripResults = useMemo(() => {
    if (!qNorm) return [];
    const res = trips.filter((t) => {
      const city = String(t.cityId ?? "").toLowerCase();
      const notes = String(t.notes ?? "").toLowerCase();
      return city.includes(qNorm) || notes.includes(qNorm);
    });
    return res.slice(0, 6);
  }, [trips, qNorm]);

  const showSearch = qNorm.length > 0;

  const tripsCountLabel = useMemo(() => {
    if (!loadedTrips) return "—";
    return `${trips.length} trip${trips.length === 1 ? "" : "s"}`;
  }, [loadedTrips, trips.length]);

  const fxPreview = useMemo(() => fxRows.slice(0, 6), [fxRows]);

  return (
    <Background imageUrl={getBackground("home")}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>YourNextAway</Text>
              <Text style={styles.subtitle}>Plan your next football trip</Text>
              <Text style={styles.kpi}>
                {league.label} • {formatUkDate(fromIso)} → {formatUkDate(toIso)} • {tripsCountLabel}
              </Text>
            </View>
          </View>

          {/* Search */}
          <GlassCard style={styles.searchCard} intensity={24}>
            <Text style={styles.searchTitle}>Search</Text>
            <Text style={styles.searchSub}>Find fixtures by team, venue or city. Trips by city or notes.</Text>

            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search team / venue / city…"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.search}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />

            {showSearch ? (
              <View style={{ marginTop: 12, gap: 12 }}>
                <View>
                  <Text style={styles.searchSectionTitle}>Matches</Text>
                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Searching fixtures…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && fxError ? (
                    <EmptyState title="Fixtures unavailable" message={fxError} />
                  ) : null}

                  {!fxLoading && !fxError && matchResults.length === 0 ? (
                    <Text style={styles.searchEmpty}>No matches found.</Text>
                  ) : null}

                  {!fxLoading && !fxError && matchResults.length > 0 ? (
                    <View style={styles.list}>
                      {matchResults.map((r, idx) => {
                        const id = r?.fixture?.id;
                        const line = fixtureLine(r);
                        return (
                          <Pressable
                            key={String(id ?? idx)}
                            onPress={() =>
                              id ? router.push({ pathname: "/match/[id]", params: { id: String(id) } }) : null
                            }
                            style={styles.row}
                          >
                            <Text style={styles.rowTitle}>{line.title}</Text>
                            <Text style={styles.rowMeta}>{line.meta}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}

                  <Pressable onPress={() => router.push("/(tabs)/fixtures")} style={styles.linkBtn}>
                    <Text style={styles.linkText}>Open Fixtures</Text>
                  </Pressable>
                </View>

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
                    <View style={styles.list}>
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
            ) : (
              <Text style={styles.searchHint}>
                Tip: Start typing “Madrid”, “Anfield”, or a team name.
              </Text>
            )}
          </GlassCard>

          {/* Quick actions */}
          <GlassCard style={styles.quickCard} intensity={24}>
            <Text style={styles.quickTitle}>Quick actions</Text>
            <Text style={styles.quickSub}>Pick a match, save a trip, and move on.</Text>

            <Pressable
              onPress={() => router.push("/trip/build")}
              style={[styles.btn, styles.btnPrimary]}
            >
              <Text style={styles.btnPrimaryText}>Build Trip</Text>
              <Text style={styles.btnPrimaryMeta}>Select a fixture → set dates → save</Text>
            </Pressable>

            <View style={styles.quickRow}>
              <Pressable
                onPress={() => router.push("/(tabs)/fixtures")}
                style={[styles.btn, styles.btnSecondary]}
              >
                <Text style={styles.btnSecondaryText}>Fixtures</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/(tabs)/trips")}
                style={[styles.btn, styles.btnSecondary]}
              >
                <Text style={styles.btnSecondaryText}>Trips</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* League selector (no horizontal scroll) */}
          <View style={styles.section}>
            <SectionHeader title="Top leagues" subtitle="Pick a league for your next fixtures" />
            <GlassCard style={styles.card} intensity={22}>
              <View style={styles.leagueWrap}>
                {leagues.map((l) => {
                  const active = l.leagueId === league.leagueId;
                  return (
                    <Pressable
                      key={l.leagueId}
                      onPress={() => setLeague(l)}
                      style={[styles.leaguePill, active && styles.leaguePillActive]}
                    >
                      <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>
                        {l.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </GlassCard>
          </View>

          {/* Fixtures preview */}
          <View style={styles.section}>
            <SectionHeader
              title="Next fixtures"
              subtitle={`${league.label} • ${formatUkDate(fromIso)} → ${formatUkDate(toIso)}`}
            />
            <GlassCard style={styles.card} intensity={22}>
              {fxLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading fixtures…</Text>
                </View>
              ) : null}

              {!fxLoading && fxError ? (
                <EmptyState title="Couldn’t load fixtures" message={fxError} />
              ) : null}

              {!fxLoading && !fxError && fxRows.length === 0 ? (
                <EmptyState title="No fixtures found" message="Try another league or try again later." />
              ) : null}

              {!fxLoading && !fxError && fxPreview.length > 0 ? (
                <View style={styles.list}>
                  {fxPreview.map((r, idx) => {
                    const id = r?.fixture?.id;
                    const line = fixtureLine(r);
                    return (
                      <Pressable
                        key={String(id ?? idx)}
                        onPress={() =>
                          id ? router.push({ pathname: "/match/[id]", params: { id: String(id) } }) : null
                        }
                        style={styles.row}
                      >
                        <Text style={styles.rowTitle}>{line.title}</Text>
                        <Text style={styles.rowMeta}>{line.meta}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <Pressable onPress={() => router.push("/(tabs)/fixtures")} style={styles.linkBtn}>
                <Text style={styles.linkText}>See all fixtures</Text>
              </Pressable>
            </GlassCard>
          </View>

          {/* Trips preview */}
          <View style={styles.section}>
            <SectionHeader title="Your trips" subtitle="Your saved plans" />
            <GlassCard style={styles.card} intensity={22}>
              {!loadedTrips ? <EmptyState title="Loading trips" message="One moment…" /> : null}

              {loadedTrips && trips.length === 0 ? (
                <EmptyState title="No trips yet" message="Build your first away day in under a minute." />
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

          <View style={{ height: 8 }} />
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
  },

  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  kpi: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },

  section: { marginTop: theme.spacing.lg },

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
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
  },
  linkText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  // Search
  searchCard: { padding: theme.spacing.md, marginTop: theme.spacing.sm },
  searchTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  searchSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
  search: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
  },
  searchHint: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
  searchSectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
    marginBottom: 6,
  },
  searchEmpty: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginTop: 6,
  },

  // Quick actions
  quickCard: { padding: theme.spacing.md, marginTop: theme.spacing.lg },
  quickTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  quickSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },

  btn: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  btnPrimary: {
    marginTop: 12,
    paddingVertical: 14,
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.40)",
  },
  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },
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
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  btnSecondaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  // League selector (wrap, no horizontal scroll)
  leagueWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  leaguePill: {
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
    fontSize: theme.fontSize.sm,
    fontWeight: "700",
  },
  leaguePillTextActive: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  // Next trip highlight
  nextTrip: {
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.35)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  nextTripKicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  nextTripTitle: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: "900",
  },
  nextTripMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
});
