// app/trip/[id].tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
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
import tripWorkspaceStore from "@/src/state/tripWorkspace";

import type { SavedItem } from "@/src/core/savedItemTypes";
import type { WorkspaceSectionKey } from "@/src/core/tripWorkspace";
import {
  computeWorkspaceSnapshot,
  groupSavedItemsBySection,
} from "@/src/core/tripWorkspace";

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

/* ---------------- helpers ---------------- */

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

/* ---------------- screen ---------------- */

export default function TripDetailScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const routeTripId = useMemo(() => coerceId((params as any)?.id), [params]);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripsLoaded, setTripsLoaded] = useState(tripsStore.getState().loaded);

  const [savedLoaded, setSavedLoaded] = useState(savedItemsStore.getState().loaded);
  const [allSavedItems, setAllSavedItems] = useState<SavedItem[]>([]);

  const [originLoaded, setOriginLoaded] = useState(
    preferencesStore.getState().loaded
  );
  const [originIata, setOriginIata] = useState(
    preferencesStore.getPreferredOriginIata()
  );

  const [plan, setPlan] = useState<PlanValue>("not_set");
  const isPro = plan === "premium";

  /* ---------------- load plan ---------------- */

  useEffect(() => {
    (async () => {
      try {
        const value = await storage.getString(PLAN_STORAGE_KEY);
        if (value === "premium") setPlan("premium");
        else if (value === "free") setPlan("free");
      } catch {}
    })();
  }, []);

  /* ---------------- stores ---------------- */

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
      setOriginLoaded(Boolean(state.loaded));
      setOriginIata(cleanUpper3(state.preferredOriginIata, "LON"));
    };

    const unsub = preferencesStore.subscribe(sync);
    sync();

    if (!preferencesStore.getState().loaded) {
      preferencesStore.load().finally(sync);
    }

    return () => unsub();
  }, []);

  /* ---------------- derived ---------------- */

  const activeTripId = useMemo(
    () => clean(trip?.id) || clean(routeTripId) || null,
    [trip?.id, routeTripId]
  );

  const savedItems = useMemo(() => {
    if (!activeTripId) return [];
    return allSavedItems.filter((x) => clean(x.tripId) === activeTripId);
  }, [allSavedItems, activeTripId]);

  const groupedBySection = useMemo(
    () => groupSavedItemsBySection(savedItems),
    [savedItems]
  );

  const workspaceSnapshot = useMemo(
    () => computeWorkspaceSnapshot(savedItems),
    [savedItems]
  );

  const data = useTripDetailData({
    trip,
    savedItems,
    originIata,
  });

  /* 🔥 FIX: PASS affiliateUrls */
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
    pending: savedItems.filter((x) => x.status === "pending"),
    saved: savedItems.filter((x) => x.status === "saved"),
    booked: savedItems.filter((x) => x.status === "booked"),
    primaryMatchId: data.primaryMatchId,
    primaryTicketItem: data.primaryTicketItem,
    isPro,
    kickoffTbc: data.kickoffMeta.tbc,
    controller,
  });

  const status = useMemo(() => (trip ? tripStatus(trip) : "Upcoming"), [trip]);

  /* ---------------- render ---------------- */

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.86}>
      <Stack.Screen options={{ headerShown: true, title: "Trip" }} />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: 100,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl + insets.bottom,
            gap: theme.spacing.lg,
          }}
        >
          {!trip ? (
            <GlassCard>
              <EmptyState title="Trip not found" message="No trip available." />
            </GlassCard>
          ) : (
            <>
              {/* HERO */}
              <GlassCard>
                <Text style={styles.city}>{data.cityName}</Text>
                <Text style={styles.meta}>{summaryLine(trip)}</Text>

                <View style={styles.heroRow}>
                  <Text style={styles.status}>{statusLabel(status)}</Text>
                  <Pressable onPress={controller.onViewWallet}>
                    <Text style={styles.wallet}>Wallet</Text>
                  </Pressable>
                </View>

                <View style={styles.progressBox}>
                  <Text style={styles.progressText}>
                    {vm.tripCompletionPct ?? 0}% ready
                  </Text>
                  <Text style={styles.nextText}>
                    {nextStepLabel(vm.nextIncompleteStep?.key)}
                  </Text>
                </View>

                <View style={styles.heroActions}>
                  <Pressable style={styles.primaryBtn} onPress={controller.onEditTrip}>
                    <Text style={styles.primaryBtnText}>Continue planning</Text>
                  </Pressable>
                </View>
              </GlassCard>

              <NextBestActionCard
                action={vm.nextAction}
                isPro={isPro}
                onUpgradePress={controller.onUpgradePress}
              />

              {/* 🔥 FIXED PLANNING RAIL */}
              <GlassCard>
                <Text style={styles.sectionTitle}>Plan your trip</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[
                    { key: "tickets", label: "Tickets" },
                    { key: "stay", label: "Stay" },
                    { key: "travel", label: "Travel" },
                    { key: "things", label: "Extras" },
                  ].map((item) => {
                    const count =
                      groupedBySection[item.key as WorkspaceSectionKey]?.length || 0;

                    return (
                      <Pressable
                        key={item.key}
                        style={styles.railCard}
                        onPress={() => controller.onOpenSection(item.key)}
                      >
                        <Text style={styles.railTitle}>{item.label}</Text>
                        <Text style={styles.railSub}>
                          {count > 0 ? `${count} added` : "Not added"}
                        </Text>
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
