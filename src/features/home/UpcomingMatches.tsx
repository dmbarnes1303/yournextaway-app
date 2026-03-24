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
            {active ? <View style={styles.leagueActiveGlow} pointerEvents="none" /> : null}
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
          style={({ pressed }) => [styles.headerAction, pressed && styles.pressedLite]}
          hitSlop={10}
        >
          <Text style={styles.headerActionText}>View all ›</Text>
        </Pressable>
      </View>

      <LeagueStrip
        leagues={homeTopLeagues}
        activeLeagueId={league.leagueId}
        onSelect={setLeague}
      />

      <View style={styles.panel}>
        {fxLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={theme.colors.textSecondary} />
            <Text style={styles.stateText}>Loading fixtures…</Text>
          </View>
        ) : null}

        {!fxLoading && fxError ? (
          <View style={styles.stateCard}>
            <View style={styles.stateBadge}>
              <Text style={styles.stateBadgeText}>Live data</Text>
            </View>
            <EmptyState
              title="Fixtures unavailable"
              message={fxError}
            />
          </View>
        ) : null}

        {!fxLoading && !fxError && !featured ? (
          <View style={styles.stateCard}>
            <EmptyState title="No fixtures found" message="Try another league." />
          </View>
        ) : null}

        {!fxLoading && !fxError && featured ? (
          <>
            <View style={styles.panelTopRow}>
              <Text style={styles.panelTag}>Top match pick</Text>
              <Text style={styles.panelHint}>Best near-term option</Text>
            </View>

            <Pressable
              onPress={() => goMatch(String(featured.fixture.id))}
              style={({ pressed }) => [styles.featuredCard, pressed && styles.pressedCard]}
              android_ripple={{ color: "rgba(87,162,56,0.08)" }}
            >
              <Image
                source={{ uri: featuredCityImage }}
                style={styles.featuredImage}
                resizeMode="cover"
              />
              <View style={styles.featuredImageOverlay} pointerEvents="none" />
              <View style={styles.featuredBottomFade} pointerEvents="none" />
              <View style={styles.featuredGlow} pointerEvents="none" />

              <View style={styles.featuredInner}>
                <View style={styles.featuredTopRow}>
                  <CrestSquare row={featured} />

                  <View style={styles.featuredPills}>
                    <View style={styles.featuredPillPrimary}>
                      <Text style={styles.featuredPillPrimaryText}>
                        {String(featured?.league?.name ?? "Featured").trim()}
                      </Text>
                    </View>
                    <View style={styles.featuredPillSecondary}>
                      <Text style={styles.featuredPillSecondaryText}>Trip-ready</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.featuredTextWrap}>
                  <Text style={styles.featuredTitle} numberOfLines={2} ellipsizeMode="tail">
                    {fixtureLine(featured).title}
                  </Text>
                  <Text style={styles.featuredMeta} numberOfLines={2} ellipsizeMode="tail">
                    {fixtureLine(featured).meta}
                  </Text>
                </View>

                <View style={styles.featuredFooter}>
                  <View style={styles.featuredCta}>
                    <Text style={styles.featuredCtaText}>Open match</Text>
                  </View>

                  <Text style={styles.featuredFooterLink}>Plan around this ›</Text>
                </View>
              </View>
            </Pressable>

            {list.length > 0 ? (
              <View style={styles.listWrap}>
                <Text style={styles.listLabel}>More this week</Text>

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
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: theme.fontWeight.black,
  },

  headerAction: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },

  headerActionText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
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
    backgroundColor:
      Platform.OS === "android" ? "rgba(8,11,14,0.46)" : "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  leagueStripItemActive: {
    backgroundColor:
      Platform.OS === "android" ? "rgba(17,36,24,0.76)" : "rgba(18,103,49,0.10)",
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

  leagueActiveGlow: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: -10,
    height: 26,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.18)",
  },

  panel: {
    gap: 12,
  },

  panelTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  panelTag: {
    color: "#8EF2A5",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  panelHint: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  stateCard: {
    minHeight: 176,
    borderRadius: 26,
    backgroundColor:
      Platform.OS === "android" ? "rgba(9,12,14,0.52)" : "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  stateBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(245,204,87,0.10)",
    borderWidth: 1,
    borderColor: "rgba(245,204,87,0.16)",
  },

  stateBadgeText: {
    color: "#F5CC57",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  stateText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  featuredCard: {
    minHeight: 198,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0A0F12",
  },

  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  featuredImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6,10,12,0.40)",
  },

  featuredBottomFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,7,9,0.26)",
  },

  featuredGlow: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: -14,
    height: 70,
    borderRadius: 999,
    backgroundColor: "rgba(0,210,106,0.10)",
  },

  featuredInner: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },

  featuredTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  featuredPills: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
  },

  featuredPillPrimary: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(245,204,87,0.10)",
    borderWidth: 1,
    borderColor: "rgba(245,204,87,0.18)",
  },

  featuredPillPrimaryText: {
    color: "#F5CC57",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  featuredPillSecondary: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  featuredPillSecondaryText: {
    color: "rgba(255,255,255,0.90)",
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
  },

  featuredTextWrap: {
    gap: 6,
  },

  featuredTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: theme.fontWeight.black,
    maxWidth: "92%",
  },

  featuredMeta: {
    color: "rgba(242,244,246,0.86)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
    maxWidth: "94%",
  },

  featuredFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  featuredCta: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(18,103,49,0.28)",
    borderWidth: 1,
    borderColor: "rgba(104,241,138,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  featuredCtaText: {
    color: "#8EF2A5",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  featuredFooterLink: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  crestWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestImg: {
    width: 32,
    height: 32,
    opacity: 0.96,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  listWrap: {
    gap: 10,
  },

  listLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },

  list: {
    gap: 8,
  },

  listRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor:
      Platform.OS === "android" ? "rgba(8,11,14,0.44)" : "rgba(255,255,255,0.04)",
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
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
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
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  pressedRow: {
    opacity: 0.94,
  },

  pressedCard: {
    opacity: 0.97,
    transform: [{ scale: 0.995 }],
  },

  pressedPill: {
    opacity: 0.92,
  },

  pressedLite: {
    opacity: 0.9,
  },
});
