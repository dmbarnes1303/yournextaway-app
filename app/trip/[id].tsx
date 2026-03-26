import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import NextBestActionCard from "@/src/components/NextBestActionCard";
import TripMatchesCard from "@/src/components/trip/TripMatchesCard";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import preferencesStore from "@/src/state/preferences";

import type { SavedItem } from "@/src/core/savedItemTypes";
import type { WorkspaceSectionKey } from "@/src/core/tripWorkspace";
import { groupSavedItemsBySection } from "@/src/core/tripWorkspace";

import storage from "@/src/services/storage";

import useTripDetailController from "@/src/features/tripDetail/useTripDetailController";
import useTripDetailViewModel from "@/src/features/tripDetail/useTripDetailViewModel";
import useTripDetailData from "@/src/features/tripDetail/useTripDetailData";

import {
  type PlanValue,
  clean,
  cleanUpper3,
  coerceId,
  itemResolvedScore,
  livePriceLine,
  summaryLine,
  ticketProviderFromItem,
  tripStatus,
} from "@/src/features/tripDetail/helpers";

const PLAN_STORAGE_KEY = "yna:plan";

type PlannerRailItem = {
  key: Extract<WorkspaceSectionKey, "tickets" | "stay" | "travel" | "things">;
  label: string;
};

const PLANNER_RAIL_ITEMS: PlannerRailItem[] = [
  { key: "tickets", label: "Tickets" },
  { key: "stay", label: "Stay" },
  { key: "travel", label: "Travel" },
  { key: "things", label: "Extras" },
];

function statusLabel(status: string) {
  const v = String(status ?? "").toLowerCase();
  if (v === "completed") return "Completed";
  if (v === "in progress") return "In progress";
  return "Upcoming";
}

function nextStepLabel(stepKey?: string | null) {
  if (stepKey === "tickets") return "Add tickets";
  if (stepKey === "flight") return "Check travel";
  if (stepKey === "hotel") return "Find a stay";
  if (stepKey === "transfer") return "Sort transport";
  if (stepKey === "things") return "Add extras";
  return "Continue planning";
}

function sectionCountLabel(count: number) {
  if (count <= 0) return "Not added";
  return `${count} added`;
}

