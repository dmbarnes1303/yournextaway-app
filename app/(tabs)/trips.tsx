// app/(tabs)/trips.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  ImageBackground,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import SectionHeader from "@/src/components/SectionHeader";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { LEAGUES, parseIsoDateOnly, toIsoDate } from "@/src/constants/football";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import walletStore, { type WalletTripGroup } from "@/src/state/walletStore";
import type { SavedItem } from "@/src/core/savedItemTypes";

import { getFlagImageUrl } from "@/src/utils/flagImages";

const TRIPS_HEADER_LOGO = "";

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

function cityLabel(t: Trip) {
  const raw = String((t as any)?.displayCity ?? t.cityId ?? "").trim();
  return titleCase(raw || "Trip");
}

function slugify(input: string) {
  return String(input ?? "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function ordinal(day: number) {
  if (day % 10 === 1 && day % 100 !== 11) return `${day}st`;
  if (day % 10 === 2 && day % 100 !== 12) return `${day}nd`;
  if (day % 10 === 3 && day % 100 !== 13) return `${day}rd`;
  return `${day}th`;
}

function formatPrettyDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return "—";

  const day = ordinal(d.getUTCDate());
  const month = d.toLocaleDateString("en-GB", {
    month: "long",
    timeZone: "UTC",
  });
  const year = d.getUTCFullYear();

  return `${day} ${month} ${year}`;
}

function tripSummaryLine(t: Trip) {
  const a = t.startDate ? formatPrettyDate(t.startDate) : "—";
  const b = t.endDate ? formatPrettyDate(t.endDate) : "—";
  const n = t.matchIds?.length ?? 0;
  return `${a} - ${b} • ${n} match${n === 1 ? "" : "es"}`;
}

function isUpcoming(t: Trip) {
  const start = t.startDate ? parseIsoDateOnly(t.startDate) : null;
  if (!start) return false;

  const today = parseIsoDateOnly(toIsoDate(new Date()));
  if (!today) return true;

  return start.getTime() >= today.getTime();
}

function buildCountsIndex(items: SavedItem[]) {
  const byTrip: Record<
    string,
    {
      total: number;
      pending: number;
      booked: number;
      saved: number;
    }
  > = {};

  for (const it of items) {
    const tid = String(it.tripId ?? "").trim();
    if (!tid) continue;

    if (!byTrip[tid]) byTrip[tid] = { total: 0, pending: 0, booked: 0, saved: 0 };

    const c = byTrip[tid];
    c.total += 1;
    if (it.status === "pending") c.pending += 1;
    else if (it.status === "booked") c.booked += 1;
    else if (it.status === "saved") c.saved += 1;
  }

  return byTrip;
}

function badgeLabel(t: Trip, counts?: { pending: number; booked: number }) {
  const pending = counts?.pending ?? 0;
  const booked = counts?.booked ?? 0;

  if (pending > 0) return { text: `${pending} pending`, kind: "pending" as const };
  if (booked > 0) return { text: `${booked} booked`, kind: "booked" as const };

  const noDates = !t.startDate || !t.endDate;
  if (noDates) return { text: "Draft", kind: "draft" as const };

  return { text: "Ready", kind: "ready" as const };
}

function clamp2(n: number) {
  return Math.max(0, Math.min(99, n));
}

function tripProgress(counts?: { total: number; pending: number; booked: number; saved: number }) {
  const c = counts ?? { total: 0, pending: 0, booked: 0, saved: 0 };
  if (c.total <= 0) return 0;
  return Math.max(0, Math.min(1, c.booked / c.total));
}

function progressLabel(counts?: { total: number; pending: number; booked: number; saved: number }) {
  const c = counts ?? { total: 0, pending: 0, booked: 0, saved: 0 };
  if (c.total <= 0) return "Nothing saved yet";
  if (c.booked === c.total) return "Everything booked";
  if (c.booked > 0) return `${c.booked}/${c.total} booked`;
  if (c.pending > 0) return `${c.pending} pending`;
  return `${c.total} saved`;
}

