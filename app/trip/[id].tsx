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
import { Stack, useLocalSearchParams } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import TicketOptionsSheet from "@/src/components/tickets/TicketOptionsSheet";

import { getBackground, getCityBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import useTripWorkspace from "@/src/features/tripDetail/useTripWorkspace";
import useTripDetailData from "@/src/features/tripDetail/useTripDetailData";
import useTripDetailController from "@/src/features/tripDetail/useTripDetailController";

import { coerceId } from "@/src/features/tripDetail/helpers";

const FALLBACK_CITY_IMAGE =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=90";

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
    readNestedString(fixture, [
      ["kickoffIso"],
      ["date"],
      ["fixture", "date"],
    ]) ||
    clean(trip?.kickoffIso) ||
    null;

  const status = clean(
    readNestedString(fixture, [["fixture", "status", "short"]])
  ).toUpperCase();

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

function nightsLine(start?: string | null, end?: string | null) {
  const startDate = new Date(clean(start));
  const endDate = new Date(clean(end));

  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
    return "Dates not set";
  }

  const nights = Math.max(
    0,
    Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000)
  );

  return `${nights} ${nights === 1 ? "night" : "nights"}`;
}

function tripDateLine(start?: string | null, end?: string | null) {
  const s = clean(start);
  const e = clean(end);
  if (!s || !e) return "Trip dates not set";
  return `${s} → ${e}`;
}

function progressCompletion(progress: any) {
  const tickets = progress?.tickets === "booked" ? 45 : 0;
  const flight = progress?.flight === "booked" ? 30 : 0;
  const hotel = progress?.hotel === "booked" ? 20 : 0;
  const transfer = progress?.transfer === "booked" ? 3 : 0;
  const things = progress?.things === "booked" ? 2 : 0;

  return Math.max(0, Math.min(100, tickets + flight + hotel + transfer + things));
}

function progressStateLabel(state: string) {
  if (state === "booked") return "Confirmed";
  if (state === "pending") return "Pending";
  if (state === "saved") return "Saved";
  return "Not started";
}

