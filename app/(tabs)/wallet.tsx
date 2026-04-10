import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  ImageBackground,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Background from "@/src/components/Background";
import EmptyState from "@/src/components/EmptyState";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { LEAGUES } from "@/src/constants/football";

import walletStore, {
  type WalletBooking,
  type WalletSummary,
  type WalletTripGroup,
} from "@/src/state/walletStore";
import savedItemsStore from "@/src/state/savedItems";
import tripsStore, { type Trip } from "@/src/state/trips";
import {
  getSavedItemTypeLabel,
  type SavedItemType,
  type WalletAttachment,
} from "@/src/core/savedItemTypes";
import { attachTicketProof } from "@/src/services/ticketAttachment";
import { openAttachment } from "@/src/services/walletAttachments";
import { getFlagImageUrl } from "@/src/utils/flagImages";

type CategoryFilter = "all" | SavedItemType;

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "tickets", label: "Tickets" },
  { id: "hotel", label: "Hotels" },
  { id: "flight", label: "Flights" },
  { id: "train", label: "Rail / bus" },
  { id: "transfer", label: "Transfers" },
  { id: "things", label: "Experiences" },
  { id: "insurance", label: "Insurance" },
  { id: "claim", label: "Claims" },
  { id: "note", label: "Notes" },
  { id: "other", label: "Other" },
];

const TRIP_CITY_META: Record<
  string,
  {
    countryCode?: string;
    leagueId?: number;
    image?: string;
  }
> = {
  barcelona: {
    countryCode: "ES",
    leagueId: 140,
    image:
      "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1600&h=900&q=80",
  },
  madrid: {
    countryCode: "ES",
    leagueId: 140,
    image:
      "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1600&h=900&q=80",
  },
  milan: {
    countryCode: "IT",
    leagueId: 135,
    image:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&h=900&q=80",
  },
  rome: {
    countryCode: "IT",
    leagueId: 135,
    image:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1600&h=900&q=80",
  },
  london: {
    countryCode: "ENGLAND",
    leagueId: 39,
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&h=900&q=80",
  },
  manchester: {
    countryCode: "ENGLAND",
    leagueId: 39,
    image:
      "https://images.unsplash.com/photo-1515586838455-8f8f940d6853?auto=format&fit=crop&w=1600&h=900&q=80",
  },
  liverpool: {
    countryCode: "ENGLAND",
    leagueId: 39,
    image:
      "https://images.unsplash.com/photo-1520034475321-cbe63696469a?auto=format&fit=crop&w=1600&h=900&q=80",
  },
  glasgow: {
    countryCode: "SCOTLAND",
    leagueId: 179,
    image:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&h=900&q=80",
  },
};

