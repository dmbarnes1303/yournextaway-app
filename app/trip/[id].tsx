import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
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
  summaryLine,
  ticketProviderFromItem,
  tripStatus,
} from "@/src/features/tripDetail/helpers";

const PLAN_STORAGE_KEY = "yna:plan";

const STADIUM_HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1400&q=90";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function screenStatusLabel(status: string) {
  const value = String(status ?? "").toLowerCase();
  if (value === "completed") return "Completed";
  if (value === "in progress") return "In progress";
  return "Upcoming";
}

function dateWindowLine(startDate?: string | null, endDate?: string | null) {
  const start = clean(startDate);
  const end = clean(endDate);
  if (!start || !end) return "Trip dates not set";
  return `${start} → ${end}`;
}

function completionTone(pct?: number | null) {
  const value = typeof pct === "number" ? pct : 0;
  if (value >= 90) return "ready";
  if (value >= 65) return "progress";
  return "early";
}

function inferSourceSectionFromSavedItemType(type?: SavedItemType) {
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

function getAttachments(item?: SavedItem | null) {
  return Array.isArray(item?.attachments) ? item.attachments : [];
}

function progressStateLabel(state: string) {
  if (state === "booked") return "Booked";
  if (state === "pending") return "Pending";
  if (state === "saved") return "Started";
  return "Empty";
}

function progressTone(state: string) {
  if (state === "booked") return "booked" as const;
  if (state === "pending" || state === "saved") return "started" as const;
  return "empty" as const;
}

function walletHeadline(args: { bookedCount: number; missingProofCount: number }) {
  const { bookedCount, missingProofCount } = args;

  if (bookedCount <= 0) return "No booked items yet";

  if (missingProofCount > 0) {
    return `${missingProofCount} proof ${missingProofCount === 1 ? "upload" : "uploads"} still missing`;
  }

  return "All booked items have proof attached";
}

function walletSubline(args: {
  bookedCount: number;
  pendingCount: number;
  savedCount: number;
}) {
  const { bookedCount, pendingCount, savedCount } = args;
  return `${bookedCount} booked • ${pendingCount} pending • ${savedCount} saved`;
}

function nextTasks(args: {
  hasTickets: boolean;
  hasFlight: boolean;
  hasHotel: boolean;
  hasTransport: boolean;
  missingProofCount: number;
  kickoffTbc: boolean;
}) {
  const rows: string[] = [];

  if (!args.hasTickets) rows.push("Book tickets");
  if (args.hasTickets && !args.hasFlight) rows.push("Add main travel");
  if (args.hasFlight && !args.hasHotel) rows.push("Lock your stay");
  if (!args.hasTransport) rows.push("Sort local transport");
  if (args.missingProofCount > 0) rows.push("Upload booking proof");
  if (args.kickoffTbc) rows.push("Check kickoff confirmation");

  return rows.slice(0, 3);
}

function initialsFromName(name?: string | null) {
  const value = clean(name);
  if (!value) return "?";

  const parts = value
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
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

function getFixtureTeamInfo(fixture: unknown) {
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
    ["home", "badge"],
    ["teams", "home", "logo"],
    ["teams", "home", "badge"],
  ]);

  const awayLogo = readNestedString(fixture, [
    ["awayLogo"],
    ["awayBadge"],
    ["away", "logo"],
    ["away", "badge"],
    ["teams", "away", "logo"],
    ["teams", "away", "badge"],
  ]);

  const leagueName =
    readNestedString(fixture, [
      ["leagueName"],
      ["league", "name"],
    ]) || "Matchday";

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

  return {
    homeName,
    awayName,
    homeLogo,
    awayLogo,
    leagueName,
    venue,
    kickoff,
  };
}

