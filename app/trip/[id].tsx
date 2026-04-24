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

const STADIUM_HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=90";

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
  if (state === "booked") return "Confirmed";
  if (state === "pending") return "Pending";
  if (state === "saved") return "Saved";
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
}: {
  name: string;
  logo?: string | null;
}) {
  const initials = initialsFromName(name);

  return (
    <View style={styles.teamBadgeShell}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.teamBadgeImage} resizeMode="contain" />
      ) : (
        <Text style={styles.teamBadgeInitials}>{initials}</Text>
      )}
    </View>
  );
}

function ItineraryIcon({ itemKey }: { itemKey: string }) {
  const icon =
    itemKey === "tickets"
      ? "🎟"
      : itemKey === "flight" || itemKey === "travel"
        ? "✈"
        : itemKey === "hotel" || itemKey === "stay"
          ? "🛏"
          : itemKey === "things"
            ? "★"
            : "✓";

  return (
    <View style={styles.itineraryIcon}>
      <Text style={styles.itineraryIconText}>{icon}</Text>
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
    return data.fixturesById?.[String(data.primaryMatchId)] ?? null;
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

  const completionPct = Math.max(0, Math.min(100, vm.tripCompletionPct ?? 0));

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
        <View style={styles.heroCard}>
          <ImageBackground
            source={{ uri: STADIUM_HERO_IMAGE_URL }}
            style={styles.heroImage}
            imageStyle={styles.heroImageInner}
          >
            <View style={styles.heroDarkLayer} pointerEvents="none" />
            <View style={styles.heroGreenLayer} pointerEvents="none" />

            <View style={styles.heroContent}>
              <View style={styles.heroLogo}>
                <Text style={styles.heroLogoText}>YNA</Text>
              </View>

              <Text style={styles.heroTitle}>
                {fixtureInfo.homeName} vs {fixtureInfo.awayName}
              </Text>

              <Text style={styles.heroSub}>
                {fixtureInfo.leagueName} • {data.cityName}
              </Text>

              <View style={styles.heroChipRow}>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>{formatKickoffDate(fixtureInfo.kickoff)}</Text>
                </View>

                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText}>
                    {data.kickoffMeta.tbc ? "Kickoff TBC" : formatKickoffTime(fixtureInfo.kickoff)}
                  </Text>
                </View>

                <View style={styles.heroChip}>
                  <Text style={styles.heroChipText} numberOfLines={1}>
                    {fixtureInfo.venue}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.pitchBadgeStrip}>
              <TeamBadge name={fixtureInfo.homeName} logo={fixtureInfo.homeLogo} />
              <View style={styles.vsBadge}>
                <Text style={styles.vsBadgeText}>VS</Text>
              </View>
              <TeamBadge name={fixtureInfo.awayName} logo={fixtureInfo.awayLogo} />
            </View>
          </ImageBackground>
        </View>

        <GlassCard style={styles.tripCard} variant="brand" level="strong">
          <View style={styles.tripCardTop}>
            <View style={styles.tripCardCopy}>
              <Text style={styles.cardEyebrow}>Your trip to {data.cityName}</Text>
              <Text style={styles.tripDate}>{tripDatesText}</Text>
              <Text style={styles.tripMeta}>
                {screenStatusLabel(status)} • {completionPct}% booked
              </Text>
            </View>

            <Pressable onPress={controller.onViewWallet} hitSlop={8} style={styles.walletPill}>
              <Text style={styles.walletPillText}>Wallet</Text>
            </Pressable>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
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

            <View style={styles.completionPill}>
              <Text style={styles.completionPillText}>{completionPct}% booked</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.priorityCard} variant="gold">
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

        <GlassCard style={styles.cardBlock}>
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
                  <ItineraryIcon itemKey={item.key} />

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

        <GlassCard style={styles.cardBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Wallet status</Text>
            <Text style={styles.sectionSubtitle}>
              {bookedItems.length} booked • {pendingItems.length} pending • {savedOnlyItems.length} saved
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
          <GlassCard style={styles.cardBlock}>
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
    <Background imageSource={getBackground("trips")} overlayOpacity={0.94}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Trip",
          headerTransparent: true,
          headerTintColor: "#F5F7F6",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: "transparent",
          },
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
    paddingTop: 92,
    paddingHorizontal: 18,
    gap: 14,
  },

  stateCard: {
    minHeight: 180,
    justifyContent: "center",
  },

  heroCard: {
    height: 338,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(126,255,143,0.28)",
    backgroundColor: "#031207",
    shadowColor: "#22C55E",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  heroImage: {
    flex: 1,
    justifyContent: "space-between",
  },

  heroImageInner: {
    borderRadius: 32,
  },

  heroDarkLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  heroGreenLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 190,
    backgroundColor: "rgba(0,32,14,0.74)",
  },

  heroContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    alignItems: "center",
  },

  heroLogo: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.55)",
  },

  heroLogoText: {
    color: "#F5F7F6",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },

  heroTitle: {
    marginTop: 14,
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  heroSub: {
    marginTop: 5,
    color: "rgba(245,247,246,0.78)",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    textAlign: "center",
  },

  heroChipRow: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  heroChip: {
    maxWidth: 126,
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(3,30,13,0.84)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.18)",
  },

  heroChipText: {
    color: "rgba(245,247,246,0.90)",
    fontSize: 11,
    fontWeight: "900",
  },

  pitchBadgeStrip: {
    marginBottom: 26,
    alignSelf: "center",
    minWidth: 214,
    minHeight: 92,
    borderRadius: 999,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(3,44,18,0.74)",
    borderWidth: 1,
    borderColor: "rgba(126,255,143,0.18)",
  },

  teamBadgeShell: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.66)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },

  teamBadgeImage: {
    width: 48,
    height: 48,
  },

  teamBadgeInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  vsBadge: {
    width: 40,
    height: 40,
    marginHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(250,204,21,0.95)",
  },

  vsBadgeText: {
    color: "#07140B",
    fontSize: 12,
    fontWeight: "900",
  },

  tripCard: {
    borderRadius: 28,
    padding: 18,
  },

  tripCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },

  tripCardCopy: {
    flex: 1,
  },

  cardEyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9DFF9E",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  tripDate: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  tripMeta: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  walletPill: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  walletPillText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "900",
  },

  progressTrack: {
    marginTop: 16,
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.34)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#86EFAC",
  },

  badgeRow: {
    marginTop: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  statusChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  statusChipText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "900",
  },

  warningPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(250,204,21,0.12)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.26)",
  },

  warningPillText: {
    color: "#FDE68A",
    fontSize: 12,
    fontWeight: "900",
  },

  completionPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  completionPillText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "900",
  },

  priorityCard: {
    borderRadius: 24,
    padding: 18,
  },

  priorityEyebrow: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FDE68A",
    textTransform: "uppercase",
    letterSpacing: 0.75,
  },

  priorityTitle: {
    marginTop: 8,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -0.45,
  },

  priorityBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },

  primaryActionBtn: {
    marginTop: 16,
    minHeight: 52,
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
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textSecondary,
    fontWeight: "800",
  },

  capHint: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.textMuted,
    fontWeight: "700",
  },

  cardBlock: {
    borderRadius: 24,
    padding: 16,
  },

  sectionHeaderRow: {
    marginBottom: 14,
    gap: 4,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },

  progressList: {
    gap: 10,
  },

  itineraryRow: {
    minHeight: 70,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.04)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  itineraryRowBooked: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.20)",
  },

  itineraryRowStarted: {
    backgroundColor: "rgba(250,204,21,0.07)",
    borderColor: "rgba(250,204,21,0.16)",
  },

  itineraryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.26)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  itineraryIconText: {
    fontSize: 19,
    color: "#FDE68A",
    fontWeight: "900",
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
    fontWeight: "800",
  },

  itineraryStatus: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
  },

  itineraryStatusBooked: {
    color: "#86EFAC",
  },

  itineraryStatusStarted: {
    color: "#FDE68A",
  },

  walletPreviewRow: {
    flexDirection: "row",
    gap: 10,
  },

  walletMetricCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.045)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  walletMetricValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "900",
  },

  walletMetricLabel: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },

  walletPreviewHeadline: {
    marginTop: 14,
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "800",
  },

  secondaryActionBtn: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
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
    fontWeight: "800",
  },
});