export default function TripDetailScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const routeTripId = useMemo(() => coerceId((params as any)?.id), [params]);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripsLoaded, setTripsLoaded] = useState<boolean>(tripsStore.getState().loaded);

  const [savedLoaded, setSavedLoaded] = useState<boolean>(savedItemsStore.getState().loaded);
  const [allSavedItems, setAllSavedItems] = useState<SavedItem[]>([]);

  const [originIata, setOriginIata] = useState<string>(
    preferencesStore.getPreferredOriginIata()
  );

  const [plan, setPlan] = useState<PlanValue>("not_set");
  const isPro = plan === "premium";

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        const value = await storage.getString(PLAN_STORAGE_KEY);
        if (cancelled) return;

        if (value === "premium") setPlan("premium");
        else if (value === "free") setPlan("free");
      } catch {
        // ignore storage failure
      }
    }

    void loadPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sync = () => {
      const state = tripsStore.getState();
      setTripsLoaded(state.loaded);
      setTrip(state.trips.find((x) => x.id === routeTripId) ?? null);
    };

    const unsub = tripsStore.subscribe(sync);
    sync();

    if (!tripsStore.getState().loaded) {
      tripsStore.loadTrips().finally(sync);
    }

    return () => unsub();
  }, [routeTripId]);

  useEffect(() => {
    const sync = () => {
      const state = savedItemsStore.getState();
      setSavedLoaded(state.loaded);
      setAllSavedItems(Array.isArray(state.items) ? state.items : []);
    };

    const unsub = savedItemsStore.subscribe(sync);
    sync();

    if (!savedItemsStore.getState().loaded) {
      savedItemsStore.load().finally(sync);
    }

    return () => unsub();
  }, []);

  useEffect(() => {
    const sync = () => {
      const state = preferencesStore.getState();
      setOriginIata(cleanUpper3(state.preferredOriginIata, "LON"));
    };

    const unsub = preferencesStore.subscribe(sync);
    sync();

    if (!preferencesStore.getState().loaded) {
      preferencesStore.load().finally(sync);
    }

    return () => unsub();
  }, []);

  const activeTripId = useMemo(() => {
    return clean(trip?.id) || clean(routeTripId) || null;
  }, [trip?.id, routeTripId]);

  const savedItems = useMemo(() => {
    if (!activeTripId) return [];
    return allSavedItems.filter((item) => clean(item.tripId) === activeTripId);
  }, [allSavedItems, activeTripId]);

  const pendingItems = useMemo(
    () => savedItems.filter((item) => item.status === "pending"),
    [savedItems]
  );

  const savedOnlyItems = useMemo(
    () => savedItems.filter((item) => item.status === "saved"),
    [savedItems]
  );

  const bookedItems = useMemo(
    () => savedItems.filter((item) => item.status === "booked"),
    [savedItems]
  );

  const groupedBySection = useMemo(() => {
    return groupSavedItemsBySection(savedItems);
  }, [savedItems]);

  const data = useTripDetailData({
    trip,
    savedItems,
    originIata,
  });

  const controller = useTripDetailController({
    trip,
    activeTripId,
    cityName: data.cityName,
    primaryLeagueId: data.primaryLeagueId,
    fixturesById: data.fixturesById,
    ticketsByMatchId: data.ticketsByMatchId,
    affiliateUrls: data.affiliateUrls,
  });

  const vm = useTripDetailViewModel({
    trip,
    tripsLoaded,
    savedLoaded,
    workspaceLoaded: true,
    routeTripId,
    cityName: data.cityName,
    originIata,
    affiliateUrls: data.affiliateUrls,
    progress: data.progress,
    readiness: data.readiness,
    pending: pendingItems,
    saved: savedOnlyItems,
    booked: bookedItems,
    primaryMatchId: data.primaryMatchId,
    primaryTicketItem: data.primaryTicketItem,
    isPro,
    kickoffTbc: data.kickoffMeta.tbc,
    controller,
    bookingPriceBoard: data.bookingPriceBoard,
    ticketsPriceFrom: data.ticketsPriceFrom,
    flightsPriceFrom: data.flightsPriceFrom,
    hotelsPriceFrom: data.hotelsPriceFrom,
    transfersPriceFrom: data.transfersPriceFrom,
    experiencesPriceFrom: data.experiencesPriceFrom,
    tripPriceFrom: data.tripPriceFrom,
  });

  const status = useMemo(() => {
    return trip ? tripStatus(trip) : "Upcoming";
  }, [trip]);

  const isMissingTrip = !trip && tripsLoaded;

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.86}>
      <Stack.Screen options={{ headerShown: true, title: "Trip" }} />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: theme.spacing.xxl + insets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {vm.loading ? (
            <GlassCard>
              <EmptyState
                title="Loading trip"
                message="Pulling together matches, bookings and trip details."
              />
            </GlassCard>
          ) : isMissingTrip ? (
            <GlassCard>
              <EmptyState title="Trip not found" message="No trip available." />
            </GlassCard>
          ) : !trip ? (
            <GlassCard>
              <EmptyState title="Loading" message="Trip details are still loading." />
            </GlassCard>
          ) : (
            <>
              <GlassCard>
                <Text style={styles.city}>{data.cityName}</Text>
                <Text style={styles.meta}>{summaryLine(trip)}</Text>

                <View style={styles.heroRow}>
                  <Text style={styles.statusBadge}>{statusLabel(status)}</Text>

                  <Pressable onPress={controller.onViewWallet} hitSlop={8}>
                    <Text style={styles.walletLink}>Wallet</Text>
                  </Pressable>
                </View>

                <View style={styles.progressBox}>
                  <Text style={styles.progressText}>{vm.tripCompletionPct ?? 0}% ready</Text>
                  <Text style={styles.nextText}>{nextStepLabel(vm.nextIncompleteStep?.key)}</Text>

                  {vm.bookingFunnelLabel ? (
                    <Text style={styles.funnelText}>{vm.bookingFunnelLabel}</Text>
                  ) : null}

                  {vm.commercialSummaryLine ? (
                    <Text style={styles.commercialText}>{vm.commercialSummaryLine}</Text>
                  ) : null}
                </View>

                <View style={styles.heroActions}>
                  <Pressable style={styles.primaryBtn} onPress={controller.onEditTrip}>
                    <Text style={styles.primaryBtnText}>Continue planning</Text>
                  </Pressable>
                </View>

                {vm.capHint ? <Text style={styles.capHint}>{vm.capHint}</Text> : null}
              </GlassCard>

              <NextBestActionCard
                action={vm.nextAction}
                isPro={isPro}
                onUpgradePress={controller.onUpgradePress}
              />

              <GlassCard>
                <Text style={styles.sectionTitle}>Plan your trip</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.railScrollContent}
                >
                  {PLANNER_RAIL_ITEMS.map((item) => {
                    const count = groupedBySection[item.key]?.length || 0;

                    return (
                      <Pressable
                        key={item.key}
                        style={styles.railCard}
                        onPress={() => controller.onOpenSection(item.key)}
                      >
                        <Text style={styles.railTitle}>{item.label}</Text>
                        <Text style={styles.railSub}>{sectionCountLabel(count)}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </GlassCard>

              <TripMatchesCard
                trip={trip}
                numericMatchIds={data.numericMatchIds}
                primaryMatchId={data.primaryMatchId}
                fixturesById={data.fixturesById}
                ticketsByMatchId={data.ticketsByMatchId}
                fxLoading={data.fxLoading}
                onAddMatch={controller.onAddMatch}
                onOpenTicketsForMatch={controller.openTicketsForMatch}
                onOpenMatchActions={controller.openMatchActions}
                onSetPrimaryMatch={controller.setPrimaryMatch}
                onRemoveMatch={controller.removeMatch}
                getTicketProviderFromItem={ticketProviderFromItem}
                getTicketScoreFromItem={itemResolvedScore}
                getLivePriceLine={livePriceLine}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  content: {
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  city: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.4,
  },

  meta: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },

  heroRow: {
    marginTop: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },

  statusBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },

  walletLink: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.accent,
  },

  progressBox: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 4,
  },

  progressText: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },

  nextText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },

  funnelText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },

  commercialText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },

  heroActions: {
    marginTop: theme.spacing.md,
  },

  primaryBtn: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
  },

  primaryBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0B1020",
  },

  capHint: {
    marginTop: theme.spacing.sm,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  railScrollContent: {
    paddingRight: 4,
    gap: theme.spacing.sm,
  },

  railCard: {
    width: 132,
    minHeight: 88,
    borderRadius: 16,
    padding: theme.spacing.md,
    marginRight: theme.spacing.sm,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    justifyContent: "space-between",
  },

  railTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },

  railSub: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
  },
});
