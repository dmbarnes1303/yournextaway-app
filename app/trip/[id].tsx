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
    round,
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
  return `${nights} ${nights === 1 ? "night" : "nights"}`;
}

function tripDateLine(start?: string | null, end?: string | null) {
  const s = clean(start);
  const e = clean(end);
  if (!s || !e) return "Trip dates not set";

  const startDate = new Date(s);
  const endDate = new Date(e);

  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
    return `${s} → ${e}`;
  }

  return `${startDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })} – ${endDate.toLocaleDateString("en-GB", {
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
  if (state === "booked") return "Confirmed";
  if (state === "pending") return "In progress";
  if (state === "saved") return "Saved idea";
  return "Find options";
}

function nextStepLabel(progress: any) {
  if (progress?.tickets !== "booked") return "Next step: choose match tickets";
  if (progress?.flight !== "booked") return "Next step: plan travel";
  if (progress?.hotel !== "booked") return "Next step: compare stays";
  if (progress?.things !== "booked") return "Next step: explore the city";
  return "Trip essentials are in place";
}

function MiniIcon({ label }: { label: string }) {
  return (
    <View style={styles.miniIcon}>
      <Text style={styles.miniIconText}>{label}</Text>
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
  const awayTeam = useMemo(() => getTeam(fixture.awayName), [fixture.awayName]);
  const cityGuide = useMemo(() => getCityGuide(data.cityName || ""), [data.cityName]);

  const heroCountry =
    clean(homeTeam?.country) ||
    clean(awayTeam?.country) ||
    clean(cityGuide?.country) ||
    "Italy";

const primaryAction = useMemo(() => {
  const ticketsState = data.progress?.tickets ?? "empty";
  const hotelState = data.progress?.hotel ?? "empty";
  const flightState = data.progress?.flight ?? "empty";
  const thingsState = data.progress?.things ?? "empty";

  if (ticketsState !== "booked") {
    return {
      key: "tickets",
      title:
        ticketsState === "pending" || ticketsState === "saved"
          ? "Finish your ticket decision"
          : "This trip starts with tickets",
      detail:
        ticketsState === "pending" || ticketsState === "saved"
          ? "You’ve already started. Finish the ticket step before building the rest."
          : fixture.hasRealMatch
            ? `Secure tickets for ${fixture.homeName} vs ${fixture.awayName} before planning around it.`
            : "Choose the match ticket route first so the trip is built on something real.",
      cta:
        ticketsState === "pending" || ticketsState === "saved"
          ? "Finish tickets"
          : "Secure your tickets",
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
      title: "Lock in where you’re staying",
      detail: data.cityName
        ? `Compare stays in ${data.cityName} for your exact trip dates.`
        : "Choose a stay that fits the match and your trip window.",
      cta: hotelState === "pending" || hotelState === "saved" ? "Finish stay" : "Book your stay",
      onPress: () => void controller.onOpenSection("stay"),
    };
  }

  if (flightState !== "booked") {
    return {
      key: "travel",
      title: "Make sure this trip actually works",
      detail: "Check the route before the trip becomes awkward, expensive or rushed.",
      cta:
        flightState === "pending" || flightState === "saved"
          ? "Finish travel"
          : "Lock in your travel",
      onPress: () => void controller.onOpenSection("travel"),
    };
  }

  if (thingsState !== "booked") {
    return {
      key: "things",
      title: "Add something around the match",
      detail: "Turn this from a match booking into an actual city break.",
      cta: "Add something to the trip",
      onPress: () => void controller.onOpenSection("things"),
    };
  }

  return {
    key: "wallet",
    title: "Your trip is taking shape",
    detail: "Tickets, stay and travel are now confirmed. Keep the important stuff in Wallet.",
    cta: "View your booked trip",
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
]);

  const guideRows: GuideRow[] = useMemo(() => {
    const rows: GuideRow[] = [];

    if (cityGuide?.cityId) {
      rows.push({
        key: "city",
        title: `${cityGuide.name || data.cityName} City Guide`,
        detail: "Areas, food, transport and matchday city tips",
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
        detail: "Club, stadium and local context",
        badge: "HOME",
        onPress: () => {
          router.push({
            pathname: "/team/[teamKey]",
            params: { teamKey: homeTeam.teamKey },
          } as never);
        },
      });
    }

    if (awayTeam?.teamKey && awayTeam.teamKey !== homeTeam?.teamKey && hasTeamGuide(awayTeam.teamKey)) {
      rows.push({
        key: "away",
        title: `${awayTeam.name} Team Guide`,
        detail: "Club, stadium and local context",
        badge: "TEAM",
        onPress: () => {
          router.push({
            pathname: "/team/[teamKey]",
            params: { teamKey: awayTeam.teamKey },
          } as never);
        },
      });
    }

    return rows;
  }, [awayTeam, cityGuide, data.cityName, homeTeam, router]);

  const itineraryRows = useMemo(
    () => [
      {
        key: "tickets",
        icon: "🎟",
        label: "Match tickets",
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
        key: "travel",
        icon: "✈",
        label: "Travel",
        detail: "Flights and main route",
        state: data.progress?.flight ?? "empty",
        onPress: () => void controller.onOpenSection("travel"),
      },
      {
        key: "stay",
        icon: "▰",
        label: "Stay",
        detail: data.cityName ? `Hotels in ${data.cityName}` : "Find the right area",
        state: data.progress?.hotel ?? "empty",
        onPress: () => void controller.onOpenSection("stay"),
      },
      {
        key: "things",
        icon: "★",
        label: "Things to do",
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
      <Background imageSource={getBackground("trip")} overlayOpacity={0.94}>
        <Stack.Screen
          options={{
            headerTransparent: true,
            title: "",
            headerTintColor: "#FFFFFF",
          }}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingShell}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading trip…</Text>
          </View>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background imageSource={getBackground("trip")} overlayOpacity={0.94}>
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

          <View style={styles.primaryActionCard}>
            <Text style={styles.primaryActionEyebrow}>{primaryAction.eyebrow}</Text>
            <Text style={styles.primaryActionTitle}>{primaryAction.title}</Text>
            <Text style={styles.primaryActionDetail}>{primaryAction.detail}</Text>

            <Pressable
              style={({ pressed }) => [
                styles.primaryActionButton,
                pressed && styles.pressed,
                ticketLoading && styles.primaryActionButtonDisabled,
              ]}
              disabled={ticketLoading && primaryAction.cta === "Checking tickets…"}
              onPress={primaryAction.onPress}
            >
              <Text style={styles.primaryActionButtonText}>{primaryAction.cta}</Text>
            </Pressable>
          </View>

          <View style={styles.tripSummaryCard}>
            <View style={styles.tripSummaryTop}>
              <View style={styles.tripSummaryCopy}>
                <Text style={styles.tripSummaryTitle}>Your Trip to {data.cityName || "the city"}</Text>
                <Text style={styles.tripSummaryDates}>
                  {tripDateLine(trip.startDate, trip.endDate)} • {nightsLine(trip.startDate, trip.endDate)}
                </Text>
              </View>

              <Text style={styles.tripSummaryIcon}>✈</Text>
            </View>

            <Text style={styles.tripBookedLine}>{booked}/6 confirmed</Text>
            <Text style={styles.nextStep}>{nextStepLabel(data.progress)}</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trip checklist</Text>

            <View style={styles.itineraryList}>
              {itineraryRows.map((row) => {
                const confirmed = row.state === "booked";
                const started = row.state === "saved" || row.state === "pending";

                return (
                  <Pressable key={row.key} style={styles.itineraryRow} onPress={row.onPress}>
                    <MiniIcon label={row.icon} />

                    <View style={styles.itineraryCopy}>
                      <Text style={styles.itineraryTitle}>{row.label}</Text>
                      <Text style={styles.itineraryDetail}>{row.detail}</Text>
                    </View>

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

                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {guideRows.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Local intelligence</Text>

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
            <Text style={styles.walletTitle}>Wallet</Text>
            <Text style={styles.walletSub}>
              {workspace.booked.length} booked • {workspace.pending.length} pending
            </Text>

            <Pressable style={styles.walletButton} onPress={controller.onViewWallet}>
              <Text style={styles.walletButtonText}>Open wallet</Text>
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
    gap: 22,
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

  primaryActionCard: {
    padding: 20,
    borderRadius: 28,
    backgroundColor: "rgba(10,78,36,0.86)",
    borderWidth: 1,
    borderColor: "rgba(163,230,53,0.42)",
    shadowColor: "#A3E635",
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },

  primaryActionEyebrow: {
    color: "#BEF264",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  primaryActionTitle: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  primaryActionDetail: {
    marginTop: 9,
    color: "rgba(245,247,246,0.74)",
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
    backgroundColor: "#A3E635",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },

  primaryActionButtonDisabled: {
    opacity: 0.7,
  },

  primaryActionButtonText: {
    color: "#10220D",
    fontSize: 15,
    fontWeight: "900",
  },

  tripSummaryCard: {
    padding: 20,
    borderRadius: 27,
    backgroundColor: "rgba(0,48,22,0.72)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.34)",
    shadowColor: "#22C55E",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },

  tripSummaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 18,
  },

  tripSummaryCopy: {
    flex: 1,
  },

  tripSummaryTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  tripSummaryDates: {
    marginTop: 8,
    color: "rgba(245,247,246,0.74)",
    fontSize: 14,
    fontWeight: "800",
  },

  tripSummaryIcon: {
    color: "#FDE68A",
    fontSize: 31,
    fontWeight: "900",
  },

  tripBookedLine: {
    marginTop: 20,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  nextStep: {
    marginTop: 6,
    color: "#A3E635",
    fontSize: 13,
    fontWeight: "900",
  },

  progressTrack: {
    marginTop: 12,
    height: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#A3E635",
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
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "rgba(0,37,18,0.72)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.16)",
  },

  miniIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  miniIconText: {
    color: "#FDE68A",
    fontSize: 21,
    fontWeight: "900",
  },

  itineraryCopy: {
    flex: 1,
  },

  itineraryTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  itineraryDetail: {
    marginTop: 4,
    color: "rgba(245,247,246,0.62)",
    fontSize: 13,
    fontWeight: "800",
  },

  itineraryStatus: {
    color: "rgba(245,247,246,0.52)",
    fontSize: 13,
    fontWeight: "900",
  },

  statusConfirmed: {
    color: "#A3E635",
  },

  statusStarted: {
    color: "#FACC15",
  },

  chevron: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 26,
    marginTop: -2,
  },

  guideGrid: {
    gap: 12,
  },

  guideCard: {
    padding: 17,
    borderRadius: 22,
    backgroundColor: "rgba(0,30,14,0.78)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.20)",
  },

  guideBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(250,204,21,0.13)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.25)",
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
  },

  guideDetail: {
    marginTop: 5,
    color: "rgba(245,247,246,0.62)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

  guideCta: {
    marginTop: 13,
    color: "#A3E635",
    fontSize: 13,
    fontWeight: "900",
  },

  walletCard: {
    padding: 20,
    borderRadius: 26,
  },

  walletTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },

  walletSub: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
  },

  walletButton: {
    marginTop: 18,
    minHeight: 52,
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
