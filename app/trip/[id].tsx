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
import { Stack, useLocalSearchParams } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import TripProgressStrip from "@/src/components/TripProgressStrip";
import NextBestActionCard from "@/src/components/NextBestActionCard";
import TripHealthScore from "@/src/components/TripHealthScore";
import TripMatchesCard from "@/src/components/trip/TripMatchesCard";
import TripWorkspaceCard from "@/src/components/trip/TripWorkspaceCard";
import TripStayGuidanceCard from "@/src/components/trip/TripStayGuidanceCard";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import tripsStore, { type Trip } from "@/src/state/trips";
import savedItemsStore from "@/src/state/savedItems";
import preferencesStore from "@/src/state/preferences";
import tripWorkspaceStore from "@/src/state/tripWorkspace";

import type { SavedItem } from "@/src/core/savedItemTypes";
import type { WorkspaceSectionKey, TripWorkspace } from "@/src/core/tripWorkspace";
import {
  DEFAULT_SECTION_ORDER,
  computeWorkspaceSnapshot,
  groupSavedItemsBySection,
} from "@/src/core/tripWorkspace";

import { getIataCityCodeForCity, debugCityKey } from "@/src/data/iataCityCodes";
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

declare const __DEV__: boolean;
const DEV = typeof __DEV__ === "boolean" ? __DEV__ : false;

const PLAN_STORAGE_KEY = "yna:plan";

function heroStatusTone(status: string) {
  const value = String(status ?? "").trim().toLowerCase();

  if (value === "upcoming") return styles.statusPillUpcoming;
  if (value === "in progress") return styles.statusPillLive;
  if (value === "completed") return styles.statusPillComplete;
  return styles.statusPillUpcoming;
}

function completionTone(value: number) {
  if (value >= 85) return styles.completionStrong;
  if (value >= 55) return styles.completionMid;
  return styles.completionSoft;
}

function formatCoreCompleteLabel(count?: number | null) {
  const value = typeof count === "number" ? count : 0;
  return `${value}/4 key steps done`;
}

function nextStepLabel(stepKey?: string | null) {
  const v = String(stepKey ?? "").trim();
  if (v === "tickets") return "Next: Tickets";
  if (v === "flight") return "Next: Flights";
  if (v === "hotel") return "Next: Hotel";
  if (v === "transfer") return "Next: Transport";
  if (v === "things") return "Next: Extras";
  return "Trip basics complete";
}

function statusLabel(status: string) {
  const value = String(status ?? "").trim().toLowerCase();
  if (value === "upcoming") return "Upcoming";
  if (value === "in progress") return "In progress";
  if (value === "completed") return "Completed";
  return "Upcoming";
}

