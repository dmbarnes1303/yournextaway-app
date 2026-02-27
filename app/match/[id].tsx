// app/match/[id].tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import MatchdayLogisticsCard from "@/src/components/match/MatchdayLogisticsCard";
import FixtureCertaintyBadge from "@/src/components/FixtureCertaintyBadge";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import { coerceString } from "@/src/utils/params";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

import savedItemsStore from "@/src/state/savedItems";
import { registerPartnerClick } from "@/src/services/partnerReturnBootstrap";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";

import { getMatchdayLogistics } from "@/src/data/matchdayLogistics";
import { getStadiumByHomeTeam } from "@/src/data/stadiums";

/* -------------------------------------------------------------------------- */
/* helpers */
/* -------------------------------------------------------------------------- */

function enc(v: string) {
  return encodeURIComponent(String(v ?? "").trim());
}

async function safeOpenUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn’t open link");
  }
}

function cleanText(v: unknown) {
  return String(v ?? "").trim();
}

function initials(name: string) {
  const clean = cleanText(name);
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function TeamCrest({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(name)}</Text>
      )}
    </View>
  );
}

/** Best-effort short snippet (keeps the page calm). */
function buildLogisticsSummary(logistics: any | null | undefined) {
  if (!logistics) return "Matchday tips not available for this team yet.";

  const bestAreas = Array.isArray(logistics?.stay?.bestAreas) ? logistics.stay.bestAreas : [];
  const areaA = cleanText(bestAreas?.[0]?.area);
  const areaB = cleanText(bestAreas?.[1]?.area);

  const stops = Array.isArray(logistics?.transport?.primaryStops) ? logistics.transport.primaryStops : [];
  const stopA = cleanText(stops?.[0]?.name);

  const bits: string[] = [];
  if (areaA) bits.push(`Best base: ${areaA}${areaB ? `, ${areaB}` : ""}`);
  if (stopA) bits.push(`Key stop: ${stopA}`);

  return bits.length ? bits.join(" • ") : "Open full logistics for areas + transport tips.";
}