function TeamBadge({
  name,
  logo,
}: {
  name: string;
  logo?: string | null;
}) {
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

export default function TripScreen() {
  const params = useLocalSearchParams();
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

  const fixture = useMemo(
    () => getFixtureInfo(primaryFixture, trip),
    [primaryFixture, trip]
  );

  const cityImage = useMemo(() => {
    return asImageSource(getCityBackground(data.cityName || "rome"));
  }, [data.cityName]);

  const completion = progressCompletion(data.progress);

  const itineraryRows = useMemo(
    () => [
      {
        key: "tickets",
        label: "Tickets",
        detail:
          fixture.homeName !== "Home"
            ? `${fixture.homeName} vs ${fixture.awayName}`
            : "Match ticket options",
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
        label: "Stay",
        detail: data.cityName ? `Hotels in ${data.cityName}` : "Find the right area",
        state: data.progress?.hotel ?? "empty",
        onPress: () => void controller.onOpenSection("stay"),
      },
      {
        key: "travel",
        label: "Travel",
        detail: "Flights and main travel",
        state: data.progress?.flight ?? "empty",
        onPress: () => void controller.onOpenSection("travel"),
      },
      {
        key: "things",
        label: "Things",
        detail: "City break extras",
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
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 42 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <ImageBackground
              source={cityImage}
              style={styles.heroImage}
              imageStyle={styles.heroImageInner}
            >
              <View style={styles.heroShade} />
              <View style={styles.heroBottomShade} />

              <View style={styles.heroTop}>
                <Text style={styles.heroTitle}>
                  {fixture.homeName} vs {fixture.awayName}
                </Text>

                <Text style={styles.heroMeta}>{fixture.leagueName}</Text>

                <View style={styles.heroChips}>
                  <View style={styles.heroChip}>
                    <Text style={styles.heroChipText}>{dateLabel(fixture.kickoff)}</Text>
                  </View>

                  <View style={styles.heroChip}>
                    <Text style={styles.heroChipText}>
                      {fixture.tbc ? "TBC" : timeLabel(fixture.kickoff)}
                    </Text>
                  </View>

                  <View style={styles.heroChipWide}>
                    <Text style={styles.heroChipText} numberOfLines={1}>
                      {fixture.venue}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.badgeStrip}>
                <TeamBadge name={fixture.homeName} logo={fixture.homeLogo} />
                <View style={styles.vsDisc}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
                <TeamBadge name={fixture.awayName} logo={fixture.awayLogo} />
              </View>
            </ImageBackground>
          </View>

          <View style={styles.tripStrip}>
            <View style={styles.tripStripCopy}>
              <Text style={styles.tripTitle}>Trip to {data.cityName || "your city"}</Text>
              <Text style={styles.tripDates}>{tripDateLine(trip.startDate, trip.endDate)}</Text>
              <Text style={styles.tripMeta}>
                {nightsLine(trip.startDate, trip.endDate)} • {completion}% booked
              </Text>
            </View>

            <Text style={styles.tripPercent}>{completion}%</Text>
          </View>

          <GlassCard variant="brand" level="strong" style={styles.ticketCard}>
            <Text style={styles.eyebrow}>Match anchor</Text>
            <Text style={styles.ticketTitle}>Match & Tickets</Text>

            <View style={styles.ticketTeams}>
              <TeamBadge name={fixture.homeName} logo={fixture.homeLogo} />
              <View style={styles.ticketCopy}>
                <Text style={styles.ticketMatch}>
                  {fixture.homeName} vs {fixture.awayName}
                </Text>
                <Text style={styles.ticketMeta}>
                  {dateLabel(fixture.kickoff)} • {fixture.venue}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.primaryCta}
              onPress={() => {
                if (data.primaryMatchId) {
                  void controller.openTicketsForMatch(String(data.primaryMatchId));
                } else {
                  controller.onAddMatch();
                }
              }}
            >
              <Text style={styles.primaryCtaText}>
                {data.primaryMatchId ? "Find ticket options" : "Add a match"}
              </Text>
            </Pressable>

            {ticketLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" />
                <Text style={styles.loadingRowText}>Checking ticket routes…</Text>
              </View>
            ) : null}
          </GlassCard>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your itinerary</Text>

            <View style={styles.itineraryList}>
              {itineraryRows.map((row) => {
                const confirmed = row.state === "booked";
                const started = row.state === "saved" || row.state === "pending";

                return (
                  <Pressable key={row.key} style={styles.itineraryRow} onPress={row.onPress}>
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
                      {progressStateLabel(row.state)}
                    </Text>

                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

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
    color: theme.colors.text,
    fontWeight: "900",
  },

  heroCard: {
    height: 380,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.24)",
    backgroundColor: "#031208",
    shadowColor: "#22C55E",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },

  heroImage: {
    flex: 1,
    justifyContent: "space-between",
  },

  heroImageInner: {
    borderRadius: 36,
  },

  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  heroBottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 185,
    backgroundColor: "rgba(0,28,12,0.70)",
  },

  heroTop: {
    paddingHorizontal: 22,
    paddingTop: 88,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  heroMeta: {
    marginTop: 6,
    color: "rgba(245,247,246,0.78)",
    fontSize: 15,
    fontWeight: "800",
  },

  heroChips: {
    marginTop: 20,
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },

  heroChip: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 13,
    justifyContent: "center",
    backgroundColor: "rgba(0,20,9,0.68)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.13)",
  },

  heroChipWide: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 13,
    justifyContent: "center",
    backgroundColor: "rgba(0,20,9,0.68)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.13)",
  },

  heroChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  badgeStrip: {
    alignSelf: "center",
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(0,26,12,0.74)",
    borderWidth: 1,
    borderColor: "rgba(134,239,172,0.18)",
  },

  teamBadge: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  teamBadgeImage: {
    width: 52,
    height: 52,
  },

  teamBadgeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  vsDisc: {
    width: 44,
    height: 44,
    marginHorizontal: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accentGold,
  },

  vsText: {
    color: "#07100A",
    fontSize: 12,
    fontWeight: "900",
  },

  tripStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },

  tripStripCopy: {
    flex: 1,
  },

  tripTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  tripDates: {
    marginTop: 5,
    color: "rgba(245,247,246,0.74)",
    fontSize: 15,
    fontWeight: "800",
  },

  tripMeta: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },

  tripPercent: {
    color: theme.colors.accentGreen,
    fontSize: 18,
    fontWeight: "900",
  },

  ticketCard: {
    padding: 20,
    borderRadius: 28,
  },

  eyebrow: {
    color: theme.colors.accentGoldSoft,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  ticketTitle: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.45,
  },

  ticketTeams: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  ticketCopy: {
    flex: 1,
  },

  ticketMatch: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
  },

  ticketMeta: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },

  primaryCta: {
    marginTop: 18,
    minHeight: 56,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accentGold,
  },

  primaryCtaText: {
    color: "#07100A",
    fontSize: 16,
    fontWeight: "900",
  },

  loadingRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  loadingRowText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
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
    gap: 0,
  },

  itineraryRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.085)",
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
    marginTop: 3,
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },

  itineraryStatus: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "900",
  },

  statusConfirmed: {
    color: theme.colors.accentGreenSoft,
  },

  statusStarted: {
    color: theme.colors.accentGoldSoft,
  },

  chevron: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 26,
    marginTop: -2,
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
