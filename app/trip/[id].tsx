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
  Share,
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

import getCityGuide from "@/src/data/cityGuides/getCityGuide";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";

function formatTripRange(t: Trip) {
  return `${formatUkDateOnly(t.startDate)} → ${formatUkDateOnly(t.endDate)}`;
}

async function safeOpenUrl(url: string) {
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) throw new Error("Cannot open URL");
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn’t open link", "Your device could not open that link.");
  }
}

function enc(v: string) {
  return encodeURIComponent(v);
}

function isoDateOnly(isoMaybe?: string) {
  if (!isoMaybe) return undefined;
  const d = new Date(isoMaybe);
  if (Number.isNaN(d.getTime())) return undefined;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * v1 link builders (simple + reliable).
 * Later: swap these URLs to affiliate variants in one place.
 */
function buildFlightsUrl(city: string, startDate?: string, endDate?: string) {
  const safeCity = city?.trim() ? city.trim() : "your destination";
  if (startDate && endDate) {
    const q = `Flights to ${safeCity} return ${startDate} to ${endDate}`;
    return `https://www.google.com/search?q=${enc(q)}`;
  }
  const q = `Flights to ${safeCity}`;
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildHotelsUrl(city: string, startDate?: string, endDate?: string) {
  const safeCity = city?.trim() ? city.trim() : "your destination";
  const base = `https://www.booking.com/searchresults.html?ss=${enc(safeCity)}`;
  if (startDate && endDate) return `${base}&checkin=${enc(startDate)}&checkout=${enc(endDate)}`;
  return base;
}

function buildTicketsUrl(home?: string, away?: string, kickoffDate?: string) {
  const vs = home && away ? `${home} vs ${away}` : "match";
  const q = kickoffDate ? `${vs} tickets ${kickoffDate}` : `${vs} tickets`;
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildMapsWebUrl(venue?: string, city?: string) {
  const q = [venue, city].filter(Boolean).join(" ").trim();
  if (!q) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
}

async function openMapsPreferNative(query: string) {
  const q = query.trim();
  if (!q) return safeOpenUrl("https://www.google.com/maps");

  const geo = `geo:0,0?q=${enc(q)}`; // Android-native
  const web = `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;

  try {
    const canGeo = await Linking.canOpenURL(geo);
    await safeOpenUrl(canGeo ? geo : web);
  } catch {
    await safeOpenUrl(web);
  }
}

function subtitleOrFallback(value: string | null | undefined, fallback: string) {
  const v = String(value ?? "").trim();
  return v ? v : fallback;
}

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const id =
    typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

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
  const matchCount = matchIds.length;

  // ARCH: prefer stable citySlug if present; fall back to label.
  const cityLookupKey = useMemo(() => trip?.citySlug ?? trip?.cityId, [trip?.citySlug, trip?.cityId]);
  const { slug: cityKey, guide: cityGuide } = useMemo(() => getCityGuide(cityLookupKey), [cityLookupKey]);

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

  function goCityGuide() {
    if (!cityKey) {
      Alert.alert("City unavailable", "This trip doesn’t have a valid city yet.");
      return;
    }
    router.push({ pathname: "/city/[slug]", params: { slug: cityKey } });
  }

  function onEditTrip() {
    if (!trip) return;
    router.push({ pathname: "/trip/build", params: { tripId: trip.id } });
  }

  async function onShareTrip() {
    if (!trip) return;

    const primary = fixtureRows[0];
    const home = primary?.teams?.home?.name ?? "";
    const away = primary?.teams?.away?.name ?? "";
    const kick = formatUkDateTimeMaybe(primary?.fixture?.date);
    const venue = primary?.fixture?.venue?.name ?? "";
    const venueCity = primary?.fixture?.venue?.city ?? trip.cityId ?? "";

    const lines = [
      `YourNextAway trip`,
      ``,
      `City: ${trip.cityId || "Trip"}`,
      `Dates: ${formatTripRange(trip)}`,
      ...(home && away ? [`Match: ${home} vs ${away}`, `Kick-off: ${kick || "TBC"}`] : []),
      ...(venue ? [`Stadium: ${venue}`, ...(venueCity ? [`Location: ${venueCity}`] : [])] : []),
    ];

    try {
      await Share.share({ message: lines.join("\n") });
    } catch {
      Alert.alert("Couldn’t share", "Your device could not open the share sheet.");
    }
  }

  const primaryFixture = useMemo(() => (fixtureRows.length > 0 ? fixtureRows[0] : null), [fixtureRows]);

  const tripCityLabel = useMemo(() => {
    const raw = String(trip?.cityId ?? "").trim();
    return raw || "Trip";
  }, [trip?.cityId]);

  const primaryHome = primaryFixture?.teams?.home?.name as string | undefined;
  const primaryAway = primaryFixture?.teams?.away?.name as string | undefined;
  const primaryKickoffIso = isoDateOnly(primaryFixture?.fixture?.date as string | undefined);
  const primaryVenue = primaryFixture?.fixture?.venue?.name as string | undefined;
  const primaryVenueCity = primaryFixture?.fixture?.venue?.city as string | undefined;

  // Smart-but-safe V1 URLs
  const flightsUrl = useMemo(() => buildFlightsUrl(tripCityLabel, trip?.startDate, trip?.endDate), [
    tripCityLabel,
    trip?.startDate,
    trip?.endDate,
  ]);

  const hotelsUrl = useMemo(() => buildHotelsUrl(tripCityLabel, trip?.startDate, trip?.endDate), [
    tripCityLabel,
    trip?.startDate,
    trip?.endDate,
  ]);

  const ticketsUrl = useMemo(() => buildTicketsUrl(primaryHome, primaryAway, primaryKickoffIso), [
    primaryHome,
    primaryAway,
    primaryKickoffIso,
  ]);

  const mapsWebUrl = useMemo(
    () => buildMapsWebUrl(primaryVenue, primaryVenueCity || tripCityLabel),
    [primaryVenue, primaryVenueCity, tripCityLabel]
  );

  // Card subtitles with fallbacks (still render even if missing)
  const flightsSub = useMemo(() => {
    if (trip?.startDate && trip?.endDate) return `${formatUkDateOnly(trip.startDate)} → ${formatUkDateOnly(trip.endDate)}`;
    return "Set dates to refine search";
  }, [trip?.startDate, trip?.endDate]);

  const hotelsSub = useMemo(() => {
    if (trip?.startDate && trip?.endDate) return `${tripCityLabel} • ${formatUkDateOnly(trip.startDate)} → ${formatUkDateOnly(trip.endDate)}`;
    return `${tripCityLabel} • Add dates for availability`;
  }, [tripCityLabel, trip?.startDate, trip?.endDate]);

  const ticketsSub = useMemo(() => {
    if (primaryHome && primaryAway) {
      const when = primaryKickoffIso ? ` • ${primaryKickoffIso}` : "";
      return `${primaryHome} vs ${primaryAway}${when}`;
    }
    return "Select a match to refine search";
  }, [primaryHome, primaryAway, primaryKickoffIso]);

  const directionsSub = useMemo(() => {
    const venueLine = subtitleOrFallback(primaryVenue, "Open maps");
    const cityLine = subtitleOrFallback(primaryVenueCity || tripCityLabel, "");
    return [venueLine, cityLine].filter(Boolean).join(" • ");
  }, [primaryVenue, primaryVenueCity, tripCityLabel]);

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
              {/* SUMMARY */}
              <GlassCard style={styles.card} intensity={26}>
                <Text style={styles.h1}>{trip.cityId || "Trip"}</Text>
                <Text style={styles.muted}>{formatTripRange(trip)}</Text>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryLabel}>Matches</Text>
                    <Text style={styles.summaryValue}>{matchCount}</Text>
                  </View>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryLabel}>City guide</Text>
                    <Text style={styles.summaryValue}>{cityGuide ? "Available" : "—"}</Text>
                  </View>
                </View>

                {trip.notes?.trim() ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.label}>Notes</Text>
                    <Text style={styles.body}>{trip.notes.trim()}</Text>
                  </View>
                ) : null}

                {/* Hub actions */}
                <View style={styles.actionsGrid}>
                  <Pressable onPress={onEditTrip} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Edit trip</Text>
                  </Pressable>

                  <Pressable onPress={onShareTrip} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Share trip</Text>
                  </Pressable>

                  <Pressable onPress={() => router.push("/trip/build")} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Build another</Text>
                  </Pressable>

                  <Pressable onPress={onDelete} style={[styles.actionBtn, styles.dangerBtn]}>
                    <Text style={styles.actionText}>Delete</Text>
                  </Pressable>
                </View>

                <Text style={styles.smallPrint}>Trip ID: {trip.id}</Text>
              </GlassCard>

              {/* BOOK YOUR TRIP (v1 CTAs) */}
              <GlassCard style={styles.card} intensity={24}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h2}>Book your trip</Text>
                    <Text style={styles.muted}>Fast links for flights, accommodation, tickets, and directions.</Text>
                  </View>
                </View>

                <View style={styles.ctaGrid}>
                  <Pressable onPress={() => safeOpenUrl(flightsUrl)} style={styles.bigCtaBtn}>
                    <Text style={styles.bigCtaKicker}>Flights</Text>
                    <Text style={styles.bigCtaTitle}>Search flights</Text>
                    <Text style={styles.bigCtaSub}>{flightsSub}</Text>
                  </Pressable>

                  <Pressable onPress={() => safeOpenUrl(hotelsUrl)} style={styles.bigCtaBtn}>
                    <Text style={styles.bigCtaKicker}>Accommodation</Text>
                    <Text style={styles.bigCtaTitle}>Find hotels</Text>
                    <Text style={styles.bigCtaSub}>{hotelsSub}</Text>
                  </Pressable>

                  <Pressable onPress={() => safeOpenUrl(ticketsUrl)} style={styles.bigCtaBtn}>
                    <Text style={styles.bigCtaKicker}>Tickets</Text>
                    <Text style={styles.bigCtaTitle}>Find tickets</Text>
                    <Text style={styles.bigCtaSub}>{ticketsSub}</Text>
                  </Pressable>

                  <Pressable
                    onPress={async () => {
                      const q = [primaryVenue, primaryVenueCity || tripCityLabel].filter(Boolean).join(" ");
                      if (!q.trim()) return safeOpenUrl(mapsWebUrl);
                      await openMapsPreferNative(q);
                    }}
                    style={styles.bigCtaBtn}
                  >
                    <Text style={styles.bigCtaKicker}>Directions</Text>
                    <Text style={styles.bigCtaTitle}>Get to stadium</Text>
                    <Text style={styles.bigCtaSub}>{directionsSub}</Text>
                  </Pressable>
                </View>

                <Text style={styles.smallPrint}>
                  Note: These are v1 link-outs (reliable). Swap to affiliate / provider deep links later.
                </Text>
              </GlassCard>

              {/* CITY GUIDE */}
              <GlassCard style={styles.card} intensity={24}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.h2}>City guide</Text>
                    <Text style={styles.muted}>
                      {cityGuide ? `${cityGuide.name}, ${cityGuide.country}` : "Limited rollout (top 5 league capitals)."}
                    </Text>
                  </View>

                  {cityGuide?.tripAdvisorTopThingsUrl ? (
                    <Pressable onPress={() => safeOpenUrl(cityGuide.tripAdvisorTopThingsUrl!)} style={styles.ctaBtn}>
                      <Text style={styles.ctaText}>TripAdvisor Top 10</Text>
                    </Pressable>
                  ) : null}
                </View>

                <Pressable onPress={goCityGuide} style={[styles.ctaBtn, { marginTop: 10 }]}>
                  <Text style={styles.ctaText}>Open full guide</Text>
                </Pressable>

                {!cityGuide ? (
                  <View style={{ marginTop: 12 }}>
                    <EmptyState
                      title="No guide for this city yet"
                      message={`Saved trip city: “${trip.cityId || "—"}”\nSaved trip slug: “${trip.citySlug || "—"}”\nLookup key: “${cityKey || "—"}”`}
                    />
                  </View>
                ) : (
                  <>
                    <Text style={[styles.body, { marginTop: 12 }]}>{cityGuide.overview}</Text>

                    <View style={{ marginTop: 14 }}>
                      <Text style={styles.sectionTitle}>Top 10 things to do</Text>
                      <View style={styles.bullets}>
                        {cityGuide.topThings.slice(0, 10).map((x, i) => (
                          <View key={`${x.title}-${i}`} style={styles.bulletRow}>
                            <Text style={styles.bulletIndex}>{i + 1}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.bulletTitle}>{x.title}</Text>
                              <Text style={styles.bulletTip}>{x.tip}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={{ marginTop: 14 }}>
                      <Text style={styles.sectionTitle}>Local tips</Text>
                      <View style={styles.tipList}>
                        {cityGuide.tips.map((t, i) => (
                          <Text key={`${t}-${i}`} style={styles.tipItem}>
                            • {t}
                          </Text>
                        ))}
                      </View>
                    </View>

                    {(cityGuide.transport || cityGuide.accommodation) ? (
                      <View style={{ marginTop: 14 }}>
                        <Text style={styles.sectionTitle}>Practical info</Text>

                        {cityGuide.transport ? (
                          <View style={{ marginTop: 8 }}>
                            <Text style={styles.label}>Transport</Text>
                            <Text style={styles.body}>{cityGuide.transport}</Text>
                          </View>
                        ) : null}

                        {cityGuide.accommodation ? (
                          <View style={{ marginTop: 10 }}>
                            <Text style={styles.label}>Accommodation</Text>
                            <Text style={styles.body}>{cityGuide.accommodation}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                )}
              </GlassCard>

              {/* MATCHES */}
              <GlassCard style={styles.card} intensity={24}>
                <Text style={styles.h2}>Matches</Text>
                <Text style={styles.muted}>{matchCount} match{matchCount === 1 ? "" : "es"} linked</Text>

                {loadingFixtures ? (
                  <View style={styles.center}>
                    <ActivityIndicator />
                    <Text style={styles.muted}>Loading match details…</Text>
                  </View>
                ) : null}

                {!loadingFixtures && fixtureError ? <EmptyState title="Couldn’t load matches" message={fixtureError} /> : null}

                {!loadingFixtures && !fixtureError && matchCount > 0 && fixtureRows.length === 0 ? (
                  <EmptyState title="No match details yet" message="Matches are linked, but details are unavailable." />
                ) : null}

                {!loadingFixtures && !fixtureError && fixtureRows.length > 0 ? (
                  <View style={styles.list}>
                    {fixtureRows.map((r, idx) => {
                      const fixtureId = r?.fixture?.id ?? matchIds[idx];
                      const home = r?.teams?.home?.name ?? "Home";
                      const away = r?.teams?.away?.name ?? "Away";
                      const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
                      const kickoffIso = isoDateOnly(r?.fixture?.date);
                      const venue = r?.fixture?.venue?.name ?? "";
                      const city = r?.fixture?.venue?.city ?? "";
                      const extra = [venue, city].filter(Boolean).join(" • ");
                      const line2 = extra ? `${kickoff} • ${extra}` : kickoff;

                      const matchTicketsUrl = buildTicketsUrl(home, away, kickoffIso);
                      const mapQuery = [venue, city || tripCityLabel].filter(Boolean).join(" ");

                      return (
                        <View key={String(fixtureId ?? idx)} style={styles.matchCard}>
                          <Pressable
                            onPress={() => {
                              if (!fixtureId) return;
                              router.push({ pathname: "/match/[id]", params: { id: String(fixtureId) } });
                            }}
                            style={styles.rowTop}
                          >
                            <Text style={styles.rowTitle}>
                              {home} vs {away}
                            </Text>
                            <Text style={styles.rowMeta}>{line2}</Text>
                          </Pressable>

                          <View style={styles.matchQuickRow}>
                            <Pressable onPress={() => safeOpenUrl(matchTicketsUrl)} style={styles.smallPill}>
                              <Text style={styles.smallPillText}>Tickets</Text>
                            </Pressable>

                            <Pressable
                              onPress={async () => {
                                if (!mapQuery.trim()) return safeOpenUrl("https://www.google.com/maps");
                                await openMapsPreferNative(mapQuery);
                              }}
                              style={styles.smallPill}
                            >
                              <Text style={styles.smallPillText}>Directions</Text>
                            </Pressable>
                          </View>
                        </View>
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

  h1: { fontSize: theme.fontSize.xl, fontWeight: "900", color: theme.colors.text },
  h2: { fontSize: theme.fontSize.lg, fontWeight: "900", color: theme.colors.text },

  muted: { marginTop: 6, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },

  label: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, marginBottom: 6 },
  body: { color: theme.colors.text, fontSize: theme.fontSize.md, lineHeight: 20 },

  smallPrint: { marginTop: 12, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },

  // Summary pills
  summaryRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  summaryPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryLabel: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "800" },
  summaryValue: { marginTop: 6, color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "900" },

  // Hub actions
  actionsGrid: { marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: {
    width: "48%",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
  },
  dangerBtn: { borderColor: "rgba(255, 80, 80, 0.6)" },
  actionText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  // Card header
  cardHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },

  ctaBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignSelf: "flex-start",
  },
  ctaText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  // Book your trip
  ctaGrid: { marginTop: 12, gap: 10 },
  bigCtaBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.28)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bigCtaKicker: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.xs,
    letterSpacing: 0.2,
  },
  bigCtaTitle: {
    marginTop: 6,
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: theme.fontSize.md,
  },
  bigCtaSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },

  // City guide content
  sectionTitle: { marginTop: 2, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

  bullets: { marginTop: 10, gap: 10 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletIndex: {
    width: 22,
    textAlign: "center",
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.sm,
    marginTop: 1,
  },
  bulletTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  bulletTip: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  tipList: { marginTop: 10, gap: 8 },
  tipItem: { color: theme.colors.text, fontSize: theme.fontSize.sm, lineHeight: 18 },

  // Matches list
  list: { marginTop: 12, gap: 12 },

  matchCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 14,
    overflow: "hidden",
  },
  rowTop: { paddingVertical: 12, paddingHorizontal: 12 },
  rowTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  matchQuickRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  smallPill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 10,
    alignItems: "center",
  },
  smallPillText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },
});
