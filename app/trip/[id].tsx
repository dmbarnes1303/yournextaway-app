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
import { parseIsoDateOnly, toIsoDate } from "@/src/constants/football";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";

import type { SavedItem, SavedItemStatus, SavedItemType } from "@/src/core/savedItemTypes";
import { getPartner, inferPartnerIdFromUrl, type PartnerId } from "@/src/core/partners";

import { beginPartnerClick, openPartnerUrl } from "@/src/services/partnerClicks";

import { getFixtureById } from "@/src/services/apiFootball";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { buildAffiliateLinks } from "@/src/services/affiliateLinks";

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

/**
 * Date-only semantics: local-midnight parsing for YYYY-MM-DD.
 */
function tripStatus(t: Trip): "Draft" | "Upcoming" | "Past" {
  const start = t.startDate ? parseIsoDateOnly(t.startDate) : null;
  const end = t.endDate ? parseIsoDateOnly(t.endDate) : null;
  if (!start || !end) return "Draft";

  const todayIso = toIsoDate(new Date());
  const today = parseIsoDateOnly(todayIso);
  if (!today) return "Draft";

  if (end.getTime() < today.getTime()) return "Past";
  return "Upcoming";
}

function normalizeUrl(url: string): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function shortDomain(url: string): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  try {
    const parsed = new URL(normalizeUrl(u));
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return u.replace(/^https?:\/\//i, "").split("/")[0] ?? u;
  }
}

/* ----------------------------- SavedItem utils ---------------------------- */

const TYPE_LABEL: Record<SavedItemType, string> = {
  tickets: "Tickets",
  hotel: "Stay",
  flight: "Flights",
  train: "Trains",
  transfer: "Transfers",
  things: "Things to do",
  insurance: "Insurance",
  claim: "Claims",
  note: "Notes",
  other: "Other",
};

const STATUS_LABEL: Record<SavedItemStatus, string> = {
  saved: "Saved",
  pending: "Pending",
  booked: "Booked",
  archived: "Archived",
};

function statusOrder(s: SavedItemStatus): number {
  // show Pending first, then Saved, then Booked, then Archived
  return s === "pending" ? 0 : s === "saved" ? 1 : s === "booked" ? 2 : 3;
}

function sortItems(a: SavedItem, b: SavedItem) {
  const so = statusOrder(a.status) - statusOrder(b.status);
  if (so !== 0) return so;
  return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
}

function canTransition(from: SavedItemStatus, to: SavedItemStatus): boolean {
  if (from === "saved") return to === "pending" || to === "archived";
  if (from === "pending") return to === "booked" || to === "archived";
  if (from === "booked") return to === "archived";
  if (from === "archived") return to === "saved";
  return false;
}

/* -------------------------------- Screen -------------------------------- */

type AddModalMode = "add" | "note";

