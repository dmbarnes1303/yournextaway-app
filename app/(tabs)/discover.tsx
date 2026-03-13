import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import {
  LEAGUES,
  nextWeekendWindowIso,
  windowFromTomorrowIso,
} from "@/src/constants/football";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

type ShortcutWindow = { from: string; to: string };
type DiscoverWindowKey = "wknd" | "d7" | "d14" | "d30";
type DiscoverTripLength = "day" | "1" | "2" | "3";
type DiscoverVibe = "easy" | "big" | "hidden" | "nightlife" | "culture" | "warm";

type DiscoverCategory =
  | "bigMatches"
  | "derbies"
  | "atmospheres"
  | "valueTrips"
  | "legendaryStadiums"
  | "iconicCities"
  | "perfectTrips"
  | "nightMatches"
  | "titleDrama"
  | "easyTickets"
  | "bucketList"
  | "matchdayCulture"
  | "underratedTrips";

const DISCOVER_ROWS: DiscoverCategory[][] = [
  ["bigMatches", "derbies", "atmospheres", "valueTrips"],
  ["legendaryStadiums", "iconicCities", "perfectTrips", "nightMatches"],
  ["titleDrama", "easyTickets", "bucketList", "matchdayCulture"],
  ["underratedTrips"],
];

const DISCOVER_CATEGORY_META: Record<
  DiscoverCategory,
  {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    emphasis?: "primary" | "neutral";
  }
> = {
  bigMatches: {
    title: "Big Matches",
    subtitle: "High-profile fixtures worth travelling for",
    icon: "star-outline",
    emphasis: "primary",
  },
  derbies: {
    title: "Derbies & Rivalries",
    subtitle: "Tension, history, noise, chaos",
    icon: "flame-outline",
    emphasis: "primary",
  },
  atmospheres: {
    title: "Insane Atmospheres",
    subtitle: "Best noise, intensity and matchday energy",
    icon: "radio-outline",
    emphasis: "primary",
  },
  valueTrips: {
    title: "Best Value Football Trips",
    subtitle: "Better experience-per-pound potential",
    icon: "cash-outline",
  },
  legendaryStadiums: {
    title: "Legendary Stadiums",
    subtitle: "Grounds with weight, history and pull",
    icon: "business-outline",
  },
  iconicCities: {
    title: "Iconic Football Cities",
    subtitle: "Trips where the city matters as much as the match",
    icon: "earth-outline",
  },
  perfectTrips: {
    title: "Perfect Football Trips",
    subtitle: "Strong fixture plus solid travel potential",
    icon: "navigate-outline",
  },
  nightMatches: {
    title: "Night Matches",
    subtitle: "Evening kickoffs with better match feel",
    icon: "moon-outline",
  },
  titleDrama: {
    title: "Title Race Drama",
    subtitle: "Fixtures with sharper end-of-season stakes",
    icon: "trophy-outline",
  },
  easyTickets: {
    title: "Easy Ticket Matches",
    subtitle: "Better chance of accessible home tickets",
    icon: "ticket-outline",
  },
  bucketList: {
    title: "Football Bucket List",
    subtitle: "Trips people should do at least once",
    icon: "bookmark-outline",
  },
  matchdayCulture: {
    title: "Best Matchday Culture",
    subtitle: "Beyond the 90 minutes",
    icon: "people-outline",
  },
  underratedTrips: {
    title: "Underrated Trips",
    subtitle: "Less obvious, more interesting",
    icon: "sparkles-outline",
  },
};

function toKey(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function labelForKey(key: DiscoverWindowKey) {
  if (key === "wknd") return "This Weekend";
  if (key === "d7") return "Next 7 Days";
  if (key === "d14") return "Next 14 Days";
  return "Next 30 Days";
}

function labelForTripLength(v: DiscoverTripLength) {
  if (v === "day") return "Day Trip";
  if (v === "1") return "1 Night";
  if (v === "2") return "2 Nights";
  return "3 Nights";
}

function labelForVibe(v: DiscoverVibe) {
  if (v === "easy") return "Easy Travel";
  if (v === "big") return "Big Match";
  if (v === "hidden") return "Different";
  if (v === "nightlife") return "Nightlife";
  if (v === "culture") return "Culture";
  return "Warm-ish";
}

function windowForKey(key: DiscoverWindowKey): ShortcutWindow {
  if (key === "wknd") return nextWeekendWindowIso();
  if (key === "d7") return windowFromTomorrowIso(7);
  if (key === "d14") return windowFromTomorrowIso(14);
  return windowFromTomorrowIso(30);
}

function pickRandom<T>(arr: T[]): T | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)] ?? null;
}

