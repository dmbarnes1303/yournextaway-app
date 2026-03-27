// app/trip/[id].tsx

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

type PlannerCardItem = {
  key: Extract<WorkspaceSectionKey, "tickets" | "stay" | "travel" | "things">;
  label: string;
  emptyLabel: string;
};

const PLANNER_ITEMS: PlannerCardItem[] = [
  { key: "tickets", label: "Tickets", emptyLabel: "Not secured" },
  { key: "travel", label: "Travel", emptyLabel: "Not added" },
  { key: "stay", label: "Stay", emptyLabel: "Not added" },
  { key: "things", label: "Extras", emptyLabel: "Optional" },
];

function statusLabel(status: string) {
  const v = String(status ?? "").toLowerCase();
  if (v === "completed") return "Completed";
  if (v === "in progress") return "In progress";
  return "Upcoming";
}

function sectionCountLabel(count: number, emptyLabel: string) {
  if (count <= 0) return emptyLabel;
  if (count === 1) return "1 added";
  return `${count} added`;
}

function nextStepLabel(stepKey?: string | null) {
  if (stepKey === "tickets") return "Secure tickets";
  if (stepKey === "flight") return "Sort flights";
  if (stepKey === "hotel") return "Lock hotel";
  if (stepKey === "transfer") return "Sort transport";
  if (stepKey === "things") return "Add extras";
  return "Continue planning";
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
        // ignore
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

  const dominantAction = vm.nextAction;
  const dominantTitle = dominantAction?.title || "Continue planning";
  const dominantBody =
    dominantAction?.body ||
    "Move the trip forward by securing the next core booking step.";
  const dominantCta = dominantAction?.cta || "Continue planning";

  const ticketHeadline = data.ticketsPriceFrom || "Tickets not priced yet";
  const tripHeadline = data.tripPriceFrom || vm.commercialSummaryLine || "Trip estimate building";

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
                <View style={styles.headerTopRow}>
                  <View style={styles.headerTitleWrap}>
                    <Text style={styles.city}>{data.cityName}</Text>
                    <Text style={styles.meta}>{summaryLine(trip)}</Text>
                  </View>

                  <Pressable onPress={controller.onViewWallet} hitSlop={8}>
                    <Text style={styles.walletLink}>Wallet</Text>
                  </Pressable>
                </View>

                <View style={styles.badgeRow}>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{statusLabel(status)}</Text>
                  </View>

                  {data.kickoffMeta.tbc ? (
                    <View style={styles.warningPill}>
                      <Text style={styles.warningPillText}>Kickoff TBC</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.priceRow}>
                  <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>Tickets</Text>
                    <Text style={styles.priceValue}>{ticketHeadline}</Text>
                  </View>

                  <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>Trip</Text>
                    <Text style={styles.priceValue}>{tripHeadline}</Text>
                  </View>
                </View>

                <View style={styles.decisionCard}>
                  <Text style={styles.decisionEyebrow}>Right now</Text>
                  <Text style={styles.decisionTitle}>{dominantTitle}</Text>
                  <Text style={styles.decisionBody}>{dominantBody}</Text>

                  <View style={styles.decisionMetaRow}>
                    <Text style={styles.decisionMetaText}>
                      {vm.bookingFunnelLabel || `Next: ${nextStepLabel(vm.nextIncompleteStep?.key)}`}
                    </Text>

                    {vm.tripCompletionPct != null ? (
                      <Text style={styles.decisionMetaText}>
                        {vm.tripCompletionPct}% ready
                      </Text>
                    ) : null}
                  </View>

                  <Pressable
                    style={styles.primaryActionBtn}
                    onPress={
                      dominantAction?.onPress
                        ? () => dominantAction.onPress()
                        : controller.onEditTrip
                    }
                  >
                    <Text style={styles.primaryActionBtnText}>{dominantCta}</Text>
                  </Pressable>

                  {vm.capHint ? <Text style={styles.capHint}>{vm.capHint}</Text> : null}
                </View>
              </GlassCard>

              <GlassCard>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Trip planner</Text>
                  <Text style={styles.sectionSubtitle}>
                    {vm.completionSummary || "Move the trip forward one step at a time."}
                  </Text>
                </View>

                <View style={styles.plannerGrid}>
                  {PLANNER_ITEMS.map((item) => {
                    const count = groupedBySection[item.key]?.length || 0;

                    let sub = sectionCountLabel(count, item.emptyLabel);

                    if (item.key === "tickets" && data.ticketsPriceFrom) {
                      sub = data.ticketsPriceFrom;
                    } else if (item.key === "travel" && data.flightsPriceFrom) {
                      sub = data.flightsPriceFrom;
                    } else if (item.key === "stay" && data.hotelsPriceFrom) {
                      sub = data.hotelsPriceFrom;
                    } else if (item.key === "things" && data.experiencesPriceFrom) {
                      sub = data.experiencesPriceFrom;
                    }

                    return (
                      <Pressable
                        key={item.key}
                        style={styles.plannerCard}
                        onPress={() => controller.onOpenSection(item.key)}
                      >
                        <Text style={styles.plannerCardTitle}>{item.label}</Text>
                        <Text style={styles.plannerCardSub}>{sub}</Text>
                      </Pressable>
                    );
                  })}
                </View>
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

  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },

  headerTitleWrap: {
    flex: 1,
  },

  city: {
    fontSize: 30,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },

  meta: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },

  walletLink: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.accent,
    paddingTop: 8,
  },

  badgeRow: {
    marginTop: theme.spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },

  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  statusPillText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "800",
  },

  warningPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,170,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,170,0,0.28)",
  },

  warningPillText: {
    color: "rgba(255,200,90,1)",
    fontSize: 12,
    fontWeight: "800",
  },

  priceRow: {
    marginTop: theme.spacing.md,
    flexDirection: "row",
    gap: theme.spacing.sm,
  },

  priceCard: {
    flex: 1,
    borderRadius: 16,
    padding: theme.spacing.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  priceLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  priceValue: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: theme.colors.text,
  },

  decisionCard: {
    marginTop: theme.spacing.md,
    borderRadius: 18,
    padding: theme.spacing.md,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  decisionEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  decisionTitle: {
    marginTop: 8,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.4,
  },

  decisionBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },

  decisionMetaRow: {
    marginTop: theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
  },

  decisionMetaText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textMuted,
    fontWeight: "700",
  },

  primaryActionBtn: {
    marginTop: theme.spacing.md,
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
  },

  primaryActionBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0B1020",
  },

  capHint: {
    marginTop: theme.spacing.sm,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },

  sectionHeaderRow: {
    marginBottom: theme.spacing.md,
    gap: 4,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },

  plannerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },

  plannerCard: {
    width: "48%",
    minHeight: 98,
    borderRadius: 16,
    padding: theme.spacing.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    justifyContent: "space-between",
  },

  plannerCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },

  plannerCardSub: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },
});