export default function TripDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const tripId = useMemo(() => coerceId((params as any)?.id), [params]);

  const [loadedTrips, setLoadedTrips] = useState(tripsStore.getState().loaded);
  const [trip, setTrip] = useState<Trip | null>(null);

  const [loadedSaved, setLoadedSaved] = useState(savedItemsStore.getState().loaded);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  // Fixtures for match cards
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fixturesById, setFixturesById] = useState<Record<string, any>>({});

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<AddModalMode>("add");

  // Add item form
  const [newType, setNewType] = useState<SavedItemType>("hotel");
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPriceText, setNewPriceText] = useState("");
  const [newStatus, setNewStatus] = useState<SavedItemStatus>("saved");

  // Quick note form (SavedItem note)
  const [noteText, setNoteText] = useState("");

  // Legacy trip notes (still in Trip model)
  const [tripNotesDraft, setTripNotesDraft] = useState("");

  // Subscribe to trips + load if needed
  useEffect(() => {
    let mounted = true;

    const sync = () => {
      const s = tripsStore.getState();
      if (!mounted) return;

      setLoadedTrips(s.loaded);

      if (!tripId) {
        setTrip(null);
        return;
      }

      const t = s.trips.find((x) => x.id === tripId) ?? null;
      setTrip(t);
      setTripNotesDraft(String(t?.notes ?? ""));
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

  // Subscribe to saved items + load if needed
  useEffect(() => {
    let mounted = true;

    const sync = () => {
      const s = savedItemsStore.getState();
      if (!mounted) return;

      setLoadedSaved(s.loaded);

      if (!tripId) {
        setSavedItems([]);
        return;
      }

      const items = s.items.filter((x) => x.tripId === tripId).slice().sort(sortItems);
      setSavedItems(items);
    };

    const unsub = savedItemsStore.subscribe(() => sync());
    sync();

    (async () => {
      if (!savedItemsStore.getState().loaded) {
        try {
          await savedItemsStore.load();
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

  // Load fixtures for trip.matchIds
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

    const firstMatchId = trip?.matchIds?.[0] ? String(trip.matchIds[0]) : null;
    const firstFx = firstMatchId ? fixturesById[firstMatchId] : null;
    const fromFixture = String(firstFx?.fixture?.venue?.city ?? "").trim();
    if (fromFixture) return fromFixture;

    return "Trip";
  }, [trip?.cityId, trip?.matchIds, fixturesById]);

  const bookingLinks = useMemo(() => {
    if (!trip) return null;
    if (!cityName || cityName === "Trip") return null;
    return buildAffiliateLinks({
      city: cityName,
      startDate: trip.startDate,
      endDate: trip.endDate,
    });
  }, [trip, cityName]);

  const savedByType = useMemo(() => {
    const base: Record<SavedItemType, SavedItem[]> = {
      tickets: [],
      hotel: [],
      flight: [],
      train: [],
      transfer: [],
      things: [],
      insurance: [],
      claim: [],
      note: [],
      other: [],
    };
    for (const it of savedItems) {
      (base[it.type] ?? base.other).push(it);
    }
    return base;
  }, [savedItems]);

  const walletBooked = useMemo(() => savedItems.filter((x) => x.status === "booked"), [savedItems]);
  const pending = useMemo(() => savedItems.filter((x) => x.status === "pending"), [savedItems]);

  function onEditTrip() {
    if (!trip) return;
    router.push({ pathname: "/trip/build", params: { tripId: trip.id } } as any);
  }

  async function onDeleteTrip() {
    if (!trip) return;

    Alert.alert("Delete trip?", "This will remove the trip from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await tripsStore.removeTrip(trip.id);
            try {
              await savedItemsStore.clearTrip(trip.id);
            } catch {
              // ignore
            }
            router.replace("/(tabs)/trips");
          } catch {
            Alert.alert("Couldn’t delete", "Something went wrong removing this trip.");
          }
        },
      },
    ]);
  }

  function openAdd(mode: AddModalMode, presetType?: SavedItemType) {
    if (!trip) return;

    setAddMode(mode);
    setAddOpen(true);

    if (mode === "add") {
      setNewType(presetType ?? "hotel");
      setNewTitle("");
      setNewUrl("");
      setNewPriceText("");
      setNewStatus("saved");
      setNoteText("");
    } else {
      setNoteText("");
    }
  }

  function closeAdd() {
    setAddOpen(false);
  }

  async function saveNewItem() {
    if (!tripId) return;

    const title = newTitle.trim();
    if (!title) {
      Alert.alert("Missing title", "Give this item a short title.");
      return;
    }

    const urlRaw = newUrl.trim();
    const priceText = newPriceText.trim();

    const inferredPartnerId: PartnerId | undefined = urlRaw ? inferPartnerIdFromUrl(urlRaw) : undefined;

    try {
      await savedItemsStore.add({
        tripId,
        type: newType,
        status: newStatus,
        title,
        partnerId: inferredPartnerId && inferredPartnerId !== "unknown" ? inferredPartnerId : undefined,
        partnerUrl: urlRaw ? normalizeUrl(urlRaw) : undefined,
        priceText: priceText || undefined,
        metadata: { source: "manual" },
      });

      closeAdd();
    } catch {
      Alert.alert("Couldn’t save", "Something went wrong saving that item.");
    }
  }

  async function saveNewNote() {
    if (!tripId) return;

    const text = noteText.trim();
    if (!text) {
      Alert.alert("Empty note", "Type something first.");
      return;
    }

    try {
      await savedItemsStore.add({
        tripId,
        type: "note",
        status: "saved",
        title: text.length > 60 ? `${text.slice(0, 60)}…` : text,
        metadata: { note: text, source: "quick_note" },
      });
      closeAdd();
    } catch {
      Alert.alert("Couldn’t save", "Something went wrong saving that note.");
    }
  }

  async function removeItem(item: SavedItem) {
    Alert.alert("Remove item?", "This removes it from the trip.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await savedItemsStore.remove(item.id);
          } catch {
            Alert.alert("Couldn’t remove", "Something went wrong removing that item.");
          }
        },
      },
    ]);
  }

  async function transition(item: SavedItem, to: SavedItemStatus) {
    if (!canTransition(item.status, to)) return;

    try {
      await savedItemsStore.transitionStatus(item.id, to);
    } catch {
      Alert.alert("Couldn’t update", "Something went wrong updating that item.");
    }
  }

  /**
   * STANDARDISED OPEN FLOW:
   * - Partner CTAs use beginPartnerClick (tracked -> Pending)
   * - Everything else uses openPartnerUrl (untracked, hardened, in-app browser)
   *
   * openPartnerUrl has a global in-flight guard; if user double-taps Open,
   * it will throw. We swallow that and do nothing (better than duplicate opens).
   */
  async function openUntracked(url: string) {
    const u = String(url ?? "").trim();
    if (!u) {
      Alert.alert("No link", "This item doesn’t have a link saved.");
      return;
    }
    try {
      await openPartnerUrl(u);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg.toLowerCase().includes("already in progress")) return;
      Alert.alert("Couldn’t open link", "Your device could not open that link.");
    }
  }

  async function onPartnerShortcut(partnerId: PartnerId, url: string, title: string) {
    if (!tripId) return;

    try {
      await beginPartnerClick({
        tripId,
        partnerId,
        url,
        title,
        metadata: { city: cityName, tripId },
      });
    } catch {
      // Don’t block the user; fall back to untracked open.
      await openUntracked(url);
    }
  }

  async function saveLegacyTripNotes() {
    if (!trip) return;
    const next = tripNotesDraft.trim();

    try {
      await tripsStore.updateTrip(trip.id, { notes: next || undefined });
      Alert.alert("Saved", "Trip notes updated.");
    } catch {
      Alert.alert("Couldn’t save", "Something went wrong saving trip notes.");
    }
  }

  function openMatch(fixtureId: string) {
    router.push({ pathname: "/match/[id]", params: { id: fixtureId } } as any);
  }

  function ItemRow({ item }: { item: SavedItem }) {
    const partner = item.partnerId ? getPartner(item.partnerId) : null;
    const domain = item.partnerUrl ? shortDomain(item.partnerUrl) : "";
    const price = String(item.priceText ?? "").trim();

    return (
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.itemTop}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.statusPillSmall}>
              <Text style={styles.statusTextSmall}>{STATUS_LABEL[item.status]}</Text>
            </View>
          </View>

          <Text style={styles.rowMeta} numberOfLines={1}>
            {TYPE_LABEL[item.type]}
            {partner ? ` • ${partner.name}` : ""}
            {domain ? ` • ${domain}` : ""}
          </Text>

          {price ? (
            <Text style={styles.priceLine} numberOfLines={1}>
              {price}
            </Text>
          ) : null}
        </View>

        <View style={styles.itemActionsCol}>
          {item.partnerUrl ? (
            <Pressable onPress={() => openUntracked(String(item.partnerUrl))} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Open</Text>
            </Pressable>
          ) : null}

          {item.status === "pending" ? (
            <Pressable onPress={() => transition(item, "booked")} style={[styles.smallBtn, styles.smallBtnPrimary]}>
              <Text style={styles.smallBtnPrimaryText}>Booked</Text>
            </Pressable>
          ) : null}

          {item.status === "saved" ? (
            <Pressable onPress={() => transition(item, "pending")} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Set pending</Text>
            </Pressable>
          ) : null}

          {item.status !== "archived" ? (
            <Pressable onPress={() => transition(item, "archived")} style={styles.smallBtnDanger}>
              <Text style={styles.smallBtnDangerText}>Archive</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => transition(item, "saved")} style={styles.smallBtn}>
              <Text style={styles.smallBtnText}>Restore</Text>
            </Pressable>
          )}

          <Pressable onPress={() => removeItem(item)} style={styles.smallBtnDangerGhost}>
            <Text style={styles.smallBtnDangerText}>Remove</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function Section({
    title,
    subtitle,
    types,
    emptyTitle,
    emptyMsg,
    addType,
  }: {
    title: string;
    subtitle: string;
    types: SavedItemType[];
    emptyTitle: string;
    emptyMsg: string;
    addType: SavedItemType;
  }) {
    const items = types.flatMap((t) => savedByType[t] ?? []).slice().sort(sortItems);

    return (
      <View style={styles.section}>
        <SectionHeader title={title} subtitle={subtitle} />
        <GlassCard style={styles.card} strength="default">
          {items.length === 0 ? (
            <>
              <EmptyState title={emptyTitle} message={emptyMsg} />
              <Pressable onPress={() => openAdd("add", addType)} style={styles.linkBtn}>
                <Text style={styles.linkText}>Add item</Text>
              </Pressable>
            </>
          ) : (
            <View style={{ gap: 10 }}>
              {items.map((it) => (
                <ItemRow key={it.id} item={it} />
              ))}
              <Pressable onPress={() => openAdd("add", addType)} style={styles.linkBtn}>
                <Text style={styles.linkText}>Add another</Text>
              </Pressable>
            </View>
          )}
        </GlassCard>
      </View>
    );
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

          {tripId && (!loadedTrips || !loadedSaved) ? (
            <GlassCard style={styles.card} strength="strong">
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trip…</Text>
              </View>
            </GlassCard>
          ) : null}

          {tripId && loadedTrips && loadedSaved && !trip ? (
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
                    <Text style={styles.kicker}>TRIP WORKSPACE</Text>
                    <Text style={styles.cityTitle} numberOfLines={1}>
                      {cityName}
                    </Text>
                    <Text style={styles.heroMeta}>{summaryLine(trip)}</Text>
                  </View>

                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                </View>

                {/* Spine signals */}
                {pending.length > 0 ? (
                  <View style={styles.pendingBanner}>
                    <Text style={styles.pendingTitle}>Pending bookings</Text>
                    <Text style={styles.pendingSub}>
                      {pending.length} item{pending.length === 1 ? "" : "s"} awaiting confirmation.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.heroActions}>
                  <Pressable onPress={onEditTrip} style={[styles.btn, styles.btnPrimary]}>
                    <Text style={styles.btnPrimaryText}>Edit trip</Text>
                  </Pressable>

                  <Pressable onPress={() => openAdd("add")} style={[styles.btn, styles.btnSecondary]}>
                    <Text style={styles.btnSecondaryText}>Add item</Text>
                  </Pressable>
                </View>

                <Pressable onPress={() => openAdd("note")} style={styles.noteInline}>
                  <Text style={styles.noteInlineText}>+ Quick note</Text>
                </Pressable>

                <Pressable onPress={onDeleteTrip} style={styles.deleteInline}>
                  <Text style={styles.deleteInlineText}>Delete trip</Text>
                </Pressable>
              </GlassCard>

              {/* BOOK THIS TRIP (tracked partner clicks -> pending items) */}
              {bookingLinks ? (
                <View style={styles.section}>
                  <SectionHeader title="Book this trip" subtitle="Partner clicks create Pending items" />
                  <GlassCard style={styles.card} strength="default">
                    <Text style={styles.bookSub}>
                      These open partner search pages for {cityName}. When you return, you’ll be asked if you booked it.
                    </Text>

                    <View style={styles.bookGrid}>
                      <Pressable
                        onPress={() => onPartnerShortcut("booking", bookingLinks.hotelsUrl, `Hotel options in ${cityName}`)}
                        style={[styles.bookBtn, styles.bookBtnPrimary]}
                      >
                        <Text style={styles.bookBtnText}>Hotels</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => onPartnerShortcut("skyscanner", bookingLinks.flightsUrl, `Flights for ${cityName} trip`)}
                        style={styles.bookBtn}
                      >
                        <Text style={styles.bookBtnText}>Flights</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => onPartnerShortcut("omio", bookingLinks.trainsUrl, `Trains / coaches to ${cityName}`)}
                        style={styles.bookBtn}
                      >
                        <Text style={styles.bookBtnText}>Trains</Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          onPartnerShortcut("getyourguide", bookingLinks.experiencesUrl, `GetYourGuide: ${cityName}`)
                        }
                        style={styles.bookBtn}
                      >
                        <Text style={styles.bookBtnText}>GetYourGuide</Text>
                      </Pressable>
                    </View>

                    {/* Maps is intentionally non-tracked in Phase 1 */}
                    <Pressable onPress={() => openUntracked(bookingLinks.mapsUrl)} style={styles.mapsInline}>
                      <Text style={styles.mapsInlineText}>Open Maps search</Text>
                    </Pressable>
                  </GlassCard>
                </View>
              ) : null}

              {/* WALLET (Booked) */}
              <View style={styles.section}>
                <SectionHeader title="Wallet" subtitle="Booked items (Phase 1 list)" />
                <GlassCard style={styles.card} strength="default">
                  {walletBooked.length === 0 ? (
                    <EmptyState title="Nothing booked yet" message="When you confirm bookings, they show up here." />
                  ) : (
                    <View style={{ gap: 10 }}>
                      {walletBooked.map((it) => (
                        <ItemRow key={it.id} item={it} />
                      ))}
                    </View>
                  )}
                </GlassCard>
              </View>

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
                      <Pressable onPress={onEditTrip} style={styles.linkBtn}>
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
                          <Pressable key={`${id}-${idx}`} onPress={() => openMatch(id)} style={styles.matchRow}>
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

              {/* WORKSPACE SECTIONS (SavedItems) */}
              <Section
                title="Stay"
                subtitle="Hotels, apartments, saved options"
                types={["hotel"]}
                emptyTitle="Nothing saved"
                emptyMsg="Add a hotel option, shortlist, or booking reference."
                addType="hotel"
              />

              <Section
                title="Travel"
                subtitle="Flights, trains, transfers, parking"
                types={["flight", "train", "transfer"]}
                emptyTitle="Nothing saved"
                emptyMsg="Add flight/train options or transfers."
                addType="flight"
              />

              <Section
                title="Things to do"
                subtitle="Activities, tours, ideas"
                types={["things"]}
                emptyTitle="Nothing saved"
                emptyMsg="Add a GetYourGuide option or any activity link."
                addType="things"
              />

              <Section
                title="Tickets"
                subtitle="Match tickets or entry confirmations"
                types={["tickets"]}
                emptyTitle="Nothing saved"
                emptyMsg="Add a ticket link or reference."
                addType="tickets"
              />

              <Section
                title="Insurance"
                subtitle="Policies, quotes, documents"
                types={["insurance"]}
                emptyTitle="Nothing saved"
                emptyMsg="Add an insurance quote or policy reference."
                addType="insurance"
              />

              <Section
                title="Claims"
                subtitle="Delays, refunds, compensation tracking"
                types={["claim"]}
                emptyTitle="Nothing saved"
                emptyMsg="Add claim references or notes."
                addType="claim"
              />

              <Section
                title="Notes & other"
                subtitle="Anything else you want attached to this trip"
                types={["note", "other"]}
                emptyTitle="Nothing saved"
                emptyMsg="Add a note or any miscellaneous item."
                addType="note"
              />

              {/* Legacy Trip Notes (keep temporarily; migrate later) */}
              <View style={styles.section}>
                <SectionHeader title="Trip notes" subtitle="Legacy field (we’ll migrate to SavedItems later)" />
                <GlassCard style={styles.card} strength="default">
                  <TextInput
                    value={tripNotesDraft}
                    onChangeText={setTripNotesDraft}
                    placeholder="General notes (optional)"
                    placeholderTextColor={theme.colors.textSecondary}
                    style={[styles.input, styles.textarea]}
                    multiline
                    textAlignVertical="top"
                  />
                  <Pressable onPress={saveLegacyTripNotes} style={[styles.saveBtn]}>
                    <Text style={styles.saveText}>Save notes</Text>
                  </Pressable>
                </GlassCard>
              </View>

              <View style={{ height: 10 }} />
            </>
          ) : null}
        </ScrollView>

        {/* ADD MODAL */}
        <Modal visible={addOpen} transparent animationType="slide" onRequestClose={closeAdd}>
          <View style={styles.modalWrap}>
            <Pressable style={styles.modalBackdrop} onPress={closeAdd} />

            <SafeAreaView edges={["bottom"]} style={[styles.sheetWrap, { paddingBottom: insets.bottom }]}>
              <View style={styles.sheetCard}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetKicker}>{addMode === "note" ? "Quick note" : "Add item"}</Text>
                    <Text style={styles.sheetTitle} numberOfLines={1}>
                      {cityName || "Trip"}
                    </Text>
                    <Text style={styles.sheetSub} numberOfLines={2}>
                      {addMode === "note"
                        ? "Saved as a Notes item in your trip workspace."
                        : "Saved items power your trip workspace and wallet pipeline."}
                    </Text>
                  </View>

                  <Pressable onPress={closeAdd} style={styles.closeBtn} hitSlop={10}>
                    <Text style={styles.closeText}>Close</Text>
                  </Pressable>
                </View>

                <ScrollView
                  style={{ maxHeight: 560 }}
                  contentContainerStyle={{ paddingBottom: theme.spacing.md }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {addMode === "note" ? (
                    <View style={{ marginTop: 10, gap: 10 }}>
                      <TextInput
                        value={noteText}
                        onChangeText={setNoteText}
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

                        <Pressable onPress={saveNewNote} style={[styles.sheetBtn, styles.sheetBtnPrimary]}>
                          <Text style={styles.sheetBtnPrimaryText}>Save note</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={{ marginTop: 10, gap: 10 }}>
                      {/* Type pills */}
                      <View style={styles.typeRow}>
                        {(
                          [
                            "hotel",
                            "flight",
                            "train",
                            "transfer",
                            "things",
                            "tickets",
                            "insurance",
                            "claim",
                            "note",
                            "other",
                          ] as SavedItemType[]
                        ).map((t) => {
                          const active = newType === t;
                          return (
                            <Pressable
                              key={t}
                              onPress={() => setNewType(t)}
                              style={[styles.typePill, active && styles.typePillActive]}
                            >
                              <Text style={[styles.typeText, active && styles.typeTextActive]}>{TYPE_LABEL[t]}</Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Status pills */}
                      <View style={styles.statusRow}>
                        {(["saved", "pending", "booked", "archived"] as SavedItemStatus[]).map((s) => {
                          const active = newStatus === s;
                          return (
                            <Pressable
                              key={s}
                              onPress={() => setNewStatus(s)}
                              style={[styles.statusPickPill, active && styles.statusPickPillActive]}
                            >
                              <Text style={[styles.statusPickText, active && styles.statusPickTextActive]}>
                                {STATUS_LABEL[s]}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      <TextInput
                        value={newTitle}
                        onChangeText={setNewTitle}
                        placeholder="Title (required) — e.g. “Hotel shortlist”"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={styles.input}
                        autoCapitalize="sentences"
                        autoCorrect={false}
                      />

                      <TextInput
                        value={newUrl}
                        onChangeText={setNewUrl}
                        placeholder="Link (optional) — Booking, airline, Maps, etc."
                        placeholderTextColor={theme.colors.textSecondary}
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType={Platform.OS === "ios" ? "url" : "default"}
                      />

                      <TextInput
                        value={newPriceText}
                        onChangeText={setNewPriceText}
                        placeholder='Price text (optional) — “£220” or “View live price”'
                        placeholderTextColor={theme.colors.textSecondary}
                        style={styles.input}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />

                      <View style={styles.sheetActions}>
                        <Pressable onPress={closeAdd} style={[styles.sheetBtn, styles.sheetBtnGhost]}>
                          <Text style={styles.sheetBtnGhostText}>Cancel</Text>
                        </Pressable>

                        <Pressable onPress={saveNewItem} style={[styles.sheetBtn, styles.sheetBtnPrimary]}>
                          <Text style={styles.sheetBtnPrimaryText}>Save item</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
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
  // Your original styles unchanged below
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

  pendingBanner: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 210, 80, 0.25)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  pendingTitle: { color: "rgba(255, 210, 80, 0.95)", fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },
  pendingSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18 },

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

  noteInline: { marginTop: 10, alignSelf: "center", paddingVertical: 6, paddingHorizontal: 10 },
  noteInlineText: { color: "rgba(0,255,136,0.90)", fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  deleteInline: { marginTop: 6, alignSelf: "center", paddingVertical: 6, paddingHorizontal: 10 },
  deleteInlineText: {
    color: "rgba(255, 120, 120, 0.95)",
    fontWeight: theme.fontWeight.black,
    fontSize: theme.fontSize.sm,
  },

  card: { padding: theme.spacing.lg },

  center: { paddingVertical: 12, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm },

  /* Book this trip */
  bookSub: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },
  bookGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  bookBtn: {
    width: "48%",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  bookBtnPrimary: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  bookBtnText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  mapsInline: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
  },
  mapsInlineText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.sm },

  matchRow: {
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

  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  itemTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowTitle: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.md },
  rowMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },
  priceLine: {
    marginTop: 6,
    color: "rgba(242,244,246,0.92)",
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.black,
  },

  chev: { color: theme.colors.textSecondary, fontSize: 24, marginTop: -2 },

  statusPillSmall: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusTextSmall: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.xs },

  itemActionsCol: { gap: 8, alignItems: "flex-end" },

  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  smallBtnText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.xs },

  smallBtnPrimary: {
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  smallBtnPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.xs },

  smallBtnDanger: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 120, 120, 0.35)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  smallBtnDangerGhost: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 120, 120, 0.22)",
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  smallBtnDangerText: { color: "rgba(255, 120, 120, 0.95)", fontWeight: theme.fontWeight.black, fontSize: theme.fontSize.xs },

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
  textarea: { minHeight: 120 },

  saveBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
  },
  saveText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },

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

  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  typePillActive: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.30)" },
  typeText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.xs },
  typeTextActive: { color: theme.colors.text },

  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statusPickPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  statusPickPillActive: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.30)" },
  statusPickText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.xs },
  statusPickTextActive: { color: theme.colors.text },

  sheetActions: { marginTop: 12, flexDirection: "row", gap: 10 },
  sheetBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", borderWidth: 1 },
  sheetBtnGhost: { borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(0,0,0,0.18)" },
  sheetBtnGhostText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: theme.fontSize.sm },
  sheetBtnPrimary: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.30)" },
  sheetBtnPrimaryText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
});
```0
