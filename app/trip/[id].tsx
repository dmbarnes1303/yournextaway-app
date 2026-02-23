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
  TextInput,
  Keyboard,
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

import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";
import { getSavedItemTypeLabel } from "@/src/core/savedItemTypes";
import { getPartner, type PartnerId } from "@/src/core/partners";

import { beginPartnerClick, openUntrackedUrl } from "@/src/services/partnerClicks";
import { getFixtureById } from "@/src/services/apiFootball";
import { formatUkDateOnly } from "@/src/utils/formatters";
import { buildAffiliateLinks } from "@/src/services/affiliateLinks";

import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";

/* -------------------------------------------------------------------------- */
/* helpers */
/* -------------------------------------------------------------------------- */

function coerceId(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || null;
  return null;
}

function isNumericId(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return false;
  return /^[0-9]+$/.test(s);
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

function cleanNoteText(v: string) {
  return String(v ?? "").replace(/\r\n/g, "\n").trim();
}

function noteTitleFromText(text: string) {
  const t = cleanNoteText(text);
  if (!t) return "Note";
  const firstLine = t.split("\n")[0]?.trim() || "";
  return firstLine.length > 42 ? firstLine.slice(0, 42).trim() + "…" : firstLine;
}

function safePartnerName(item: SavedItem) {
  if (!item.partnerId) return null;
  try {
    return getPartner(item.partnerId).name;
  } catch {
    return null;
  }
}

function safeTypeLabel(type: SavedItemType) {
  try {
    return getSavedItemTypeLabel(type);
  } catch {
    return "Notes";
  }
}

function shortDomain(url?: string) {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function buildMetaLine(item: SavedItem) {
  const bits: string[] = [];
  bits.push(safeTypeLabel(item.type));

  const p = safePartnerName(item);
  if (p) bits.push(p);

  if (item.partnerUrl) {
    const d = shortDomain(item.partnerUrl);
    if (d) bits.push(d);
  }

  return bits.join(" • ");
}

function defer(fn: () => void) {
  setTimeout(fn, 60);
}

function statusLabel(s: SavedItem["status"]) {
  if (s === "pending") return "Pending";
  if (s === "saved") return "Saved";
  if (s === "booked") return "Booked";
  return "Archived";
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

  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

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

  /* ---------------- load fixtures (fallback city name) ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const idsRaw = Array.isArray(trip?.matchIds) ? trip!.matchIds : [];
      const ids = idsRaw.map((x) => String(x).trim()).filter(Boolean);

      const numericIds = ids.filter(isNumericId);

      if (numericIds.length === 0) {
        setFixturesById({});
        setFxLoading(false);
        return;
      }

      setFxLoading(true);

      try {
        const map: Record<string, any> = {};
        for (const id of numericIds) {
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

  const bookingLinks = useMemo(() => {
    if (!trip || !cityName || cityName === "Trip") return null;
    return buildAffiliateLinks({
      city: cityName,
      startDate: trip.startDate,
      endDate: trip.endDate,
    });
  }, [trip, cityName]);

  const pending = useMemo(() => savedItems.filter((x) => x.status === "pending"), [savedItems]);
  const saved = useMemo(
    () => savedItems.filter((x) => x.status === "saved" && x.type !== "note"),
    [savedItems]
  );
  const booked = useMemo(() => savedItems.filter((x) => x.status === "booked"), [savedItems]);

  const notes = useMemo(
    () => savedItems.filter((x) => x.type === "note" && x.status !== "archived"),
    [savedItems]
  );

  /* ---------------- navigation ---------------- */

  function onEditTrip() {
    if (!trip) return;
    router.push({ pathname: "/trip/build", params: { tripId: trip.id } } as any);
  }

  function onViewWallet() {
    router.push("/wallet" as any);
  }

  /* -------------------------------------------------------------------------- */
  /* OPEN FLOW */
  /* -------------------------------------------------------------------------- */

  async function openUntracked(url?: string) {
    if (!url) return;
    try {
      await openUntrackedUrl(url);
    } catch {
      Alert.alert("Couldn’t open link");
    }
  }

  async function openTrackedPartner(args: {
    partnerId: PartnerId;
    url: string;
    title: string;
    savedItemType?: SavedItemType;
    metadata?: Record<string, any>;
  }) {
    if (!tripId) {
      Alert.alert("Save trip first", "Save this trip before booking so we can store it in Wallet.");
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
        savedItemType: args.savedItemType,
        title: args.title,
        metadata: args.metadata,
      });
    } catch {
      await openUntracked(args.url);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* workspace actions */
  /* -------------------------------------------------------------------------- */

  async function openSavedItem(item: SavedItem) {
    if (!item.partnerUrl) {
      const text = String(item.metadata?.text ?? "").trim();
      Alert.alert(item.title || "Notes", text || "No details saved.");
      return;
    }

    await openUntracked(item.partnerUrl);
  }

  async function archiveItem(item: SavedItem) {
    try {
      await savedItemsStore.transitionStatus(item.id, "archived");
    } catch {
      Alert.alert("Couldn’t archive", "That item can’t be archived right now.");
    }
  }

  async function moveToPending(item: SavedItem) {
    try {
      await savedItemsStore.transitionStatus(item.id, "pending");
    } catch {
      Alert.alert("Couldn’t move", "That item can’t be moved right now.");
    }
  }

  async function markBookedSmart(item: SavedItem) {
    try {
      await savedItemsStore.transitionStatus(item.id, "booked");
      defer(() => {
        confirmBookedAndOfferProof(item.id).catch(() => null);
      });
    } catch {
      Alert.alert("Couldn’t mark booked", "That item can’t be marked booked right now.");
    }
  }

  function confirmArchive(item: SavedItem) {
    Alert.alert(
      "Archive this item?",
      "Archived items are hidden from the trip workspace. You can restore them later (Phase 2).",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Archive", style: "destructive", onPress: () => archiveItem(item) },
      ]
    );
  }

  function confirmMarkBooked(item: SavedItem) {
    Alert.alert(
      "Mark as booked?",
      "Only do this if you completed the booking and want it in Wallet.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Mark booked", style: "default", onPress: () => markBookedSmart(item) },
      ]
    );
  }

  function confirmMoveToPending(item: SavedItem) {
    Alert.alert(
      "Move to Pending?",
      "Use Pending when you’re not sure if you booked it yet (so we’ll ask on return next time you open a partner).",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Move", style: "default", onPress: () => moveToPending(item) },
      ]
    );
  }

  async function addNote() {
    const text = cleanNoteText(noteText);
    if (!tripId) return;

    if (!text) {
      Alert.alert("Add a note", "Type something first.");
      return;
    }

    setNoteSaving(true);
    try {
      await savedItemsStore.add({
        tripId,
        type: "note",
        status: "saved",
        title: noteTitleFromText(text),
        metadata: { text },
      });

      setNoteText("");
      Keyboard.dismiss();
    } catch {
      Alert.alert("Couldn’t save note");
    } finally {
      setNoteSaving(false);
    }
  }

  function openNoteActions(item: SavedItem) {
    const text = String(item.metadata?.text ?? "").trim();
    Alert.alert(
      item.title || "Notes",
      text || "No details saved.",
      [
        { text: "Close", style: "cancel" },
        { text: "Archive", style: "destructive", onPress: () => archiveItem(item) },
      ],
      { cancelable: true }
    );
  }

  function StatusBadge({ s }: { s: SavedItem["status"] }) {
    const label = statusLabel(s);
    const style =
      s === "pending"
        ? styles.badgePending
        : s === "saved"
        ? styles.badgeSaved
        : s === "booked"
        ? styles.badgeBooked
        : styles.badgeArchived;

    return (
      <View style={[styles.badge, style]}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  }

  /* -------------------------------------------------------------------------- */

  const loading = Boolean(tripId && (!tripsLoaded || !savedLoaded));
  const showHeroBanners = pending.length > 0 || saved.length > 0 || booked.length > 0;

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

                <View style={styles.heroTopRow}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{status}</Text>
                  </View>

                  <Pressable onPress={onViewWallet} style={styles.walletBtn}>
                    <Text style={styles.walletBtnText}>View wallet ›</Text>
                  </Pressable>
                </View>

                {showHeroBanners && (
                  <View style={styles.bannersRow}>
                    {pending.length > 0 && (
                      <View style={styles.pendingBanner}>
                        <Text style={styles.pendingText}>
                          {pending.length} pending booking{pending.length === 1 ? "" : "s"}
                        </Text>
                      </View>
                    )}

                    {saved.length > 0 && (
                      <View style={styles.savedBanner}>
                        <Text style={styles.savedText}>
                          {saved.length} saved item{saved.length === 1 ? "" : "s"}
                        </Text>
                      </View>
                    )}

                    {booked.length > 0 && (
                      <View style={styles.bookedBanner}>
                        <Text style={styles.bookedText}>
                          {booked.length} booked item{booked.length === 1 ? "" : "s"} in Wallet
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.heroActions}>
                  <Pressable onPress={onEditTrip} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Edit trip</Text>
                  </Pressable>
                </View>
              </GlassCard>

              {/* PENDING */}
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Pending</Text>

                {pending.length === 0 ? (
                  <EmptyState
                    title="No pending bookings"
                    message="When you click a partner link, it appears here until you confirm it’s booked."
                  />
                ) : (
                  <View style={{ gap: 10 }}>
                    {pending.map((it) => (
                      <View key={it.id} style={styles.itemRow}>
                        <Pressable style={{ flex: 1 }} onPress={() => openSavedItem(it)}>
                          <View style={styles.itemTitleRow}>
                            <Text style={styles.itemTitle} numberOfLines={1}>
                              {it.title}
                            </Text>
                            <StatusBadge s={it.status} />
                          </View>

                          <Text style={styles.itemMeta} numberOfLines={1}>
                            {buildMetaLine(it)}
                          </Text>

                          {it.priceText ? (
                            <Text style={styles.priceLine} numberOfLines={1}>
                              {it.priceText}
                            </Text>
                          ) : null}
                        </Pressable>

                        <View style={styles.itemActions}>
                          <Pressable onPress={() => confirmMarkBooked(it)} style={styles.smallBtn}>
                            <Text style={styles.smallBtnText}>Booked</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => confirmArchive(it)}
                            style={[styles.smallBtn, styles.smallBtnDanger]}
                          >
                            <Text style={styles.smallBtnText}>Archive</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </GlassCard>

              {/* SAVED */}
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Saved</Text>

                {saved.length === 0 ? (
                  <EmptyState
                    title="No saved items"
                    message="If you answer “No” after returning from a partner, we keep the link here as Saved."
                  />
                ) : (
                  <View style={{ gap: 10 }}>
                    {saved.map((it) => (
                      <View key={it.id} style={styles.itemRow}>
                        <Pressable style={{ flex: 1 }} onPress={() => openSavedItem(it)}>
                          <View style={styles.itemTitleRow}>
                            <Text style={styles.itemTitle} numberOfLines={1}>
                              {it.title}
                            </Text>
                            <StatusBadge s={it.status} />
                          </View>

                          <Text style={styles.itemMeta} numberOfLines={1}>
                            {buildMetaLine(it)}
                          </Text>

                          {it.priceText ? (
                            <Text style={styles.priceLine} numberOfLines={1}>
                              {it.priceText}
                            </Text>
                          ) : null}
                        </Pressable>

                        <View style={styles.itemActions}>
                          <Pressable onPress={() => confirmMarkBooked(it)} style={styles.smallBtn}>
                            <Text style={styles.smallBtnText}>Booked</Text>
                          </Pressable>

                          <Pressable onPress={() => confirmMoveToPending(it)} style={styles.smallBtn}>
                            <Text style={styles.smallBtnText}>Pending</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => confirmArchive(it)}
                            style={[styles.smallBtn, styles.smallBtnDanger]}
                          >
                            <Text style={styles.smallBtnText}>Archive</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </GlassCard>

              {/* NOTES */}
              <GlassCard style={styles.card}>
                <Text style={styles.sectionTitle}>Notes</Text>

                <View style={styles.noteBox}>
                  <TextInput
                    value={noteText}
                    onChangeText={setNoteText}
                    placeholder="Add a note (tickets, hotel shortlist, reminders, anything)…"
                    placeholderTextColor={theme.colors.textSecondary}
                    style={styles.noteInput}
                    multiline
                  />

                  <Pressable
                    onPress={addNote}
                    disabled={noteSaving}
                    style={[styles.noteSaveBtn, noteSaving && { opacity: 0.7 }]}
                  >
                    <Text style={styles.noteSaveText}>{noteSaving ? "Saving…" : "Save note"}</Text>
                  </Pressable>
                </View>

                {notes.length === 0 ? (
                  <View style={{ marginTop: 10 }}>
                    <EmptyState title="No notes yet" message="Notes you save for this trip appear here." />
                  </View>
                ) : (
                  <View style={{ gap: 10, marginTop: 10 }}>
                    {notes.map((it) => (
                      <Pressable
                        key={it.id}
                        onPress={() => openNoteActions(it)}
                        style={styles.noteRow}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {it.title}
                          </Text>
                          <Text style={styles.itemMeta} numberOfLines={1}>
                            Notes
                          </Text>
                        </View>
                        <Text style={styles.chev}>›</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </GlassCard>

              {/* BOOK YOUR TRIP */}
              {bookingLinks && (
                <GlassCard style={styles.card}>
                  <Text style={styles.sectionTitle}>Book your trip</Text>

                  <View style={styles.bookGrid}>
                    <Pressable
                      style={styles.bookBtn}
                      onPress={() =>
                        openTrackedPartner({
                          partnerId: "expedia_stays",
                          url: bookingLinks.hotelsUrl,
                          savedItemType: "hotel",
                          title: `Hotels in ${cityName}`,
                          metadata: {
                            city: cityName,
                            startDate: trip.startDate,
                            endDate: trip.endDate,
                          },
                        })
                      }
                    >
                      <Text style={styles.bookBtnText}>Hotels</Text>
                      <Text style={styles.bookBtnSub}>Expedia</Text>
                    </Pressable>

                    <Pressable
                      style={styles.bookBtn}
                      onPress={() =>
                        openTrackedPartner({
                          partnerId: "aviasales",
                          url: bookingLinks.flightsUrl,
                          savedItemType: "flight",
                          title: `Flights to ${cityName}`,
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
                          url: bookingLinks.transfersUrl,
                          savedItemType: "transfer",
                          title: `Transfers in ${cityName}`,
                          metadata: {
                            city: cityName,
                            startDate: trip.startDate,
                            endDate: trip.endDate,
                          },
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
                          url: bookingLinks.experiencesUrl,
                          savedItemType: "things",
                          title: `Experiences in ${cityName}`,
                          metadata: { city: cityName },
                        })
                      }
                    >
                      <Text style={styles.bookBtnText}>Experiences</Text>
                      <Text style={styles.bookBtnSub}>GetYourGuide</Text>
                    </Pressable>
                  </View>

                  <Pressable onPress={() => openUntracked(bookingLinks.mapsUrl)}>
                    <Text style={styles.mapsInline}>Open maps search</Text>
                  </Pressable>

                  {fxLoading ? <Text style={styles.mutedInline}>Loading match details…</Text> : null}
                </GlassCard>
              )}

              {/* MATCH TICKETS */}
              {bookingLinks && (
                <GlassCard style={styles.card}>
                  <Text style={styles.sectionTitle}>Match tickets</Text>

                  <Pressable
                    style={styles.wideBtn}
                    onPress={() =>
                      openTrackedPartner({
                        partnerId: "sportsevents365",
                        url: bookingLinks.ticketsUrl,
                        savedItemType: "tickets",
                        title: `Match tickets`,
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
              {bookingLinks && (
                <GlassCard style={styles.card}>
                  <Text style={styles.sectionTitle}>Protect yourself</Text>

                  <Pressable
                    style={styles.wideBtn}
                    onPress={() =>
                      openTrackedPartner({
                        partnerId: "safetywing",
                        url: bookingLinks.insuranceUrl,
                        savedItemType: "insurance",
                        title: `Travel insurance`,
                        metadata: {
                          city: cityName,
                          startDate: trip.startDate,
                          endDate: trip.endDate,
                        },
                      })
                    }
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.wideBtnTitle}>Travel insurance</Text>
                      <Text style={styles.wideBtnSub}>SafetyWing</Text>
                    </View>
                    <Text style={styles.chev}>›</Text>
                  </Pressable>
                </GlassCard>
              )}

              {/* CLAIMS */}
              {bookingLinks && (
                <GlassCard style={styles.card}>
                  <Text style={styles.sectionTitle}>Claims & compensation</Text>

                  <Pressable
                    style={styles.wideBtn}
                    onPress={() =>
                      openTrackedPartner({
                        partnerId: "airhelp",
                        url: bookingLinks.claimsUrl,
                        savedItemType: "claim",
                        title: `Check compensation`,
                        metadata: { city: cityName },
                      })
                    }
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.wideBtnTitle}>Check compensation</Text>
                      <Text style={styles.wideBtnSub}>AirHelp</Text>
                    </View>
                    <Text style={styles.chev}>›</Text>
                  </Pressable>
                </GlassCard>
              )}

              {/* WALLET PREVIEW */}
              <GlassCard style={styles.card}>
                <View style={styles.walletHeaderRow}>
                  <Text style={styles.sectionTitle}>Wallet</Text>
                  <Pressable onPress={onViewWallet} style={styles.walletInlineBtn}>
                    <Text style={styles.walletInlineText}>Open ›</Text>
                  </Pressable>
                </View>

                {booked.length === 0 ? (
                  <EmptyState title="Nothing booked yet" message="Booked items appear here." />
                ) : (
                  <View style={{ gap: 10 }}>
                    {booked.map((it) => (
                      <Pressable
                        key={it.id}
                        onPress={() => openSavedItem(it)}
                        style={styles.noteRow}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.itemTitleRow}>
                            <Text style={styles.itemTitle} numberOfLines={1}>
                              {it.title}
                            </Text>
                            <StatusBadge s={it.status} />
                          </View>

                          <Text style={styles.itemMeta} numberOfLines={1}>
                            {buildMetaLine(it)}
                          </Text>
                        </View>
                        <Text style={styles.chev}>›</Text>
                      </Pressable>
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

/* -------------------------------------------------------------------------- */
/* styles */
/* -------------------------------------------------------------------------- */

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

  heroTopRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  statusPill: {
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.4)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },

  statusText: { color: theme.colors.text },

  walletBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  walletBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  bannersRow: { marginTop: 12, gap: 10 },

  pendingBanner: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,200,80,0.15)",
  },

  pendingText: {
    color: "rgba(255,200,80,1)",
    fontWeight: "900",
  },

  savedBanner: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,255,136,0.10)",
  },

  savedText: {
    color: "rgba(0,255,136,1)",
    fontWeight: "900",
  },

  bookedBanner: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(120,170,255,0.14)",
  },

  bookedText: {
    color: "rgba(160,195,255,1)",
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

  itemRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
  },

  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  itemTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    flexShrink: 1,
    paddingRight: 6,
  },

  itemMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },

  priceLine: {
    marginTop: 6,
    color: "rgba(242,244,246,0.92)",
    fontSize: 12,
    fontWeight: "900",
  },

  itemActions: {
    gap: 8,
    alignItems: "flex-end",
  },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  smallBtnDanger: {
    borderColor: "rgba(255,80,80,0.35)",
  },

  smallBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 12,
  },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  badgeText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 11,
  },

  badgePending: {
    borderColor: "rgba(255,200,80,0.40)",
    backgroundColor: "rgba(255,200,80,0.10)",
  },

  badgeSaved: {
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,255,136,0.08)",
  },

  badgeBooked: {
    borderColor: "rgba(120,170,255,0.45)",
    backgroundColor: "rgba(120,170,255,0.10)",
  },

  badgeArchived: {
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  noteBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },

  noteInput: {
    minHeight: 80,
    color: theme.colors.text,
    textAlignVertical: "top",
  },

  noteSaveBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    alignItems: "center",
  },

  noteSaveText: { color: theme.colors.text, fontWeight: "900" },

  noteRow: {
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
  bookBtnSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },

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
  wideBtnSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },

  chev: { color: theme.colors.textSecondary, fontSize: 24, marginTop: -2 },

  walletHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  walletInlineBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  walletInlineText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },
});