function formatKickoffDate(value?: string | null) {
  const raw = clean(value);
  if (!raw) return "Date TBC";

  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return raw.slice(0, 10);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatKickoffTime(value?: string | null) {
  const raw = clean(value);
  if (!raw) return "TBC";

  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return "TBC";

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TeamBadge({
  name,
  logo,
  side,
}: {
  name: string;
  logo?: string | null;
  side: "home" | "away";
}) {
  const initials = initialsFromName(name);

  return (
    <View style={[styles.teamBadgeShell, side === "home" ? styles.homeBadge : styles.awayBadge]}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.teamBadgeImage} resizeMode="contain" />
      ) : (
        <Text style={styles.teamBadgeInitials}>{initials}</Text>
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

  const isPro = plan === "premium";
  const returnPromptBusyRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        const value = await storage.getString(PLAN_STORAGE_KEY);
        if (cancelled) return;

        if (value === "premium") {
          setPlan("premium");
          return;
        }

        if (value === "free") {
          setPlan("free");
        }
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
    isPro,
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

        const section = inferSourceSectionFromSavedItemType(item.type);

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
                void markNotBooked(item.id)
                  .catch(() => null)
                  .finally(() => {
                    returnPromptBusyRef.current = null;
                  });
              },
            },
            {
              text: "Yes, booked",
              onPress: () => {
                void markBooked(item.id, {
                  sourceSurface: "workspace_cta",
                  sourceSection: section,
                  metadata: {
                    partnerId: item.partnerId ?? null,
                    partnerTier: item.partnerTier ?? null,
                    partnerCategory: item.partnerCategory ?? null,
                  },
                })
                  .then(() => confirmBookedAndOfferProof(item.id))
                  .catch(() => {
                    Alert.alert(
                      "Couldn’t update booking",
                      "The partner page opened, but the app could not mark this item as booked."
                    );
                  })
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

  const status = useMemo(() => {
    return trip ? tripStatus(trip) : "Upcoming";
  }, [trip]);

  const primaryFixture = useMemo(() => {
    if (!data.primaryMatchId) return null;
    return data.fixturesById?.[String(data.primaryMatchId)] ?? data.fixturesById?.[Number(data.primaryMatchId) as never] ?? null;
  }, [data.fixturesById, data.primaryMatchId]);

  const fixtureInfo = useMemo(() => {
    return getFixtureTeamInfo(primaryFixture);
  }, [primaryFixture]);

  const dominantAction = vm.nextAction;
  const decisionTitle = dominantAction?.title || "Continue planning";
  const decisionCta = dominantAction?.cta || "Continue planning";
  const decisionBody =
    dominantAction?.body || "Move the trip forward with the next real booking step.";

  const tripDatesText = useMemo(() => {
    return dateWindowLine(trip?.startDate, trip?.endDate);
  }, [trip?.startDate, trip?.endDate]);

  const missingProofCount = useMemo(() => {
    return bookedItems.filter((item) => getAttachments(item).length === 0).length;
  }, [bookedItems]);

  const proofCount = useMemo(() => {
    return bookedItems.filter((item) => getAttachments(item).length > 0).length;
  }, [bookedItems]);

  const taskRows = useMemo(() => {
    return nextTasks({
      hasTickets: vm.hasTickets,
      hasFlight: vm.hasFlight,
      hasHotel: vm.hasHotel,
      hasTransport: vm.hasTransport,
      missingProofCount,
      kickoffTbc: data.kickoffMeta.tbc,
    });
  }, [
    vm.hasTickets,
    vm.hasFlight,
    vm.hasHotel,
    vm.hasTransport,
    missingProofCount,
    data.kickoffMeta.tbc,
  ]);

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
        ? "Best matches first, then weaker fallback routes"
        : "Strong ticket route found";
    }

    return "Only fallback routes found";
  }, [ticketSheetPayload]);

  const renderBody = () => {
    if (vm.loading) {
      return (
        <GlassCard style={styles.stateCard}>
          <EmptyState
            title="Loading trip"
            message="Pulling together matches, bookings and trip details."
          />
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
        <View style={styles.matchHero}>
          <ImageBackground
            source={{ uri: STADIUM_HERO_IMAGE_URL }}
            style={styles.matchHeroImage}
            imageStyle={styles.matchHeroImageInner}
          >
            <View style={styles.heroSmokeTop} pointerEvents="none" />
            <View style={styles.heroSmokeBottom} pointerEvents="none" />
            <View style={styles.pitchGlow} pointerEvents="none" />

            <View style={styles.heroTopOverlay}>
              <View style={styles.logoDisc}>
                <Text style={styles.logoDiscText}>YNA</Text>
              </View>

              <Text style={styles.matchTitle}>
                {fixtureInfo.homeName} vs {fixtureInfo.awayName}
              </Text>

              <Text style={styles.matchMeta}>
                {fixtureInfo.leagueName} • {data.cityName}
              </Text>

              <View style={styles.fixtureChipRow}>
                <View style={styles.fixtureChip}>
                  <Text style={styles.fixtureChipText}>
                    {formatKickoffDate(fixtureInfo.kickoff)}
                  </Text>
                </View>

                <View style={styles.fixtureChip}>
                  <Text style={styles.fixtureChipText}>
                    {data.kickoffMeta.tbc ? "Kickoff TBC" : formatKickoffTime(fixtureInfo.kickoff)}
                  </Text>
                </View>

                <View style={styles.fixtureChip}>
                  <Text style={styles.fixtureChipText}>{fixtureInfo.venue}</Text>
                </View>
              </View>
            </View>

            <View style={styles.badgesOnPitch}>
              <TeamBadge name={fixtureInfo.homeName} logo={fixtureInfo.homeLogo} side="home" />
              <View style={styles.vsOrb}>
                <Text style={styles.vsOrbText}>VS</Text>
              </View>
              <TeamBadge name={fixtureInfo.awayName} logo={fixtureInfo.awayLogo} side="away" />
            </View>
          </ImageBackground>
        </View>

        <GlassCard style={styles.tripPulseCard}>
          <View style={styles.tripPulseHeader}>
            <View style={styles.tripPulseCopy}>
              <Text style={styles.tripPulseEyebrow}>Your trip to {data.cityName}</Text>
              <Text style={styles.tripPulseTitle}>{tripDatesText}</Text>
              <Text style={styles.tripPulseMeta}>
                {screenStatusLabel(status)} • {vm.tripCompletionPct ?? 0}% booked
              </Text>
            </View>

            <Pressable onPress={controller.onViewWallet} hitSlop={8} style={styles.walletOrb}>
              <Text style={styles.walletOrbText}>Wallet</Text>
            </Pressable>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(0, Math.min(100, vm.tripCompletionPct ?? 0))}%`,
                },
              ]}
            />
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>{screenStatusLabel(status)}</Text>
            </View>

            {data.kickoffMeta.tbc ? (
              <View style={styles.warningPill}>
                <Text style={styles.warningPillText}>Kickoff TBC</Text>
              </View>
            ) : null}

            {vm.tripCompletionPct != null ? (
              <View
                style={[
                  styles.completionPill,
                  completionTone(vm.tripCompletionPct) === "ready"
                    ? styles.completionPillReady
                    : completionTone(vm.tripCompletionPct) === "progress"
                      ? styles.completionPillProgress
                      : styles.completionPillEarly,
                ]}
              >
                <Text style={styles.completionPillText}>{vm.tripCompletionPct}% booked</Text>
              </View>
            ) : null}
          </View>
        </GlassCard>

        <GlassCard style={styles.priorityCard}>
          <Text style={styles.priorityEyebrow}>Do this next</Text>
          <Text style={styles.priorityTitle}>{decisionTitle}</Text>
          <Text style={styles.priorityBody}>{decisionBody}</Text>

          <Pressable
            style={styles.primaryActionBtn}
            onPress={
              dominantAction?.onPress ? () => dominantAction.onPress() : controller.onEditTrip
            }
          >
            <Text style={styles.primaryActionBtnText}>{decisionCta}</Text>
          </Pressable>

          {ticketLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Checking ticket availability…</Text>
            </View>
          ) : null}

          {vm.capHint ? <Text style={styles.capHint}>{vm.capHint}</Text> : null}
        </GlassCard>

        <GlassCard>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Your itinerary</Text>
            <Text style={styles.sectionSubtitle}>Tickets, travel, stay and extras in one clean view.</Text>
          </View>

          <View style={styles.progressList}>
            {vm.progressItems.map((item) => {
              const tone = progressTone(item.state);

              return (
                <Pressable
                  key={item.key}
                  style={[
                    styles.itineraryRow,
                    tone === "booked" && styles.itineraryRowBooked,
                    tone === "started" && styles.itineraryRowStarted,
                  ]}
                  onPress={() => {
                    void item.onPress?.();
                  }}
                >
                  <View style={styles.itineraryIcon}>
                    <Text style={styles.itineraryIconText}>
                      {item.key === "tickets"
                        ? "🎟"
                        : item.key === "flight" || item.key === "travel"
                          ? "✈"
                          : item.key === "hotel" || item.key === "stay"
                            ? "🏨"
                            : item.key === "things"
                              ? "⭐"
                              : "✓"}
                    </Text>
                  </View>

                  <View style={styles.itineraryCopy}>
                    <Text style={styles.itineraryTitle}>{item.label}</Text>
                    <Text style={styles.itinerarySubline}>{progressStateLabel(item.state)}</Text>
                  </View>

                  <Text
                    style={[
                      styles.itineraryStatus,
                      tone === "booked" && styles.itineraryStatusBooked,
                      tone === "started" && styles.itineraryStatusStarted,
                    ]}
                  >
                    {progressStateLabel(item.state)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        <GlassCard>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Wallet status</Text>
            <Text style={styles.sectionSubtitle}>
              {walletSubline({
                bookedCount: bookedItems.length,
                pendingCount: pendingItems.length,
                savedCount: savedOnlyItems.length,
              })}
            </Text>
          </View>

          <View style={styles.walletPreviewRow}>
            <View style={styles.walletMetricCard}>
              <Text style={styles.walletMetricValue}>{bookedItems.length}</Text>
              <Text style={styles.walletMetricLabel}>Booked</Text>
            </View>

            <View style={styles.walletMetricCard}>
              <Text style={styles.walletMetricValue}>{proofCount}</Text>
              <Text style={styles.walletMetricLabel}>Proofs</Text>
            </View>

            <View style={styles.walletMetricCard}>
              <Text style={styles.walletMetricValue}>{missingProofCount}</Text>
              <Text style={styles.walletMetricLabel}>Missing</Text>
            </View>
          </View>

          <Text style={styles.walletPreviewHeadline}>
            {walletHeadline({
              bookedCount: bookedItems.length,
              missingProofCount,
            })}
          </Text>

          <Pressable style={styles.secondaryActionBtn} onPress={controller.onViewWallet}>
            <Text style={styles.secondaryActionBtnText}>Open wallet</Text>
          </Pressable>
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

        {taskRows.length > 0 ? (
          <GlassCard>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Next tasks</Text>
              <Text style={styles.sectionSubtitle}>Only the actions that still matter.</Text>
            </View>

            <View style={styles.taskList}>
              {taskRows.map((task) => (
                <View key={task} style={styles.taskRow}>
                  <View style={styles.taskDot} />
                  <Text style={styles.taskText}>{task}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        ) : null}
      </>
    );
  };

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.9}>
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
          {renderBody()}
        </ScrollView>

        <TicketOptionsSheet
          visible={controller.ticketSheet.visible}
          matchLabel={ticketSheetMatchLabel}
          subtitle={ticketSheetSubtitle}
          strongOptions={ticketSheetPayload?.strongOptions || []}
          weakOptions={ticketSheetPayload?.weakOptions || []}
          onClose={controller.closeTicketSheet}
          onSelect={(option) => {
            void controller.onSelectTicketSheetOption(option);
          }}
          onCompareAll={controller.onCompareAllTickets}
          onOpenOfficial={
            ticketSheetPayload?.officialTicketUrl
              ? () => {
                  void controller.onOpenOfficialFromSheet();
                }
              : null
          }
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  content: {
    paddingTop: 84,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  stateCard: {
    minHeight: 180,
    justifyContent: "center",
  },

  matchHero: {
    height: 430,
    borderRadius: 34,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(126,255,143,0.20)",
    backgroundColor: "#04180D",
    shadowColor: "#00FF66",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },

  matchHeroImage: {
    flex: 1,
    justifyContent: "space-between",
  },

  matchHeroImageInner: {
    borderRadius: 34,
  },

  heroSmokeTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  heroSmokeBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
    backgroundColor: "rgba(0,18,9,0.72)",
  },

  pitchGlow: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 68,
    height: 90,
    borderRadius: 999,
    backgroundColor: "rgba(67,255,99,0.16)",
    borderWidth: 1,
    borderColor: "rgba(130,255,150,0.18)",
  },

  heroTopOverlay: {
    paddingHorizontal: 22,
    paddingTop: 24,
    alignItems: "center",
  },

  logoDisc: {
    width: 58,
    height: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,215,94,0.58)",
    shadowColor: "#FFD85A",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },

  logoDiscText: {
    color: "#E7FFE8",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  matchTitle: {
    marginTop: 18,
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.4,
  },

  matchMeta: {
    marginTop: 6,
    color: "rgba(234,255,235,0.76)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  fixtureChipRow: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },

  fixtureChip: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,26,12,0.70)",
    borderWidth: 1,
    borderColor: "rgba(126,255,143,0.18)",
  },

  fixtureChipText: {
    color: "rgba(245,255,245,0.88)",
    fontSize: 12,
    fontWeight: "800",
  },

  badgesOnPitch: {
    marginBottom: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  teamBadgeShell: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.64)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",
    shadowColor: "#7EFF8F",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },

  homeBadge: {
    transform: [{ rotate: "-4deg" }],
  },

  awayBadge: {
    transform: [{ rotate: "4deg" }],
  },

  teamBadgeImage: {
    width: 62,
    height: 62,
  },

  teamBadgeInitials: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  vsOrb: {
    width: 48,
    height: 48,
    marginHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,214,78,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.50)",
  },

  vsOrbText: {
    color: "#07140B",
    fontSize: 13,
    fontWeight: "950",
  },

  tripPulseCard: {
    borderRadius: 28,
    backgroundColor: "rgba(0,62,29,0.55)",
    borderColor: "rgba(95,255,119,0.22)",
  },

  tripPulseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },

  tripPulseCopy: {
    flex: 1,
  },

  tripPulseEyebrow: {
    fontSize: 13,
    fontWeight: "900",
    color: "#9DFF9E",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  tripPulseTitle: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  tripPulseMeta: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },

  walletOrb: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  walletOrbText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "900",
  },

  progressTrack: {
    marginTop: 18,
    height: 9,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#7EFF58",
  },

  badgeRow: {
    marginTop: theme.spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },

  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  statusChipText: {
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

  completionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },

  completionPillEarly: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
  },

  completionPillProgress: {
    backgroundColor: "rgba(87,162,56,0.10)",
    borderColor: "rgba(87,162,56,0.26)",
  },

  completionPillReady: {
    backgroundColor: "rgba(69,182,122,0.12)",
    borderColor: "rgba(69,182,122,0.30)",
  },

  completionPillText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "800",
  },

  priorityCard: {
    borderRadius: 26,
  },

  priorityEyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: "#F5CC57",
    textTransform: "uppercase",
    letterSpacing: 0.75,
  },

  priorityTitle: {
    marginTop: 8,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.4,
  },

  priorityBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },

  primaryActionBtn: {
    marginTop: theme.spacing.md,
    minHeight: 54,
    borderRadius: 16,
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

  loadingRow: {
    marginTop: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    fontWeight: "700",
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

  progressList: {
    gap: 10,
  },

  itineraryRow: {
    minHeight: 74,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.045)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  itineraryRowBooked: {
    backgroundColor: "rgba(87,255,105,0.08)",
    borderColor: "rgba(87,255,105,0.20)",
  },

  itineraryRowStarted: {
    backgroundColor: "rgba(255,210,80,0.07)",
    borderColor: "rgba(255,210,80,0.16)",
  },

  itineraryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  itineraryIconText: {
    fontSize: 20,
  },

  itineraryCopy: {
    flex: 1,
  },

  itineraryTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "900",
  },

  itinerarySubline: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },

  itineraryStatus: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
  },

  itineraryStatusBooked: {
    color: "#7EFF58",
  },

  itineraryStatusStarted: {
    color: "#F5CC57",
  },

  walletPreviewRow: {
    flexDirection: "row",
    gap: 10,
  },

  walletMetricCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  walletMetricValue: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "900",
  },

  walletMetricLabel: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
  },

  walletPreviewHeadline: {
    marginTop: 14,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
  },

  secondaryActionBtn: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 16,
  },

  secondaryActionBtnText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "900",
  },

  taskList: {
    gap: 10,
  },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
  },

  taskText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
});
