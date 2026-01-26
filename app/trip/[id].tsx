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
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import SectionHeader from "@/src/components/SectionHeader";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip, type TripLinkItem, type TripItineraryItem } from "@/src/state/trips";
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

function isoToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function parseIsoDateOnlySafe(iso?: string): Date | null {
  const s = String(iso ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function tripStatus(t: Trip): "Draft" | "Upcoming" | "Past" {
  const start = parseIsoDateOnlySafe(t.startDate);
  const end = parseIsoDateOnlySafe(t.endDate);

  if (!start || !end) return "Draft";

  const today = parseIsoDateOnlySafe(isoToday());
  if (!today) return "Draft";

  if (end.getTime() < today.getTime()) return "Past";
  return "Upcoming";
}

async function safeOpenUrl(url: string) {
  const u = String(url ?? "").trim();
  if (!u) return;

  const hasScheme = /^https?:\/\//i.test(u);
  const candidate = hasScheme ? u : `https://${u}`;

  try {
    const can = await Linking.canOpenURL(candidate);
    if (!can) throw new Error("Cannot open URL");
    await Linking.openURL(candidate);
  } catch {
    Alert.alert("Couldn’t open link", "Your device could not open that link.");
  }
}

function shortDomain(url: string): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  try {
    const hasScheme = /^https?:\/\//i.test(u);
    const parsed = new URL(hasScheme ? u : `https://${u}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return u.replace(/^https?:\/\//i, "").split("/")[0] ?? u;
  }
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/* -------------------------------- Screen -------------------------------- */

type AddKind = "link" | "itinerary" | "note";

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const tripId = useMemo(() => coerceId((params as any)?.id), [params]);

  const [loaded, setLoaded] = useState(tripsStore.getState().loaded);
  const [trip, setTrip] = useState<Trip | null>(null);

  // Fixtures for match cards (lazy: only load those in trip.matchIds)
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fixturesById, setFixturesById] = useState<Record<string, any>>({});

  // Add item modal
  const [addOpen, setAddOpen] = useState(false);
  const [addKind, setAddKind] = useState<AddKind>("link");

  // Add link form
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkGroup, setLinkGroup] = useState<TripLinkItem["group"]>("links");

  // Add itinerary form
  const [itTitle, setItTitle] = useState("");
  const [itDate, setItDate] = useState(""); // YYYY-MM-DD optional
  const [itTime, setItTime] = useState(""); // HH:MM optional
  const [itNotes, setItNotes] = useState("");

  // Add note quick
  const [quickNote, setQuickNote] = useState("");

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

    sync();

    (async () => {
      if (!tripsStore.getState().loaded) {
        try {
          await tripsStore.loadTrips();
        } catch {
          // best-effort
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

  // Load fixtures for trip.matchIds (all of them, not just first)
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setFxError(null);

      const ids = (trip?.matchIds ?? []).map((x) => String(x)).filter(Boolean);
      if (ids.length === 0) {
        setFixturesById({});
        return;
      }

      setFxLoading(true);

      try {
        const next: Record<string, any> = {};

        // Sequential is fine for V1; keeps API usage simple.
        for (const id of ids) {
          if (cancelled) return;
          const r = await getFixtureById(id);
          if (r) next[id] = r;
        }

        if (cancelled) return;
        setFixturesById(next);
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

  const status = useMemo(() => (trip ? tripStatus(trip) : "Draft"), [trip]);

  const cityName = useMemo(() => {
    const fromTrip = String(trip?.cityId ?? "").trim();
    if (fromTrip) return fromTrip;

    // fallback: first loaded fixture city
    const firstMatchId = trip?.matchIds?.[0] ? String(trip.matchIds[0]) : null;
    const firstFx = firstMatchId ? fixturesById[firstMatchId] : null;
    const fromFixture = String(firstFx?.fixture?.venue?.city ?? "").trim();
    if (fromFixture) return fromFixture;

    return "Trip";
  }, [trip?.cityId, trip?.matchIds, fixturesById]);

  const cityBundle = useMemo(() => {
    if (!cityName || cityName === "Trip") return null;
    return getTopThingsToDoForTrip(cityName);
  }, [cityName]);

  const links = useMemo(() => (trip?.links ?? []).slice(), [trip?.links]);
  const itinerary = useMemo(() => (trip?.itinerary ?? []).slice(), [trip?.itinerary]);

  const groupedLinks = useMemo(() => {
    const base = {
      stay: [] as TripLinkItem[],
      travel: [] as TripLinkItem[],
      tickets: [] as TripLinkItem[],
      links: [] as TripLinkItem[],
    };
    for (const l of links) {
      const g = (l.group ?? "links") as TripLinkItem["group"];
      (base[g] ?? base.links).push(l);
    }
    return base;
  }, [links]);

  const itinerarySorted = useMemo(() => {
    const arr = itinerary.slice();
    arr.sort((a, b) => {
      const ad = String(a.date ?? "").trim();
      const bd = String(b.date ?? "").trim();
      if (ad && bd && ad !== bd) return ad.localeCompare(bd);
      const at = String(a.time ?? "").trim();
      const bt = String(b.time ?? "").trim();
      if (at && bt && at !== bt) return at.localeCompare(bt);
      return (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0);
    });
    return arr;
  }, [itinerary]);

  function onEdit() {
    if (!trip) return;
    router.push({ pathname: "/trip/build", params: { tripId: trip.id } } as any);
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

  function openAdd(kind?: AddKind) {
    if (!trip) return;
    setAddKind(kind ?? "link");
    setAddOpen(true);

    // reset forms lightly
    setQuickNote("");
    setLinkTitle("");
    setLinkUrl("");
    setLinkGroup("links");
    setItTitle("");
    setItDate(trip.startDate ?? "");
    setItTime("");
    setItNotes("");
  }

  function closeAdd() {
    setAddOpen(false);
  }

  async function saveAddLink() {
    if (!trip) return;

    const title = linkTitle.trim();
    const url = linkUrl.trim();

    if (!url) {
      Alert.alert("Missing URL", "Paste a link first.");
      return;
    }

    const item: TripLinkItem = {
      id: makeId("lnk"),
      title: title || shortDomain(url) || "Link",
      url,
      group: linkGroup,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await tripsStore.addLink(trip.id, item);
      closeAdd();
    } catch {
      Alert.alert("Couldn’t save", "Something went wrong saving that link.");
    }
  }

  async function saveAddItinerary() {
    if (!trip) return;

    const title = itTitle.trim();
    if (!title) {
      Alert.alert("Missing title", "Give the itinerary item a name.");
      return;
    }

    const date = itDate.trim();
    const time = itTime.trim();
    const notes = itNotes.trim();

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD (or leave it blank).");
      return;
    }
    if (time && !/^\d{2}:\d{2}$/.test(time)) {
      Alert.alert("Invalid time", "Use HH:MM (or leave it blank).");
      return;
    }

    const item: TripItineraryItem = {
      id: makeId("it"),
      title,
      date: date || undefined,
      time: time || undefined,
      notes: notes || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await tripsStore.addItineraryItem(trip.id, item);
      closeAdd();
    } catch {
      Alert.alert("Couldn’t save", "Something went wrong saving that itinerary item.");
    }
  }

  async function saveQuickNote() {
    if (!trip) return;
    const qn = quickNote.trim();
    if (!qn) {
      Alert.alert("Empty note", "Type something first.");
      return;
    }

    const existing = String(trip.notes ?? "").trim();
    const merged = existing ? `${existing}\n\n• ${qn}` : `• ${qn}`;

    try {
      await tripsStore.updateTrip(trip.id, { notes: merged });
      closeAdd();
    } catch {
      Alert.alert("Couldn’t save", "Something went wrong saving that note.");
    }
  }

  async function removeLink(id: string) {
    if (!trip) return;

    Alert.alert("Remove link?", "This removes it from the trip.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await tripsStore.removeLink(trip.id, id);
          } catch {
            Alert.alert("Couldn’t remove", "Something went wrong removing that link.");
          }
        },
      },
    ]);
  }

  async function removeItineraryItem(id: string) {
    if (!trip) return;

    Alert.alert("Remove itinerary item?", "This removes it from the trip.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await tripsStore.removeItineraryItem(trip.id, id);
          } catch {
            Alert.alert("Couldn’t remove", "Something went wrong removing that item.");
          }
        },
      },
    ]);
  }

  function openMatch(fixtureId: string) {
    router.push({ pathname: "/match/[id]", params: { id: fixtureId } } as any);
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
            <GlassCard style={styles.card} strength="strong">
              <EmptyState title="Missing trip id" message="This screen was opened without a valid trip id." />
              <Pressable onPress={() => router.replace("/(tabs)/trips")} style={styles.linkBtn}>
                <Text style={styles.linkText}>Back to Trips</Text>
              </Pressable>
            </GlassCard>
          ) : null}

          {tripId && !loaded ? (
            <GlassCard style={styles.card} strength="strong">
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trip…</Text>
              </View>
            </GlassCard>
          ) : null}

          {tripId && loaded && !trip ? (
            <GlassCard style={styles.card} strength="strong">
              <EmptyState title="Trip not found" message="It may have been deleted or not saved on this device." />
              <Pressable onPress={() => router.replace("/(tabs)/trips")} style={styles.linkBtn}>
                <Text style={styles.linkText}>Back to Trips</Text>
              </Pressable>
            </GlassCard>
          ) : null}

          {trip ? (
            <>
              {/* HERO */}
              <GlassCard style={styles.hero} strength="strong">
                <View style={styles.heroTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>TRIP HUB</Text>
                    <Text style={styles.cityTitle} numberOfLines={1}>
                      {cityName}
                    </Text>
                    <Text style={styles.heroMeta}>{summaryLine(trip)}</Text>
                  </View>

                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                </View>

                <View style={styles.heroActions}>
                  <Pressable onPress={onEdit} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Edit trip</Text>
                  </Pressable>

                  <Pressable onPress={() => openAdd("link")} style={[styles.btn, styles.btnSecondary]}>
                    <Text style={styles.btnSecondaryText}>Add item</Text>
                  </Pressable>
                </View>

                <Pressable onPress={onDelete} style={styles.deleteInline}>
                  <Text style={styles.deleteInlineText}>Delete trip</Text>
                </Pressable>
              </GlassCard>

              {/* MATCHES */}
              <View style={styles.section}>
                <SectionHeader title="Matches" subtitle="Your linked fixtures" />
                <GlassCard style={styles.card} strength="default">
                  {fxLoading ? (
                    <View style={styles.center}>
                      <ActivityIndicator />
                      <Text style={styles.muted}>Loading matches…</Text>
                    </View>
                  ) : null}

                  {!fxLoading && fxError ? <EmptyState title="Matches unavailable" message={fxError} /> : null}

                  {!fxLoading && !fxError && (trip.matchIds?.length ?? 0) === 0 ? (
                    <>
                      <EmptyState title="No matches yet" message="Edit the trip to choose a fixture." />
                      <Pressable onPress={onEdit} style={styles.linkBtn}>
                        <Text style={styles.linkText}>Edit trip</Text>
                      </Pressable>
                    </>
                  ) : null}

                  {!fxLoading && !fxError && (trip.matchIds?.length ?? 0) > 0 ? (
                    <View style={{ gap: 10 }}>
                      {(trip.matchIds ?? []).map((mid, idx) => {
                        const id = String(mid);
                        const fx = fixturesById[id];
                        const home = fx?.teams?.home?.name ?? "Home";
                        const away = fx?.teams?.away?.name ?? "Away";
                        const kick = formatUkDateTimeMaybe(fx?.fixture?.date);
                        const venue = fx?.fixture?.venue?.name ?? "";
                        const city = fx?.fixture?.venue?.city ?? "";
                        const extra = [venue, city].filter(Boolean).join(" • ");
                        const meta = extra ? `${kick} • ${extra}` : kick;

                        return (
                          <Pressable key={`${id}-${idx}`} onPress={() => openMatch(id)} style={styles.itemRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.rowTitle}>
                                {home} vs {away}
                              </Text>
                              <Text style={styles.rowMeta}>{meta || "Match details not loaded"}</Text>
                            </View>
                            <Text style={styles.chev}>›</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </GlassCard>
              </View>

              {/* STAY */}
              <View style={styles.section}>
                <SectionHeader title="Stay" subtitle="Hotels, apartments, saved options" />
                <GlassCard style={styles.card} strength="default">
                  {groupedLinks.stay.length === 0 ? (
                    <>
                      <EmptyState title="Nothing saved" message="Add a booking link or a note for your stay." />
                      <Pressable
                        onPress={() => {
                          setLinkGroup("stay");
                          openAdd("link");
                        }}
                        style={styles.linkBtn}
                      >
                        <Text style={styles.linkText}>Add stay link</Text>
                      </Pressable>
                    </>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {groupedLinks.stay.map((l) => (
                        <View key={l.id} style={styles.linkRow}>
                          <Pressable style={{ flex: 1 }} onPress={() => safeOpenUrl(l.url)}>
                            <Text style={styles.rowTitle} numberOfLines={1}>
                              {l.title}
                            </Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>
                              {shortDomain(l.url)}
                            </Text>
                          </Pressable>
                          <Pressable onPress={() => removeLink(l.id)} style={styles.smallDangerBtn}>
                            <Text style={styles.smallDangerText}>Remove</Text>
                          </Pressable>
                        </View>
                      ))}
                      <Pressable
                        onPress={() => {
                          setLinkGroup("stay");
                          openAdd("link");
                        }}
                        style={styles.linkBtn}
                      >
                        <Text style={styles.linkText}>Add another</Text>
                      </Pressable>
                    </View>
                  )}
                </GlassCard>
              </View>

              {/* TRAVEL */}
              <View style={styles.section}>
                <SectionHeader title="Travel" subtitle="Flights, trains, transfers, parking" />
                <GlassCard style={styles.card} strength="default">
                  {groupedLinks.travel.length === 0 ? (
                    <>
                      <EmptyState title="Nothing saved" message="Add a flight/train link or any travel reference." />
                      <Pressable
                        onPress={() => {
                          setLinkGroup("travel");
                          openAdd("link");
                        }}
                        style={styles.linkBtn}
                      >
                        <Text style={styles.linkText}>Add travel link</Text>
                      </Pressable>
                    </>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {groupedLinks.travel.map((l) => (
                        <View key={l.id} style={styles.linkRow}>
                          <Pressable style={{ flex: 1 }} onPress={() => safeOpenUrl(l.url)}>
                            <Text style={styles.rowTitle} numberOfLines={1}>
                              {l.title}
                            </Text>
                            <Text style={styles.rowMeta} numberOfLines={1}>
                              {shortDomain(l.url)}
                            </Text>
                          </Pressable>
                          <Pressable onPress={() => removeLink(l.id)} style={styles.smallDangerBtn}>
                            <Text style={styles.smallDangerText}>Remove</Text>
                          </Pressable>
                        </View>
                      ))}
                      <Pressable
                        onPress={() => {
                          setLinkGroup("travel");
                          openAdd("link");
                        }}
                        style={styles.linkBtn}
                      >
                        <Text style={styles.linkText}>Add another</Text>
                      </Pressable>
                    </View>
                  )}
                </GlassCard>
              </View>

              {/* TICKETS & LINKS */}
              <View style={styles.section}>
                <SectionHeader title="Tickets & Links" subtitle="Anything you want quick access to" />
                <GlassCard style={styles.card} strength="default">
                  {groupedLinks.tickets.length === 0 && groupedLinks.links.length === 0 ? (
                    <>
                      <EmptyState title="Nothing saved" message="Add any useful link (tickets, maps, reservations, etc.)." />
                      <Pressable
                        onPress={() => {
                          setLinkGroup("links");
                          openAdd("link");
                        }}
                        style={styles.linkBtn}
                      >
                        <Text style={styles.linkText}>Add link</Text>
                      </Pressable>
                    </>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {groupedLinks.tickets.length > 0 ? (
                        <>
                          <Text style={styles.bucketTitle}>Tickets</Text>
                          {groupedLinks.tickets.map((l) => (
                            <View key={l.id} style={styles.linkRow}>
                              <Pressable style={{ flex: 1 }} onPress={() => safeOpenUrl(l.url)}>
                                <Text style={styles.rowTitle} numberOfLines={1}>
                                  {l.title}
                                </Text>
                                <Text style={styles.rowMeta} numberOfLines={1}>
                                  {shortDomain(l.url)}
                                </Text>
                              </Pressable>
                              <Pressable onPress={() => removeLink(l.id)} style={styles.smallDangerBtn}>
                                <Text style={styles.smallDangerText}>Remove</Text>
                              </Pressable>
                            </View>
                          ))}
                        </>
                      ) : null}

                      {groupedLinks.links.length > 0 ? (
                        <>
                          <Text style={styles.bucketTitle}>Links</Text>
                          {groupedLinks.links.map((l) => (
                            <View key={l.id} style={styles.linkRow}>
                              <Pressable style={{ flex: 1 }} onPress={() => safeOpenUrl(l.url)}>
                                <Text style={styles.rowTitle} numberOfLines={1}>
                                  {l.title}
                                </Text>
                                <Text style={styles.rowMeta} numberOfLines={1}>
                                  {shortDomain(l.url)}
                                </Text>
                                </Text>
                              </Pressable>
                              <Pressable onPress={() => removeLink(l.id)} style={styles.smallDangerBtn}>
                                <Text style={styles.smallDangerText}>Remove</Text>
                              </Pressable>
                            </View>
                          ))}
                        </>
                      ) : null}

                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <Pressable
                          onPress={() => {
                            setLinkGroup("tickets");
                            openAdd("link");
                          }}
                          style={[styles.halfBtn, styles.halfBtnPrimary]}
                        >
                          <Text style={styles.halfBtnPrimaryText}>Add ticket link</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setLinkGroup("links");
                            openAdd("link");
                          }}
                          style={[styles.halfBtn, styles.halfBtnGhost]}
                        >
                          <Text style={styles.halfBtnGhostText}>Add link</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </GlassCard>
              </View>

              {/* ITINERARY */}
              <View style={styles.section}>
                <SectionHeader title="Itinerary" subtitle="Your plan, by day/time" />
                <GlassCard style={styles.card} strength="default">
                  {itinerarySorted.length === 0 ? (
                    <>
                      <EmptyState title="No itinerary yet" message="Add a couple of anchor points for your break." />
                      <Pressable onPress={() => openAdd("itinerary")} style={styles.linkBtn}>
                        <Text style={styles.linkText}>Add itinerary item</Text>
                      </Pressable>
                    </>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {itinerarySorted.slice(0, 30).map((it) => {
                        const when = [it.date ? formatUkDateOnly(it.date) : "", it.time ?? ""].filter(Boolean).join(" • ");
                        return (
                          <View key={it.id} style={styles.itRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.rowTitle}>{it.title}</Text>
                              {when ? <Text style={styles.rowMeta}>{when}</Text> : null}
                              {it.notes ? (
                                <Text style={styles.rowMeta} numberOfLines={2}>
                                  {it.notes}
                                </Text>
                              ) : null}
                            </View>
                            <Pressable onPress={() => removeItineraryItem(it.id)} style={styles.smallDangerBtn}>
                              <Text style={styles.smallDangerText}>Remove</Text>
                            </Pressable>
                          </View>
                        );
                      })}
                      {itinerarySorted.length > 30 ? <Text style={styles.moreInline}>Showing the first 30 items.</Text> : null}

                      <Pressable onPress={() => openAdd("itinerary")} style={styles.linkBtn}>
                        <Text style={styles.linkText}>Add another</Text>
                      </Pressable>
                    </View>
                  )}
                </GlassCard>
              </View>

              {/* NOTES */}
              <View style={styles.section}>
                <SectionHeader title="Notes" subtitle="Your running notes for this trip" />
                <GlassCard style={styles.card} strength="default">
                  {String(trip.notes ?? "").trim() ? (
                    <>
                      <Text style={styles.notesText}>{String(trip.notes ?? "").trim()}</Text>
                      <Pressable onPress={() => openAdd("note")} style={styles.linkBtn}>
                        <Text style={styles.linkText}>Add quick note</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <EmptyState
                        title="No notes yet"
                        message="Add quick reminders: hotel options, train times, places to eat."
                      />
                      <Pressable onPress={() => openAdd("note")} style={styles.linkBtn}>
                        <Text style={styles.linkText}>Add note</Text>
                      </Pressable>
                    </>
                  )}
                </GlassCard>
              </View>

              {/* IN THE CITY */}
              <View style={styles.section}>
                <SectionHeader title="In the city" subtitle="Quick inspiration for your break" />
                <GlassCard style={styles.card} strength="default">
                  {!cityBundle ? (
                    <EmptyState title="No city bundle" message="Link a match with a venue city to see curated picks." />
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

              <View style={{ height: 10 }} />
            </>
          ) : null}
        </ScrollView>

        {/* ADD ITEM MODAL */}
        <Modal visible={addOpen} transparent animationType="slide" onRequestClose={closeAdd}>
          <View style={styles.modalWrap}>
            <Pressable style={styles.modalBackdrop} onPress={closeAdd} />

            <SafeAreaView edges={["bottom"]} style={[styles.sheetWrap, { paddingBottom: insets.bottom }]}>
              <View style={styles.sheetCard}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetKicker}>Add to trip</Text>
                    <Text style={styles.sheetTitle} numberOfLines={1}>
                      {cityName || "Trip"}
                    </Text>
                    <Text style={styles.sheetSub} numberOfLines={2}>
                      Choose what you want to save — link, itinerary item, or quick note.
                    </Text>
                  </View>

                  <Pressable onPress={closeAdd} style={styles.closeBtn} hitSlop={10}>
                    <Text style={styles.closeText}>Close</Text>
                  </Pressable>
                </View>

                {/* Kind tabs */}
                <View style={styles.tabRow}>
                  {([
                    { k: "link", label: "Link" },
                    { k: "itinerary", label: "Itinerary" },
                    { k: "note", label: "Note" },
                  ] as Array<{ k: AddKind; label: string }>).map((t) => {
                    const active = addKind === t.k;
                    return (
                      <Pressable
                        key={t.k}
                        onPress={() => setAddKind(t.k)}
                        style={[styles.tabPill, active && styles.tabPillActive]}
                      >
                        <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <ScrollView
                  style={{ maxHeight: 520 }}
                  contentContainerStyle={{ paddingBottom: theme.spacing.md }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* LINK */}
                  {addKind === "link" ? (
                    <View style={{ marginTop: 10, gap: 10 }}>
                      <View style={styles.groupRow}>
                        {([
                          { g: "stay", label: "Stay" },
                          { g: "travel", label: "Travel" },
                          { g: "tickets", label: "Tickets" },
                          { g: "links", label: "Links" },
                        ] as Array<{ g: TripLinkItem["group"]; label: string }>).map((x) => {
                          const active = linkGroup === x.g;
                          return (
                            <Pressable
                              key={x.g}
                              onPress={() => setLinkGroup(x.g)}
                              style={[styles.groupPill, active && styles.groupPillActive]}
                            >
                              <Text style={[styles.groupText, active && styles.groupTextActive]}>{x.label}</Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <TextInput
                        value={linkTitle}
                        onChangeText={setLinkTitle}
                        placeholder="Title (optional, e.g. “Hotel shortlist”)"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={styles.input}
                        autoCapitalize="sentences"
                        autoCorrect={false}
                      />

                      <TextInput
                        value={linkUrl}
                        onChangeText={setLinkUrl}
                        placeholder="Paste a URL (Booking, Google Maps, airline, etc.)"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType={Platform.OS === "ios" ? "url" : "default"}
                      />

                      <View style={styles.sheetActions}>
                        <Pressable onPress={closeAdd} style={[styles.sheetBtn, styles.sheetBtnGhost]}>
                          <Text style={styles.sheetBtnGhostText}>Cancel</Text>
                        </Pressable>

                        <Pressable onPress={saveAddLink} style={[styles.sheetBtn, styles.sheetBtnPrimary]}>
                          <Text style={styles.sheetBtnPrimaryText}>Save link</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {/* ITINERARY */}
                  {addKind === "itinerary" ? (
                    <View style={{ marginTop: 10, gap: 10 }}>
                      <TextInput
                        value={itTitle}
                        onChangeText={setItTitle}
                        placeholder="What are you doing? (e.g. “Dinner reservation”)"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={styles.input}
                        autoCapitalize="sentences"
                        autoCorrect={false}
                      />

                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <TextInput
                          value={itDate}
                          onChangeText={setItDate}
                          placeholder="Date (YYYY-MM-DD)"
                          placeholderTextColor={theme.colors.textSecondary}
                          style={[styles.input, { flex: 1 }]}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />

                        <TextInput
                          value={itTime}
                          onChangeText={setItTime}
                          placeholder="Time (HH:MM)"
                          placeholderTextColor={theme.colors.textSecondary}
                          style={[styles.input, { flex: 1 }]}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>

                      <TextInput
                        value={itNotes}
                        onChangeText={setItNotes}
                        placeholder="Notes (optional)"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={[styles.input, styles.textarea]}
                        multiline
                        textAlignVertical="top"
                      />

                      <View style={styles.sheetActions}>
                        <Pressable onPress={closeAdd} style={[styles.sheetBtn, styles.sheetBtnGhost]}>
                          <Text style={styles.sheetBtnGhostText}>Cancel</Text>
                        </Pressable>

                        <Pressable onPress={saveAddItinerary} style={[styles.sheetBtn, styles.sheetBtnPrimary]}>
                          <Text style={styles.sheetBtnPrimaryText}>Save item</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {/* NOTE */}
                  {addKind === "note" ? (
                    <View style={{ marginTop: 10, gap: 10 }}>
                      <Text style={styles.noteHint}>
                        This app doesn’t have a dedicated wallet yet. For now, quick notes are appended to the trip’s Notes
                        block so you don’t lose anything.
                      </Text>

                      <TextInput
                        value={quickNote}
                        onChangeText={setQuickNote}
                        placeholder="Quick note (e.g. “Hotel: citizenM or Premier Inn”)"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={[styles.input, styles.textarea]}
                        multiline
                        textAlignVertical="top"
                      />

                      <View style={styles.sheetActions}>
                        <Pressable onPress={closeAdd} style={[styles.sheetBtn, styles.sheetBtnGhost]}>
                          <Text style={styles.sheetBtnGhostText}>Cancel</Text>
                        </Pressable>

                        <Pressable onPress={saveQuickNote} style={[styles.sheetBtn, styles.sheetBtnPrimary]}>
                          <Text style={styles.sheetBtnPrimaryText}>Save note</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </ScrollView>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
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

  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },

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

  heroMeta: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  statusText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.xs },

  heroActions: { marginTop: 14, flexDirection: "row", gap: 10 },

  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },

  btnPrimary: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  btnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  btnSecondary: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  btnSecondaryText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  deleteInline: { marginTop: 10, alignSelf: "center", paddingVertical: 6, paddingHorizontal: 10 },
  deleteInlineText: { color: "rgba(255, 120, 120, 0.95)", fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  card: { padding: theme.spacing.lg },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  rowTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: theme.fontWeight.bold },
  chev: { color: theme.colors.textSecondary, fontSize: 24, marginTop: -2 },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  itRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  smallDangerBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 80, 80, 0.30)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignSelf: "flex-start",
  },
  smallDangerText: { color: "rgba(255, 120, 120, 0.95)", fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.xs },

  bucketTitle: { marginTop: 6, color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  moreInline: { marginTop: 10, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  notesText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

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

  halfBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  halfBtnPrimary: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.30)" },
  halfBtnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },
  halfBtnGhost: { borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(0,0,0,0.18)" },
  halfBtnGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  cityBlockTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  cityBlockSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  thingsList: { marginTop: 10, gap: 10 },
  thingRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  thingIdx: { width: 18, color: theme.colors.primary, fontWeight: theme.fontWeight.black },
  thingTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black },
  thingDesc: { marginTop: 4, color: theme.colors.textSecondary, lineHeight: 18 },

  tipsBlock: { marginTop: 12 },
  tipsTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm, marginBottom: 6 },
  tipLine: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  /* Modal sheet */
  modalWrap: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },

  sheetWrap: { paddingHorizontal: theme.spacing.lg },
  sheetCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.38)",
    backgroundColor: "rgba(0,0,0,0.30)",
    padding: theme.spacing.md,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 10,
  },

  sheetHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  sheetKicker: { color: theme.colors.primary, fontWeight: "900", fontSize: theme.fontSize.xs },
  sheetTitle: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.lg },
  sheetSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  closeText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  tabRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
  },
  tabPillActive: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.30)" },
  tabText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.sm },
  tabTextActive: { color: theme.colors.text },

  groupRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  groupPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  groupPillActive: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.30)" },
  groupText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.xs },
  groupTextActive: { color: theme.colors.text },

  sheetActions: { marginTop: 12, flexDirection: "row", gap: 10 },
  sheetBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", borderWidth: 1 },
  sheetBtnGhost: { borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(0,0,0,0.18)" },
  sheetBtnGhostText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.sm },
  sheetBtnPrimary: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.30)" },
  sheetBtnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },

  noteHint: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: theme.fontWeight.bold },

  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
  },
  textarea: { minHeight: 90 },
});