export default function TripDetailScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const routeTripId = useMemo(() => coerceId((params as any)?.id), [params]);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripsLoaded, setTripsLoaded] = useState(tripsStore.getState().loaded);

  const [savedLoaded, setSavedLoaded] = useState(savedItemsStore.getState().loaded);
  const [allSavedItems, setAllSavedItems] = useState<SavedItem[]>([]);

  const [workspaceLoaded, setWorkspaceLoaded] = useState(tripWorkspaceStore.getState().loaded);
  const [workspace, setWorkspace] = useState<TripWorkspace | null>(null);

  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const [originLoaded, setOriginLoaded] = useState<boolean>(preferencesStore.getState().loaded);
  const [originIata, setOriginIata] = useState<string>(preferencesStore.getPreferredOriginIata());

  const [plan, setPlan] = useState<PlanValue>("not_set");
  const [proofBusyId, setProofBusyId] = useState<string | null>(null);
  const [devWarnedCityKey, setDevWarnedCityKey] = useState<string | null>(null);

  const isPro = plan === "premium";

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const value = await storage.getString(PLAN_STORAGE_KEY);
        if (!mounted) return;

        if (value === "free" || value === "premium" || value === "not_set") {
          setPlan(value);
          return;
        }

        if (value === "Free Plan") {
          setPlan("free");
          return;
        }

        if (value === "Premium Plan") {
          setPlan("premium");
        }
      } catch {}
    })();

    return () => {
      mounted = false;
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
      const state = tripWorkspaceStore.getState();
      setWorkspaceLoaded(state.loaded);
      setWorkspace(routeTripId ? state.workspaces[routeTripId] ?? null : null);
    };

    const unsub = tripWorkspaceStore.subscribe(sync);
    sync();

    if (!tripWorkspaceStore.getState().loaded) {
      tripWorkspaceStore.loadWorkspaces().finally(sync);
    }

    return () => unsub();
  }, [routeTripId]);

  useEffect(() => {
    if (routeTripId && workspaceLoaded) {
      tripWorkspaceStore.ensureWorkspace(routeTripId);
    }
  }, [routeTripId, workspaceLoaded]);

  useEffect(() => {
    let mounted = true;

    const sync = () => {
      const state = preferencesStore.getState();
      if (!mounted) return;
      setOriginLoaded(Boolean(state.loaded));
      setOriginIata(cleanUpper3(state.preferredOriginIata, "LON"));
    };

    const unsub = preferencesStore.subscribe(sync);
    sync();

    if (!preferencesStore.getState().loaded) {
      preferencesStore.load().finally(sync);
    }

    return () => {
      mounted = false;
      try {
        unsub();
      } catch {}
    };
  }, []);

  const activeTripId = useMemo(
    () => clean(trip?.id) || clean(routeTripId) || null,
    [trip?.id, routeTripId]
  );

  const savedItems = useMemo(() => {
    if (!activeTripId) return [];
    return allSavedItems.filter((x) => clean(x.tripId) === activeTripId);
  }, [allSavedItems, activeTripId]);

  const groupedBySection = useMemo(() => groupSavedItemsBySection(savedItems), [savedItems]);
  const workspaceSnapshot = useMemo(() => computeWorkspaceSnapshot(savedItems), [savedItems]);

  const sectionOrder = useMemo<WorkspaceSectionKey[]>(
    () => workspace?.sectionOrder ?? [...DEFAULT_SECTION_ORDER],
    [workspace]
  );

  const activeSection = useMemo<WorkspaceSectionKey>(
    () => workspace?.activeSection ?? sectionOrder[0] ?? "tickets",
    [workspace?.activeSection, sectionOrder]
  );

  async function setActiveWorkspaceSection(section: WorkspaceSectionKey) {
    const id = clean(activeTripId);
    if (!id) return;
    try {
      await tripWorkspaceStore.setActiveSection(id, section);
    } catch {}
  }

  async function toggleWorkspaceSection(section: WorkspaceSectionKey) {
    const id = clean(activeTripId);
    if (!id) return;
    try {
      await tripWorkspaceStore.toggleCollapsed(id, section);
    } catch {}
  }

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
    noteText,
    setNoteText,
    setNoteSaving,
    setProofBusyId,
    setActiveWorkspaceSection,
  });

  const vm = useTripDetailViewModel({
    trip,
    tripsLoaded,
    savedLoaded,
    workspaceLoaded,
    routeTripId,
    cityName: data.cityName,
    originIata,
    affiliateUrls: data.affiliateUrls,
    progress: data.progress,
    readiness: data.readiness,
    pending: savedItems.filter((x) => x.status === "pending"),
    saved: savedItems.filter((x) => x.status === "saved" && x.type !== "note"),
    booked: savedItems.filter((x) => x.status === "booked"),
    primaryMatchId: data.primaryMatchId,
    primaryTicketItem: data.primaryTicketItem,
    isPro,
    kickoffTbc: data.kickoffMeta.tbc,
    controller,
    setActiveWorkspaceSection,
  });

  const status = useMemo(() => (trip ? tripStatus(trip) : "Upcoming"), [trip]);

  useEffect(() => {
    if (!DEV) return;

    const city = clean(data.cityName);
    if (!city || city === "Trip") return;

    const code = getIataCityCodeForCity(city);
    if (code) return;

    const key = debugCityKey(city);
    if (!key || devWarnedCityKey === key) return;

    setDevWarnedCityKey(key);

    Alert.alert(
      "Missing IATA mapping (dev)",
      `City: ${city}\n\nNormalized key:\n${key}\n\nAdd it to src/data/iataCityCodes.ts`,
      [{ text: "OK" }],
      { cancelable: true }
    );
  }, [data.cityName, devWarnedCityKey]);

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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!routeTripId ? (
            <GlassCard style={styles.card}>
              <EmptyState title="Missing trip id" message="No trip id provided." />
            </GlassCard>
          ) : null}

          {vm.loading ? (
            <GlassCard style={styles.card}>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading trip…</Text>
              </View>
            </GlassCard>
          ) : null}

          {!vm.loading && routeTripId && tripsLoaded && savedLoaded && workspaceLoaded && !trip ? (
            <GlassCard style={styles.card}>
              <EmptyState
                title="Trip not found"
                message="This trip doesn’t exist on this device."
              />
            </GlassCard>
          ) : null}

          {trip ? (
            <>
              <GlassCard style={styles.hero}>
                <Text style={styles.kicker}>YOUR TRIP</Text>
                <Text style={styles.cityTitle}>{data.cityName}</Text>
                <Text style={styles.heroMeta}>{summaryLine(trip)}</Text>
                <Text style={styles.heroMetaSmall}>{data.kickoffMeta.line}</Text>

                <View style={styles.heroTopRow}>
                  <View style={[styles.statusPill, heroStatusTone(status)]}>
                    <Text style={styles.statusText}>{statusLabel(status)}</Text>
                  </View>

                  <Pressable onPress={controller.onViewWallet} style={styles.walletBtn}>
                    <Text style={styles.walletBtnText}>Wallet</Text>
                  </Pressable>
                </View>

                <View style={styles.funnelCard}>
                  <View style={styles.funnelTopRow}>
                    <View
                      style={[
                        styles.completionScoreBox,
                        completionTone(vm.tripCompletionPct ?? 0),
                      ]}
                    >
                      <Text style={styles.completionScoreValue}>
                        {vm.tripCompletionPct ?? 0}%
                      </Text>
                      <Text style={styles.completionScoreLabel}>Complete</Text>
                    </View>

                    <View style={styles.funnelCopyWrap}>
                      <Text style={styles.funnelTitle}>Trip progress</Text>
                      <Text style={styles.funnelSub}>{vm.completionSummary}</Text>
                      <Text style={styles.funnelSubAlt}>
                        {formatCoreCompleteLabel(vm.completeCoreCount)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.funnelBadgeRow}>
                    <View style={styles.funnelBadge}>
                      <Text style={styles.funnelBadgeText}>
                        {nextStepLabel(vm.nextIncompleteStep?.key)}
                      </Text>
                    </View>

                    {vm.commercialSummaryLine ? (
                      <View style={styles.funnelBadge}>
                        <Text style={styles.funnelBadgeText}>
                          {vm.commercialSummaryLine}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {vm.showHeroBanners ? (
                  <View style={styles.bannersRow}>
                    {vm.heroBannerCounts.pending > 0 ? (
                      <View style={styles.pendingBanner}>
                        <Text style={styles.pendingText}>
                          {vm.heroBannerCounts.pending} pending booking
                          {vm.heroBannerCounts.pending === 1 ? "" : "s"}
                        </Text>
                      </View>
                    ) : null}

                    {vm.heroBannerCounts.saved > 0 ? (
                      <View style={styles.savedBanner}>
                        <Text style={styles.savedText}>
                          {vm.heroBannerCounts.saved} saved item
                          {vm.heroBannerCounts.saved === 1 ? "" : "s"}
                        </Text>
                      </View>
                    ) : null}

                    {vm.heroBannerCounts.booked > 0 ? (
                      <View style={styles.bookedBanner}>
                        <Text style={styles.bookedText}>
                          {vm.heroBannerCounts.booked} booked item
                          {vm.heroBannerCounts.booked === 1 ? "" : "s"} in Wallet
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.heroActions}>
                  <Pressable
                    onPress={controller.onEditTrip}
                    style={[styles.btn, styles.btnPrimary]}
                  >
                    <Text style={styles.btnPrimaryText}>Edit trip</Text>
                  </Pressable>

                  {!isPro ? (
                    <Pressable
                      onPress={controller.onUpgradePress}
                      style={[styles.btn, styles.btnSecondary]}
                    >
                      <Text style={styles.btnSecondaryText}>Go Pro</Text>
                    </Pressable>
                  ) : null}
                </View>

                {!originLoaded ? (
                  <Text style={styles.mutedInline}>Loading departure airport…</Text>
                ) : null}

                <View style={styles.heroBottomStack}>
                  <TripProgressStrip items={vm.progressItems} />
                  <NextBestActionCard
                    action={vm.nextAction}
                    isPro={isPro}
                    onUpgradePress={controller.onUpgradePress}
                  />
                  <TripHealthScore
                    score={vm.readiness.score}
                    missing={vm.readiness.missing}
                    isPro={isPro}
                    capHint={vm.capHint}
                  />
                </View>
              </GlassCard>

              {data.affiliateUrls ? (
                <GlassCard style={styles.card}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionTitle}>Book this trip</Text>
                    <Text style={styles.sectionSub}>Prices and partner links</Text>
                  </View>

                  {vm.commercialSummaryLine ? (
                    <View style={styles.smartSummaryBar}>
                      <Text style={styles.smartSummaryText}>
                        {vm.commercialSummaryLine}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.smartGrid}>
                    {vm.smartBookButtons.map((button, index) => (
                      <Pressable
                        key={`${button.title}-${index}`}
                        style={[
                          styles.smartBtn,
                          button.kind === "primary" && styles.smartBtnPrimary,
                        ]}
                        onPress={button.onPress}
                      >
                        <View style={styles.smartBtnTop}>
                          <Text style={styles.smartBtnText}>{button.title}</Text>
                        </View>
                        <Text style={styles.smartBtnSub}>{button.sub}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => controller.openUntracked(data.affiliateUrls?.mapsUrl)}
                  >
                    <Text style={styles.mapsInline}>Open in Maps</Text>
                  </Pressable>
                </GlassCard>
              ) : null}

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

              <TripWorkspaceCard
                workspaceSnapshot={workspaceSnapshot}
                workspace={workspace}
                sectionOrder={sectionOrder}
                activeSection={activeSection}
                groupedBySection={groupedBySection}
                primaryMatchId={data.primaryMatchId}
                affiliateUrls={data.affiliateUrls}
                cityName={data.cityName}
                originIata={cleanUpper3(originIata, "LON")}
                tripStartDate={trip.startDate}
                tripEndDate={trip.endDate}
                noteText={noteText}
                noteSaving={noteSaving}
                proofBusyId={proofBusyId}
                stayBestAreas={data.stayBestAreas}
                stayBudgetAreas={data.stayBudgetAreas}
                transportStops={data.transportStops}
                onSetActiveSection={setActiveWorkspaceSection}
                onToggleSection={toggleWorkspaceSection}
                onNoteTextChange={setNoteText}
                onAddNote={controller.addNote}
                onOpenTicketsForPrimaryMatch={() => {
                  if (data.primaryMatchId) controller.openTicketsForMatch(data.primaryMatchId);
                }}
                onOpenSavedItem={controller.openSavedItem}
                onOpenNoteActions={controller.openNoteActions}
                onConfirmMarkBooked={controller.confirmMarkBooked}
                onAddProofForBookedItem={controller.addProofForBookedItem}
                onViewWallet={controller.onViewWallet}
                onConfirmMoveToPending={controller.confirmMoveToPending}
                onConfirmArchive={controller.confirmArchive}
                onOpenPartner={controller.openTrackedPartner}
                getLivePriceLine={livePriceLine}
                getTicketProviderFromItem={ticketProviderFromItem}
              />

              <TripStayGuidanceCard
                stadiumName={data.stadiumName}
                stadiumCity={data.stadiumCity}
                logisticsSnippet={data.primaryLogisticsSnippet}
                bestAreas={data.stayBestAreas}
                budgetAreas={data.stayBudgetAreas}
                transportStops={data.transportStops}
                transportTips={data.transportTips}
                lateTransportNote={data.lateTransportNote}
                stadiumMapsUrl={data.stadiumMapsUrl}
                openUrl={controller.openUntracked}
              />
            </>
          ) : null}
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

  center: {
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
  },

  mutedInline: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: "800",
  },

  hero: { padding: theme.spacing.lg },

  kicker: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.xs,
    letterSpacing: 0.7,
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
    fontWeight: "800",
  },

  heroMetaSmall: {
    marginTop: 6,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 12,
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
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  statusPillUpcoming: {
    borderColor: "rgba(0,255,136,0.4)",
  },

  statusPillLive: {
    borderColor: "rgba(255,200,80,0.45)",
  },

  statusPillComplete: {
    borderColor: "rgba(120,170,255,0.45)",
  },

  statusText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

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

  funnelCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
    gap: 10,
  },

  funnelTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  completionScoreBox: {
    width: 84,
    height: 84,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  completionStrong: {
    borderColor: "rgba(0,255,136,0.40)",
    backgroundColor: "rgba(0,255,136,0.10)",
  },

  completionMid: {
    borderColor: "rgba(255,200,80,0.35)",
    backgroundColor: "rgba(255,200,80,0.10)",
  },

  completionSoft: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  completionScoreValue: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 24,
    lineHeight: 28,
  },

  completionScoreLabel: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 10,
  },

  funnelCopyWrap: {
    flex: 1,
    minWidth: 0,
  },

  funnelTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 15,
  },

  funnelSub: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  funnelSubAlt: {
    marginTop: 4,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
  },

  funnelBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  funnelBadge: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  funnelBadgeText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 11,
  },

  bannersRow: {
    marginTop: 12,
    gap: 10,
  },

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

  heroActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

  heroBottomStack: {
    marginTop: 14,
    gap: 10,
  },

  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },

  btnPrimary: {
    borderColor: "rgba(0,255,136,0.6)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  btnPrimaryText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  btnSecondary: {
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  btnSecondaryText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 8,
  },

  sectionSub: {
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 12,
  },

  smartSummaryBar: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.18)",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  smartSummaryText: {
    color: theme.colors.textSecondary,
    fontWeight: "900",
    fontSize: 12,
    lineHeight: 16,
  },

  smartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  smartBtn: {
    width: "48%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  smartBtnPrimary: {
    borderColor: "rgba(0,255,136,0.45)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  smartBtnTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  smartBtnText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  smartBtnSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    textAlign: "left",
  },

  mapsInline: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    textAlign: "center",
    fontWeight: "900",
  },
});
