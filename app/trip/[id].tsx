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
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { parseIsoDateOnly, toIsoDate } from "@/src/constants/football";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";

import type { SavedItem } from "@/src/core/savedItemTypes";
import {
  getSavedItemGroupKey,
  getSavedItemGroupTitle,
  groupOrder,
} from "@/src/core/savedItemTypes";

import type { PartnerId } from "@/src/core/partners";
import { beginPartnerClick, openPartnerUrl } from "@/src/services/partnerClicks";

import { getFixtureById } from "@/src/services/apiFootball";
import { formatUkDateOnly } from "@/src/utils/formatters";
import { buildAffiliateLinks } from "@/src/services/affiliateLinks";

/* -------------------------------------------------------------------------- */
/* helpers */
/* -------------------------------------------------------------------------- */

function coerceId(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || null;
  return null;
}

function summaryLine(t: Trip) {
  const a = t.startDate ? formatUkDateOnly(t.startDate) : "—";
  const b = t.endDate ? formatUkDateOnly(t.endDate) : "—";
  const n = t.matchIds?.length ?? 0;
  return `${a} → ${b} • ${n} match${n === 1 ? "" : "es"}`;
}

function tripStatus(t: Trip): "Draft" | "Upcoming" | "Past" {
  const start = t.startDate ? parseIsoDateOnly(t.startDate) : null;
  const end = t.endDate ? parseIsoDateOnly(t.endDate) : null;
  if (!start || !end) return "Draft";

  const today = parseIsoDateOnly(toIsoDate(new Date()));
  if (!today) return "Draft";

  if (end.getTime() < today.getTime()) return "Past";
  return "Upcoming";
}

function groupByBucket(items: SavedItem[]) {
  const map = new Map<string, SavedItem[]>();
  for (const it of items) {
    const key = getSavedItemGroupKey(it.type);
    const arr = map.get(key) ?? [];
    arr.push(it);
    map.set(key, arr);
  }
  const entries = [...map.entries()];
  entries.sort((a, b) => groupOrder(a[0] as any) - groupOrder(b[0] as any));
  return entries;
}

