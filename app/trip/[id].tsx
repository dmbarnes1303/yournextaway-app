// app/trip/[id].tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import TripMatchesCard from "@/src/components/trip/TripMatchesCard";
import TicketOptionsSheet from "@/src/components/tickets/TicketOptionsSheet";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import storage from "@/src/services/storage";
import savedItemsStore from "@/src/state/savedItems";

import useTripDetailController from "@/src/features/tripDetail/useTripDetailController";
import useTripDetailViewModel from "@/src/features/tripDetail/useTripDetailViewModel";
import useTripDetailData from "@/src/features/tripDetail/useTripDetailData";
import useTripWorkspace from "@/src/features/tripDetail/useTripWorkspace";

import {
  ensurePartnerReturnWatcher,
  markBooked,
  markNotBooked,
  dismissReturnPrompt,
} from "@/src/services/partnerClicks";
import { confirmBookedAndOfferProof } from "@/src/services/bookingProof";

import type { SavedItem, SavedItemType } from "@/src/core/savedItemTypes";

import {
  type PlanValue,
  coerceId,
  itemResolvedScore,
  livePriceLine,
  ticketProviderFromItem,
  tripStatus,
} from "@/src/features/tripDetail/helpers";

const PLAN_STORAGE_KEY = "yna:plan";

const CITY_HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=90";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function dateLabel(value?: string | null) {
  const raw = clean(value);
  if (!raw) return "Date TBC";

  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return raw.slice(0, 10);

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeLabel(value?: string | null) {
  const raw = clean(value);
  if (!raw) return "TBC";

  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return "TBC";

  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tripDateLine(start?: string | null, end?: string | null) {
  const s = clean(start);
  const e = clean(end);
  if (!s || !e) return "Trip dates not set";
  return `${s}  →  ${e}`;
}

function nightsLine(start?: string | null, end?: string | null) {
  const s = new Date(clean(start));
  const e = new Date(clean(end));

  if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime())) {
    return "Nights not set";
  }

  const nights = Math.max(
    0,
    Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
  );

  return `${nights} ${nights === 1 ? "night" : "nights"}`;
}

function readNestedString(source: unknown, paths: string[][]): string | null {
  if (!source || typeof source !== "object") return null;

  for (const path of paths) {
    let current: unknown = source;

    for (const key of path) {
      if (!current || typeof current !== "object" || !(key in current)) {
        current = null;
        break;
      }

      current = (current as Record<string, unknown>)[key];
    }

    const value = clean(current);
    if (value) return value;
  }

  return null;
}

function getFixtureInfo(fixture: unknown) {
  const homeName =
    readNestedString(fixture, [
      ["homeName"],
      ["homeTeam"],
      ["home", "name"],
      ["teams", "home", "name"],
    ]) || "Home";

  const awayName =
    readNestedString(fixture, [
      ["awayName"],
      ["awayTeam"],
      ["away", "name"],
      ["teams", "away", "name"],
    ]) || "Away";

  const homeLogo = readNestedString(fixture, [
    ["homeLogo"],
    ["homeBadge"],
    ["home", "logo"],
    ["teams", "home", "logo"],
  ]);

  const awayLogo = readNestedString(fixture, [
    ["awayLogo"],
    ["awayBadge"],
    ["away", "logo"],
    ["teams", "away", "logo"],
  ]);

  const leagueName =
    readNestedString(fixture, [["leagueName"], ["league", "name"]]) ||
    "Matchday";

  const venue =
    readNestedString(fixture, [
      ["venue"],
      ["stadium"],
      ["fixture", "venue", "name"],
      ["venue", "name"],
    ]) || "Stadium";

  const kickoff =
    readNestedString(fixture, [
      ["kickoffIso"],
      ["date"],
      ["fixture", "date"],
    ]) || null;

  return { homeName, awayName, homeLogo, awayLogo, leagueName, venue, kickoff };
}

function initials(name?: string | null) {
  const value = clean(name);
  if (!value) return "?";

  const parts = value
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length <= 1) return value.slice(0, 3).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function sourceSectionFromType(type?: SavedItemType) {
  switch (type) {
    case "tickets":
      return "tickets";
    case "hotel":
      return "stay";
    case "flight":
    case "train":
      return "travel";
    case "transfer":
      return "transfers";
    case "things":
      return "things";
    case "insurance":
      return "insurance";
    case "claim":
      return "claims";
    case "note":
    case "other":
      return "notes";
    default:
      return "unknown";
  }
}

function attachments(item?: SavedItem | null) {
  return Array.isArray(item?.attachments) ? item.attachments : [];
}

function stateLabel(state: string) {
  if (state === "booked") return "Confirmed";
  if (state === "pending") return "Pending";
  if (state === "saved") return "Saved";
  return "Empty";
}

