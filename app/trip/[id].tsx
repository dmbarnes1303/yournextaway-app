// app/trip/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import SectionHeader from "@/src/components/SectionHeader";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import { getFixtureById } from "@/src/services/apiFootball";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getTopThingsToDoForTrip } from "@/src/data/cityGuides";

/* -------------------------------- Helpers -------------------------------- */

function coerceId(v: unknown): string | null {
  if (typeof v === "string") {
    const s = v.trim();
    return s ? s : null;
  }
  if (Array.isArray(v) && typeof v[0] === "string") {
    const s = v[0].trim();
    return s ? s : null;
  }
  return null;
}

function summaryLine(t: Trip) {
  const a = t.startDate ? formatUkDateOnly(t.startDate) : "—";
  const b = t.endDate ? formatUkDateOnly(t.endDate) : "—";
  const n = t.matchIds?.length ?? 0;
  return `${a} → ${b} • ${n} match${n === 1 ? "" : "es"}`;
}

async function safeOpenUrl(url: string) {
  const u = String(url ?? "").trim();
  if (!u) return;

  try {
    const can = await Linking.canOpenURL(u);
    if (!can) throw new Error("Cannot open URL");
    await Linking.openURL(u);
  } catch {
    Alert.alert("Couldn’t open link", "Your device could not open that link.");
  }
}

