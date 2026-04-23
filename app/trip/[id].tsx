import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
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

import type { SavedItemType } from "@/src/core/savedItemTypes";

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

type PlannerCardItem = {
  key: "tickets" | "stay" | "travel" | "things";
  label: string;
  eyebrow: string;
};

type PlannerCardTone = "strong" | "medium" | "weak" | "optional";

type PlannerCardViewModel = PlannerCardItem & {
  count: number;
  subtitle: string;
  status: string;
  tone: PlannerCardTone;
};

const PLANNER_ITEMS: PlannerCardItem[] = [
  { key: "tickets", label: "Tickets", eyebrow: "Anchor the trip" },
  { key: "travel", label: "Travel", eyebrow: "Get there" },
  { key: "stay", label: "Stay", eyebrow: "Choose location" },
  { key: "things", label: "Extras", eyebrow: "Optional add-ons" },
];

function screenStatusLabel(status: string) {
  const value = String(status ?? "").toLowerCase();
  if (value === "completed") return "Completed";
  if (value === "in progress") return "In progress";
  return "Upcoming";
}

function nextStepLabel(stepKey?: string | null) {
  if (stepKey === "tickets") return "Secure tickets";
  if (stepKey === "flight") return "Sort travel";
  if (stepKey === "hotel") return "Lock stay";
  if (stepKey === "transfer") return "Sort local transport";
  if (stepKey === "things") return "Add extras";
  return "Continue planning";
}

function urgencyLine(hasBookedTickets: boolean, kickoffTbc: boolean) {
  if (!hasBookedTickets && kickoffTbc) {
    return "Kickoff can still move. Secure tickets first, then keep travel flexible.";
  }

  if (!hasBookedTickets) {
    return "Tickets come first. Flights and stays are still soft planning until tickets are actually booked.";
  }

  if (kickoffTbc) {
    return "Tickets are booked, but kickoff is still TBC. Avoid locking inflexible travel too early.";
  }

  return "Use the saved trip window as truth. Flights and stays should match the real saved dates, not guesswork.";
}

function dateWindowLine(startDate?: string | null, endDate?: string | null) {
  const start = String(startDate ?? "").trim();
  const end = String(endDate ?? "").trim();

  if (!start || !end) return "Trip dates not set";
  return `${start} → ${end}`;
}

function completionTone(pct?: number | null) {
  const value = typeof pct === "number" ? pct : 0;
  if (value >= 90) return "ready";
  if (value >= 65) return "progress";
  return "early";
}