function rowIcon(key: string) {
  if (key === "tickets") return "🎟";
  if (key === "flight" || key === "travel") return "✈";
  if (key === "hotel" || key === "stay") return "🛏";
  if (key === "transfer") return "🚕";
  if (key === "things") return "★";
  return "✓";
}

function TeamBadge({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <View style={styles.teamBadge}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.teamBadgeImage} resizeMode="contain" />
      ) : (
        <Text style={styles.teamBadgeText}>{initials(name)}</Text>
      )}
    </View>
  );
}

export default function TripDetailScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const routeTripId = useMemo(
    () => coerceId((params as Record<string, unknown>)?.id),
    [params]
  );

  const workspace = useTripWorkspace({ routeTripId });

  const trip = workspace.trip;
  const tripsLoaded = workspace.tripsLoaded;
  const savedLoaded = workspace.savedLoaded;
  const originIata = workspace.originIata;
  const activeTripId = workspace.activeTripId;
  const savedItems = workspace.savedItems;
  const pendingItems = workspace.pending;
  const savedOnlyItems = workspace.saved;
  const bookedItems = workspace.booked;

  const [plan, setPlan] = useState<PlanValue>("not_set");
  const [ticketLoading, setTicketLoading] = useState(false);
  const returnPromptBusyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        const value = await storage.getString(PLAN_STORAGE_KEY);
        if (cancelled) return;
        if (value === "premium") setPlan("premium");
        if (value === "free") setPlan("free");
      } catch {
        // ignore
      }
    }

    void loadPlan();

    return () => {
      cancelled = true;
    };
  }, []);

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
    setTicketLoading,
    setActiveWorkspaceSection: workspace.setActiveSection,
  });

  const vm = useTripDetailViewModel({
    trip,
    tripsLoaded,
    savedLoaded,
    workspaceLoaded: workspace.workspaceLoaded,
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
    isPro: plan === "premium",
    kickoffTbc: data.kickoffMeta.tbc,
    controller,
    setActiveWorkspaceSection: workspace.setActiveSection,
    bookingPriceBoard: data.bookingPriceBoard,
  });

  useEffect(() => {
    const cleanup = ensurePartnerReturnWatcher(async (click) => {
      if (!click?.itemId) return;
      if (returnPromptBusyRef.current === click.itemId) return;

      returnPromptBusyRef.current = click.itemId;

      try {
        await savedItemsStore.load();
        const item = savedItemsStore.getById(click.itemId);

        if (!item) {
          await dismissReturnPrompt(click.itemId);
          return;
        }

        if (item.status === "booked") {
          await dismissReturnPrompt(item.id);
          return;
        }

        Alert.alert(
          "Did you complete this booking?",
          `"${item.title}" was opened. Only mark it booked if you actually completed the booking.`,
          [
            {
              text: "Not now",
              style: "cancel",
              onPress: () => {
                void dismissReturnPrompt(item.id);
                returnPromptBusyRef.current = null;
              },
            },
            {
              text: "No",
              onPress: () => {
                void markNotBooked(item.id).finally(() => {
                  returnPromptBusyRef.current = null;
                });
              },
            },
            {
              text: "Yes, booked",
              onPress: () => {
                void markBooked(item.id, {
                  sourceSurface: "workspace_cta",
                  sourceSection: sourceSectionFromType(item.type),
                  metadata: {
                    partnerId: item.partnerId ?? null,
                    partnerTier: item.partnerTier ?? null,
                    partnerCategory: item.partnerCategory ?? null,
                  },
                })
                  .then(() => confirmBookedAndOfferProof(item.id))
                  .finally(() => {
                    returnPromptBusyRef.current = null;
                  });
              },
            },
          ],
          { cancelable: true }
        );
      } catch {
        returnPromptBusyRef.current = null;
      }
    });

    return cleanup;
  }, []);

  const isMissingTrip = !trip && tripsLoaded;

  const primaryFixture = useMemo(() => {
    if (!data.primaryMatchId) return null;
    return data.fixturesById?.[String(data.primaryMatchId)] ?? null;
  }, [data.fixturesById, data.primaryMatchId]);

  const fixture = useMemo(() => getFixtureInfo(primaryFixture), [primaryFixture]);

  const completionPct = Math.max(0, Math.min(100, vm.tripCompletionPct ?? 0));
  const bookedProofs = bookedItems.filter((item) => attachments(item).length > 0).length;
  const missingProofs = bookedItems.filter((item) => attachments(item).length === 0).length;

  const ticketSheetPayload = controller.ticketSheet.payload;

  const ticketSheetMatchLabel = useMemo(() => {
    if (!ticketSheetPayload) return "Match tickets";
    return `${ticketSheetPayload.homeName} vs ${ticketSheetPayload.awayName}`;
  }, [ticketSheetPayload]);

  const ticketSheetSubtitle = useMemo(() => {
    if (!ticketSheetPayload) return "Compare ticket providers";

    const total =
      (ticketSheetPayload.strongOptions?.length || 0) +
      (ticketSheetPayload.weakOptions?.length || 0);

    if (ticketSheetPayload.strongOptions?.length) {
      return total > 1
        ? "Best matches first, then fallback routes"
        : "Strong ticket route found";
    }

    return "Only fallback routes found";
  }, [ticketSheetPayload]);

  function renderBody() {
    if (vm.loading) {
      return (
        <GlassCard style={styles.stateCard}>
          <EmptyState title="Loading trip" message="Pulling together your trip." />
        </GlassCard>
      );
    }

    if (isMissingTrip) {
      return (
        <GlassCard style={styles.stateCard}>
          <EmptyState title="Trip not found" message="No trip available." />
        </GlassCard>
      );
    }

    if (!trip) {
      return (
        <GlassCard style={styles.stateCard}>
          <EmptyState title="Loading" message="Trip details are still loading." />
        </GlassCard>
      );
    }

    return (
      <>
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>YNA</Text>
            </View>

            <Text style={styles.heroTitle}>
              {fixture.homeName} vs {fixture.awayName}
            </Text>

            <Text style={styles.heroMeta}>
              {fixture.leagueName} • Matchday
            </Text>

            <View style={styles.heroChips}>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>{dateLabel(fixture.kickoff)}</Text>
              </View>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>
                  {data.kickoffMeta.tbc ? "TBC" : timeLabel(fixture.kickoff)}
                </Text>
              </View>
              <View style={styles.heroChipWide}>
                <Text style={styles.heroChipText} numberOfLines={1}>
                  {fixture.venue}
                </Text>
              </View>
            </View>
          </View>

          <ImageBackground
            source={{ uri: CITY_HERO_IMAGE_URL }}
            style={styles.cityImage}
            imageStyle={styles.cityImageInner}
          >
            <View style={styles.cityImageShade} />
          </ImageBackground>

          <View style={styles.pitchStrip}>
            <TeamBadge name={fixture.homeName} logo={fixture.homeLogo} />
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <TeamBadge name={fixture.awayName} logo={fixture.awayLogo} />
          </View>
        </View>

        <GlassCard variant="brand" level="strong" style={styles.tripCard}>
          <View style={styles.tripTop}>
            <View style={styles.tripCopy}>
              <Text style={styles.tripEyebrow}>Your trip to {data.cityName}</Text>
              <Text style={styles.tripDates}>{tripDateLine(trip.startDate, trip.endDate)}</Text>
              <Text style={styles.tripMeta}>
                {nightsLine(trip.startDate, trip.endDate)} • {completionPct}% booked
              </Text>
            </View>

            <Text style={styles.planeIcon}>✈</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
          </View>
        </GlassCard>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your itinerary</Text>

          <View style={styles.itineraryList}>
            {vm.progressItems.map((item) => {
              const confirmed = item.state === "booked";
              const started = item.state === "saved" || item.state === "pending";

              return (
                <Pressable
                  key={item.key}
                  onPress={() => void item.onPress?.()}
                  style={styles.itineraryRow}
                >
                  <View style={styles.itineraryIcon}>
                    <Text style={styles.itineraryIconText}>{rowIcon(item.key)}</Text>
                  </View>

                  <View style={styles.itineraryCopy}>
                    <Text style={styles.itineraryTitle}>{item.label}</Text>
                    <Text style={styles.itinerarySub}>
                      {item.key === "tickets" && !confirmed
                        ? "Finding best options"
                        : stateLabel(item.state)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.itineraryStatus,
                      confirmed && styles.statusConfirmed,
                      started && styles.statusStarted,
                    ]}
                  >
                    {confirmed ? "Confirmed" : started ? "Pending" : "Empty"}
                  </Text>

                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {ticketLoading ? (
          <GlassCard style={styles.loadingCard}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Checking ticket availability…</Text>
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

        <GlassCard style={styles.walletCard}>
          <Text style={styles.walletTitle}>Wallet status</Text>
          <Text style={styles.walletSub}>
            {bookedItems.length} booked • {pendingItems.length} pending • {savedOnlyItems.length} saved
          </Text>

          <View style={styles.walletStats}>
            <View style={styles.walletMetric}>
              <Text style={styles.walletNumber}>{bookedItems.length}</Text>
              <Text style={styles.walletLabel}>Booked</Text>
            </View>
            <View style={styles.walletMetric}>
              <Text style={styles.walletNumber}>{bookedProofs}</Text>
              <Text style={styles.walletLabel}>Proofs</Text>
            </View>
            <View style={styles.walletMetric}>
              <Text style={styles.walletNumber}>{missingProofs}</Text>
              <Text style={styles.walletLabel}>Missing</Text>
            </View>
          </View>

          <Pressable style={styles.walletButton} onPress={controller.onViewWallet}>
            <Text style={styles.walletButtonText}>Open wallet</Text>
          </Pressable>
        </GlassCard>
      </>
    );
  }

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.94}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Trip",
          headerTransparent: true,
          headerShadowVisible: false,
          headerTintColor: "#F5F7F6",
          headerTitleStyle: {
            color: "#F5F7F6",
            fontWeight: "900",
          },
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: theme.spacing.xxl + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {renderBody()}
        </ScrollView>

        <TicketOptionsSheet
          visible={controller.ticketSheet.visible}
          matchLabel={ticketSheetMatchLabel}
          subtitle={ticketSheetSubtitle}
          strongOptions={ticketSheetPayload?.strongOptions || []}
          weakOptions={ticketSheetPayload?.weakOptions || []}
          onClose={controller.closeTicketSheet}
          onSelect={(option) => void controller.onSelectTicketSheetOption(option)}
          onCompareAll={controller.onCompareAllTickets}
          onOpenOfficial={
            ticketSheetPayload?.officialTicketUrl
              ? () => void controller.onOpenOfficialFromSheet()
              : null
          }
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  content: {
    paddingTop: 92,
    paddingHorizontal: 20,
    gap: 18,
  },

  stateCard: {
    minHeight: 180,
    justifyContent: "center",
  },

  hero: {
    borderRadius: 34,
    padding: 20,
    backgroundColor: "rgba(0,35,16,0.72)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.24)",
    shadowColor: "#22C55E",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  heroHeader: {
    alignItems: "center",
  },

  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.42)",
  },

  logoText: {
    color: "#F5F7F6",
    fontWeight: "900",
    letterSpacing: 1,
  },

  heroTitle: {
    marginTop: 18,
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.6,
  },

  heroMeta: {
    marginTop: 6,
    color: "rgba(245,247,246,0.74)",
    fontSize: 15,
    fontWeight: "800",
  },

  heroChips: {
    marginTop: 18,
    flexDirection: "row",
    gap: 8,
  },

  heroChip: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 13,
    justifyContent: "center",
    backgroundColor: "rgba(0,22,10,0.66)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.12)",
  },

  heroChipWide: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 13,
    justifyContent: "center",
    backgroundColor: "rgba(0,22,10,0.66)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.12)",
  },

  heroChipText: {
    color: "#F5F7F6",
    fontSize: 12,
    fontWeight: "900",
  },

  cityImage: {
    height: 145,
    marginTop: 22,
    borderRadius: 24,
    overflow: "hidden",
  },

  cityImageInner: {
    borderRadius: 24,
  },

  cityImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },

  pitchStrip: {
    marginTop: 18,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(0,26,12,0.72)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.18)",
  },

  teamBadge: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  teamBadgeImage: {
    width: 50,
    height: 50,
  },

  teamBadgeText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 18,
  },

  vsCircle: {
    width: 42,
    height: 42,
    marginHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FACC15",
  },

  vsText: {
    color: "#07100A",
    fontWeight: "900",
    fontSize: 12,
  },

  tripCard: {
    padding: 20,
    borderRadius: 28,
  },

  tripTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },

  tripCopy: {
    flex: 1,
  },

  tripEyebrow: {
    color: "#86EFAC",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  tripDates: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  tripMeta: {
    marginTop: 6,
    color: "rgba(245,247,246,0.70)",
    fontSize: 14,
    fontWeight: "800",
  },

  planeIcon: {
    fontSize: 32,
    color: "#FDE68A",
  },

  progressTrack: {
    marginTop: 18,
    height: 9,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#86EFAC",
  },

  section: {
    gap: 14,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  itineraryList: {
    gap: 12,
  },

  itineraryRow: {
    minHeight: 78,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(0,28,13,0.66)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.12)",
  },

  itineraryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  itineraryIconText: {
    fontSize: 20,
  },

  itineraryCopy: {
    flex: 1,
  },

  itineraryTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  itinerarySub: {
    marginTop: 3,
    color: "rgba(245,247,246,0.62)",
    fontSize: 13,
    fontWeight: "800",
  },

  itineraryStatus: {
    color: "rgba(245,247,246,0.50)",
    fontSize: 12,
    fontWeight: "900",
  },

  statusConfirmed: {
    color: "#86EFAC",
  },

  statusStarted: {
    color: "#FDE68A",
  },

  chevron: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 26,
    marginTop: -2,
  },

  loadingCard: {
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
  },

  walletCard: {
    padding: 18,
    borderRadius: 24,
  },

  walletTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  walletSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },

  walletStats: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },

  walletMetric: {
    flex: 1,
    minHeight: 76,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  walletNumber: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  walletLabel: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },

  walletButton: {
    marginTop: 16,
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  walletButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