function getTripVisualMeta(t: Trip) {
  const city = cityLabel(t);
  const slug = slugify(city);

  const storedLeagueId =
    (t as any)?.leagueId != null ? Number((t as any).leagueId) : null;
  const storedCountryCode = String((t as any)?.countryCode ?? "").trim() || null;
  const storedLeagueLogo = String((t as any)?.leagueLogo ?? "").trim() || null;

  const fallback = TRIP_CITY_META[slug] ?? null;

  const leagueId = storedLeagueId ?? fallback?.leagueId ?? null;
  const leagueMeta = leagueId ? LEAGUES.find((l) => l.leagueId === leagueId) ?? null : null;

  const countryCode =
    storedCountryCode ??
    leagueMeta?.countryCode ??
    fallback?.countryCode ??
    null;

  const leagueLogo = storedLeagueLogo ?? leagueMeta?.logo ?? null;
  const image = String((t as any)?.heroImage ?? "").trim() || fallback?.image || null;

  return {
    countryCode,
    leagueLogo,
    image,
  };
}

function buildWalletIndex(groups: WalletTripGroup[]) {
  const byTrip: Record<
    string,
    {
      booked: number;
      pending: number;
      proofs: number;
      total: number;
      missingProof: number;
    }
  > = {};

  for (const group of groups) {
    const tripId = String(group.tripId ?? "").trim();
    if (!tripId) continue;

    const booked = group.items.filter((x) => x.status === "booked").length;
    const pending = group.items.filter((x) => x.status === "pending").length;
    const proofs = group.items.filter((x) => x.hasProof).length;
    const total = group.items.length;
    const missingProof = group.items.filter((x) => x.status === "booked" && !x.hasProof).length;

    byTrip[tripId] = { booked, pending, proofs, total, missingProof };
  }

  return byTrip;
}

