// app/trip/[id].tsx

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import TicketOptionsSheet from "@/src/components/tickets/TicketOptionsSheet";

import { getBackground, getCityBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import useTripWorkspace from "@/src/features/tripDetail/useTripWorkspace";
import useTripDetailData from "@/src/features/tripDetail/useTripDetailData";
import useTripDetailController from "@/src/features/tripDetail/useTripDetailController";

import { coerceId } from "@/src/features/tripDetail/helpers";

import { getCityGuide } from "@/src/data/cityGuides";
import { getTeam } from "@/src/data/teams";
import { hasTeamGuide } from "@/src/data/teamGuides";

const FALLBACK_CITY_IMAGE =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=90";

type GuideRow = {
  key: string;
  title: string;
  detail: string;
  badge: string;
  enabled: boolean;
  onPress: () => void;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function asImageSource(value: string | ImageSourcePropType | null | undefined) {
  if (!value) return { uri: FALLBACK_CITY_IMAGE };
  if (typeof value === "string") return { uri: value };
  return value;
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
  };
}

function dateLabel(value?: string | null) {
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

function shortDateLabel(value?: string | null) {
  const raw = clean(value);
  if (!raw) return "Date TBC";

  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return "Date TBC";

  return date.toLocaleDateString("en-GB", {
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

function initials(name?: string | null) {
  const value = clean(name);
  if (!value) return "?";

  const parts = value
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) return value.slice(0, 3).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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
  if (state === "pending") return "Pending";
  if (state === "saved") return "Saved";
  return "Find options";
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

  const cityImage = useMemo(() => {
    return asImageSource(getCityBackground(data.cityName || "rome"));
  }, [data.cityName]);

  const completion = progressCompletion(data.progress);
  const booked = bookedCount(data.progress);

  const homeTeam = useMemo(() => getTeam(fixture.homeName), [fixture.homeName]);
  const awayTeam = useMemo(() => getTeam(fixture.awayName), [fixture.awayName]);
  const cityGuide = useMemo(() => getCityGuide(data.cityName || ""), [data.cityName]);

  const guideRows: GuideRow[] = useMemo(() => {
    const rows: GuideRow[] = [];

    if (cityGuide?.cityId) {
      rows.push({
        key: "city",
        title: `${cityGuide.name || data.cityName} City Guide`,
        detail: "Areas, food, transport and matchday city tips",
        badge: "CITY",
        enabled: true,
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
        detail: homeTeam.stadiumKey ? "Club, stadium and local context" : "Club and local context",
        badge: "HOME",
        enabled: true,
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
        detail: awayTeam.stadiumKey ? "Club, stadium and local context" : "Club and local context",
        badge: "TEAM",
        enabled: true,
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
        key: "tickets",
        icon: "🎟",
        label: "Match tickets",
        detail:
          fixture.homeName !== "Home"
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
        key: "things",
        icon: "★",
        label: "Experiences",
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
          <View style={styles.heroShell}>
            <ImageBackground source={cityImage} style={styles.heroImage} imageStyle={styles.heroImageInner}>
              <View style={styles.heroShade} />
              <View style={styles.heroGlow} />

              <View style={styles.heroBadgeTop}>
                <TeamBadge name={fixture.homeName} logo={fixture.homeLogo} />
              </View>

              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>
                  {fixture.homeName} vs {fixture.awayName}
                </Text>

                <Text style={styles.heroMeta}>
                  {fixture.leagueName}
                  {fixture.round ? ` • ${fixture.round}` : ""}
                </Text>

                <View style={styles.heroChips}>
                  <View style={styles.heroChip}>
                    <Text style={styles.heroChipText}>▣ {shortDateLabel(fixture.kickoff)}</Text>
                  </View>

                  <View style={styles.heroChip}>
                    <Text style={styles.heroChipText}>
                      ◷ {fixture.tbc ? "TBC" : timeLabel(fixture.kickoff)}
                    </Text>
                  </View>

                  <View style={styles.heroChipWide}>
                    <Text style={styles.heroChipText} numberOfLines={1}>
                      ◉ {fixture.venue}
                    </Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
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

            <Text style={styles.tripBookedLine}>{booked}/6 booked</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%` }]} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your itinerary</Text>

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

  heroShell: {
    height: 360,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.24)",
    backgroundColor: "#031208",
    shadowColor: "#22C55E",
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 9,
  },

  heroImage: {
    flex: 1,
  },

  heroImageInner: {
    borderRadius: 36,
  },

  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,22,10,0.66)",
  },

  heroGlow: {
    position: "absolute",
    left: -60,
    right: -60,
    bottom: -80,
    height: 210,
    backgroundColor: "rgba(21,128,61,0.34)",
    borderRadius: 999,
  },

  heroBadgeTop: {
    alignItems: "center",
    paddingTop: 22,
  },

  heroCopy: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 24,
    alignItems: "center",
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    letterSpacing: -0.7,
    textAlign: "center",
  },

  heroMeta: {
    marginTop: 8,
    color: "rgba(245,247,246,0.78)",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  heroChips: {
    marginTop: 20,
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },

  heroChip: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: "center",
    backgroundColor: "rgba(0,20,9,0.72)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.14)",
  },

  heroChipWide: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: "center",
    backgroundColor: "rgba(0,20,9,0.72)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.14)",
  },

  heroChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  teamBadge: {
    width: 76,
    height: 76,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.52)",
    borderWidth: 2,
    borderColor: "rgba(190,242,100,0.56)",
  },

  teamBadgeImage: {
    width: 58,
    height: 58,
  },

  teamBadgeText: {
    color: "#FFFFFF",
    fontSize: 18,
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
