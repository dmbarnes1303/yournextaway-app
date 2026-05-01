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
    year: "numeric",
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
        eyebrow: "FIRST MOVE",
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
        eyebrow: "NEXT STEP",
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
        eyebrow: "TRAVEL",
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
        eyebrow: "CITY BREAK",
        title: "Add plans around the match",
        detail: "Turn the trip into more than just ninety minutes.",
        cta: "Add city plans",
        onPress: () => void controller.onOpenSection("things"),
      };
    }

    return {
      key: "wallet",
      eyebrow: "READY",
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
        badge: "CITY",
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
        badge: "HOME",
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
            <ActivityIndicator color="#86EFAC" />
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
            <Text style={styles.brandStripText}>PLAN • FLY • STAY • WATCH</Text>
          </View>

          <View style={styles.tripSummaryCard}>
            <View style={styles.tripSummaryGlow} />

            <View style={styles.tripSummaryTop}>
              <View style={styles.tripSummaryCopy}>
                <Text style={styles.tripSummaryKicker}>TRIP HUB</Text>
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
            <View style={styles.primaryActionGlow} />

            <Text style={styles.primaryActionEyebrow}>{primaryAction.eyebrow}</Text>
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
              <Text style={styles.sectionEyebrow}>BUILD SEQUENCE</Text>
              <Text style={styles.sectionTitle}>Trip checklist</Text>
              <Text style={styles.sectionSub}>
                Work through the essentials in order. Tickets first, then stay, travel and plans.
              </Text>
            </View>

            <View style={styles.itineraryList}>
              {itineraryRows.map((row) => {
                const confirmed = row.state === "booked";
                const started = row.state === "saved" || row.state === "pending";

                return (
                  <Pressable key={row.key} style={styles.itineraryRow} onPress={row.onPress}>
                    <StepIcon label={row.icon} />

                    <View style={styles.itineraryCopy}>
                      <Text style={styles.itineraryTitle}>{row.label}</Text>
                      <Text style={styles.itineraryDetail}>{row.detail}</Text>
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
                <Text style={styles.sectionEyebrow}>LOCAL INTELLIGENCE</Text>
                <Text style={styles.sectionTitle}>Guides for this trip</Text>
                <Text style={styles.sectionSub}>
                  Destination-first planning. City context and home-team matchday basics only.
                </Text>
              </View>

              <View style={styles.guideGrid}>
                {guideRows.map((row) => (
                  <Pressable key={row.key} style={styles.guideCard} onPress={row.onPress}>
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
            <Text style={styles.walletKicker}>OFFLINE READY</Text>
            <Text style={styles.walletTitle}>Wallet</Text>
            <Text style={styles.walletSub}>
              {workspace.booked.length} booked • {workspace.pending.length} pending
            </Text>

            <Pressable style={styles.walletButton} onPress={controller.onViewWallet}>
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
    gap: 18,
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
    color: "#FFFFFF",
    fontWeight: "900",
  },

  brandStrip: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.34)",
  },

  brandStripText: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.15,
  },

  tripSummaryCard: {
    overflow: "hidden",
    padding: 20,
    borderRadius: 29,
    backgroundColor: "rgba(9,18,18,0.94)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.24)",
    shadowColor: "#22C55E",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },

  tripSummaryGlow: {
    position: "absolute",
    top: -92,
    right: -76,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.13)",
  },

  tripSummaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 18,
  },

  tripSummaryCopy: {
    flex: 1,
  },

  tripSummaryKicker: {
    color: "#86EFAC",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.25,
  },

  tripSummaryTitle: {
    marginTop: 7,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.45,
  },

  tripSummaryDates: {
    marginTop: 8,
    color: "rgba(245,247,246,0.78)",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },

  tripSummaryNights: {
    marginTop: 5,
    color: "rgba(245,247,246,0.56)",
    fontSize: 12,
    fontWeight: "900",
  },

  tripMedallion: {
    width: 66,
    height: 66,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.11)",
    borderWidth: 2,
    borderColor: "rgba(134,239,172,0.42)",
  },

  tripMedallionText: {
    color: "#86EFAC",
    fontSize: 17,
    fontWeight: "900",
  },

  tripMedallionSub: {
    marginTop: 1,
    color: "rgba(245,247,246,0.54)",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  tripStatsRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },

  tripStatPill: {
    minWidth: 96,
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
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  tripStatValueSmall: {
    marginTop: 3,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  tripStatLabel: {
    color: "rgba(245,247,246,0.58)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  progressTrack: {
    marginTop: 14,
    height: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },

  primaryActionCard: {
    overflow: "hidden",
    padding: 22,
    borderRadius: 30,
    backgroundColor: "rgba(2,18,10,0.94)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.28)",
    shadowColor: "#D4AF37",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },

  primaryActionGlow: {
    position: "absolute",
    top: -90,
    right: -90,
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.13)",
  },

  primaryActionEyebrow: {
    color: "#FDE68A",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.35,
  },

  primaryActionTitle: {
    marginTop: 9,
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  primaryActionDetail: {
    marginTop: 10,
    color: "rgba(245,247,246,0.72)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },

  primaryActionButton: {
    marginTop: 20,
    minHeight: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#22C55E",
    shadowOpacity: 0.24,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
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
    backgroundColor: "rgba(9,18,18,0.91)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  sectionHeaderRow: {
    gap: 5,
  },

  sectionEyebrow: {
    color: "#86EFAC",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.45,
  },

  sectionSub: {
    color: "rgba(245,247,246,0.58)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  itineraryList: {
    gap: 11,
  },

  itineraryRow: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.12)",
  },

  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.28)",
  },

  stepIconText: {
    color: "#FDE68A",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  itineraryCopy: {
    flex: 1,
    minWidth: 0,
  },

  itineraryTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  itineraryDetail: {
    marginTop: 4,
    color: "rgba(245,247,246,0.62)",
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
    backgroundColor: "rgba(250,204,21,0.10)",
    borderColor: "rgba(250,204,21,0.25)",
  },

  itineraryStatus: {
    color: "rgba(245,247,246,0.58)",
    fontSize: 11,
    fontWeight: "900",
  },

  statusConfirmed: {
    color: "#86EFAC",
  },

  statusStarted: {
    color: "#FDE68A",
  },

  chevron: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 24,
    marginTop: -2,
  },

  guideGrid: {
    gap: 12,
  },

  guideCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.24)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
  },

  guideBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(212,175,55,0.13)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.30)",
  },

  guideBadgeText: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  guideTitle: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  guideDetail: {
    marginTop: 5,
    color: "rgba(245,247,246,0.64)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  guideCta: {
    marginTop: 14,
    color: "#86EFAC",
    fontSize: 13,
    fontWeight: "900",
  },

  walletCard: {
    padding: 21,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.18)",
    backgroundColor: "rgba(9,18,18,0.92)",
  },

  walletKicker: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  walletTitle: {
    marginTop: 7,
    color: "#FFFFFF",
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
    backgroundColor: "rgba(34,197,94,0.14)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.26)",
  },

  walletButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});