export default function TripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loadedTrips, setLoadedTrips] = useState(tripsStore.getState().loaded);
  const [trips, setTrips] = useState<Trip[]>(tripsStore.getState().trips);

  const [loadedItems, setLoadedItems] = useState(savedItemsStore.getState().loaded);
  const [items, setItems] = useState<SavedItem[]>(savedItemsStore.getState().items);

  const [walletGroups, setWalletGroups] = useState<WalletTripGroup[]>([]);
  const [walletLoaded, setWalletLoaded] = useState(false);

  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = tripsStore.subscribe((s) => {
      setLoadedTrips(s.loaded);
      setTrips(s.trips);
    });

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().catch(() => {});
    }

    return unsub;
  }, []);

  useEffect(() => {
    const unsub = savedItemsStore.subscribe((s) => {
      setLoadedItems(s.loaded);
      setItems(s.items);
    });

    if (!savedItemsStore.getState().loaded) {
      savedItemsStore.load().catch(() => {});
    }

    return unsub;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadWalletGroups() {
      try {
        const groups = await walletStore.getGroupedByTrip();
        if (!cancelled) {
          setWalletGroups(groups);
          setWalletLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setWalletGroups([]);
          setWalletLoaded(true);
        }
      }
    }

    loadWalletGroups();

    return () => {
      cancelled = true;
    };
  }, []);

  const loading = !loadedTrips || !loadedItems || !walletLoaded;

  const countsIndex = useMemo(() => buildCountsIndex(items), [items]);
  const walletIndex = useMemo(() => buildWalletIndex(walletGroups), [walletGroups]);

  const upcoming = useMemo(() => trips.filter(isUpcoming), [trips]);
  const past = useMemo(() => trips.filter((t) => !isUpcoming(t)), [trips]);

  const totals = useMemo(() => {
    const tripCount = trips.length;
    const pending = items.filter((x) => x.status === "pending").length;
    const booked = items.filter((x) => x.status === "booked").length;
    const saved = items.filter((x) => x.status === "saved").length;
    return { tripCount, pending, booked, saved };
  }, [trips.length, items]);

  const featuredTrip = useMemo(() => {
    if (upcoming.length > 0) return upcoming[0];
    if (past.length > 0) return past[0];
    return null;
  }, [upcoming, past]);

  const featuredCounts = featuredTrip ? countsIndex[featuredTrip.id] : undefined;
  const featuredWallet = featuredTrip ? walletIndex[featuredTrip.id] : undefined;

  const showEmpty = !loading && trips.length === 0;

  const openTrip = useCallback(
    (t: Trip) => router.push({ pathname: "/trip/[id]", params: { id: t.id } } as any),
    [router]
  );

  const editTrip = useCallback(
    (t: Trip) => router.push({ pathname: "/trip/build", params: { tripId: t.id } } as any),
    [router]
  );

  const goBuild = useCallback(() => router.push("/trip/build"), [router]);
  const goFixtures = useCallback(() => router.push("/(tabs)/fixtures" as any), [router]);

  const goWalletForTrip = useCallback(
    (t: Trip) => {
      router.push({
        pathname: "/(tabs)/wallet",
        params: { tripId: t.id },
      } as any);
    },
    [router]
  );

  const actuallyDeleteTrip = useCallback(
    async (t: Trip) => {
      if (deletingTripId) return;

      setDeletingTripId(t.id);
      try {
        await tripsStore.deleteTripCascade(t.id);
      } catch {
        Alert.alert("Couldn’t delete", "Try again.");
      } finally {
        setDeletingTripId(null);
      }
    },
    [deletingTripId]
  );

  const deleteTrip = useCallback(
    (t: Trip) => {
      const c = countsIndex[t.id] ?? { total: 0, pending: 0, booked: 0, saved: 0 };
      const name = cityLabel(t);

      Alert.alert(
        "Delete trip?",
        `"${name}" will be removed from this device.\n\nItems: ${c.total} • Pending: ${c.pending} • Booked: ${c.booked}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            style: "destructive",
            onPress: () => {
              const msg =
                `This cannot be undone.\n\n` +
                `Deleting this trip will also remove all saved links, pending items, booked items, and any wallet attachments for this trip from this device.`;

              Alert.alert("Confirm delete", msg, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete trip",
                  style: "destructive",
                  onPress: () => {
                    actuallyDeleteTrip(t).catch(() => null);
                  },
                },
              ]);
            },
          },
        ]
      );
    },
    [countsIndex, actuallyDeleteTrip]
  );

  return (
    <Background
      imageSource={getBackground("trips")}
      overlayOpacity={0.02}
      topShadeOpacity={0.22}
      bottomShadeOpacity={0.28}
      centerShadeOpacity={0.02}
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: theme.spacing.xxl + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.hero} strength="strong" noPadding>
            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroTextWrap}>
                  <Text style={styles.kicker}>WORKSPACES</Text>
                  <Text style={styles.title}>Trips</Text>
                  <Text style={styles.subtitle}>
                    Plan the trip, track key progress, and keep each football getaway in one clean workspace.
                  </Text>
                </View>

                {TRIPS_HEADER_LOGO ? (
                  <View style={styles.heroLogoSlot}>
                    <View style={styles.logoPanel}>
                      <Image
                        source={{ uri: TRIPS_HEADER_LOGO }}
                        style={styles.logoPanelImage}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.heroStatsRow}>
                <MetricCard
                  icon="airplane-outline"
                  value={String(clamp2(totals.tripCount))}
                  label="Trips"
                />
                <MetricCard
                  icon="time-outline"
                  value={String(clamp2(totals.pending))}
                  label="Pending"
                />
                <MetricCard
                  icon="checkmark-done-outline"
                  value={String(clamp2(totals.booked))}
                  label="Booked"
                />
              </View>

              <View style={styles.heroActionsRow}>
                <Pressable
                  onPress={goBuild}
                  style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
                >
                  <View style={styles.primaryActionIcon}>
                    <Ionicons name="add-outline" size={18} color={theme.colors.text} />
                  </View>
                  <View style={styles.primaryActionTextWrap}>
                    <Text style={styles.primaryActionTitle}>Build a trip</Text>
                    <Text style={styles.primaryActionSub}>Create a new workspace</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={goFixtures}
                  style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
                >
                  <View style={styles.secondaryActionIcon}>
                    <Ionicons name="calendar-outline" size={18} color={theme.colors.text} />
                  </View>
                  <View style={styles.secondaryActionTextWrap}>
                    <Text style={styles.secondaryActionTitle}>Browse fixtures</Text>
                    <Text style={styles.secondaryActionSub}>Start from a match</Text>
                  </View>
                </Pressable>
              </View>

              <View style={styles.heroSummaryRow}>
                <SummaryPill label="Saved" value={totals.saved} />
                <SummaryPill label="Pending" value={totals.pending} />
                <SummaryPill label="Booked" value={totals.booked} />
              </View>

              {loading ? (
                <View style={styles.heroLoadingRow}>
                  <ActivityIndicator />
                  <Text style={styles.muted}>Loading your trips…</Text>
                </View>
              ) : null}
            </View>
          </GlassCard>

          {!loading && featuredTrip ? (
            <View style={styles.section}>
              <SectionHeader
                title="Spotlight"
                subtitle="Your most relevant workspace right now"
              />

              <SpotlightTripCard
                trip={featuredTrip}
                counts={featuredCounts}
                wallet={featuredWallet}
                onOpen={openTrip}
                onOpenWallet={goWalletForTrip}
              />
            </View>
          ) : null}

          {showEmpty ? (
            <GlassCard style={styles.card} strength="default">
              <EmptyState
                title="No trips yet"
                message="Start from a fixture, then build your trip workspace around tickets, travel and saved items."
              />
              <View style={styles.emptyActions}>
                <Pressable
                  onPress={goBuild}
                  style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}
                >
                  <Ionicons name="add-circle-outline" size={18} color={theme.colors.text} />
                  <Text style={styles.emptyActionText}>Create trip</Text>
                </Pressable>

                <Pressable
                  onPress={goFixtures}
                  style={({ pressed }) => [styles.emptyAction, pressed && styles.pressed]}
                >
                  <Ionicons name="search-outline" size={18} color={theme.colors.text} />
                  <Text style={styles.emptyActionText}>Browse fixtures</Text>
                </Pressable>
              </View>
            </GlassCard>
          ) : null}

          {!loading && upcoming.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="Upcoming"
                subtitle={`${upcoming.length} active workspace${upcoming.length === 1 ? "" : "s"}`}
              />
              <View style={styles.list}>
                {upcoming.map((t) => (
                  <TripCard
                    key={t.id}
                    t={t}
                    counts={countsIndex[t.id]}
                    wallet={walletIndex[t.id]}
                    deletingTripId={deletingTripId}
                    onOpen={openTrip}
                    onEdit={editTrip}
                    onDelete={deleteTrip}
                    onOpenWallet={goWalletForTrip}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {!loading && past.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="Past & draft"
                subtitle={`${past.length} workspace${past.length === 1 ? "" : "s"}`}
              />
              <View style={styles.list}>
                {past.map((t) => (
                  <TripCard
                    key={t.id}
                    t={t}
                    counts={countsIndex[t.id]}
                    wallet={walletIndex[t.id]}
                    deletingTripId={deletingTripId}
                    onOpen={openTrip}
                    onEdit={editTrip}
                    onDelete={deleteTrip}
                    onOpenWallet={goWalletForTrip}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={16} color={theme.colors.textSecondary} />
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricKey}>{label}</Text>
    </View>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryPillLabel}>{label}</Text>
      <Text style={styles.summaryPillValue}>{String(clamp2(value))}</Text>
    </View>
  );
}

function StatusChip({
  kind,
  text,
}: {
  kind: "pending" | "booked" | "draft" | "ready";
  text: string;
}) {
  const style =
    kind === "pending"
      ? styles.chipPending
      : kind === "booked"
        ? styles.chipBooked
        : kind === "draft"
          ? styles.chipDraft
          : styles.chipReady;

  return (
    <View style={[styles.chip, style]}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function LeagueMetaInline({ trip }: { trip: Trip }) {
  const meta = getTripVisualMeta(trip);
  const flagUrl = meta.countryCode ? getFlagImageUrl(meta.countryCode) : null;

  if (!meta.leagueLogo && !flagUrl) return null;

  return (
    <View style={styles.leagueMetaInline}>
      {meta.leagueLogo ? (
        <View style={styles.leagueLogoTile}>
          <Image
            source={{ uri: meta.leagueLogo }}
            style={styles.leagueLogoImg}
            resizeMode="contain"
          />
        </View>
      ) : null}

      {flagUrl ? (
        <Image source={{ uri: flagUrl }} style={styles.countryFlag} resizeMode="cover" />
      ) : null}
    </View>
  );
}

function WalletStrip({
  wallet,
  onPress,
}: {
  wallet?: {
    booked: number;
    pending: number;
    proofs: number;
    total: number;
    missingProof: number;
  };
  onPress: () => void;
}) {
  const booked = wallet?.booked ?? 0;
  const pending = wallet?.pending ?? 0;
  const missingProof = wallet?.missingProof ?? 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.walletStrip, pressed && styles.pressed]}>
      <View style={styles.walletStripLeft}>
        <View style={styles.walletStripIcon}>
          <Ionicons name="wallet-outline" size={16} color={theme.colors.text} />
        </View>

        <View style={styles.walletStripTextWrap}>
          <Text style={styles.walletStripTitle}>Wallet</Text>
          <Text style={styles.walletStripMeta}>
            {`${booked} booked • ${pending} pending • ${missingProof} missing proof`}
          </Text>
        </View>
      </View>

      <View style={styles.walletStripRight}>
        <Text style={styles.walletStripLink}>Open</Text>
        <Text style={styles.walletStripArrow}>›</Text>
      </View>
    </Pressable>
  );
}

function SpotlightTripCard({
  trip,
  counts,
  wallet,
  onOpen,
  onOpenWallet,
}: {
  trip: Trip;
  counts?: { total: number; pending: number; booked: number; saved: number };
  wallet?: { booked: number; pending: number; proofs: number; total: number; missingProof: number };
  onOpen: (t: Trip) => void;
  onOpenWallet: (t: Trip) => void;
}) {
  const badge = badgeLabel(trip, counts);
  const progress = tripProgress(counts);
  const visual = getTripVisualMeta(trip);

  return (
    <Pressable onPress={() => onOpen(trip)} style={({ pressed }) => [pressed && styles.pressed]}>
      <GlassCard style={styles.spotlightCard} strength="default" noPadding>
        <ImageBackground
          source={visual.image ? { uri: visual.image } : undefined}
          style={styles.spotlightImageWrap}
          imageStyle={styles.spotlightImage}
        >
          <View style={styles.tripImageOverlayStrong} />
          <View style={styles.spotlightInner}>
            <View style={styles.spotlightTopRow}>
              <View style={styles.spotlightBadgeIcon}>
                <Ionicons name="sparkles-outline" size={18} color={theme.colors.text} />
              </View>

              <StatusChip kind={badge.kind} text={badge.text} />
            </View>

            <View style={styles.tripTitleVisualRow}>
              <Text style={styles.spotlightTitle}>{cityLabel(trip)}</Text>
              <LeagueMetaInline trip={trip} />
            </View>

            <Text style={styles.spotlightMeta}>{tripSummaryLine(trip)}</Text>
            <Text style={styles.spotlightSub}>{progressLabel(counts)}</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(8, progress * 100)}%` }]} />
            </View>

            <View style={styles.spotlightStatsRow}>
              <MiniStat label="Items" value={counts?.total ?? 0} />
              <MiniStat label="Pending" value={counts?.pending ?? 0} />
              <MiniStat label="Booked" value={counts?.booked ?? 0} />
            </View>

            <WalletStrip wallet={wallet} onPress={() => onOpenWallet(trip)} />

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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatValue}>{String(clamp2(value))}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

