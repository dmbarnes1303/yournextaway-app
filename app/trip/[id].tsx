// app/trip/[id].tsx

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import TicketOptionsSheet from "@/src/components/tickets/TicketOptionsSheet";
import MatchHeroCard from "@/src/components/trip/MatchHeroCard";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import useTripWorkspace from "@/src/features/tripDetail/useTripWorkspace";
import useTripDetailData from "@/src/features/tripDetail/useTripDetailData";
import useTripDetailController from "@/src/features/tripDetail/useTripDetailController";

import { coerceId } from "@/src/features/tripDetail/helpers";

import { getCityGuide } from "@/src/data/cityGuides";
import { getTeam } from "@/src/data/teams";
import { hasTeamGuide } from "@/src/data/teamGuides";

type GuideRow = {
  key: string;
  title: string;
  detail: string;
  badge: string;
  onPress: () => void;
};

type PrimaryAction = {
  key: string;
  eyebrow: string;
  title: string;
  detail: string;
  cta: string;
  onPress: () => void;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
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

function formatRoundLabel(round?: string | null): string {
  const value = clean(round);
  if (!value) return "";

  return value
    .replace(/\bRegular Season\b/gi, "Matchday")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getFixtureInfo(fixture: unknown, trip: any) {
  const hasFixture = Boolean(fixture);

  const homeName =
    readNestedString(fixture, [
      ["homeName"],
      ["homeTeam"],
      ["home", "name"],
      ["teams", "home", "name"],
    ]) ||
    clean(trip?.homeName) ||
    "Home";

  const awayName =
    readNestedString(fixture, [
      ["awayName"],
      ["awayTeam"],
      ["away", "name"],
      ["teams", "away", "name"],
    ]) ||
    clean(trip?.awayName) ||
    "Away";

  const homeLogo =
    readNestedString(fixture, [
      ["homeLogo"],
      ["homeBadge"],
      ["home", "logo"],
      ["teams", "home", "logo"],
    ]) || null;

  const awayLogo =
    readNestedString(fixture, [
      ["awayLogo"],
      ["awayBadge"],
      ["away", "logo"],
      ["teams", "away", "logo"],
    ]) || null;

  const leagueName =
    readNestedString(fixture, [["leagueName"], ["league", "name"]]) ||
    clean(trip?.leagueName) ||
    "Matchday";

  const round =
    readNestedString(fixture, [["round"], ["league", "round"]]) ||
    clean(trip?.round) ||
    "";

  const venue =
    readNestedString(fixture, [
      ["venue"],
      ["stadium"],
      ["fixture", "venue", "name"],
      ["venue", "name"],
    ]) ||
    clean(trip?.venueName) ||
    "Stadium";

  const kickoff =
    readNestedString(fixture, [["kickoffIso"], ["date"], ["fixture", "date"]]) ||
    clean(trip?.kickoffIso) ||
    null;

  const status = clean(readNestedString(fixture, [["fixture", "status", "short"]])).toUpperCase();

  const kickoffDate = kickoff ? new Date(kickoff) : null;
  const validKickoff = Boolean(kickoffDate && Number.isFinite(kickoffDate.getTime()));

  const tbc =
    !validKickoff ||
    status === "TBD" ||
    status === "TBA" ||
    status === "PST" ||
    (!hasFixture && Boolean(trip?.kickoffTbc));

  const hasRealMatch =
    hasFixture &&
    homeName !== "Home" &&
    awayName !== "Away" &&
    Boolean(clean(homeName)) &&
    Boolean(clean(awayName));

  return {
    homeName,
    awayName,
    homeLogo,
    awayLogo,
    leagueName,
    round: formatRoundLabel(round),
    venue,
    kickoff,
    tbc,
    hasRealMatch,
  };
}

function shortDateLabel(value?: string | null) {
  const raw = clean(value);
  if (!raw) return "Date TBC";

  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return "Date TBC";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function timeLabel(value?: string | null) {
  const raw = clean(value);
  if (!raw) return "TBC";

  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return "TBC";

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nightsCount(start?: string | null, end?: string | null) {
  const startDate = new Date(clean(start));
  const endDate = new Date(clean(end));

  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) return 0;

  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000));
}

function nightsLine(start?: string | null, end?: string | null) {
  const nights = nightsCount(start, end);
  if (!nights) return "Dates not set";

  const days = nights + 1;
  return `${nights} ${nights === 1 ? "night" : "nights"} • ${days} ${
    days === 1 ? "day" : "days"
  }`;
}

function tripDateLine(start?: string | null, end?: string | null) {
  const s = clean(start);
  const e = clean(end);
  if (!s || !e) return "Trip dates not set";

  const startDate = new Date(s);
  const endDate = new Date(e);

  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
    return "Trip dates not set";
  }

  return `${startDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })} → ${endDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function progressCompletion(progress: any) {
  const tickets = progress?.tickets === "booked" ? 45 : 0;
  const flight = progress?.flight === "booked" ? 30 : 0;
  const hotel = progress?.hotel === "booked" ? 20 : 0;
  const transfer = progress?.transfer === "booked" ? 3 : 0;
  const things = progress?.things === "booked" ? 2 : 0;

  return Math.max(0, Math.min(100, tickets + flight + hotel + transfer + things));
}

function bookedCount(progress: any) {
  return ["tickets", "flight", "hotel", "things", "transfer", "insurance"].filter(
    (key) => progress?.[key] === "booked"
  ).length;
}

function progressStateLabel(state: string) {
  if (state === "booked") return "Done";
  if (state === "pending") return "Started";
  if (state === "saved") return "Saved";
  return "Open";
}

function nextStepLabel(progress: any) {
  if (progress?.tickets !== "booked") return "Find ticket options";
  if (progress?.hotel !== "booked") return "Choose where to stay";
  if (progress?.flight !== "booked") return "Add travel";
  if (progress?.things !== "booked") return "Add city plans";
  return "Open Wallet";
}

function StepIcon({ label }: { label: string }) {
  return (
    <View style={styles.stepIcon}>
      <Text style={styles.stepIconText}>{label}</Text>
    </View>
  );
}

export default function TripScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ticketLoading, setTicketLoading] = useState(false);

  const routeTripId = useMemo(() => coerceId((params as any)?.id), [params]);

  const workspace = useTripWorkspace({ routeTripId });
  const trip = workspace.trip;

  const data = useTripDetailData({
    trip,
    savedItems: workspace.savedItems,
    originIata: workspace.originIata,
  });

  const controller = useTripDetailController({
    trip,
    activeTripId: workspace.activeTripId,
    cityName: data.cityName,
    primaryLeagueId: data.primaryLeagueId,
    fixturesById: data.fixturesById,
    ticketsByMatchId: data.ticketsByMatchId,
    affiliateUrls: data.affiliateUrls,
    setTicketLoading,
    setActiveWorkspaceSection: workspace.setActiveSection,
  });

  const primaryFixture = useMemo(() => {
    if (!data.primaryMatchId) return null;
    return data.fixturesById?.[String(data.primaryMatchId)] ?? null;
  }, [data.fixturesById, data.primaryMatchId]);

  const fixture = useMemo(() => getFixtureInfo(primaryFixture, trip), [primaryFixture, trip]);

  const completion = progressCompletion(data.progress);
  const booked = bookedCount(data.progress);

  const homeTeam = useMemo(() => getTeam(fixture.homeName), [fixture.homeName]);
  const cityGuide = useMemo(() => getCityGuide(data.cityName || ""), [data.cityName]);

  const heroCountry = clean(homeTeam?.country) || clean(cityGuide?.country) || "Italy";

  const primaryAction: PrimaryAction = useMemo(() => {
    const ticketsState = data.progress?.tickets ?? "empty";
    const hotelState = data.progress?.hotel ?? "empty";
    const flightState = data.progress?.flight ?? "empty";
    const thingsState = data.progress?.things ?? "empty";

    if (ticketsState !== "booked") {
      return {
        key: "tickets",
        eyebrow: "First move",
        title:
          ticketsState === "pending" || ticketsState === "saved"
            ? "Finish your ticket choice"
            : "Start with the match ticket",
        detail:
          ticketsState === "pending" || ticketsState === "saved"
            ? "You already started this step. Finish tickets before booking the rest of the trip."
            : fixture.hasRealMatch
              ? `Check ticket routes for ${fixture.homeName} vs ${fixture.awayName}, then build the trip properly around it.`
              : "Pick a match first, then compare ticket routes.",
        cta: ticketLoading
          ? "Checking tickets…"
          : ticketsState === "pending" || ticketsState === "saved"
            ? "Finish tickets"
            : "Find ticket options",
        onPress: () => {
          if (data.primaryMatchId) {
            void controller.openTicketsForMatch(String(data.primaryMatchId));
          } else {
            controller.onAddMatch();
          }
        },
      };
    }

    if (hotelState !== "booked") {
      return {
        key: "stay",
        eyebrow: "Next step",
        title: "Choose where to stay",
        detail: data.cityName
          ? `Find stays in ${data.cityName} for your saved trip dates.`
          : "Pick a stay that fits the match and your trip window.",
        cta: hotelState === "pending" || hotelState === "saved" ? "Finish stay" : "Compare stays",
        onPress: () => void controller.onOpenSection("stay"),
      };
    }

    if (flightState !== "booked") {
      return {
        key: "travel",
        eyebrow: "Travel",
        title: "Add your route",
        detail: "Check flights or travel before the trip becomes awkward or expensive.",
        cta:
          flightState === "pending" || flightState === "saved"
            ? "Finish travel"
            : "Compare travel",
        onPress: () => void controller.onOpenSection("travel"),
      };
    }

    if (thingsState !== "booked") {
      return {
        key: "things",
        eyebrow: "City break",
        title: "Add plans around the match",
        detail: "Turn the trip into more than just ninety minutes.",
        cta: "Add city plans",
        onPress: () => void controller.onOpenSection("things"),
      };
    }

    return {
      key: "wallet",
      eyebrow: "Ready",
      title: "Keep everything in Wallet",
      detail: "Tickets, stay and travel are in place. Store proof and booking details together.",
      cta: "Open Wallet",
      onPress: controller.onViewWallet,
    };
  }, [
    controller,
    data.cityName,
    data.primaryMatchId,
    data.progress,
    fixture.awayName,
    fixture.hasRealMatch,
    fixture.homeName,
    ticketLoading,
  ]);

  const guideRows: GuideRow[] = useMemo(() => {
    const rows: GuideRow[] = [];

    if (cityGuide?.cityId) {
      rows.push({
        key: "city",
        title: `${cityGuide.name || data.cityName} City Guide`,
        detail: "Stay areas, food, transport and city-break basics",
        badge: "City",
        onPress: () => {
          router.push({
            pathname: "/city/key/[cityKey]",
            params: { cityKey: cityGuide.cityId },
          } as never);
        },
      });
    }

    if (homeTeam?.teamKey && hasTeamGuide(homeTeam.teamKey)) {
      rows.push({
        key: "home",
        title: `${homeTeam.name} Team Guide`,
        detail: "Club, stadium and matchday context",
        badge: "Home",
        onPress: () => {
          router.push({
            pathname: "/team/[teamKey]",
            params: { teamKey: homeTeam.teamKey },
          } as never);
        },
      });
    }

    return rows;
  }, [cityGuide, data.cityName, homeTeam, router]);

  const itineraryRows = useMemo(
    () => [
      {
        key: "tickets",
        icon: "01",
        label: "Tickets",
        detail:
          fixture.hasRealMatch
            ? `${fixture.homeName} vs ${fixture.awayName}`
            : "Compare ticket routes",
        state: data.progress?.tickets ?? "empty",
        onPress: () => {
          if (data.primaryMatchId) {
            void controller.openTicketsForMatch(String(data.primaryMatchId));
          } else {
            controller.onAddMatch();
          }
        },
      },
      {
        key: "stay",
        icon: "02",
        label: "Stay",
        detail: data.cityName ? `Hotels in ${data.cityName}` : "Find the right area",
        state: data.progress?.hotel ?? "empty",
        onPress: () => void controller.onOpenSection("stay"),
      },
      {
        key: "travel",
        icon: "03",
        label: "Travel",
        detail: "Flights and main route",
        state: data.progress?.flight ?? "empty",
        onPress: () => void controller.onOpenSection("travel"),
      },
      {
        key: "things",
        icon: "04",
        label: "Plans",
        detail: "City break extras and saved ideas",
        state: data.progress?.things ?? "empty",
        onPress: () => void controller.onOpenSection("things"),
      },
    ],
    [
      controller,
      data.cityName,
      data.primaryMatchId,
      data.progress,
      fixture.awayName,
      fixture.hasRealMatch,
      fixture.homeName,
    ]
  );

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
      return total > 1 ? "Best ticket routes first" : "Strong ticket route found";
    }

    return "Fallback ticket routes only";
  }, [ticketSheetPayload]);

  if (!trip) {
    return (
      <Background imageSource={getBackground("trip")} overlayOpacity={0.96}>
        <Stack.Screen
          options={{
            headerTransparent: true,
            title: "",
            headerTintColor: "#FFFFFF",
          }}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingShell}>
            <ActivityIndicator color={theme.colors.emeraldSoft} />
            <Text style={styles.loadingText}>Loading trip…</Text>
          </View>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background imageSource={getBackground("trip")} overlayOpacity={0.9}>
      <Stack.Screen
        options={{
          headerTransparent: true,
          title: "",
          headerTintColor: "#FFFFFF",
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 42 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <MatchHeroCard
            homeName={fixture.homeName}
            awayName={fixture.awayName}
            homeLogo={fixture.homeLogo}
            awayLogo={fixture.awayLogo}
            country={heroCountry}
            leagueName={fixture.leagueName}
            round={fixture.round}
            dateLabel={shortDateLabel(fixture.kickoff)}
            timeLabel={fixture.tbc ? "TBC" : timeLabel(fixture.kickoff)}
            venueLabel={fixture.hasRealMatch ? fixture.venue : "Add stadium"}
            hasRealMatch={fixture.hasRealMatch}
            cityName={data.cityName}
          />

          <View style={styles.brandStrip}>
            <Text style={styles.brandStripText}>Plan • Fly • Watch • Repeat</Text>
          </View>

          <View style={styles.tripSummaryCard}>
            <View style={styles.tripSummaryTop}>
              <View style={styles.tripSummaryCopy}>
                <Text style={styles.cardEyebrow}>Trip hub</Text>
                <Text style={styles.tripSummaryTitle}>
                  {data.cityName ? `${data.cityName} Trip` : "Your Trip"}
                </Text>
                <Text style={styles.tripSummaryDates}>
                  {tripDateLine(trip.startDate, trip.endDate)}
                </Text>
                <Text style={styles.tripSummaryNights}>
                  {nightsLine(trip.startDate, trip.endDate)}
                </Text>
              </View>

              <View style={styles.tripMedallion}>
                <Text style={styles.tripMedallionText}>{completion}%</Text>
                <Text style={styles.tripMedallionSub}>ready</Text>
              </View>
            </View>

            <View style={styles.tripStatsRow}>
              <View style={styles.tripStatPill}>
                <Text style={styles.tripStatValue}>{booked}/6</Text>
                <Text style={styles.tripStatLabel}>confirmed</Text>
              </View>

              <View style={styles.tripStatPillWide}>
                <Text style={styles.tripStatLabel}>Next step</Text>
                <Text style={styles.tripStatValueSmall}>{nextStepLabel(data.progress)}</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
          </View>

          <View style={styles.primaryActionCard}>
            <Text style={styles.actionEyebrow}>{primaryAction.eyebrow}</Text>
            <Text style={styles.primaryActionTitle}>{primaryAction.title}</Text>
            <Text style={styles.primaryActionDetail}>{primaryAction.detail}</Text>

            <Pressable
              style={({ pressed }) => [
                styles.primaryActionButton,
                pressed && styles.pressed,
                ticketLoading && primaryAction.key === "tickets" && styles.primaryActionButtonDisabled,
              ]}
              disabled={ticketLoading && primaryAction.key === "tickets"}
              onPress={primaryAction.onPress}
            >
              <Text style={styles.primaryActionButtonText}>{primaryAction.cta}</Text>
            </Pressable>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardEyebrow}>Build sequence</Text>
              <Text style={styles.sectionTitle}>Trip checklist</Text>
              <Text style={styles.sectionSub}>Tickets first, then stay, travel and plans.</Text>
            </View>

            <View style={styles.itineraryList}>
              {itineraryRows.map((row) => {
                const confirmed = row.state === "booked";
                const started = row.state === "saved" || row.state === "pending";

                return (
                  <Pressable
                    key={row.key}
                    style={({ pressed }) => [styles.itineraryRow, pressed && styles.pressed]}
                    onPress={row.onPress}
                  >
                    <StepIcon label={row.icon} />

                    <View style={styles.itineraryCopy}>
                      <Text style={styles.itineraryTitle}>{row.label}</Text>
                      <Text style={styles.itineraryDetail} numberOfLines={2}>
                        {row.detail}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        confirmed && styles.statusPillConfirmed,
                        started && styles.statusPillStarted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.itineraryStatus,
                          confirmed && styles.statusConfirmed,
                          started && styles.statusStarted,
                        ]}
                      >
                        {ticketLoading && row.key === "tickets"
                          ? "Checking"
                          : progressStateLabel(row.state)}
                      </Text>
                    </View>

                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {guideRows.length > 0 ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.cardEyebrow}>Local intelligence</Text>
                <Text style={styles.sectionTitle}>Guides for this trip</Text>
                <Text style={styles.sectionSub}>
                  City context and home-team matchday basics only.
                </Text>
              </View>

              <View style={styles.guideGrid}>
                {guideRows.map((row) => (
                  <Pressable
                    key={row.key}
                    style={({ pressed }) => [styles.guideCard, pressed && styles.pressed]}
                    onPress={row.onPress}
                  >
                    <View style={styles.guideBadge}>
                      <Text style={styles.guideBadgeText}>{row.badge}</Text>
                    </View>

                    <Text style={styles.guideTitle}>{row.title}</Text>
                    <Text style={styles.guideDetail}>{row.detail}</Text>

                    <Text style={styles.guideCta}>Open guide →</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <GlassCard level="subtle" style={styles.walletCard}>
            <Text style={styles.cardEyebrow}>Offline ready</Text>
            <Text style={styles.walletTitle}>Wallet</Text>
            <Text style={styles.walletSub}>
              {workspace.booked.length} booked • {workspace.pending.length} pending
            </Text>

            <Pressable
              style={({ pressed }) => [styles.walletButton, pressed && styles.pressed]}
              onPress={controller.onViewWallet}
            >
              <Text style={styles.walletButtonText}>Open Wallet</Text>
            </Pressable>
          </GlassCard>
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
    paddingHorizontal: 20,
    gap: 16,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },

  loadingShell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: theme.colors.textPrimary,
    fontWeight: "900",
  },

  brandStrip: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.46)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.26)",
  },

  brandStripText: {
    color: theme.colors.emeraldSoft,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.15,
    textTransform: "uppercase",
  },

  tripSummaryCard: {
    padding: 18,
    borderRadius: 28,
    backgroundColor: "rgba(7,12,12,0.94)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  tripSummaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },

  tripSummaryCopy: {
    flex: 1,
    minWidth: 0,
  },

  cardEyebrow: {
    color: theme.colors.emeraldSoft,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  tripSummaryTitle: {
    marginTop: 7,
    color: theme.colors.textPrimary,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.45,
  },

  tripSummaryDates: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },

  tripSummaryNights: {
    marginTop: 5,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
  },

  tripMedallion: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.32)",
  },

  tripMedallionText: {
    color: theme.colors.emeraldSoft,
    fontSize: 17,
    fontWeight: "900",
  },

  tripMedallionSub: {
    marginTop: 1,
    color: theme.colors.textMuted,
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  tripStatsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },

  tripStatPill: {
    minWidth: 94,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  tripStatPillWide: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  tripStatValue: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  tripStatValueSmall: {
    marginTop: 3,
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "900",
  },

  tripStatLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  progressTrack: {
    marginTop: 14,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: theme.colors.emeraldSoft,
  },

  primaryActionCard: {
    padding: 20,
    borderRadius: 28,
    backgroundColor: "rgba(8,16,13,0.94)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.20)",
  },

  actionEyebrow: {
    color: theme.colors.emeraldSoft,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },

  primaryActionTitle: {
    marginTop: 9,
    color: theme.colors.textPrimary,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  primaryActionDetail: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },

  primaryActionButton: {
    marginTop: 18,
    minHeight: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  primaryActionButtonDisabled: {
    opacity: 0.72,
  },

  primaryActionButtonText: {
    color: "#031007",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.1,
  },

  sectionCard: {
    gap: 14,
    padding: 18,
    borderRadius: 28,
    backgroundColor: "rgba(7,12,12,0.92)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  sectionHeaderRow: {
    gap: 5,
  },

  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.45,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  itineraryList: {
    gap: 11,
  },

  itineraryRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  stepIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.24)",
  },

  stepIconText: {
    color: theme.colors.emeraldSoft,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  itineraryCopy: {
    flex: 1,
    minWidth: 0,
  },

  itineraryTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },

  itineraryDetail: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },

  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  statusPillConfirmed: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderColor: "rgba(134,239,172,0.30)",
  },

  statusPillStarted: {
    backgroundColor: "rgba(212,175,55,0.10)",
    borderColor: "rgba(212,175,55,0.22)",
  },

  itineraryStatus: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
  },

  statusConfirmed: {
    color: theme.colors.emeraldSoft,
  },

  statusStarted: {
    color: theme.colors.goldSoft,
  },

  chevron: {
    color: theme.colors.textMuted,
    fontSize: 24,
    marginTop: -2,
  },

  guideGrid: {
    gap: 12,
  },

  guideCard: {
    padding: 17,
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  guideBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.24)",
  },

  guideBadgeText: {
    color: theme.colors.emeraldSoft,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  guideTitle: {
    marginTop: 12,
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  guideDetail: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  guideCta: {
    marginTop: 14,
    color: theme.colors.emeraldSoft,
    fontSize: 13,
    fontWeight: "900",
  },

  walletCard: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(7,12,12,0.92)",
  },

  walletTitle: {
    marginTop: 7,
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  walletSub: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
  },

  walletButton: {
    marginTop: 18,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.22)",
  },

  walletButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: "900",
  },
});
