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
        const isLigue1 = String(league.name ?? "").toLowerCase().includes("ligue 1");

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
            <View
              style={[
                styles.leagueLogoDisc,
                active && styles.leagueLogoDiscActive,
                isLigue1 && styles.leagueLogoDiscLight,
              ]}
            >
              <Image
                source={{ uri: league.logo }}
                style={styles.leagueStripLogo}
                resizeMode="contain"
              />
            </View>
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

export default function UpcomingMatches(props: Props) {
  const {
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
    goMatch,
  } = props;

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
          style={({ pressed }) => [styles.miniPill, pressed && styles.pressedLite]}
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
            <View style={styles.loadingWrap}>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading fixtures…</Text>
            </View>
          ) : null}

          {!fxLoading && fxError ? (
            <View style={styles.errorWrap}>
              <EmptyState title="Fixtures unavailable" message={fxError} />
            </View>
          ) : null}

          {!fxLoading && !fxError && !featured ? (
            <View style={styles.errorWrap}>
              <EmptyState title="No fixtures found" message="Try another league." />
            </View>
          ) : null}

          {!fxLoading && !fxError && featured ? (
            <>
              <Text style={styles.blockKicker}>Featured pick</Text>

              <Pressable
                onPress={() => goMatch(String(featured.fixture.id))}
                style={({ pressed }) => [styles.featured, pressed && styles.pressedRow]}
                android_ripple={{ color: "rgba(87,162,56,0.08)" }}
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
                    <Text style={styles.featuredMeta} numberOfLines={2} ellipsizeMode="tail">
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

                        <Text style={styles.rowChevron}>›</Text>
                      </View>

                      <Text style={styles.listMeta} numberOfLines={1} ellipsizeMode="tail">
                        {line.meta}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },

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
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
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
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  leagueStripItemActive: {
    borderColor: "rgba(87,162,56,0.26)",
    backgroundColor: Platform.OS === "android" ? "rgba(87,162,56,0.08)" : "rgba(87,162,56,0.06)",
  },

  leagueLogoDisc: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },

  leagueLogoDiscActive: {
    backgroundColor: "#FFFFFF",
  },

  leagueLogoDiscLight: {
    backgroundColor: "#FFFFFF",
  },

  leagueStripLogo: {
    width: 28,
    height: 28,
    opacity: 0.98,
  },

  pressedPill: {
    opacity: 0.92,
  },

  block: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  blockInner: {
    padding: 14,
    gap: 12,