function plannerCardMeta(args: {
  key: PlannerCardItem["key"];
  count: number;
  hasBooked: boolean;
  hasStarted: boolean;
}) {
  const { key, count, hasBooked, hasStarted } = args;

  if (key === "tickets") {
    if (hasBooked) {
      return {
        subtitle: "Ticket booking confirmed by you",
        status: "Booked",
        tone: "strong" as PlannerCardTone,
      };
    }

    if (hasStarted) {
      return {
        subtitle:
          count === 1 ? "Ticket route started but not booked" : `${count} ticket items not yet confirmed`,
        status: "Not booked",
        tone: "medium" as PlannerCardTone,
      };
    }

    return {
      subtitle: "No ticket booking confirmed yet",
      status: "Not booked",
      tone: "weak" as PlannerCardTone,
    };
  }

  if (key === "travel") {
    if (hasBooked) {
      return {
        subtitle: "Main travel confirmed by you",
        status: "Booked",
        tone: "strong" as PlannerCardTone,
      };
    }

    if (hasStarted) {
      return {
        subtitle:
          count === 1 ? "Travel route started but not booked" : `${count} travel items not yet confirmed`,
        status: "Not booked",
        tone: "medium" as PlannerCardTone,
      };
    }

    return {
      subtitle: "Travel still not booked",
      status: "Not booked",
      tone: "weak" as PlannerCardTone,
    };
  }

  if (key === "stay") {
    if (hasBooked) {
      return {
        subtitle: "Stay confirmed by you",
        status: "Booked",
        tone: "strong" as PlannerCardTone,
      };
    }

    if (hasStarted) {
      return {
        subtitle:
          count === 1 ? "Stay option started but not booked" : `${count} stay items not yet confirmed`,
        status: "Not booked",
        tone: "medium" as PlannerCardTone,
      };
    }

    return {
      subtitle: "Stay still not booked",
      status: "Not booked",
      tone: "weak" as PlannerCardTone,
    };
  }

  if (hasBooked) {
    return {
      subtitle: "Optional extras confirmed",
      status: "Booked",
      tone: "optional" as PlannerCardTone,
    };
  }

  if (hasStarted) {
    return {
      subtitle: count === 1 ? "Extra saved or started, not booked" : `${count} extras saved or started, not booked`,
      status: "Optional",
      tone: "optional" as PlannerCardTone,
    };
  }

  return {
    subtitle: "Optional after the core trip is actually covered",
    status: "Optional",
    tone: "optional" as PlannerCardTone,
  };
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
  const groupedBySection = workspace.grouped;

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

  const dominantAction = vm.nextAction;
  const decisionTitle = dominantAction?.title || "Continue planning";
  const decisionCta = dominantAction?.cta || "Continue planning";

  const decisionBody = useMemo(() => {
    if (!vm.hasTickets) {
      return "Lock tickets first. That is what actually anchors the trip. Until tickets are confirmed booked, the rest is still softer planning.";
    }

    return dominantAction?.body || "Move the trip forward by finishing the next real booking step.";
  }, [vm.hasTickets, dominantAction]);

  const pressureText = useMemo(() => {
    return urgencyLine(vm.hasTickets, data.kickoffMeta.tbc);
  }, [vm.hasTickets, data.kickoffMeta.tbc]);

  const tripDatesText = useMemo(() => {
    return dateWindowLine(trip?.startDate, trip?.endDate);
  }, [trip?.startDate, trip?.endDate]);

  const ticketCount = groupedBySection.tickets?.length || 0;
  const travelCount = groupedBySection.travel?.length || 0;
  const stayCount = groupedBySection.stay?.length || 0;
  const thingsCount = groupedBySection.things?.length || 0;

  const tripStageTitle = useMemo(() => {
    if ((vm.tripCompletionPct ?? 0) >= 90) return "Trip nearly complete";
    if ((vm.tripCompletionPct ?? 0) >= 65) return "Trip materially covered";
    if ((vm.tripCompletionPct ?? 0) >= 35) return "Trip partly covered";
    return "Trip still early";
  }, [vm.tripCompletionPct]);

  const tripStageBody = useMemo(() => {
    if ((vm.tripCompletionPct ?? 0) >= 90) {
      return "Core bookings are largely covered. Final job is proof, confirmations and Wallet cleanup.";
    }

    if ((vm.tripCompletionPct ?? 0) >= 65) {
      return "The trip is taking shape, but anything not actually marked booked is still unfinished.";
    }

    if ((vm.tripCompletionPct ?? 0) >= 35) {
      return "Some parts are underway, but started does not mean covered. Saved and pending items are not finished bookings.";
    }

    return "This trip is not properly anchored yet. Work in order: tickets, travel, stay, then extras.";
  }, [vm.tripCompletionPct]);

  const plannerCards = useMemo<PlannerCardViewModel[]>(() => {
    return PLANNER_ITEMS.map((item) => {
      const count = groupedBySection[item.key]?.length || 0;

      const meta = plannerCardMeta({
        key: item.key,
        count,
        hasBooked:
          item.key === "tickets"
            ? vm.hasTickets
            : item.key === "travel"
              ? vm.hasFlight
              : item.key === "stay"
                ? vm.hasHotel
                : vm.hasThings,
        hasStarted:
          item.key === "tickets"
            ? ticketCount > 0
            : item.key === "travel"
              ? travelCount > 0
              : item.key === "stay"
                ? stayCount > 0
                : thingsCount > 0,
      });

      return {
        ...item,
        count,
        subtitle: meta.subtitle,
        status: meta.status,
        tone: meta.tone,
      };
    });
  }, [
    groupedBySection,
    vm.hasTickets,
    vm.hasFlight,
    vm.hasHotel,
    vm.hasThings,
    ticketCount,
    travelCount,
    stayCount,
    thingsCount,
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
        <GlassCard style={styles.heroCard}>
          <View style={styles.heroGlow} pointerEvents="none" />

          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroEyebrow}>Trip workspace</Text>
              <Text style={styles.city}>{data.cityName}</Text>
              <Text style={styles.meta}>{summaryLine(trip)}</Text>
            </View>

            <Pressable onPress={controller.onViewWallet} hitSlop={8} style={styles.walletPill}>
              <Text style={styles.walletPillText}>Wallet</Text>
            </Pressable>
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

          <View style={styles.tripWindowCard}>
            <View style={styles.tripWindowHeader}>
              <Text style={styles.tripWindowLabel}>Trip dates</Text>
              <Pressable onPress={controller.onEditTrip} hitSlop={8}>
                <Text style={styles.tripWindowEdit}>Edit</Text>
              </Pressable>
            </View>

            <Text style={styles.tripWindowValue}>{tripDatesText}</Text>
            <Text style={styles.tripWindowHint}>
              These are the real saved dates. Flights and stays should follow this window.
            </Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.priorityCard}>
          <Text style={styles.priorityEyebrow}>Do this next</Text>
          <Text style={styles.priorityTitle}>{decisionTitle}</Text>
          <Text style={styles.priorityBody}>{decisionBody}</Text>

          <View style={styles.priorityMetaWrap}>
            <Text style={styles.priorityMetaText}>
              {vm.bookingFunnelLabel || `Next: ${nextStepLabel(vm.nextIncompleteStep?.key)}`}
            </Text>
          </View>

          <Text style={styles.pressureText}>{pressureText}</Text>

          <Pressable
            style={styles.primaryActionBtn}
            onPress={
              dominantAction?.onPress
                ? () => dominantAction.onPress()
                : controller.onEditTrip
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
          <Text style={styles.stageEyebrow}>Trip status</Text>
          <Text style={styles.stageTitle}>{tripStageTitle}</Text>
          <Text style={styles.stageBody}>{tripStageBody}</Text>

          <View style={styles.coreStatusGrid}>
            <View style={styles.coreStatusCard}>
              <Text style={styles.coreStatusLabel}>Tickets</Text>
              <Text style={styles.coreStatusValue}>
                {vm.hasTickets ? "Booked" : ticketCount > 0 ? "Not booked (started)" : "Not booked"}
              </Text>
            </View>

            <View style={styles.coreStatusCard}>
              <Text style={styles.coreStatusLabel}>Travel</Text>
              <Text style={styles.coreStatusValue}>
                {vm.hasFlight ? "Booked" : travelCount > 0 ? "Not booked (started)" : "Not booked"}
              </Text>
            </View>

            <View style={styles.coreStatusCard}>
              <Text style={styles.coreStatusLabel}>Stay</Text>
              <Text style={styles.coreStatusValue}>
                {vm.hasHotel ? "Booked" : stayCount > 0 ? "Not booked (started)" : "Not booked"}
              </Text>
            </View>

            <View style={styles.coreStatusCard}>
              <Text style={styles.coreStatusLabel}>Extras</Text>
              <Text style={styles.coreStatusValue}>
                {vm.hasThings ? "Booked" : thingsCount > 0 ? "Optional (not booked)" : "Optional"}
              </Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Plan this trip</Text>
            <Text style={styles.sectionSubtitle}>
              {vm.completionSummary || "Work through the trip in the right order."}
            </Text>
          </View>

          <View style={styles.plannerGrid}>
            {plannerCards.map((item) => (
              <Pressable
                key={item.key}
                style={[
                  styles.plannerCard,
                  item.tone === "strong"
                    ? styles.plannerCardStrong
                    : item.tone === "medium"
                      ? styles.plannerCardMedium
                      : item.tone === "optional"
                        ? styles.plannerCardOptional
                        : styles.plannerCardWeak,
                ]}
                onPress={() => controller.onOpenSection(item.key)}
              >
                <View style={styles.plannerCardTop}>
                  <Text style={styles.plannerCardEyebrow}>{item.eyebrow}</Text>

                  <View
                    style={[
                      styles.plannerStatusPill,
                      item.tone === "strong"
                        ? styles.plannerStatusPillStrong
                        : item.tone === "medium"
                          ? styles.plannerStatusPillMedium
                          : item.tone === "optional"
                            ? styles.plannerStatusPillOptional
                            : styles.plannerStatusPillWeak,
                    ]}
                  >
                    <Text style={styles.plannerStatusPillText}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.plannerCardTitle}>{item.label}</Text>
                <Text style={styles.plannerCardSub}>{item.subtitle}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.plannerFootnote}>
            Saved and pending items are not the same as booked. The trip is only truly covered when the core steps are confirmed.
          </Text>
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

        <GlassCard>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>What this trip still needs</Text>
            <Text style={styles.sectionSubtitle}>
              Leave this screen knowing the next real move.
            </Text>
          </View>

          <View style={styles.guidanceList}>
            {!vm.hasTickets ? (
              <Text style={styles.guidanceText}>• Tickets still need locking in.</Text>
            ) : null}

            {!vm.hasFlight ? (
              <Text style={styles.guidanceText}>• Main travel is still not actually marked booked.</Text>
            ) : null}

            {!vm.hasHotel ? (
              <Text style={styles.guidanceText}>• Stay still needs deciding and booking.</Text>
            ) : null}

            {!vm.hasTransport ? (
              <Text style={styles.guidanceText}>• Local transport is still weak or unfinished.</Text>
            ) : null}

            {vm.hasTickets && vm.hasFlight && vm.hasHotel && vm.hasTransport ? (
              <Text style={styles.guidanceText}>
                • Core trip is covered. Final job is proof, confirmations and Wallet cleanup.
              </Text>
            ) : null}
          </View>
        </GlassCard>
      </>
    );
  };

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
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  stateCard: {
    minHeight: 180,
    justifyContent: "center",
  },

  heroCard: {
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
  },

  heroGlow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: -12,
    height: 74,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.08)",
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },

  heroTitleWrap: {
    flex: 1,
  },

  heroEyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: "#8EF2A5",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  city: {
    marginTop: 6,
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

  walletPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  walletPillText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.text,
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

  tripWindowCard: {
    marginTop: theme.spacing.md,
    borderRadius: 18,
    padding: theme.spacing.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  tripWindowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },

  tripWindowLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  tripWindowEdit: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.colors.accent,
  },

  tripWindowValue: {
    marginTop: 6,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: theme.colors.text,
  },

  tripWindowHint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
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

  priorityMetaWrap: {
    marginTop: theme.spacing.sm,
  },

  priorityMetaText: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textMuted,
    fontWeight: "700",
  },

  pressureText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    fontWeight: "700",
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

  stageEyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: "#8EF2A5",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  stageTitle: {
    marginTop: 8,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },

  stageBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },

  coreStatusGrid: {
    marginTop: theme.spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },

  coreStatusCard: {
    width: "48%",
    borderRadius: 16,
    padding: theme.spacing.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  coreStatusLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  coreStatusValue: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: theme.colors.text,
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
    minHeight: 132,
    borderRadius: 18,
    padding: theme.spacing.md,
    borderWidth: 1,
    justifyContent: "space-between",
  },

  plannerCardWeak: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.10)",
  },

  plannerCardMedium: {
    backgroundColor: "rgba(120,170,255,0.08)",
    borderColor: "rgba(120,170,255,0.18)",
  },

  plannerCardStrong: {
    backgroundColor: "rgba(87,162,56,0.10)",
    borderColor: "rgba(87,162,56,0.22)",
  },

  plannerCardOptional: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.10)",
  },

  plannerCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  plannerCardEyebrow: {
    flex: 1,
    fontSize: 11,
    fontWeight: "900",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  plannerStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  plannerStatusPillWeak: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
  },

  plannerStatusPillMedium: {
    backgroundColor: "rgba(120,170,255,0.12)",
    borderColor: "rgba(120,170,255,0.22)",
  },

  plannerStatusPillStrong: {
    backgroundColor: "rgba(87,162,56,0.12)",
    borderColor: "rgba(87,162,56,0.24)",
  },

  plannerStatusPillOptional: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.10)",
  },

  plannerStatusPillText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: "900",
  },

  plannerCardTitle: {
    marginTop: 8,
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

  plannerFootnote: {
    marginTop: theme.spacing.md,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textMuted,
  },

  guidanceList: {
    gap: 8,
  },

  guidanceText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },
});