async function pickFixtureFromLeagues(
  window: ShortcutWindow,
  filter: (r: FixtureListRow) => boolean
) {
  const tried = new Set<number>();

  for (let attempt = 0; attempt < 5; attempt++) {
    const remaining = LEAGUES.filter((l) => !tried.has(l.leagueId));
    const next = pickRandom(remaining.length ? remaining : LEAGUES);
    if (!next) break;

    tried.add(next.leagueId);

    const res = await getFixtures({
      league: next.leagueId,
      season: next.season,
      from: window.from,
      to: window.to,
    });

    const list = Array.isArray(res) ? res : [];
    const valid = list.filter((r) => r?.fixture?.id != null).filter(filter);

    if (valid.length > 0) {
      const chosen = pickRandom(valid);
      const fixtureId = chosen?.fixture?.id != null ? String(chosen.fixture.id) : null;
      if (fixtureId) {
        return { fixtureId, leagueId: next.leagueId, season: next.season };
      }
    }
  }

  return null;
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [discoverWindowKey, setDiscoverWindowKey] = useState<DiscoverWindowKey>("wknd");
  const [discoverTripLength, setDiscoverTripLength] = useState<DiscoverTripLength>("2");
  const [discoverVibes, setDiscoverVibes] = useState<DiscoverVibe[]>(["easy"]);
  const [discoverFrom, setDiscoverFrom] = useState("");
  const [loadingMode, setLoadingMode] = useState<"surprise" | "hidden" | null>(null);

  const toggleVibe = useCallback((v: DiscoverVibe) => {
    setDiscoverVibes((prev) => {
      const has = prev.includes(v);
      const next = has ? prev.filter((x) => x !== v) : [...prev, v];
      if (next.length > 3) return next.slice(next.length - 3);
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setDiscoverWindowKey("wknd");
    setDiscoverTripLength("2");
    setDiscoverVibes(["easy"]);
    setDiscoverFrom("");
  }, []);

  const currentWindow = useMemo(
    () => windowForKey(discoverWindowKey),
    [discoverWindowKey]
  );

  const filterSummary = useMemo(() => {
    const parts = [
      labelForKey(discoverWindowKey),
      labelForTripLength(discoverTripLength),
      discoverVibes.length ? discoverVibes.map(labelForVibe).join(" • ") : "Any vibe",
    ];

    if (discoverFrom.trim()) parts.push(`From ${discoverFrom.trim()}`);

    return parts.join("  •  ");
  }, [discoverWindowKey, discoverTripLength, discoverVibes, discoverFrom]);

  const goFixturesCategory = useCallback(
    (category: DiscoverCategory) => {
      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: currentWindow.from,
          to: currentWindow.to,
          discover: category,
        },
      } as any);
    },
    [router, currentWindow.from, currentWindow.to]
  );

  const goDiscover = useCallback(
    async (mode: "surprise" | "hidden") => {
      if (loadingMode) return;
      setLoadingMode(mode);

      try {
        const window = windowForKey(discoverWindowKey);

        const filter = (r: FixtureListRow) => {
          const venue = String(r?.fixture?.venue?.name ?? "").trim();
          const city = toKey(String(r?.fixture?.venue?.city ?? ""));
          if (!venue) return false;

          if (mode === "hidden") {
            const blocked = new Set([
              "london",
              "paris",
              "rome",
              "barcelona",
              "amsterdam",
              "lisbon",
            ]);
            if (!city || blocked.has(city)) return false;
          }

          return true;
        };

        const picked = await pickFixtureFromLeagues(window, filter);
        if (!picked) return;

        router.push({
          pathname: "/trip/build",
          params: {
            global: "1",
            fixtureId: picked.fixtureId,
            leagueId: String(picked.leagueId),
            season: String(picked.season),
            from: window.from,
            to: window.to,
            prefMode: mode,
            prefFrom: discoverFrom.trim() ? discoverFrom.trim() : undefined,
            prefWindow: discoverWindowKey,
            prefLength: discoverTripLength,
            prefVibes: discoverVibes.join(","),
          },
        } as any);
      } finally {
        setLoadingMode(null);
      }
    },
    [loadingMode, discoverWindowKey, discoverFrom, discoverTripLength, discoverVibes, router]
  );

  return (
    <Background imageSource={getBackground("home")} overlayOpacity={0.68}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.kicker}>DISCOVER</Text>
              <Text style={styles.title}>Find football trips worth taking</Text>
              <Text style={styles.sub}>
                Use Discover when you do not know exactly where to go yet. Start with themes,
                tighten the filters, then jump straight into Fixtures or Build Trip.
              </Text>

              <View style={styles.heroSummaryBox}>
                <Text style={styles.heroSummaryLabel}>Current discovery setup</Text>
                <Text style={styles.heroSummaryText}>{filterSummary}</Text>
              </View>
            </View>
          </GlassCard>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick discovery</Text>
              <Pressable onPress={resetFilters} style={styles.resetPill}>
                <Text style={styles.resetPillText}>Reset</Text>
              </Pressable>
            </View>

            <View style={styles.grid2}>
              <Pressable
                onPress={() => goDiscover("surprise")}
                disabled={loadingMode !== null}
                style={({ pressed }) => [
                  styles.tilePress,
                  (pressed || loadingMode === "surprise") && styles.pressed,
                ]}
              >
                <GlassCard strength="default" style={styles.tile} noPadding>
                  <View style={styles.tileInner}>
                    <View style={styles.tileTop}>
                      <Text style={styles.tileTitle}>Surprise me</Text>
                      {loadingMode === "surprise" ? (
                        <ActivityIndicator />
                      ) : (
                        <Ionicons name="shuffle-outline" size={20} color={theme.colors.text} />
                      )}
                    </View>
                    <Text style={styles.tileSub}>
                      Throws you into a fitting trip using your current discovery setup.
                    </Text>
                    <Text style={styles.tileHint}>{filterSummary}</Text>
                  </View>
                </GlassCard>
              </Pressable>

              <Pressable
                onPress={() => goDiscover("hidden")}
                disabled={loadingMode !== null}
                style={({ pressed }) => [
                  styles.tilePress,
                  (pressed || loadingMode === "hidden") && styles.pressed,
                ]}
              >
                <GlassCard strength="default" style={styles.tile} noPadding>
                  <View style={styles.tileInner}>
                    <View style={styles.tileTop}>
                      <Text style={styles.tileTitle}>Hidden gems</Text>
                      {loadingMode === "hidden" ? (
                        <ActivityIndicator />
                      ) : (
                        <Ionicons name="diamond-outline" size={20} color={theme.colors.text} />
                      )}
                    </View>
                    <Text style={styles.tileSub}>
                      Filters out the obvious football cities and looks for something less lazy.
                    </Text>
                    <Text style={styles.tileHint}>Still heuristic-based, but directionally useful.</Text>
                  </View>
                </GlassCard>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discovery filters</Text>

            <GlassCard strength="default" style={styles.panel}>
              <Text style={styles.label}>Flying from (optional)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={discoverFrom}
                  onChangeText={setDiscoverFrom}
                  placeholder="e.g. London, LGW, MAN"
                  placeholderTextColor={theme.colors.textTertiary}
                  style={styles.input}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.label}>Date window</Text>
              <View style={styles.chipsRow}>
                {(["wknd", "d7", "d14", "d30"] as DiscoverWindowKey[]).map((k) => (
                  <FilterChip
                    key={k}
                    label={labelForKey(k)}
                    active={discoverWindowKey === k}
                    onPress={() => setDiscoverWindowKey(k)}
                  />
                ))}
              </View>

              <Text style={styles.label}>Trip length</Text>
              <View style={styles.chipsRow}>
                {(["day", "1", "2", "3"] as DiscoverTripLength[]).map((k) => (
                  <FilterChip
                    key={k}
                    label={labelForTripLength(k)}
                    active={discoverTripLength === k}
                    onPress={() => setDiscoverTripLength(k)}
                  />
                ))}
              </View>

              <Text style={styles.label}>Vibe (up to 3)</Text>
              <View style={styles.chipsRow}>
                {(["easy", "big", "hidden", "nightlife", "culture", "warm"] as DiscoverVibe[]).map((v) => (
                  <FilterChip
                    key={v}
                    label={labelForVibe(v)}
                    active={discoverVibes.includes(v)}
                    onPress={() => toggleVibe(v)}
                  />
                ))}
              </View>
            </GlassCard>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse by theme</Text>
            <Text style={styles.sectionSub}>
              These routes push you into Fixtures with a Discover context so the app can rank with intent rather than just dumping matches.
            </Text>

            <View style={styles.rows}>
              {DISCOVER_ROWS.map((row, rowIndex) => (
                <ScrollView
                  key={`row-${rowIndex}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rowScroll}
                >
                  {row.map((category) => {
                    const meta = DISCOVER_CATEGORY_META[category];
                    const primary = meta.emphasis === "primary";

                    return (
                      <Pressable
                        key={category}
                        onPress={() => goFixturesCategory(category)}
                        style={({ pressed }) => [styles.categoryPress, pressed && styles.pressed]}
                      >
                        <GlassCard
                          strength="default"
                          style={[
                            styles.categoryCard,
                            primary && styles.categoryCardPrimary,
                          ]}
                          noPadding
                        >
                          <View style={styles.categoryInner}>
                            <View
                              style={[
                                styles.categoryIconWrap,
                                primary && styles.categoryIconWrapPrimary,
                              ]}
                            >
                              <Ionicons
                                name={meta.icon}
                                size={18}
                                color={theme.colors.text}
                              />
                            </View>

                            <View style={styles.categoryTextWrap}>
                              <Text style={styles.categoryTitle}>{meta.title}</Text>
                              <Text style={styles.categorySubtitle}>{meta.subtitle}</Text>
                            </View>
                          </View>
                        </GlassCard>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ))}
            </View>
          </View>

          <GlassCard strength="default" style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to use Discover properly</Text>
            <Text style={styles.infoText}>
              Use Surprise Me when you want speed. Use Hidden Gems when you want something less obvious.
              Use the theme cards when you already know the kind of trip you want, but not the exact fixture.
            </Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: 18,
  },

  hero: {
    marginTop: theme.spacing.lg,
    borderRadius: 26,
  },
  heroInner: {
    padding: theme.spacing.lg,
    gap: 10,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
  },
  sub: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },

  heroSummaryBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    backgroundColor:
      Platform.OS === "android" ? "rgba(18,20,24,0.34)" : "rgba(18,20,24,0.28)",
    padding: 12,
    gap: 6,
  },
  heroSummaryLabel: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "900",
  },
  heroSummaryText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },

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
    fontWeight: "900",
  },
  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
  },

  resetPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor:
      Platform.OS === "android" ? "rgba(18,20,24,0.34)" : "rgba(18,20,24,0.28)",
  },
  resetPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "900",
  },

  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tilePress: {
    width: "48.5%",
    borderRadius: 18,
    overflow: "hidden",
  },
  tile: { borderRadius: 18 },
  tileInner: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 8,
    minHeight: 154,
  },
  tileTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tileTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  tileSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  tileHint: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },

  panel: {
    padding: 14,
    gap: 12,
  },
  label: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "900",
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
  },
  input: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(18,20,24,0.34)" : "rgba(18,20,24,0.28)",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  chipActive: {
    borderColor: "rgba(79,224,138,0.26)",
    backgroundColor:
      Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "900",
  },
  chipTextActive: {
    color: theme.colors.text,
  },

  rows: { gap: 10 },
  rowScroll: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },
  categoryPress: {
    width: 192,
    borderRadius: 18,
    overflow: "hidden",
  },
  categoryCard: {
    borderRadius: 18,
  },
  categoryCardPrimary: {
    borderColor: "rgba(79,224,138,0.18)",
  },
  categoryInner: {
    padding: 14,
    minHeight: 124,
    gap: 14,
    justifyContent: "space-between",
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  categoryIconWrapPrimary: {
    borderColor: "rgba(79,224,138,0.18)",
    backgroundColor: "rgba(79,224,138,0.08)",
  },
  categoryTextWrap: {
    gap: 6,
  },
  categoryTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },
  categorySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },

  infoCard: {
    padding: 14,
    marginBottom: 4,
  },
  infoTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },
  infoText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