/* -------------------------------------------------------------------------- */
/* screen */
/* -------------------------------------------------------------------------- */

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const id = useMemo(() => coerceString((params as any)?.id), [params]);

  // Context: where did we come from?
  const tripId = useMemo(() => coerceString((params as any)?.tripId), [params]);
  const source = useMemo(() => coerceString((params as any)?.source) || "fixtures", [params]);

  const [row, setRow] = useState<FixtureListRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullLogistics, setShowFullLogistics] = useState(false);

  /* ------------------------------------------------------------------ */
  /* LOAD MATCH */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const r = await getFixtureById(id);
        if (!cancelled) setRow(r ?? null);
      } catch {
        if (!cancelled) setRow(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const home = cleanText(row?.teams?.home?.name) || "Home";
  const away = cleanText(row?.teams?.away?.name) || "Away";

  const homeLogo = row?.teams?.home?.logo ?? null;
  const awayLogo = row?.teams?.away?.logo ?? null;

  const kickoffDisplay = formatUkDateTimeMaybe(row?.fixture?.date);

  const stadiumMeta = useMemo(() => getStadiumByHomeTeam(home), [home]);
  const stadiumName = cleanText(stadiumMeta?.name) || cleanText(row?.fixture?.venue?.name);
  const stadiumCity = cleanText(stadiumMeta?.city) || cleanText(row?.fixture?.venue?.city);

  const mapsUrl = useMemo(() => {
    const q = [stadiumName || "stadium", stadiumCity].filter(Boolean).join(" ");
    return `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
  }, [stadiumName, stadiumCity]);

  const logistics = useMemo(() => getMatchdayLogistics({ homeTeamName: home }), [home]);
  const logisticsSummary = useMemo(() => buildLogisticsSummary(logistics), [logistics]);

  const certainty = useMemo(() => getFixtureCertainty(row, {}), [row]);

  /* ------------------------------------------------------------------ */
  /* PRIMARY CTA */
  /* ------------------------------------------------------------------ */

  const onPrimaryCta = useCallback(() => {
    if (!row?.fixture?.id) return;

    // If we’re already in a trip, go back to it.
    if (tripId) {
      router.push({ pathname: "/trip/[id]", params: { id: tripId } } as any);
      return;
    }

    // Otherwise, build a trip from this match.
    router.push({
      pathname: "/trip/build",
      params: {
        fixtureId: String(row.fixture.id),
        source: source || "fixtures",
      },
    } as any);
  }, [router, row, tripId, source]);

  /* ------------------------------------------------------------------ */
  /* SAVE TICKET → WALLET (trip-aware) */
  /* ------------------------------------------------------------------ */

  const saveTicketToTrip = useCallback(
    async (provider: string, url: string) => {
      if (!row) return;
      if (!tripId) {
        // No trip = nowhere correct to store this.
        return;
      }

      const title = `${home} vs ${away} tickets`;

      const item = await savedItemsStore.add({
        tripId,
        type: "tickets",
        title,
        status: "pending",
        partnerId: provider,
        partnerUrl: url,
        metadata: {
          fixtureId: row.fixture.id,
          home,
          away,
          kickoffIso: row.fixture.date ?? null,
          source: "match",
        },
      });

      registerPartnerClick({
        itemId: item.id,
        provider,
        url,
      });
    },
    [row, tripId, home, away]
  );

  /* ------------------------------------------------------------------ */
  /* TICKET URLS */
  /* ------------------------------------------------------------------ */

  const se365PrimaryUrl = useMemo(() => {
    const query = `${home} vs ${away} tickets`;
    return `https://www.sportsevents365.com/search?q=${enc(query)}`;
  }, [home, away]);

  const officialHomeTicketsUrl = useMemo(() => {
    // Honest: we don’t have official endpoints, so this is a Google query.
    // Later: replace with club ticketing URLs per team.
    return `https://www.google.com/search?q=${enc(`${home} official tickets`)}`;
  }, [home]);

  const googleTicketsUrl = useMemo(() => {
    return `https://www.google.com/search?q=${enc(`${home} vs ${away} tickets`)}`;
  }, [home, away]);

  /* ------------------------------------------------------------------ */
  /* HANDLERS */
  /* ------------------------------------------------------------------ */

  const openTickets = useCallback(
    async (provider: string, url: string) => {
      try {
        // Only save to Wallet if we have a real trip context.
        if (tripId) {
          await saveTicketToTrip(provider, url);
        }
        await safeOpenUrl(url);
      } catch {
        Alert.alert("Couldn’t open tickets");
      }
    },
    [tripId, saveTicketToTrip]
  );

  const onTicketsNoTripNudge = useCallback(() => {
    if (tripId) return;
    Alert.alert(
      "Build a trip to save tickets",
      "If you build a trip first, ticket links will be saved into your Trip Workspace + Wallet as Pending bookings.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Build trip", style: "default", onPress: onPrimaryCta },
      ]
    );
  }, [tripId, onPrimaryCta]);

  /* ------------------------------------------------------------------ */
  /* RENDER */
  /* ------------------------------------------------------------------ */

  const headerTitle = tripId ? "Tickets + logistics" : "Match";
  const primaryCtaLabel = tripId ? "Back to trip" : "Build trip";

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
      <Stack.Screen options={{ headerShown: true, title: headerTitle, headerTransparent: true, headerTintColor: theme.colors.text }} />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: 100,
            paddingBottom: 80 + insets.bottom,
            paddingHorizontal: theme.spacing.lg,
            gap: theme.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <GlassCard style={styles.card}>
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading match…</Text>
              </View>
            ) : !row ? (
              <EmptyState title="Match not found" message="Unable to load match." />
            ) : (
              <>
                {/* Top header */}
                <Text style={styles.kicker}>{tripId ? "MATCH (FROM TRIP)" : "MATCH"}</Text>

                <View style={styles.headerRow}>
                  <TeamCrest name={home} logo={homeLogo} />

                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={styles.title} numberOfLines={2}>
                      {home} vs {away}
                    </Text>
                    <View style={styles.badgeWrap}>
                      <FixtureCertaintyBadge state={certainty} />
                    </View>
                  </View>

                  <TeamCrest name={away} logo={awayLogo} />
                </View>

                <Text style={styles.meta}>Kickoff: {kickoffDisplay ?? "TBC"}</Text>
                <Text style={styles.meta}>
                  Venue: {stadiumName || "—"}
                  {stadiumCity ? ` • ${stadiumCity}` : ""}
                </Text>

                {/* Primary CTA */}
                <Pressable style={styles.primaryCta} onPress={onPrimaryCta}>
                  <Text style={styles.primaryCtaText}>{primaryCtaLabel}</Text>
                </Pressable>

                {/* Logistics (collapsed by default) */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Matchday logistics</Text>

                    <Pressable onPress={() => setShowFullLogistics((v) => !v)} style={styles.linkBtn}>
                      <Text style={styles.linkBtnText}>{showFullLogistics ? "Hide" : "Show"}</Text>
                    </Pressable>
                  </View>

                  {!showFullLogistics ? (
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryText}>{logisticsSummary}</Text>

                      <Pressable onPress={() => safeOpenUrl(mapsUrl)} style={styles.inlineBtn}>
                        <Text style={styles.inlineBtnText}>Stadium in Maps</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <MatchdayLogisticsCard
                        logistics={logistics}
                        city={stadiumCity}
                        onOpenStop={async (q) =>
                          safeOpenUrl(`https://www.google.com/maps/search/?api=1&query=${enc(q)}`)
                        }
                        onSelectStayArea={() => {}}
                      />

                      <Pressable onPress={() => safeOpenUrl(mapsUrl)} style={styles.secondaryBtn}>
                        <Text style={styles.btnText}>Stadium in Maps</Text>
                      </Pressable>
                    </>
                  )}
                </View>

                {/* Tickets */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tickets</Text>

                  {!tripId ? (
                    <Pressable onPress={onTicketsNoTripNudge} style={styles.noticeBox}>
                      <Text style={styles.noticeTitle}>Tip: build a trip to save tickets</Text>
                      <Text style={styles.noticeText}>
                        Without a trip, ticket links can’t be stored in Wallet. Tap to build one now.
                      </Text>
                    </Pressable>
                  ) : null}

                  <View style={styles.ticketGrid}>
                    <Pressable style={styles.ticketBtn} onPress={() => openTickets("sportsevents365", se365PrimaryUrl)}>
                      <Text style={styles.ticketBtnText}>Tickets</Text>
                      <Text style={styles.ticketBtnSub}>Sportsevents365</Text>
                    </Pressable>

                    <Pressable style={styles.ticketBtn} onPress={() => openTickets("official", officialHomeTicketsUrl)}>
                      <Text style={styles.ticketBtnText}>Official club</Text>
                      <Text style={styles.ticketBtnSub}>Search</Text>
                    </Pressable>

                    <Pressable style={styles.ticketBtn} onPress={() => openTickets("google", googleTicketsUrl)}>
                      <Text style={styles.ticketBtnText}>Search tickets</Text>
                      <Text style={styles.ticketBtnSub}>Google</Text>
                    </Pressable>

                    <Pressable style={styles.ticketBtn} onPress={() => safeOpenUrl(mapsUrl)}>
                      <Text style={styles.ticketBtnText}>Directions</Text>
                      <Text style={styles.ticketBtnSub}>Google Maps</Text>
                    </Pressable>
                  </View>

                  {tripId ? (
                    <Text style={styles.smallHint}>
                      Ticket links you open from here are saved into your Trip Workspace as <Text style={{ fontWeight: "900" }}>Pending</Text>.
                    </Text>
                  ) : (
                    <Text style={styles.smallHint}>
                      You can browse tickets now — build a trip if you want Wallet tracking.
                    </Text>
                  )}
                </View>
              </>
            )}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* styles */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  card: { padding: theme.spacing.lg },

  loadingWrap: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 10,
  },

  muted: { color: theme.colors.textSecondary, fontWeight: "800" },

  kicker: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: theme.fontSize.xs,
    marginBottom: 10,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  title: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 18,
    textAlign: "center",
  },

  meta: {
    color: theme.colors.textSecondary,
    marginTop: 8,
    fontWeight: "800",
  },

  badgeWrap: {
    marginTop: 8,
    alignItems: "center",
  },

  crestWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  crestImg: { width: 28, height: 28 },
  crestFallback: { color: theme.colors.textSecondary, fontWeight: "900" },

  primaryCta: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryCtaText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  section: { marginTop: 16 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  linkBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.14)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  linkBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  summaryBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  summaryText: {
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  inlineBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.14)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inlineBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  ticketGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  ticketBtn: {
    width: "48%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  ticketBtnText: { color: theme.colors.text, fontWeight: "900" },
  ticketBtnSub: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
  },

  secondaryBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  btnText: { color: theme.colors.text, fontWeight: "900" },

  noticeBox: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,200,80,0.28)",
    backgroundColor: "rgba(255,200,80,0.08)",
    borderRadius: 14,
    padding: 12,
  },
  noticeTitle: { color: theme.colors.text, fontWeight: "900" },
  noticeText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontWeight: "800",
    fontSize: 12,
    lineHeight: 16,
  },

  smallHint: {
    marginTop: 10,
    color: theme.colors.textTertiary,
    fontWeight: "900",
    fontSize: 11,
    lineHeight: 14,
  },
});
