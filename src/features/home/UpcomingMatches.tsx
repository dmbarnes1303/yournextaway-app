import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";

import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { theme } from "@/src/constants/theme";
import type { FixtureListRow } from "@/src/services/apiFootball";
import type { LeagueOption } from "@/src/constants/football";

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function CrestSquare({ row }: { row: FixtureListRow }) {
  const homeName = row?.teams?.home?.name ?? "";
  const logo = row?.teams?.home?.logo;

  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(homeName)}</Text>
      )}
    </View>
  );
}

function LeagueStrip({
  leagues,
  activeLeagueId,
  onSelect,
}: {
  leagues: LeagueOption[];
  activeLeagueId: number;
  onSelect: (league: LeagueOption) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.leagueStripRow}
    >
      {leagues.map((league) => {
        const active = league.leagueId === activeLeagueId;

        return (
          <Pressable
            key={league.leagueId}
            onPress={() => onSelect(league)}
            style={({ pressed }) => [
              styles.leagueStripItem,
              active && styles.leagueStripItemActive,
              pressed && styles.pressedPill,
            ]}
            android_ripple={{ color: "rgba(255,255,255,0.08)" }}
          >
            <Image source={{ uri: league.logo }} style={styles.leagueStripLogo} resizeMode="contain" />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

type Props = {
  homeTopLeagues: LeagueOption[];
  league: LeagueOption;
  setLeague: (league: LeagueOption) => void;
  upcomingWindow: { from: string; to: string };
  fxLoading: boolean;
  fxError: string | null;
  featured: FixtureListRow | null;
  list: FixtureListRow[];
  featuredCityImage: string;
  fixtureLine: (row: FixtureListRow) => { title: string; meta: string };
  goFixtures: (opts?: {
    window?: { from: string; to: string };
    leagueId?: number;
    season?: number;
    sort?: "rating" | "date";
    venue?: string;
  }) => void;
  goFixturesHub: () => void;
  goMatch: (fixtureId: string) => void;
};

export default function UpcomingMatches({
  homeTopLeagues,
  league,
  setLeague,
  upcomingWindow,
  fxLoading,
  fxError,
  featured,
  list,
  featuredCityImage,
  fixtureLine,
  goFixtures,
  goFixturesHub,
  goMatch,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming matches</Text>
        <Pressable
          onPress={() =>
            goFixtures({
              window: upcomingWindow,
              leagueId: league.leagueId,
              season: league.season,
            })
          }
          style={({ pressed }) => [styles.miniPill, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.miniPillText}>View all</Text>
        </Pressable>
      </View>

      <LeagueStrip
        leagues={homeTopLeagues}
        activeLeagueId={league.leagueId}
        onSelect={setLeague}
      />

      <GlassCard strength="default" style={styles.block} noPadding>
        <View style={styles.blockInner}>
          {fxLoading ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading fixtures…</Text>
            </View>
          ) : null}

          {!fxLoading && fxError ? (
            <EmptyState title="Fixtures unavailable" message={fxError} />
          ) : null}

          {!fxLoading && !fxError && !featured ? (
            <EmptyState title="No fixtures found" message="Try another league." />
          ) : null}

          {!fxLoading && !fxError && featured ? (
            <>
              <Text style={styles.blockKicker}>Snapshot</Text>

              <Pressable
                onPress={() => goMatch(String(featured.fixture.id))}
                style={({ pressed }) => [styles.featured, pressed && styles.pressedRow]}
                android_ripple={{ color: "rgba(79,224,138,0.08)" }}
              >
                <Image
                  source={{ uri: featuredCityImage }}
                  style={styles.featuredImage}
                  resizeMode="cover"
                />
                <View style={styles.featuredImageOverlay} />

                <View style={styles.featuredTop}>
                  <CrestSquare row={featured} />
                  <View style={styles.featuredTextWrap}>
                    <Text style={styles.featuredTitle} numberOfLines={1} ellipsizeMode="tail">
                      {fixtureLine(featured).title}
                    </Text>
                    <Text style={styles.featuredMeta} numberOfLines={1} ellipsizeMode="tail">
                      {fixtureLine(featured).meta}
                    </Text>
                  </View>
                  <Text style={styles.chev}>›</Text>
                </View>
              </Pressable>

              {list.length > 0 ? <View style={styles.divider} /> : null}

              <View style={styles.list}>
                {list.map((r, idx) => {
                  const id = r?.fixture?.id ? String(r.fixture.id) : null;
                  const line = fixtureLine(r);
                  const homeLogo = r?.teams?.home?.logo;
                  const awayLogo = r?.teams?.away?.logo;

                  return (
                    <Pressable
                      key={id ?? `l-${idx}`}
                      onPress={() => (id ? goMatch(id) : null)}
                      disabled={!id}
                      style={({ pressed }) => [styles.listRow, pressed && styles.pressedRow]}
                      android_ripple={{ color: "rgba(255,255,255,0.06)" }}
                    >
                      <View style={styles.listRowTop}>
                        <View style={styles.smallCrests}>
                          <View style={styles.smallCrest}>
                            {homeLogo ? (
                              <Image
                                source={{ uri: homeLogo }}
                                style={styles.smallCrestImg}
                                resizeMode="contain"
                              />
                            ) : null}
                          </View>
                          <View style={styles.smallCrest}>
                            {awayLogo ? (
                              <Image
                                source={{ uri: awayLogo }}
                                style={styles.smallCrestImg}
                                resizeMode="contain"
                              />
                            ) : null}
                          </View>
                        </View>

                        <Text style={styles.listTitle} numberOfLines={1} ellipsizeMode="tail">
                          {line.title}
                        </Text>
                      </View>

                      <Text style={styles.listMeta} numberOfLines={1} ellipsizeMode="tail">
                        {line.meta}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={goFixturesHub}
                style={({ pressed }) => [styles.primaryCta, pressed && styles.pressed]}
                android_ripple={{ color: "rgba(79,224,138,0.10)" }}
              >
                <Text style={styles.primaryCtaText}>Browse Fixtures</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  miniPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },

  miniPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  leagueStripRow: {
    gap: 12,
    paddingRight: theme.spacing.lg,
    marginTop: 2,
  },

  leagueStripItem: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  leagueStripItemActive: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },

  leagueStripLogo: {
    width: 34,
    height: 34,
    opacity: 0.98,
  },

  pressedPill: {
    opacity: 0.92,
  },

  block: {
    borderRadius: 24,
  },

  blockInner: {
    padding: 14,
    gap: 12,
  },

  blockKicker: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  center: {
    paddingVertical: 14,
    alignItems: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  featured: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(12,14,16,0.22)" : "rgba(12,14,16,0.18)",
    overflow: "hidden",
    position: "relative",
    minHeight: 92,
  },

  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  featuredImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,8,10,0.58)",
  },

  featuredTop: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  featuredTextWrap: {
    flex: 1,
  },

  featuredTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: theme.fontWeight.black,
  },

  featuredMeta: {
    marginTop: 4,
    color: "rgba(242,244,246,0.84)",
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  crestWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestImg: {
    width: 28,
    height: 28,
    opacity: 0.95,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  chev: {
    color: theme.colors.textTertiary,
    fontSize: 22,
    marginTop: -2,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 2,
  },

  list: {
    gap: 8,
  },

  listRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor:
      Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  listRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  smallCrests: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },

  smallCrest: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  smallCrestImg: {
    width: 14,
    height: 14,
    opacity: 0.95,
  },

  listTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  listMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  primaryCta: {
    marginTop: 2,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
    borderColor: "rgba(79,224,138,0.24)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },

  primaryCtaText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },

  pressedRow: {
    opacity: 0.94,
  },
});
