// app/trip/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import tripsStore, { type Trip } from "@/src/state/trips";
import { getFixtureById } from "@/src/services/apiFootball";

import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getCityGuide } from "@/src/data/cityGuides";

function normalizeCityKey(input: string | undefined | null): string {
  if (!input) return "";
  return String(input).trim().toLowerCase();
}

function formatTripRange(t: Trip) {
  return `${formatUkDateOnly(t.startDate)} → ${formatUkDateOnly(t.endDate)}`;
}

function makeTripAdvisorSearchUrl(cityName: string) {
  const q = encodeURIComponent(`${cityName} top things to do`);
  return `https://www.tripadvisor.com/Search?q=${q}`;
}

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : undefined;

  const [loaded, setLoaded] = useState(tripsStore.getState().loaded);
  const [trip, setTrip] = useState<Trip | null>(null);

  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [fixtureRows, setFixtureRows] = useState<any[]>([]);
  const [fixtureError, setFixtureError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoaded(s.loaded);
      if (!id) return;
      setTrip(s.trips.find((x) => x.id === id) ?? null);
    });

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips();
    } else if (id) {
      const s = tripsStore.getState();
      setTrip(s.trips.find((x) => x.id === id) ?? null);
    }

    return unsub;
  }, [id]);

  const matchIds = useMemo(() => trip?.matchIds ?? [], [trip]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!trip || matchIds.length === 0) {
        setFixtureRows([]);
        setFixtureError(null);
        return;
      }

      setLoadingFixtures(true);
      setFixtureError(null);
      setFixtureRows([]);

      try {
        const results = await Promise.all(matchIds.map((mid) => getFixtureById(mid)));
        if (cancelled) return;

        const rows = results.filter(Boolean);
        setFixtureRows(rows);
      } catch (e: any) {
        if (cancelled) return;
        setFixtureError(e?.message ?? "Failed to load fixtures for this trip.");
      } finally {
        if (!cancelled) setLoadingFixtures(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [trip, matchIds]);

  const cityName = useMemo(() => (trip?.cityId || "").trim(), [trip?.cityId]);
  const cityKey = useMemo(() => normalizeCityKey(cityName), [cityName]);

  const guide = useMemo(() => getCityGuide(cityKey), [cityKey]);

  const tripAdvisorUrl = useMemo(() => {
    if (guide?.tripAdvisorTopThingsUrl) return guide.tripAdvisorTopThingsUrl;
    return cityName ? makeTripAdvisorSearchUrl(cityName) : makeTripAdvisorSearchUrl("city");
  }, [guide?.tripAdvisorTopThingsUrl, cityName]);

  async function openUrl(url: string) {
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert("Can’t open link", "Your device couldn’t open this link.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Can’t open link", "Something went wrong opening that link.");
    }
  }

  function onDelete() {
    if (!trip) return;

    Alert.alert("Delete trip?", "This will remove the trip from your device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await tripsStore.removeTrip(trip.id);
          router.replace("/(tabs)/trips");
        },
      },
    ]);
  }

  return (
    <Background imageUrl={getBackground("trips")}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Trip Details",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {!loaded ? (
            <GlassCard style={styles.card}>
              <EmptyState title="Loading trip" message="One moment…" />
            </GlassCard>
          ) : null}

          {loaded && (!id || !trip) ? (
            <GlassCard style={styles.card}>
              <EmptyState title="Trip not found" message="This trip doesn’t exist on this device." />
            </GlassCard>
          ) : null}

          {loaded && id && trip ? (
            <>
              {/* TRIP SUMMARY */}
              <GlassCard style={styles.card}>
                <Text style={styles.h1}>{trip.cityId || "Trip"}</Text>
                <Text style={styles.muted}>{formatTripRange(trip)}</Text>

                {trip.notes?.trim() ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.label}>Notes</Text>
                    <Text style={styles.body}>{trip.notes.trim()}</Text>
                  </View>
                ) : null}

                <View style={styles.actions}>
                  <Pressable onPress={() => router.push("/trip/build")} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Build Another</Text>
                  </Pressable>

                  <Pressable onPress={onDelete} style={[styles.actionBtn, styles.dangerBtn]}>
                    <Text style={styles.actionText}>Delete</Text>
                  </Pressable>
                </View>

                <Text style={styles.smallPrint}>Trip ID: {trip.id}</Text>
              </GlassCard>

              {/* CITY INTEL */}
              <GlassCard style={styles.card}>
                <Text style={styles.h2}>City intel</Text>
                <Text style={styles.muted}>
                  {guide?.hasGuide
                    ? `${guide.name}, ${guide.country} • Top things, tips, and matchday notes`
                    : "We don’t have a full guide for this city yet — but you can still get top things to do."}
                </Text>

                <Pressable onPress={() => openUrl(tripAdvisorUrl)} style={styles.primaryLinkBtn}>
                  <Text style={styles.primaryLinkText}>Open TripAdvisor: Top things to do</Text>
                </Pressable>

                {guide?.hasGuide ? (
                  <>
                    {guide.vibe ? (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.sectionTitle}>Vibe</Text>
                        <Text style={styles.body}>{guide.vibe}</Text>
                      </View>
                    ) : null}

                    {Array.isArray(guide.topThingsToDo) && guide.topThingsToDo.length > 0 ? (
                      <View style={{ marginTop: 14 }}>
                        <Text style={styles.sectionTitle}>Top things to do</Text>
                        <View style={styles.bulletList}>
                          {guide.topThingsToDo.slice(0, 10).map((x, idx) => (
                            <View key={`${x.title}-${idx}`} style={styles.bulletRow}>
                              <Text style={styles.bulletDot}>•</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.bulletTitle}>{x.title}</Text>
                                <Text style={styles.bulletMeta}>{x.tip}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}

                    {Array.isArray(guide.cityTips) && guide.cityTips.length > 0 ? (
                      <View style={{ marginTop: 14 }}>
                        <Text style={styles.sectionTitle}>City tips</Text>
                        <View style={styles.bulletList}>
                          {guide.cityTips.slice(0, 8).map((tip, idx) => (
                            <View key={`ct-${idx}`} style={styles.bulletRow}>
                              <Text style={styles.bulletDot}>•</Text>
                              <Text style={[styles.body, { flex: 1 }]}>{tip}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}

                    {Array.isArray(guide.matchdayTips) && guide.matchdayTips.length > 0 ? (
                      <View style={{ marginTop: 14 }}>
                        <Text style={styles.sectionTitle}>Matchday tips</Text>
                        <View style={styles.bulletList}>
                          {guide.matchdayTips.slice(0, 6).map((tip, idx) => (
                            <View key={`mt-${idx}`} style={styles.bulletRow}>
                              <Text style={styles.bulletDot}>•</Text>
                              <Text style={[styles.body, { flex: 1 }]}>{tip}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View style={{ marginTop: 12 }}>
                    <EmptyState
                      title="City guide coming soon"
                      message="We’re building city guides with top things to do, local tips, and matchday intel. For now, use TripAdvisor above."
                    />
                  </View>
                )}
              </GlassCard>

              {/* MATCHES */}
              <GlassCard style={styles.card}>
                <Text style={styles.h2}>Matches</Text>
                <Text style={styles.muted}>
                  {matchIds.length} match{matchIds.length === 1 ? "" : "es"} linked
                </Text>

                {loadingFixtures ? (
                  <View style={styles.center}>
                    <ActivityIndicator />
                    <Text style={styles.muted}>Loading match details…</Text>
                  </View>
                ) : null}

                {!loadingFixtures && fixtureError ? (
                  <EmptyState title="Couldn’t load matches" message={fixtureError} />
                ) : null}

                {!loadingFixtures && !fixtureError && matchIds.length > 0 && fixtureRows.length === 0 ? (
                  <EmptyState title="No match details yet" message="Matches are linked, but details are unavailable." />
                ) : null}

                {!loadingFixtures && !fixtureError && fixtureRows.length > 0 ? (
                  <View style={styles.list}>
                    {fixtureRows.map((r, idx) => {
                      const fixtureId = r?.fixture?.id ?? matchIds[idx];
                      const home = r?.teams?.home?.name ?? "Home";
                      const away = r?.teams?.away?.name ?? "Away";
                      const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
                      const venue = r?.fixture?.venue?.name ?? "";
                      const line2 = venue ? `${kickoff} • ${venue}` : kickoff;

                      return (
                        <Pressable
                          key={String(fixtureId ?? idx)}
                          onPress={() => {
                            if (!fixtureId) return;
                            router.push({ pathname: "/match/[id]", params: { id: String(fixtureId) } });
                          }}
                          style={styles.row}
                        >
                          <Text style={styles.rowTitle}>
                            {home} vs {away}
                          </Text>
                          <Text style={styles.rowMeta}>{line2}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </GlassCard>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100 },
  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  card: { padding: theme.spacing.lg },

  h1: {
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
    color: theme.colors.text,
  },
  h2: {
    fontSize: theme.fontSize.lg,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 6,
  },
  muted: {
    marginTop: 6,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: "900",
    marginBottom: 8,
  },

  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginBottom: 6,
  },
  body: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    lineHeight: 20,
  },

  bulletList: { gap: 10 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletDot: { color: theme.colors.textSecondary, marginTop: 2 },
  bulletTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  bulletMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  primaryLinkBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
  },
  primaryLinkText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  actions: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
  },
  dangerBtn: {
    borderColor: "rgba(255, 80, 80, 0.6)",
  },
  actionText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
  },

  smallPrint: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },

  list: { marginTop: 10, gap: 10 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowTitle: { color: theme.colors.text, fontWeight: "800", fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },
});