/* -------------------------------- Screen -------------------------------- */

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const tripId = useMemo(() => coerceId((params as any)?.id), [params]);

  const [loaded, setLoaded] = useState(tripsStore.getState().loaded);
  const [trip, setTrip] = useState<Trip | null>(null);

  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fixture, setFixture] = useState<any | null>(null);

  // Subscribe to trips store + load if needed
  useEffect(() => {
    let mounted = true;

    const sync = () => {
      const s = tripsStore.getState();
      if (!mounted) return;

      setLoaded(s.loaded);

      if (!tripId) {
        setTrip(null);
        return;
      }

      const t = s.trips.find((x) => x.id === tripId) ?? null;
      setTrip(t);
    };

    const unsub = tripsStore.subscribe(() => sync());

    // initial
    sync();

    // ensure loaded
    (async () => {
      if (!tripsStore.getState().loaded) {
        try {
          await tripsStore.loadTrips();
        } catch {
          // best-effort; UI handles not found
        } finally {
          sync();
        }
      }
    })();

    return () => {
      mounted = false;
      unsub();
    };
  }, [tripId]);

  // Load linked fixture (if any)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setFxError(null);
      setFixture(null);

      const matchId = trip?.matchIds?.[0] ? String(trip.matchIds[0]) : null;
      if (!matchId) return;

      setFxLoading(true);
      try {
        const r = await getFixtureById(matchId);
        if (cancelled) return;

        if (!r) {
          setFxError("Match details couldn’t be loaded right now.");
          return;
        }

        setFixture(r);
      } catch (e: any) {
        if (cancelled) return;
        setFxError(e?.message ?? "Match details couldn’t be loaded.");
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [trip?.matchIds]);

  const cityName = useMemo(() => {
    const fromTrip = String(trip?.cityId ?? "").trim();
    if (fromTrip) return fromTrip;

    const fromFixture = String(fixture?.fixture?.venue?.city ?? "").trim();
    if (fromFixture) return fromFixture;

    return "Trip";
  }, [trip?.cityId, fixture]);

  const matchLine = useMemo(() => {
    if (!fixture) return null;
    const home = fixture?.teams?.home?.name ?? "Home";
    const away = fixture?.teams?.away?.name ?? "Away";
    const kick = formatUkDateTimeMaybe(fixture?.fixture?.date);
    const venue = fixture?.fixture?.venue?.name ?? "";
    const city = fixture?.fixture?.venue?.city ?? "";
    const extra = [venue, city].filter(Boolean).join(" • ");
    return {
      title: `${home} vs ${away}`,
      meta: extra ? `${kick} • ${extra}` : kick,
      fixtureId: fixture?.fixture?.id != null ? String(fixture.fixture.id) : null,
    };
  }, [fixture]);

  const cityBundle = useMemo(() => {
    if (!cityName || cityName === "Trip") return null;
    return getTopThingsToDoForTrip(cityName);
  }, [cityName]);

  function onEdit() {
    if (!trip) return;
    router.push({ pathname: "/trip/build", params: { tripId: trip.id } } as any);
  }

  function onOpenMatch() {
    const id = matchLine?.fixtureId;
    if (!id) return;
    router.push({ pathname: "/match/[id]", params: { id } } as any);
  }

  async function onDelete() {
    if (!trip) return;

    Alert.alert("Delete trip?", "This will remove the trip from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await tripsStore.removeTrip(trip.id);
            router.replace("/(tabs)/trips");
          } catch {
            Alert.alert("Couldn’t delete", "Something went wrong removing this trip.");
          }
        },
      },
    ]);
  }

  return (
    <Background imageUrl={getBackground("trips")} overlayOpacity={0.86}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Trip",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: theme.spacing.xxl + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          {!tripId ? (
            <GlassCard style={styles.card} intensity={24}>
              <EmptyState title="Missing trip id" message="This screen was opened without a valid trip id." />
              <Pressable onPress={() => router.replace("/(tabs)/trips")} style={styles.linkBtn}>
                <Text style={styles.linkText}>Back to Trips</Text>
              </Pressable>
            </GlassCard>
          ) : null}

          {tripId && !loaded ? (
            <GlassCard style={styles.card} intensity={24}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trip…</Text>
              </View>
            </GlassCard>
          ) : null}

          {tripId && loaded && !trip ? (
            <GlassCard style={styles.card} intensity={24}>
              <EmptyState title="Trip not found" message="It may have been deleted or not saved on this device." />
              <Pressable onPress={() => router.replace("/(tabs)/trips")} style={styles.linkBtn}>
                <Text style={styles.linkText}>Back to Trips</Text>
              </Pressable>
            </GlassCard>
          ) : null}

          {trip ? (
            <>
              <GlassCard style={styles.hero} intensity={26}>
                <Text style={styles.kicker}>YOUR TRIP</Text>
                <Text style={styles.cityTitle} numberOfLines={1}>
                  {cityName}
                </Text>
                <Text style={styles.heroMeta}>{summaryLine(trip)}</Text>

                {trip.notes ? (
                  <View style={styles.notesBlock}>
                    <Text style={styles.notesTitle}>Notes</Text>
                    <Text style={styles.notesText}>{trip.notes}</Text>
                  </View>
                ) : null}

                <View style={styles.heroActions}>
                  <Pressable onPress={onEdit} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={onDelete} style={[styles.btn, styles.btnDanger]}>
                    <Text style={styles.btnDangerText}>Delete</Text>
                  </Pressable>
                </View>
              </GlassCard>

              <View style={styles.section}>
                <SectionHeader title="Match" subtitle="The fixture linked to this trip" />
                <GlassCard style={styles.card} intensity={24}>
                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Loading match…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && fxError ? <EmptyState title="Match unavailable" message={fxError} /> : null}

                  {!fxLoading && !fxError && !fixture ? (
                    <EmptyState title="No match linked" message="Edit this trip to choose a fixture." />
                  ) : null}

                  {matchLine ? (
                    <>
                      <Text style={styles.rowTitle}>{matchLine.title}</Text>
                      <Text style={styles.rowMeta}>{matchLine.meta}</Text>

                      <Pressable onPress={onOpenMatch} style={styles.linkBtn}>
                        <Text style={styles.linkText}>Open match</Text>
                      </Pressable>
                    </>
                  ) : null}
                </GlassCard>
              </View>

              <View style={styles.section}>
                <SectionHeader title="In the city" subtitle="Quick inspiration for your break" />
                <GlassCard style={styles.card} intensity={24}>
                  {!cityBundle ? (
                    <EmptyState title="No city bundle" message="Select a fixture with a venue city to see curated picks." />
                  ) : (
                    <>
                      <Text style={styles.cityBlockTitle}>Top things to do</Text>
                      <Text style={styles.cityBlockSub}>
                        {cityBundle.hasGuide ? "Curated picks + quick tips." : "No curated guide yet — browse current picks."}
                      </Text>

                      {cityBundle.hasGuide && (cityBundle.items?.length ?? 0) > 0 ? (
                        <View style={styles.thingsList}>
                          {cityBundle.items.slice(0, 6).map((it, idx) => (
                            <View key={`${it.title}-${idx}`} style={styles.thingRow}>
                              <Text style={styles.thingIdx}>{idx + 1}.</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.thingTitle}>{it.title}</Text>
                                {it.description ? <Text style={styles.thingDesc}>{it.description}</Text> : null}
                              </View>
                            </View>
                          ))}
                          {(cityBundle.items?.length ?? 0) > 6 ? (
                            <Text style={styles.moreInline}>More in the full city guide.</Text>
                          ) : null}
                        </View>
                      ) : null}

                      {cityBundle.hasGuide && (cityBundle.quickTips?.length ?? 0) > 0 ? (
                        <View style={styles.tipsBlock}>
                          <Text style={styles.tipsTitle}>Quick tips</Text>
                          {cityBundle.quickTips.slice(0, 5).map((t, idx) => (
                            <Text key={`${t}-${idx}`} style={styles.tipLine}>
                              • {t}
                            </Text>
                          ))}
                        </View>
                      ) : null}

                      {cityBundle.tripAdvisorUrl ? (
                        <Pressable onPress={() => safeOpenUrl(cityBundle.tripAdvisorUrl)} style={[styles.linkBtn, { marginTop: 12 }]}>
                          <Text style={styles.linkText}>Open TripAdvisor</Text>
                        </Pressable>
                      ) : null}
                    </>
                  )}
                </GlassCard>
              </View>
            </>
          ) : null}

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------- Styles -------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  section: { marginTop: 2 },

  hero: { padding: theme.spacing.lg },

  kicker: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
  },

  cityTitle: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.black,
    lineHeight: 30,
  },

  heroMeta: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  notesBlock: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  notesTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },
  notesText: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  heroActions: { marginTop: 14, flexDirection: "row", gap: 10 },

  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  btnPrimary: { borderColor: "rgba(0,255,136,0.55)" },
  btnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  btnDanger: { borderColor: "rgba(255, 80, 80, 0.30)" },
  btnDangerText: { color: "rgba(255, 120, 120, 0.95)", fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  card: { padding: theme.spacing.lg },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  rowTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  linkBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  linkText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  cityBlockTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  cityBlockSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  thingsList: { marginTop: 10, gap: 10 },
  thingRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  thingIdx: { width: 18, color: theme.colors.primary, fontWeight: theme.fontWeight.black },
  thingTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black },
  thingDesc: { marginTop: 4, color: theme.colors.textSecondary, lineHeight: 18 },

  moreInline: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  tipsBlock: { marginTop: 12 },
  tipsTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm, marginBottom: 6 },
  tipLine: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },
});