function TripCard({
  t,
  counts,
  wallet,
  deletingTripId,
  onOpen,
  onEdit,
  onDelete,
  onOpenWallet,
}: {
  t: Trip;
  counts?: { total: number; pending: number; booked: number; saved: number };
  wallet?: { booked: number; pending: number; proofs: number; total: number; missingProof: number };
  deletingTripId: string | null;
  onOpen: (t: Trip) => void;
  onEdit: (t: Trip) => void;
  onDelete: (t: Trip) => void;
  onOpenWallet: (t: Trip) => void;
}) {
  const c = counts ?? { total: 0, pending: 0, booked: 0, saved: 0 };
  const isDeleting = deletingTripId === t.id;
  const badge = badgeLabel(t, c);
  const progress = tripProgress(c);
  const visual = getTripVisualMeta(t);

  return (
    <GlassCard style={styles.tripCard} strength="subtle" noPadding>
      <Pressable
        onPress={() => onOpen(t)}
        disabled={isDeleting}
        style={({ pressed }) => [styles.tripPress, pressed && styles.pressed]}
        android_ripple={{ color: "rgba(255,255,255,0.06)" }}
      >
        <ImageBackground
          source={visual.image ? { uri: visual.image } : undefined}
          style={styles.tripImageWrap}
          imageStyle={styles.tripImage}
        >
          <View style={styles.tripImageOverlay} />

          <View style={styles.tripHeaderRow}>
            <View style={styles.tripHeaderLeft}>
              <View style={styles.tripTitleVisualRow}>
                <Text style={styles.tripTitle} numberOfLines={1}>
                  {cityLabel(t)}
                </Text>
                <LeagueMetaInline trip={t} />
              </View>

              <Text style={styles.tripMeta} numberOfLines={1}>
                {tripSummaryLine(t)}
              </Text>
            </View>

            <View style={styles.tripHeaderRight}>
              <StatusChip kind={badge.kind} text={badge.text} />
            </View>
          </View>

          <Text style={styles.tripProgressText}>{progressLabel(c)}</Text>

          <View style={styles.progressTrackSmall}>
            <View
              style={[
                styles.progressFillSmall,
                { width: `${Math.max(c.total > 0 ? 8 : 0, progress * 100)}%` },
              ]}
            />
          </View>

          <View style={styles.pillRow}>
            <Pill label="Items" value={c.total} />
            <Pill label="Pending" value={c.pending} />
            <Pill label="Booked" value={c.booked} />
          </View>

          <WalletStrip wallet={wallet} onPress={() => onOpenWallet(t)} />

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => onEdit(t)}
              disabled={isDeleting}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionGhost,
                pressed && styles.pressed,
                isDeleting && { opacity: 0.5 },
              ]}
            >
              <Ionicons name="create-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.actionGhostText}>Edit</Text>
            </Pressable>

            <Pressable
              onPress={() => onDelete(t)}
              disabled={isDeleting}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.actionDanger,
                pressed && styles.pressed,
                isDeleting && { opacity: 0.5 },
              ]}
            >
              <Ionicons name="trash-outline" size={15} color={"rgba(255,145,145,0.82)"} />
              <Text style={styles.actionDangerText}>{isDeleting ? "Deleting…" : "Delete"}</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </Pressable>
    </GlassCard>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillVal}>{String(clamp2(value))}</Text>
      <Text style={styles.pillKey}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

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

  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  heroTextWrap: {
    flex: 1,
  },

  heroLogoSlot: {
    width: 108,
  },

  logoPanel: {
    minHeight: 108,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  logoPanelImage: {
    width: "84%",
    height: "84%",
    opacity: 0.98,
  },

  heroStatsRow: {
    flexDirection: "row",
    gap: 10,
  },

  kicker: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
    letterSpacing: 1.2,
  },

  title: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: theme.fontWeight.bold,
  },

  metricCard: {
    flex: 1,
    minHeight: 74,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.18)" : "rgba(10,12,14,0.14)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  metricVal: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 18,
  },

  metricKey: {
    color: theme.colors.textTertiary,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
  },

  heroActionsRow: {
    flexDirection: "row",
    gap: 10,
  },

  primaryAction: {
    flex: 1,
    minHeight: 82,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.34)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(79,224,138,0.10)" : "rgba(79,224,138,0.08)",
    padding: 14,
    gap: 10,
  },

  primaryActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },

  primaryActionTextWrap: {
    gap: 3,
  },

  primaryActionTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  primaryActionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  secondaryAction: {
    flex: 1,
    minHeight: 82,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
    padding: 14,
    gap: 10,
  },

  secondaryActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  secondaryActionTextWrap: {
    gap: 3,
  },

  secondaryActionTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  secondaryActionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  heroSummaryRow: {
    flexDirection: "row",
    gap: 10,
  },

  summaryPill: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.04)",
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryPillLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  summaryPillValue: {
    marginTop: 4,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  heroLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  section: {
    gap: 10,
  },

  list: {
    gap: 12,
  },

  card: {
    padding: theme.spacing.lg,
    borderRadius: 24,
  },

  emptyActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },

  emptyAction: {
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

  emptyActionText: {
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
    minHeight: 308,
    justifyContent: "flex-end",
  },

  spotlightImage: {
    borderRadius: 24,
  },

  tripImageWrap: {
    minHeight: 258,
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  tripImage: {
    borderRadius: 24,
  },

  tripImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,11,9,0.68)",
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

  spotlightBadgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  tripTitleVisualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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

  tripCard: {
    borderRadius: 24,
    overflow: "hidden",
  },

  tripPress: {
    padding: 0,
  },

  tripHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
  },

  tripHeaderLeft: {
    flex: 1,
  },

  tripHeaderRight: {
    alignItems: "flex-end",
    gap: 8,
  },

  tripTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
    flexShrink: 1,
  },

  tripMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  tripProgressText: {
    marginTop: 10,
    marginHorizontal: 14,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  progressTrackSmall: {
    marginTop: 8,
    marginHorizontal: 14,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  progressFillSmall: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(87,162,56,0.88)",
  },

  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  chipText: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
    fontSize: 11,
  },

  chipPending: {
    borderColor: "rgba(255,200,80,0.40)",
    backgroundColor: "rgba(255,200,80,0.10)",
  },

  chipBooked: {
    borderColor: "rgba(120,170,255,0.45)",
    backgroundColor: "rgba(120,170,255,0.10)",
  },

  chipDraft: {
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  chipReady: {
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,255,136,0.08)",
  },

  leagueMetaInline: {
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

  pillRow: {
    marginTop: 12,
    marginHorizontal: 14,
    flexDirection: "row",
    gap: 10,
  },

  pill: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.26)" : "rgba(255,255,255,0.07)",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  pillVal: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  pillKey: {
    marginTop: 4,
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  walletStrip: {
    marginTop: 12,
    marginHorizontal: 14,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(7,10,9,0.42)" : "rgba(7,10,9,0.34)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  walletStripLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  walletStripIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  walletStripTextWrap: {
    flex: 1,
  },

  walletStripTitle: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  walletStripMeta: {
    marginTop: 2,
    color: "rgba(231,236,231,0.82)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: theme.fontWeight.bold,
  },

  walletStripRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  walletStripLink: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  walletStripArrow: {
    color: theme.colors.textTertiary,
    fontSize: 18,
    marginTop: -1,
  },

  actionsRow: {
    marginTop: 10,
    marginHorizontal: 14,
    marginBottom: 14,
    flexDirection: "row",
    gap: 10,
  },

  actionBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexDirection: "row",
    gap: 8,
  },

  actionGhost: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.26)" : "rgba(255,255,255,0.06)",
  },

  actionGhostText: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 13,
  },

  actionDanger: {
    borderColor: "rgba(255,90,90,0.18)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(255,90,90,0.04)" : "rgba(255,90,90,0.035)",
  },

  actionDangerText: {
    color: "rgba(255,145,145,0.82)",
    fontWeight: theme.fontWeight.bold,
    fontSize: 13,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