/* -------------------------------------------------------------------------- */
/* screen */
/* -------------------------------------------------------------------------- */

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const tripId = useMemo(() => coerceId((params as any)?.id), [params]);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripsLoaded, setTripsLoaded] = useState(tripsStore.getState().loaded);

  const [savedLoaded, setSavedLoaded] = useState(savedItemsStore.getState().loaded);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  const [fixturesById, setFixturesById] = useState<Record<string, any>>({});
  const [fxLoading, setFxLoading] = useState(false);

  /* ---------------- load trip ---------------- */

  useEffect(() => {
    const sync = () => {
      const s = tripsStore.getState();
      setTripsLoaded(s.loaded);
      setTrip(s.trips.find((x) => x.id === tripId) ?? null);
    };

    const unsub = tripsStore.subscribe(sync);
    sync();

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().finally(sync);
    }

    return () => unsub();
  }, [tripId]);

  /* ---------------- load saved items ---------------- */

  useEffect(() => {
    const sync = () => {
      const s = savedItemsStore.getState();
      setSavedLoaded(s.loaded);
      setSavedItems(s.items.filter((x) => x.tripId === tripId));
    };

    const unsub = savedItemsStore.subscribe(sync);
    sync();

    if (!savedItemsStore.getState().loaded) {
      savedItemsStore.load().finally(sync);
    }

    return () => unsub();
  }, [tripId]);

  /* ---------------- load fixtures ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!trip?.matchIds?.length) {
        setFixturesById({});
        return;
      }

      setFxLoading(true);

      try {
        const map: Record<string, any> = {};
        for (const id of trip.matchIds) {
          const r = await getFixtureById(String(id));
          if (r) map[String(id)] = r;
        }
        if (!cancelled) setFixturesById(map);
      } finally {
        if (!cancelled) setFxLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [trip?.matchIds]);

  /* ---------------- derived ---------------- */

  const status = useMemo(() => (trip ? tripStatus(trip) : "Draft"), [trip]);

  const cityName = useMemo(() => {
    if (trip?.cityId) return trip.cityId;
    const first = trip?.matchIds?.[0];
    return fixturesById[first]?.fixture?.venue?.city || "Trip";
  }, [trip, fixturesById]);

  const links = useMemo(() => {
    if (!trip || !cityName || cityName === "Trip") return null;
    return buildAffiliateLinks({
      city: cityName,
      startDate: trip.startDate,
      endDate: trip.endDate,
    });
  }, [trip, cityName]);

  const booked = useMemo(() => savedItems.filter((x) => x.status === "booked"), [savedItems]);
  const pending = useMemo(() => savedItems.filter((x) => x.status === "pending"), [savedItems]);

  const bookedBuckets = useMemo(() => groupByBucket(booked), [booked]);

  const loading = Boolean(tripId) && (!tripsLoaded || !savedLoaded);

  /* ---------------- navigation ---------------- */

  function onEditTrip() {
    if (!trip) return;
    router.push({ pathname: "/trip/build", params: { tripId: trip.id } } as any);
  }

  /* -------------------------------------------------------------------------- */
  /* STANDARD OPEN FLOW */
  /* -------------------------------------------------------------------------- */

  async function openUntracked(url?: string) {
    if (!url) return;
    try {
      await openPartnerUrl(url);
    } catch {
      Alert.alert("Couldn’t open link");
    }
  }

  async function openTrackedPartner(args: {
    partnerId: PartnerId;
    url: string;
    title: string;
    savedItemType?: any;
    metadata?: Record<string, any>;
  }) {
    if (!tripId) {
      Alert.alert(
        "Save trip first",
        "Save this trip before booking so we can track your confirmations in Wallet."
      );
      return;
    }

    if (args.partnerId === "googlemaps") {
      await openUntracked(args.url);
      return;
    }

    try {
      await beginPartnerClick({
        tripId,
        partnerId: args.partnerId,
        url: args.url,
        title: args.title,
        savedItemType: args.savedItemType,
        metadata: args.metadata,
      });
    } catch {
      await openUntracked(args.url);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* render */
  /* -------------------------------------------------------------------------- */

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.86}>
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
          contentContainerStyle={[
            styles.content,
            { paddingBottom: theme.spacing.xxl + insets.bottom },
          ]}
        >
          {!tripId && (
            <GlassCard style={styles.card}>
              <EmptyState title="Missing trip id" message="No trip id provided." />
            </GlassCard>
          )}

          {loading && (
            <GlassCard style={styles.card}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trip…</Text>
              </View>
            </GlassCard>
          )}

          {trip && (
            <>
              {/* HERO */}
              <GlassCard style={styles.hero}>
                <Text style={styles.kicker}>TRIP WORKSPACE</Text>
                <Text style={styles.cityTitle}>{cityName}</Text>
                <Text style={styles.heroMeta}>{summaryLine(trip)}</Text>

                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>{status}</Text>
                </View>

                {pending.length > 0 && (
                  <View style={styles.pendingBanner}>
                    <Text style={styles.pendingText}>
                      {pending.length} pending booking{pending.length === 1 ? "" : "s"}
                    </Text>
                  </View>
                )}

                <View style={styles.heroActions}>
                  <Pressable onPress={onEditTrip} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Edit trip</Text>
                  </Pressable>
                </View>
              </GlassCard>

              {/* BOOK YOUR TRIP */}
              {links && (
                <GlassCard style={styles.card}>
                  <Text style={styles.sectionTitle}>Book your trip</Text>

                  <View style={styles.bookGrid}>
                    <Pressable
                      style={styles.bookBtn}
                      onPress={() =>
                        openTrackedPartner({
                          partnerId: "expedia",
                          url: links.hotelsUrl,
                          title: `Stay: Hotels in ${cityName}`,
                          savedItemType: "hotel",
                          metadata: { city: cityName, startDate: trip.startDate, endDate: trip.endDate },
                        })
                      }
                    >
                      <Text style={styles.bookBtnText}>Stay</Text>
                      <Text style={styles.bookBtnSub}>Expedia</Text>
                    </Pressable>

                    <Pressable
                      style={styles.bookBtn}
                      onPress={() =>
                        openTrackedPartner({
                          partnerId: "aviasales",
                          url: links.flightsUrl,
                          title: `Flights to ${cityName}`,
                          savedItemType: "flight",
                          metadata: { city: cityName },
                        })
                      }
                    >
                      <Text style={styles.bookBtnText}>Flights</Text>
                      <Text style={styles.bookBtnSub}>Aviasales</Text>
                    </Pressable>

                    <Pressable
                      style={styles.bookBtn}
                      onPress={() =>
                        openTrackedPartner({
                          partnerId: "kiwitaxi",
                          url: links.transfersUrl,
                          title: `Transfers in ${cityName}`,
                          savedItemType: "transfer",
                          metadata: { city: cityName, startDate: trip.startDate, endDate: trip.endDate },
                        })
                      }
                    >
                      <Text style={styles.bookBtnText}>Transfers</Text>
                      <Text style={styles.bookBtnSub}>KiwiTaxi</Text>
                    </Pressable>

                    <Pressable
                      style={styles.bookBtn}
                      onPress={() =>
                        openTrackedPartner({
                          partnerId: "getyourguide",
                          url: links.experiencesUrl,
                          title: `Experiences in ${cityName}`,
                          savedItemType: "things",
                          metadata: { city: cityName },
                        })
                      }
                    >
                      <Text style={styles.bookBtnText}>Experiences</Text>
                      <Text style={styles.bookBtnSub}>GetYourGuide</Text>
                    </Pressable>
                  </View>

                  <Pressable onPress={() => openUntracked(links.mapsUrl)}>
                    <Text style={styles.mapsInline}>Open maps search</Text>
                  </Pressable>

                  {fxLoading ? <Text style={styles.mutedInline}>Loading match details…</Text> : null}
                </GlassCard>
              )}

              {/* MATCH TICKETS */}
              {links && (
                <GlassCard style={styles.card}>
                  <Text style={styles.sectionTitle}>Match tickets</Text>

                  <Pressable
                    style={styles.wideBtn}
                    onPress={() =>
                      openTrackedPartner({
                        partnerId: "sportsevents365",
                        url: links.ticketsUrl,
                        title: `Match tickets for ${cityName}`,
                        savedItemType: "tickets",
                        metadata: { city: cityName },
                      })
                    }
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.wideBtnTitle}>Find tickets</Text>
                      <Text style={styles.wideBtnSub}>SportsEvents365</Text>
                    </View>
                    <Text style={styles.chev}>›</Text>
                  </Pressable>
                </GlassCard>
              )}

              {/* PROTECT YOURSELF */}
              {links && (
                <GlassCard style={styles.card}>
                  <Text style={styles.sectionTitle}>Protect yourself</Text>

                  <View style={{ gap: 10 }}>
                    <Pressable
                      style={styles.wideBtn}
                      onPress={() =>
                        openTrackedPartner({
                          partnerId: "safetywing",
                          url: links.insuranceUrl,
                          title: `Protect yourself: Travel insurance for ${cityName}`,
                          savedItemType: "insurance",
                          metadata: { city: cityName, startDate: trip.startDate, endDate: trip.endDate },
                        })
                      }
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wideBtnTitle}>Travel insurance</Text>
                        <Text style={styles.wideBtnSub}>SafetyWing</Text>
                      </View>
                      <Text style={styles.chev}>›</Text>
                    </Pressable>

                    <Pressable
                      style={styles.wideBtn}
                      onPress={() =>
                        openTrackedPartner({
                          partnerId: "airhelp",
                          url: links.claimsUrl,
                          title: `Protect yourself: Compensation help`,
                          savedItemType: "claim",
                          metadata: { city: cityName },
                        })
                      }
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wideBtnTitle}>Claims & compensation</Text>
                        <Text style={styles.wideBtnSub}>AirHelp</Text>
                      </View>
                      <Text style={styles.chev}>›</Text>
                    </Pressable>
                  </View>
                </GlassCard>
              )}

              {/* WALLET SNAPSHOT */}
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Wallet</Text>

                {booked.length === 0 ? (
                  <EmptyState title="Nothing booked yet" message="Booked items appear here." />
                ) : (
                  <View style={{ gap: 14 }}>
                    {bookedBuckets.map(([bucketKey, bucketItems]) => (
                      <View key={bucketKey} style={{ gap: 10 }}>
                        <Text style={styles.bucketTitle}>
                          {getSavedItemGroupTitle(bucketKey as any)}
                        </Text>

                        {bucketItems.map((it) => (
                          <View key={it.id} style={styles.walletRow}>
                            <Text style={styles.walletTitle}>{it.title}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                )}
              </GlassCard>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  card: { padding: theme.spacing.lg },

  center: { alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary },
  mutedInline: { marginTop: 10, color: theme.colors.textSecondary, textAlign: "center" },

  hero: { padding: theme.spacing.lg },

  kicker: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.xs,
  },

  cityTitle: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: theme.fontSize.xl,
    fontWeight: "900",
  },

  heroMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
  },

  statusPill: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.4)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },

  statusText: { color: theme.colors.text },

  pendingBanner: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,200,80,0.15)",
  },

  pendingText: {
    color: "rgba(255,200,80,1)",
    fontWeight: "900",
  },

  heroActions: { marginTop: 12 },

  btn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },

  btnPrimary: {
    borderColor: "rgba(0,255,136,0.6)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 8,
  },

  bucketTitle: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.2,
  },

  bookGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  bookBtn: {
    width: "48%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  bookBtnText: { color: theme.colors.text, fontWeight: "900" },
  bookBtnSub: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  mapsInline: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },

  wideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  wideBtnTitle: { color: theme.colors.text, fontWeight: "900" },
  wideBtnSub: { marginTop: 4, color: theme.colors.textSecondary, fontWeight: "800", fontSize: 12 },

  chev: { color: theme.colors.textSecondary, fontSize: 24, marginTop: -2 },

  walletRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  walletTitle: { color: theme.colors.text },
});
