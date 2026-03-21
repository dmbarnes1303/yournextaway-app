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
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionEyebrow}>Live planning</Text>
          <Text style={styles.sectionTitle}>Upcoming matches</Text>
        </View>

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
              <EmptyState
                title="Fixtures unavailable"
                message={fxError}
              />
            </View>
          ) : null}

          {!fxLoading && !fxError && !featured ? (
            <View style={styles.errorWrap}>
              <EmptyState title="No fixtures found" message="Try another league." />
            </View>
          ) : null}

          {!fxLoading && !fxError && featured ? (
            <>
              <View style={styles.blockTopRow}>
                <Text style={styles.blockKicker}>Featured match</Text>
                <View style={styles.blockHintPill}>
                  <Text style={styles.blockHintPillText}>Best near-term option</Text>
                </View>
              </View>

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
                <View style={styles.featuredGradientFade} />

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

                  <View style={styles.featuredChevronWrap}>
                    <Text style={styles.chev}>›</Text>
                  </View>
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
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },

  sectionTitleWrap: {
    gap: 2,
  },

  sectionEyebrow: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: theme.fontWeight.black,
  },

  miniPill: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.20)" : "rgba(255,255,255,0.04)",
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
    width: 66,
    height: 66,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  leagueStripItemActive: {
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: Platform.OS === "android" ? "rgba(87,162,56,0.08)" : "rgba(87,162,56,0.06)",
    shadowColor: "#00D26A",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  leagueLogoDisc: {
    width: 42,
    height: 42,
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
    width: 29,
    height: 29,
    opacity: 0.98,
  },

  pressedPill: {
    opacity: 0.92,
  },

  block: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(8,11,14,0.72)",
  },

  blockInner: {
    padding: 14,
    gap: 12,
  },

  blockTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  blockKicker: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },

  blockHintPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  blockHintPillText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  loadingWrap: {
    minHeight: 132,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  muted: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  errorWrap: {
    minHeight: 152,
    justifyContent: "center",
  },

  featured: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: Platform.OS === "android" ? "rgba(12,14,16,0.22)" : "rgba(12,14,16,0.18)",
    overflow: "hidden",
    position: "relative",
    minHeight: 124,
  },

  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  featuredImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,10,12,0.54)",
  },

  featuredGradientFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,10,12,0.14)",
  },

  featuredTop: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  featuredTextWrap: {
    flex: 1,
  },

  featuredTitle: {
    color: theme.colors.text,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: theme.fontWeight.black,
  },

  featuredMeta: {
    marginTop: 5,
    color: "rgba(242,244,246,0.86)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  crestWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestImg: {
    width: 31,
    height: 31,
    opacity: 0.96,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  featuredChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  chev: {
    color: theme.colors.textTertiary,
    fontSize: 20,
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
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: Platform.OS === "android" ? "rgba(10,12,14,0.16)" : "rgba(10,12,14,0.12)",
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
    backgroundColor: "rgba(255,255,255,0.08)",
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

  rowChevron: {
    color: theme.colors.textTertiary,
    fontSize: 18,
    marginTop: -1,
  },

  listMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  pressedRow: {
    opacity: 0.94,
  },

  pressedLite: {
    opacity: 0.9,
  },
});