function cleanString(v: unknown) {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

function getSingleParam(value: unknown) {
  if (Array.isArray(value)) return cleanString(value[0]);
  return cleanString(value);
}

function ordinal(day: number) {
  if (day % 10 === 1 && day % 100 !== 11) return `${day}st`;
  if (day % 10 === 2 && day % 100 !== 12) return `${day}nd`;
  if (day % 10 === 3 && day % 100 !== 13) return `${day}rd`;
  return `${day}th`;
}

function formatPrettyDateFromIsoString(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const day = ordinal(d.getUTCDate());
  const month = d.toLocaleDateString("en-GB", {
    month: "long",
    timeZone: "UTC",
  });
  const year = d.getUTCFullYear();

  return `${day} ${month} ${year}`;
}

function formatKickoff(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const day = ordinal(d.getUTCDate());
  const month = d.toLocaleDateString("en-GB", {
    month: "long",
    timeZone: "UTC",
  });
  const year = d.getUTCFullYear();
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  return `${day} ${month} ${year} • ${time}`;
}

function iconForType(type: SavedItemType): React.ComponentProps<typeof Ionicons>["name"] {
  switch (type) {
    case "tickets":
      return "ticket-outline";
    case "hotel":
      return "bed-outline";
    case "flight":
      return "airplane-outline";
    case "train":
      return "train-outline";
    case "transfer":
      return "car-outline";
    case "things":
      return "sparkles-outline";
    case "insurance":
      return "shield-checkmark-outline";
    case "claim":
      return "cash-outline";
    case "note":
      return "document-text-outline";
    case "other":
    default:
      return "attach-outline";
  }
}

function iconForAttachmentKind(
  kind?: WalletAttachment["kind"]
): React.ComponentProps<typeof Ionicons>["name"] {
  if (kind === "pdf") return "document-text-outline";
  if (kind === "image") return "image-outline";
  return "attach-outline";
}

function statusLabel(status: WalletBooking["status"]) {
  switch (status) {
    case "booked":
      return "Booked";
    case "pending":
      return "Opened / user not confirmed";
    case "saved":
      return "Saved shortlist";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

function slugify(input: string) {
  return String(input ?? "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function titleCase(input: string) {
  const s = String(input ?? "").trim();
  if (!s) return "Trip";
  const cleaned = s.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function buildTripIndex(trips: Trip[]) {
  const index: Record<string, Trip> = {};
  for (const trip of trips) {
    const id = cleanString(trip.id);
    if (id) index[id] = trip;
  }
  return index;
}

function tripCityLabel(trip?: Trip | null) {
  if (!trip) return "Workspace";
  const raw = String((trip as any)?.displayCity ?? trip.cityId ?? "").trim();
  return titleCase(raw || "Workspace");
}

function getTripVisualMeta(trip?: Trip | null) {
  if (!trip) {
    return {
      countryCode: null as string | null,
      leagueLogo: null as string | null,
      image: null as string | null,
    };
  }

  const city = tripCityLabel(trip);
  const slug = slugify(city);

  const storedLeagueId =
    (trip as any)?.leagueId != null ? Number((trip as any).leagueId) : null;
  const storedCountryCode = String((trip as any)?.countryCode ?? "").trim() || null;
  const storedLeagueLogo = String((trip as any)?.leagueLogo ?? "").trim() || null;

  const fallback = TRIP_CITY_META[slug] ?? null;
  const leagueId = storedLeagueId ?? fallback?.leagueId ?? null;
  const leagueMeta = leagueId ? LEAGUES.find((l) => l.leagueId === leagueId) ?? null : null;

  const countryCode =
    storedCountryCode ??
    leagueMeta?.countryCode ??
    fallback?.countryCode ??
    null;

  const leagueLogo = storedLeagueLogo ?? leagueMeta?.logo ?? null;
  const image =
    String((trip as any)?.heroImage ?? "").trim() || fallback?.image || null;

  return {
    countryCode,
    leagueLogo,
    image,
  };
}

function statusChipTone(status: WalletBooking["status"]) {
  if (status === "booked") return "booked" as const;
  if (status === "pending") return "pending" as const;
  if (status === "saved") return "saved" as const;
  return "archived" as const;
}

function buildWalletProgress(items: WalletBooking[]) {
  if (!items.length) return 0;
  const booked = items.filter((x) => x.status === "booked").length;
  return booked / items.length;
}

function clamp2(n: number) {
  return Math.max(0, Math.min(99, n));
}

function getItemAttachments(itemId: string): WalletAttachment[] {
  const item = savedItemsStore.getById(itemId);
  return Array.isArray(item?.attachments) ? item.attachments : [];
}

function latestAttachment(itemId: string): WalletAttachment | null {
  const attachments = getItemAttachments(itemId);
  return attachments[0] ?? null;
}

type DerivedCounts = {
  total: number;
  booked: number;
  pending: number;
  saved: number;
  missingProof: number;
};

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [groups, setGroups] = useState<WalletTripGroup[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const focusedTripIdParam = useMemo(() => getSingleParam(params?.tripId), [params]);

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([savedItemsStore.load(), tripsStore.loadTrips()]);

      const [nextSummary, nextGroups] = await Promise.all([
        walletStore.getWalletSummary(),
        walletStore.getGroupedByTrip(),
      ]);

      setSummary(nextSummary);
      setGroups(nextGroups);
      setTrips(tripsStore.getState().trips);
    } catch (e: any) {
      Alert.alert("Wallet", e?.message || "Failed to load bookings.");
      setSummary(null);
      setGroups([]);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadWallet();
    } finally {
      setRefreshing(false);
    }
  }, [loadWallet]);

  useEffect(() => {
    loadWallet().catch(() => null);
  }, [loadWallet]);

  useFocusEffect(
    useCallback(() => {
      refreshAll().catch(() => null);
    }, [refreshAll])
  );

  const tripIndex = useMemo(() => buildTripIndex(trips), [trips]);

  const baseFilteredGroups = useMemo(() => {
    const q = cleanString(query).toLowerCase();

    return groups
      .map((group) => {
        const items = group.items.filter((item) => {
          if (category !== "all" && item.type !== category) return false;

          if (!q) return true;

          const haystack = [
            item.title,
            item.providerId ?? "",
            item.home ?? "",
            item.away ?? "",
            item.tripId ?? "",
            getSavedItemTypeLabel(item.type),
            statusLabel(item.status),
            tripCityLabel(tripIndex[group.tripId] ?? null),
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(q);
        });

        if (!items.length) return null;

        return {
          ...group,
          items,
          bookedCount: items.filter((x) => x.status === "booked").length,
          pendingCount: items.filter((x) => x.status === "pending").length,
          savedCount: items.filter((x) => x.status === "saved").length,
          proofCount: items.filter((x) => x.hasProof).length,
          updatedAt: Number(items[0]?.updatedAt ?? 0),
        } as WalletTripGroup;
      })
      .filter(Boolean) as WalletTripGroup[];
  }, [groups, category, query, tripIndex]);

  const focusedTripGroupExistsInFiltered = useMemo(() => {
    if (!focusedTripIdParam) return false;
    return baseFilteredGroups.some((g) => g.tripId === focusedTripIdParam);
  }, [baseFilteredGroups, focusedTripIdParam]);

  const filteredGroups = useMemo(() => {
    if (!focusedTripIdParam) return baseFilteredGroups;

    return [...baseFilteredGroups].sort((a, b) => {
      if (a.tripId === focusedTripIdParam && b.tripId !== focusedTripIdParam) return -1;
      if (b.tripId === focusedTripIdParam && a.tripId !== focusedTripIdParam) return 1;
      return Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0);
    });
  }, [baseFilteredGroups, focusedTripIdParam]);

  const derivedCounts = useMemo<DerivedCounts>(() => {
    const allItems = filteredGroups.flatMap((g) => g.items);

    return {
      total: allItems.length,
      booked: allItems.filter((x) => x.status === "booked").length,
      pending: allItems.filter((x) => x.status === "pending").length,
      saved: allItems.filter((x) => x.status === "saved").length,
      missingProof: allItems.filter((x) => x.status === "booked" && !x.hasProof).length,
    };
  }, [filteredGroups]);

  const spotlightGroup = useMemo(() => {
    if (!filteredGroups.length) return null;

    if (focusedTripIdParam) {
      const focused = filteredGroups.find((g) => g.tripId === focusedTripIdParam);
      if (focused) return focused;
    }

    const sorted = [...filteredGroups].sort((a, b) => {
      const aBooked = a.items.filter((x) => x.status === "booked").length;
      const bBooked = b.items.filter((x) => x.status === "booked").length;
      if (bBooked !== aBooked) return bBooked - aBooked;

      const aPending = a.items.filter((x) => x.status === "pending").length;
      const bPending = b.items.filter((x) => x.status === "pending").length;
      if (bPending !== aPending) return bPending - aPending;

      return Number(b.updatedAt ?? 0) - Number(a.updatedAt ?? 0);
    });

    return sorted[0] ?? null;
  }, [filteredGroups, focusedTripIdParam]);

  const focusedTrip = useMemo(() => {
    if (!focusedTripIdParam) return null;
    return tripIndex[focusedTripIdParam] ?? null;
  }, [focusedTripIdParam, tripIndex]);

  async function onOpenTrip(tripId?: string) {
    const id = cleanString(tripId);
    if (!id) return;
    router.push({ pathname: "/trip/[id]", params: { id } } as any);
  }

  async function onAddProof(itemId: string) {
    const ok = await attachTicketProof(itemId);
    if (ok) {
      await loadWallet();
    }
  }

  async function onViewProof(itemId: string) {
    try {
      await savedItemsStore.load();
      const attachment = latestAttachment(itemId);

      if (!attachment) {
        Alert.alert("No proof", "This booking has no proof file attached.");
        return;
      }

      await openAttachment(attachment);
    } catch (e: any) {
      Alert.alert("Couldn’t open proof", e?.message || "Try again.");
    }
  }

  async function onDeleteProof(itemId: string) {
    await savedItemsStore.load();
    const attachment = latestAttachment(itemId);

    if (!attachment) {
      Alert.alert("No proof", "There is no proof file to delete.");
      return;
    }

    Alert.alert(
      "Delete proof?",
      "This removes the attached proof file from this booking.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await savedItemsStore.removeAttachment(itemId, attachment.id);
              await loadWallet();
            } catch (e: any) {
              Alert.alert("Delete failed", e?.message || "Could not delete proof.");
            }
          },
        },
      ]
    );
  }

  async function onArchive(itemId: string) {
    Alert.alert("Archive item?", "This will hide it from the main Wallet view.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: async () => {
          try {
            await savedItemsStore.transitionStatus(itemId, "archived");
            await loadWallet();
          } catch (e: any) {
            Alert.alert("Couldn’t archive", e?.message || "Try again.");
          }
        },
      },
    ]);
  }

  async function onMoveBackToSaved(itemId: string) {
    try {
      await savedItemsStore.transitionStatus(itemId, "saved");
      await loadWallet();
    } catch (e: any) {
      Alert.alert("Couldn’t update", e?.message || "Try again.");
    }
  }

  function FilterChip({ id, label }: { id: CategoryFilter; label: string }) {
    const active = id === category;
    const count =
      id === "all"
        ? derivedCounts.total
        : filteredGroups.flatMap((g) => g.items).filter((x) => x.type === id).length;

    return (
      <Pressable onPress={() => setCategory(id)} style={[styles.chip, active && styles.chipActive]}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        <View style={[styles.chipCount, active && styles.chipCountActive]}>
          <Text style={[styles.chipCountText, active && styles.chipCountTextActive]}>{count}</Text>
        </View>
      </Pressable>
    );
  }

  function Metric({
    label,
    value,
    icon,
  }: {
    label: string;
    value: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
  }) {
    return (
      <View style={styles.metric}>
        <Ionicons name={icon} size={16} color={theme.colors.textSecondary} />
        <Text style={styles.metricVal} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.metricKey}>{label}</Text>
      </View>
    );
  }

  return (
    <Background
      imageSource={getBackground("wallet")}
      overlayOpacity={0.03}
      topShadeOpacity={0.24}
      bottomShadeOpacity={0.3}
      centerShadeOpacity={0.02}
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard style={styles.hero} strength="strong" noPadding>
            <View style={styles.heroInner}>
              <View style={styles.heroTop}>
                <View style={styles.heroText}>
                  <Text style={styles.kicker}>WALLET</Text>
                  <Text style={styles.h1}>Bookings & proofs</Text>
                  <Text style={styles.h2}>
                    This screen only reflects trip-linked wallet truth: saved shortlist items, opened partner journeys, user-confirmed bookings, and proof attached to those bookings.
                  </Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <Metric
                  label="Booked"
                  value={String(summary?.booked ?? 0)}
                  icon="checkmark-done-outline"
                />
                <Metric
                  label="Pending"
                  value={String(summary?.pending ?? 0)}
                  icon="time-outline"
                />
                <Metric
                  label="Proofs"
                  value={String(summary?.withProof ?? 0)}
                  icon="document-attach-outline"
                />
              </View>

              <View style={styles.metricsRow}>
                <Metric
                  label="Trips"
                  value={String(filteredGroups.length)}
                  icon="airplane-outline"
                />
                <Metric
                  label="Saved"
                  value={String(derivedCounts.saved)}
                  icon="bookmark-outline"
                />
                <Metric
                  label="Missing proof"
                  value={String(derivedCounts.missingProof)}
                  icon="alert-circle-outline"
                />
              </View>

              <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={18} color={theme.colors.textTertiary} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search bookings, trips, teams, providers…"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={styles.searchInput}
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {query ? (
                  <Pressable onPress={() => setQuery("")} style={styles.clearBtn}>
                    <Text style={styles.clearBtnText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </GlassCard>

          {focusedTrip ? (
            <FocusedTripStrip
              trip={focusedTrip}
              filteredOut={!focusedTripGroupExistsInFiltered}
              onOpenTrip={onOpenTrip}
              onClear={() => router.replace("/(tabs)/wallet" as any)}
            />
          ) : null}

          <View style={styles.chipsRow}>
            {CATEGORY_FILTERS.map((c) => (
              <FilterChip key={c.id} id={c.id} label={c.label} />
            ))}
          </View>

          {!loading && spotlightGroup ? (
            <View style={styles.section}>
              <SectionHeader
                title="Spotlight"
                subtitle={
                  focusedTripIdParam
                    ? "Wallet view for the trip you opened"
                    : "Most relevant trip workspace in Wallet right now"
                }
              />
              <WalletSpotlightCard
                group={spotlightGroup}
                trip={tripIndex[spotlightGroup.tripId]}
                onOpenTrip={onOpenTrip}
              />
            </View>
          ) : null}

          {loading || refreshing ? (
            <GlassCard style={styles.stateCard} strength="default">
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading wallet…</Text>
              </View>
            </GlassCard>
          ) : filteredGroups.length === 0 ? (
            <GlassCard style={styles.stateCard} strength="default">
              <EmptyState
                title="No wallet activity yet"
                message={
                  focusedTrip
                    ? "This trip has no wallet-linked activity yet. Bookings only appear here after you save items, open partners, or confirm a booking in that trip."
                    : "This Wallet only shows trip-linked booking activity and proof attached to those items."
                }
              />
              <View style={styles.emptyActions}>
                {focusedTrip ? (
                  <Pressable
                    style={({ pressed }) => [styles.emptyActionPrimary, pressed && styles.pressed]}
                    onPress={() => onOpenTrip(focusedTrip.id)}
                  >
                    <Ionicons name="airplane-outline" size={18} color={theme.colors.text} />
                    <Text style={styles.emptyActionPrimaryText}>Open trip workspace</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.emptyActionPrimary, pressed && styles.pressed]}
                    onPress={() => router.push("/(tabs)/trips" as any)}
                  >
                    <Ionicons name="briefcase-outline" size={18} color={theme.colors.text} />
                    <Text style={styles.emptyActionPrimaryText}>Go to Trips</Text>
                  </Pressable>
                )}

                <Pressable
                  style={({ pressed }) => [styles.emptyActionSecondary, pressed && styles.pressed]}
                  onPress={() => router.push("/(tabs)/fixtures" as any)}
                >
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.text} />
                  <Text style={styles.emptyActionSecondaryText}>Browse fixtures</Text>
                </Pressable>
              </View>
            </GlassCard>
          ) : (
            <View style={styles.section}>
              <SectionHeader
                title="Trip-linked wallet"
                subtitle={`${filteredGroups.length} workspace${filteredGroups.length === 1 ? "" : "s"} with wallet activity`}
              />

              <View style={styles.groupList}>
                {filteredGroups.map((group) => (
                  <WalletGroupCard
                    key={group.tripId}
                    group={group}
                    trip={tripIndex[group.tripId]}
                    focused={group.tripId === focusedTripIdParam}
                    onOpenTrip={onOpenTrip}
                    onAddProof={onAddProof}
                    onViewProof={onViewProof}
                    onDeleteProof={onDeleteProof}
                    onMoveBackToSaved={onMoveBackToSaved}
                    onArchive={onArchive}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

function FocusedTripStrip({
  trip,
  filteredOut,
  onOpenTrip,
  onClear,
}: {
  trip: Trip;
  filteredOut: boolean;
  onOpenTrip: (tripId?: string) => void;
  onClear: () => void;
}) {
  const visual = getTripVisualMeta(trip);
  const flagUrl = visual.countryCode ? getFlagImageUrl(visual.countryCode) : null;

  return (
    <GlassCard style={styles.focusStrip} strength="default" noPadding>
      <View style={styles.focusStripInner}>
        <View style={styles.focusStripLeft}>
          <View style={styles.focusStripIcon}>
            <Ionicons name="airplane-outline" size={16} color={theme.colors.text} />
          </View>

          <View style={styles.focusStripText}>
            <Text style={styles.focusStripLabel}>Trip focus active</Text>
            <View style={styles.focusStripTitleRow}>
              <Text style={styles.focusStripTitle}>{tripCityLabel(trip)}</Text>

              <View style={styles.metaInline}>
                {visual.leagueLogo ? (
                  <View style={styles.leagueLogoTile}>
                    <Image
                      source={{ uri: visual.leagueLogo }}
                      style={styles.leagueLogoImg}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}
                {flagUrl ? (
                  <Image source={{ uri: flagUrl }} style={styles.countryFlag} resizeMode="cover" />
                ) : null}
              </View>
            </View>

            <Text style={styles.focusStripMuted}>
              {filteredOut
                ? "Your current search or category filter is hiding this trip’s wallet items below."
                : "You’re looking at Wallet through this specific trip workspace."}
            </Text>
          </View>
        </View>

        <View style={styles.focusStripActions}>
          <Pressable style={styles.focusMiniBtn} onPress={() => onOpenTrip(trip.id)}>
            <Text style={styles.focusMiniBtnText}>Trip</Text>
          </Pressable>

          <Pressable style={styles.focusMiniBtn} onPress={onClear}>
            <Text style={styles.focusMiniBtnText}>All</Text>
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
}

function StatusPill({
  text,
  tone,
}: {
  text: string;
  tone: "booked" | "pending" | "saved" | "archived";
}) {
  return (
    <View
      style={[
        styles.statusPill,
        tone === "booked" && styles.statusBooked,
        tone === "pending" && styles.statusPending,
        tone === "saved" && styles.statusSaved,
        tone === "archived" && styles.statusArchived,
      ]}
    >
      <Text style={styles.statusPillText}>{text}</Text>
    </View>
  );
}

function WalletSpotlightCard({
  group,
  trip,
  onOpenTrip,
}: {
  group: WalletTripGroup;
  trip?: Trip;
  onOpenTrip: (tripId?: string) => void;
}) {
  const city = tripCityLabel(trip);
  const visual = getTripVisualMeta(trip);
  const flagUrl = visual.countryCode ? getFlagImageUrl(visual.countryCode) : null;
  const progress = buildWalletProgress(group.items);
  const booked = group.items.filter((x) => x.status === "booked").length;
  const pending = group.items.filter((x) => x.status === "pending").length;
  const proofs = group.items.filter((x) => x.hasProof).length;
  const latestKickoff = group.items
    .map((x) => x.kickoffIso)
    .filter(Boolean)
    .sort()[0];
  const kickoffText = formatPrettyDateFromIsoString(latestKickoff);

  return (
    <Pressable onPress={() => onOpenTrip(group.tripId)} style={({ pressed }) => [pressed && styles.pressed]}>
      <GlassCard style={styles.spotlightCard} strength="default" noPadding>
        <ImageBackground
          source={visual.image ? { uri: visual.image } : undefined}
          style={styles.spotlightImageWrap}
          imageStyle={styles.spotlightImage}
        >
          <View style={styles.tripImageOverlayStrong} />
          <View style={styles.spotlightInner}>
            <View style={styles.spotlightTopRow}>
              <View style={styles.spotlightIconWrap}>
                <Ionicons name="wallet-outline" size={18} color={theme.colors.text} />
              </View>

              <StatusPill
                text={booked > 0 ? "Booked live" : pending > 0 ? "Pending live" : "Saved live"}
                tone={booked > 0 ? "booked" : pending > 0 ? "pending" : "saved"}
              />
            </View>

            <View style={styles.titleVisualRow}>
              <Text style={styles.spotlightTitle}>{city}</Text>

              <View style={styles.metaInline}>
                {visual.leagueLogo ? (
                  <View style={styles.leagueLogoTile}>
                    <Image source={{ uri: visual.leagueLogo }} style={styles.leagueLogoImg} resizeMode="contain" />
                  </View>
                ) : null}
                {flagUrl ? <Image source={{ uri: flagUrl }} style={styles.countryFlag} resizeMode="cover" /> : null}
              </View>
            </View>

            <Text style={styles.spotlightMeta}>
              {kickoffText
                ? `${kickoffText} • ${group.items.length} wallet item${group.items.length === 1 ? "" : "s"}`
                : `${group.items.length} wallet item${group.items.length === 1 ? "" : "s"}`}
            </Text>

            <Text style={styles.spotlightSub}>
              {proofs > 0
                ? `${proofs} proof file${proofs === 1 ? "" : "s"} attached`
                : booked > 0
                  ? "Booked items still need proof uploads"
                  : "No confirmed proofs yet"}
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(8, progress * 100)}%` }]} />
            </View>

            <View style={styles.spotlightStatsRow}>
              <MiniStat label="Booked" value={booked} />
              <MiniStat label="Pending" value={pending} />
              <MiniStat label="Proofs" value={proofs} />
            </View>

            <View style={styles.spotlightFooter}>
              <Text style={styles.spotlightCta}>Open workspace</Text>
              <Text style={styles.spotlightArrow}>›</Text>
            </View>
          </View>
        </ImageBackground>
      </GlassCard>
    </Pressable>
  );
}

function WalletGroupCard({
  group,
  trip,
  focused,
  onOpenTrip,
  onAddProof,
  onViewProof,
  onDeleteProof,
  onMoveBackToSaved,
  onArchive,
}: {
  group: WalletTripGroup;
  trip?: Trip;
  focused: boolean;
  onOpenTrip: (tripId?: string) => void;
  onAddProof: (itemId: string) => Promise<void>;
  onViewProof: (itemId: string) => Promise<void>;
  onDeleteProof: (itemId: string) => Promise<void>;
  onMoveBackToSaved: (itemId: string) => Promise<void>;
  onArchive: (itemId: string) => Promise<void>;
}) {
  const city = tripCityLabel(trip);
  const visual = getTripVisualMeta(trip);
  const flagUrl = visual.countryCode ? getFlagImageUrl(visual.countryCode) : null;
  const booked = group.items.filter((x) => x.status === "booked").length;
  const pending = group.items.filter((x) => x.status === "pending").length;
  const saved = group.items.filter((x) => x.status === "saved").length;
  const proofs = group.items.filter((x) => x.hasProof).length;

  return (
    <GlassCard
      style={[styles.groupCard, focused && styles.groupCardFocused]}
      strength="subtle"
      noPadding
    >
      <View style={styles.groupInner}>
        <View style={styles.groupHeaderRow}>
          <View style={styles.groupHeaderLeft}>
            <View style={styles.titleVisualRow}>
              <Text style={styles.groupTitle}>{city}</Text>

              <View style={styles.metaInline}>
                {visual.leagueLogo ? (
                  <View style={styles.leagueLogoTile}>
                    <Image source={{ uri: visual.leagueLogo }} style={styles.leagueLogoImg} resizeMode="contain" />
                  </View>
                ) : null}
                {flagUrl ? <Image source={{ uri: flagUrl }} style={styles.countryFlag} resizeMode="cover" /> : null}
              </View>

              {focused ? (
                <View style={styles.focusedTag}>
                  <Text style={styles.focusedTagText}>Focused</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.groupMeta}>
              {`${booked} booked • ${pending} pending • ${saved} saved • ${proofs} with proof`}
            </Text>
          </View>

          <Pressable style={styles.groupBtn} onPress={() => onOpenTrip(group.tripId)}>
            <Text style={styles.groupBtnText}>Open trip</Text>
          </Pressable>
        </View>

        <View style={styles.groupBookingList}>
          {group.items.map((item) => (
            <WalletBookingCard
              key={item.id}
              item={item}
              onOpenTrip={onOpenTrip}
              onAddProof={onAddProof}
              onViewProof={onViewProof}
              onDeleteProof={onDeleteProof}
              onMoveBackToSaved={onMoveBackToSaved}
              onArchive={onArchive}
            />
          ))}
        </View>
      </View>
    </GlassCard>
  );
}

function WalletBookingCard({
  item,
  onOpenTrip,
  onAddProof,
  onViewProof,
  onDeleteProof,
  onMoveBackToSaved,
  onArchive,
}: {
  item: WalletBooking;
  onOpenTrip: (tripId?: string) => void;
  onAddProof: (itemId: string) => Promise<void>;
  onViewProof: (itemId: string) => Promise<void>;
  onDeleteProof: (itemId: string) => Promise<void>;
  onMoveBackToSaved: (itemId: string) => Promise<void>;
  onArchive: (itemId: string) => Promise<void>;
}) {
  const fixtureLine = item.home && item.away ? `${item.home} v ${item.away}` : null;
  const kickoff = formatKickoff(item.kickoffIso);
  const typeLabel = getSavedItemTypeLabel(item.type);
  const tone = statusChipTone(item.status);
  const attachment = latestAttachment(item.id);

  return (
    <GlassCard style={styles.docCard} strength="subtle" noPadding>
      <View style={styles.docRow}>
        <View style={styles.docIconWrap}>
          <Ionicons name={iconForType(item.type)} size={18} color={theme.colors.text} />
        </View>

        <View style={styles.docMain}>
          <View style={styles.docTitleRow}>
            <Text style={styles.docTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <StatusPill text={statusLabel(item.status)} tone={tone} />
          </View>

          <Text style={styles.docMeta} numberOfLines={1}>
            {`${typeLabel}${item.providerId ? ` • ${item.providerId}` : ""}`}
          </Text>

          {fixtureLine ? (
            <Text style={styles.docSubMeta} numberOfLines={1}>
              {fixtureLine}
            </Text>
          ) : null}

          {kickoff ? (
            <Text style={styles.docSubMeta} numberOfLines={1}>
              {kickoff}
            </Text>
          ) : null}

          <Text style={styles.docSubMeta} numberOfLines={1}>
            {item.hasProof
              ? `${item.attachmentCount} proof file${item.attachmentCount === 1 ? "" : "s"} attached`
              : item.status === "booked"
                ? "No proof attached yet"
                : "No proof needed yet"}
          </Text>

          {attachment ? (
            <View style={styles.attachmentRow}>
              <Ionicons
                name={iconForAttachmentKind(attachment.kind)}
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.attachmentText} numberOfLines={1}>
                {cleanString(attachment.name) || "Attached proof"}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.docActionsRow}>
        {item.tripId ? (
          <Pressable style={styles.smallBtn} onPress={() => onOpenTrip(item.tripId)}>
            <Text style={styles.smallBtnText}>Trip</Text>
          </Pressable>
        ) : null}

        {item.status === "booked" && !item.hasProof ? (
          <Pressable style={styles.smallBtnPrimary} onPress={() => onAddProof(item.id)}>
            <Text style={styles.smallBtnPrimaryText}>Add proof</Text>
          </Pressable>
        ) : null}

        {item.hasProof ? (
          <Pressable style={styles.smallBtn} onPress={() => onViewProof(item.id)}>
            <Text style={styles.smallBtnText}>View proof</Text>
          </Pressable>
        ) : null}

        {item.hasProof ? (
          <Pressable style={[styles.smallBtn, styles.smallBtnDanger]} onPress={() => onDeleteProof(item.id)}>
            <Text style={styles.smallBtnDangerText}>Delete proof</Text>
          </Pressable>
        ) : null}

        {item.status === "pending" ? (
          <Pressable style={styles.smallBtn} onPress={() => onMoveBackToSaved(item.id)}>
            <Text style={styles.smallBtnText}>Mark saved</Text>
          </Pressable>
        ) : null}

        <Pressable style={[styles.smallBtn, styles.smallBtnDanger]} onPress={() => onArchive(item.id)}>
          <Text style={styles.smallBtnDangerText}>Archive</Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{String(clamp2(value))}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  hero: {
    borderRadius: 28,
    borderColor: "rgba(87,162,56,0.12)",
  },

  heroInner: {
    padding: 16,
    gap: 14,
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  heroText: {
    flex: 1,
  },

  kicker: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
    letterSpacing: 1.2,
  },

  h1: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: theme.fontWeight.black,
  },

  h2: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: theme.fontWeight.bold,
  },

  focusStrip: {
    borderRadius: 20,
    borderColor: "rgba(87,162,56,0.18)",
  },

  focusStripInner: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  focusStripLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  focusStripIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  focusStripText: {
    flex: 1,
    gap: 2,
  },

  focusStripLabel: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  focusStripTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  focusStripTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  focusStripMuted: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
  },

  focusStripActions: {
    flexDirection: "row",
    gap: 8,
  },

  focusMiniBtn: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  focusMiniBtnText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },

  metric: {
    flex: 1,
    minHeight: 76,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  metricVal: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 16,
  },

  metricKey: {
    color: theme.colors.textTertiary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
  },

  searchWrap: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },

  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  clearBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  chipActive: {
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.06)",
  },

  chipText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
  },

  chipTextActive: {
    color: theme.colors.text,
  },

  chipCount: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  },

  chipCountActive: {
    backgroundColor: "rgba(0,0,0,0.22)",
    borderColor: "rgba(255,255,255,0.16)",
  },

  chipCountText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
  },

  chipCountTextActive: {
    color: theme.colors.text,
  },

  section: {
    gap: 10,
  },

  groupList: {
    gap: 12,
  },

  stateCard: {
    padding: theme.spacing.lg,
    borderRadius: 24,
  },

  center: {
    paddingVertical: 10,
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  emptyActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },

  emptyActionPrimary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.30)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(79,224,138,0.10)" : "rgba(79,224,138,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  emptyActionPrimaryText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  emptyActionSecondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  emptyActionSecondaryText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  spotlightCard: {
    borderRadius: 24,
    borderColor: "rgba(87,162,56,0.16)",
    overflow: "hidden",
  },

  spotlightImageWrap: {
    minHeight: 260,
    justifyContent: "flex-end",
  },

  spotlightImage: {
    borderRadius: 24,
  },

  tripImageOverlayStrong: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,11,9,0.62)",
  },

  spotlightInner: {
    padding: 16,
    gap: 10,
  },

  spotlightTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  spotlightIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  titleVisualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  spotlightTitle: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: theme.fontWeight.black,
    flexShrink: 1,
  },

  spotlightMeta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  spotlightSub: {
    color: theme.colors.primary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
  },

  progressTrack: {
    marginTop: 2,
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(87,162,56,0.92)",
  },

  spotlightStatsRow: {
    flexDirection: "row",
    gap: 10,
  },

  miniStat: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.26)" : "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },

  miniStatValue: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: theme.fontWeight.black,
  },

  miniStatLabel: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  spotlightFooter: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  spotlightCta: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  spotlightArrow: {
    color: theme.colors.textTertiary,
    fontSize: 22,
    marginTop: -2,
  },

  groupCard: {
    borderRadius: 24,
    overflow: "hidden",
  },

  groupCardFocused: {
    borderColor: "rgba(87,162,56,0.24)",
  },

  groupInner: {
    padding: 14,
    gap: 12,
  },

  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  groupHeaderLeft: {
    flex: 1,
  },

  groupTitle: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 18,
    flexShrink: 1,
  },

  groupMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: 12,
  },

  groupBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  groupBtnText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
  },

  focusedTag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  focusedTagText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.2,
  },

  groupBookingList: {
    gap: 10,
  },

  docCard: {
    borderRadius: 18,
    overflow: "hidden",
  },

  docRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },

  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  docMain: {
    flex: 1,
    minWidth: 0,
  },

  docTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  docTitle: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 14,
    flexShrink: 1,
  },

  docMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: 12,
  },

  docSubMeta: {
    marginTop: 4,
    color: theme.colors.textTertiary,
    fontWeight: theme.fontWeight.bold,
    fontSize: 12,
  },

  attachmentRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  attachmentText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: 12,
  },

  docActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },

  smallBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  smallBtnPrimary: {
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.30)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(79,224,138,0.10)" : "rgba(79,224,138,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  smallBtnDanger: {
    borderColor: "rgba(255,80,80,0.18)",
    backgroundColor: "rgba(255,80,80,0.05)",
  },

  smallBtnText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
  },

  smallBtnPrimaryText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
  },

  smallBtnDangerText: {
    color: "rgba(255,145,145,0.82)",
    fontWeight: theme.fontWeight.bold,
    fontSize: 12,
  },

  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusPillText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
  },

  statusBooked: {
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,255,136,0.08)",
  },

  statusPending: {
    borderColor: "rgba(255,200,80,0.40)",
    backgroundColor: "rgba(255,200,80,0.10)",
  },

  statusSaved: {
    borderColor: "rgba(120,170,255,0.45)",
    backgroundColor: "rgba(120,170,255,0.10)",
  },

  statusArchived: {
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  metaInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  leagueLogoTile: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  leagueLogoImg: {
    width: 18,
    height: 18,
  },

  countryFlag: {
    width: 18,
    height: 13,
    borderRadius: 3,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
