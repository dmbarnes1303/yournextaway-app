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
import {
  DISCOVER_PRIMARY_CATEGORIES,
  DISCOVER_SECONDARY_CATEGORIES,
  DISCOVER_CATEGORY_META,
  type DiscoverCategory,
} from "@/src/features/discover/discoverCategories";
import {
  buildDiscoverScores,
  type DiscoverTripLength,
  type DiscoverVibe,
} from "@/src/features/discover/discoverEngine";
import { discoverScoreForCategory } from "@/src/features/discover/discoverRanking";

type ShortcutWindow = { from: string; to: string };
type DiscoverWindowKey = "wknd" | "d7" | "d14" | "d30";

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

async function fetchDiscoverPool(window: ShortcutWindow, maxLeagues = 8) {
  const shuffled = [...LEAGUES].sort(() => Math.random() - 0.5).slice(0, maxLeagues);

  const batches = await Promise.all(
    shuffled.map(async (league) => {
      const res = await getFixtures({
        league: league.leagueId,
        season: league.season,
        from: window.from,
        to: window.to,
      });
      return Array.isArray(res) ? res : [];
    })
  );

  return batches.flat().filter((r) => r?.fixture?.id != null);
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

function categorySeedFromVibes(vibes: DiscoverVibe[]): DiscoverCategory {
  if (vibes.includes("big")) return "bigMatches";
  if (vibes.includes("nightlife")) return "nightMatches";
  if (vibes.includes("culture")) return "matchdayCulture";
  if (vibes.includes("warm")) return "iconicCities";
  if (vibes.includes("easy")) return "easyTickets";
  return "perfectTrips";
}

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [discoverWindowKey, setDiscoverWindowKey] = useState<DiscoverWindowKey>("wknd");
  const [discoverTripLength, setDiscoverTripLength] = useState<DiscoverTripLength>("2");
  const [discoverVibes, setDiscoverVibes] = useState<DiscoverVibe[]>(["easy"]);
  const [discoverFrom, setDiscoverFrom] = useState("");
  const [loadingRandom, setLoadingRandom] = useState(false);

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
          discoverFrom: discoverFrom.trim() || undefined,
          discoverTripLength,
          discoverVibes: discoverVibes.join(","),
        },
      } as any);
    },
    [
      router,
      currentWindow.from,
      currentWindow.to,
      discoverFrom,
      discoverTripLength,
      discoverVibes,
    ]
  );

  const goRandomTrip = useCallback(async () => {
    if (loadingRandom) return;
    setLoadingRandom(true);

    try {
      const window = windowForKey(discoverWindowKey);
      const pool = await fetchDiscoverPool(window, 8);

      const valid = pool.filter((r: FixtureListRow) => {
        const venue = String(r?.fixture?.venue?.name ?? "").trim();
        return !!venue;
      });

      if (!valid.length) return;

      const scored = buildDiscoverScores(valid);
      const seededCategory = categorySeedFromVibes(discoverVibes);

      const ranked = scored
        .map((item) => ({
          item,
          score: discoverScoreForCategory(seededCategory, item, {
            origin: discoverFrom.trim() || null,
            tripLength: discoverTripLength,
            vibes: discoverVibes,
          }),
        }))
        .sort((a, b) => b.score - a.score);

      const poolTop = ranked.slice(0, Math.min(12, ranked.length));
      const chosen = pickRandom(poolTop);
      const fixture = chosen?.item?.fixture ?? null;

      const fixtureId =
        fixture?.fixture?.id != null ? String(fixture.fixture.id) : null;
      const leagueId =
        fixture?.league?.id != null ? String(fixture.league.id) : null;
      const season =
        (fixture as any)?.league?.season != null
          ? String((fixture as any).league.season)
          : null;

      if (!fixtureId) return;

      router.push({
        pathname: "/trip/build",
        params: {
          global: "1",
          fixtureId,
          ...(leagueId ? { leagueId } : {}),
          ...(season ? { season } : {}),
          from: window.from,
          to: window.to,
          prefMode: "random",
          prefFrom: discoverFrom.trim() ? discoverFrom.trim() : undefined,
          prefWindow: discoverWindowKey,
          prefLength: discoverTripLength,
          prefVibes: discoverVibes.join(","),
        },
      } as any);
    } finally {
      setLoadingRandom(false);
    }
  }, [
    loadingRandom,
    discoverWindowKey,
    discoverFrom,
    discoverTripLength,
    discoverVibes,
    router,
  ]);

  const renderCategoryCard = useCallback(
    (category: DiscoverCategory, compact = false) => {
      const meta = DISCOVER_CATEGORY_META[category];
      const primary = meta.emphasis === "primary";

      return (
        <Pressable
          key={category}
          onPress={() => goFixturesCategory(category)}
          style={({ pressed }) => [
            compact ? styles.categoryPressCompact : styles.categoryPress,
            pressed && styles.pressed,
          ]}
        >
          <GlassCard
            strength="default"
            style={[
              styles.categoryCard,
              primary && styles.categoryCardPrimary,
              compact && styles.categoryCardCompact,
            ]}
            noPadding
          >
            <View style={[styles.categoryInner, compact && styles.categoryInnerCompact]}>
              <View
                style={[
                  styles.categoryIconWrap,
                  primary && styles.categoryIconWrapPrimary,
                ]}
              >
                <Ionicons name={meta.icon} size={18} color={theme.colors.text} />
              </View>

              <View style={styles.categoryTextWrap}>
                <Text style={styles.categoryTitle}>{meta.title}</Text>
                <Text style={styles.categorySubtitle}>{meta.subtitle}</Text>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      );
    },
    [goFixturesCategory]
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
                Start with a trip type, shape it with filters, then jump into Fixtures with a
                Discover context instead of a flat match list.
              </Text>

              <View style={styles.heroSummaryBox}>
                <Text style={styles.heroSummaryLabel}>Current discovery setup</Text>
                <Text style={styles.heroSummaryText}>{filterSummary}</Text>
              </View>
            </View>
          </GlassCard>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Discovery filters</Text>
              <Pressable onPress={resetFilters} style={styles.resetPill}>
                <Text style={styles.resetPillText}>Reset</Text>
              </Pressable>
            </View>

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
                {(["easy", "big", "nightlife", "culture", "warm"] as DiscoverVibe[]).map((v) => (
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
            <Text style={styles.sectionTitle}>Start with the strongest routes</Text>
            <Text style={styles.sectionSub}>
              These are the main Discover entry points. They should feel like deliberate trip types,
              not a messy category dump.
            </Text>

            <View style={styles.primaryGrid}>
              {DISCOVER_PRIMARY_CATEGORIES.map((category) => renderCategoryCard(category, false))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>More ways to browse</Text>
            <Text style={styles.sectionSub}>
              Secondary routes for specific trip moods, city pull or niche browsing.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.secondaryRow}
            >
              {DISCOVER_SECONDARY_CATEGORIES.map((category) => renderCategoryCard(category, true))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Randomiser</Text>
            <Text style={styles.sectionSub}>
              When you cannot be bothered choosing, this pulls from your current Discover setup and
              picks from stronger options instead of random junk.
            </Text>

            <Pressable
              onPress={goRandomTrip}
              disabled={loadingRandom}
              style={({ pressed }) => [
                styles.randomPress,
                (pressed || loadingRandom) && styles.pressed,
              ]}
            >
              <GlassCard strength="default" style={styles.randomCard} noPadding>
                <View style={styles.randomInner}>
                  <View style={styles.randomTop}>
                    <Text style={styles.randomTitle}>Random trip</Text>
                    {loadingRandom ? (
                      <ActivityIndicator />
                    ) : (
                      <Ionicons
                        name="shuffle-outline"
                        size={20}
                        color={theme.colors.text}
                      />
                    )}
                  </View>

                  <Text style={styles.randomSub}>
                    Score a live pool using your current setup, then jump into Build Trip from one
                    of the better options.
                  </Text>

                  <Text style={styles.randomHint}>{filterSummary}</Text>
                </View>
              </GlassCard>
            </Pressable>
          </View>

          <GlassCard strength="default" style={styles.infoCard}>
            <Text style={styles.infoTitle}>How Discover should be used</Text>
            <Text style={styles.infoText}>
              Discover is for when you know the kind of football trip you want, but not the exact
              match. Use Fixtures when you already know you want a direct fixture browse.
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

  primaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  categoryPress: {
    width: "48.5%",
    borderRadius: 18,
    overflow: "hidden",
  },
  categoryPressCompact: {
    width: 188,
    borderRadius: 18,
    overflow: "hidden",
  },
  categoryCard: {
    borderRadius: 18,
  },
  categoryCardPrimary: {
    borderColor: "rgba(79,224,138,0.18)",
  },
  categoryCardCompact: {
    minHeight: 110,
  },
  categoryInner: {
    padding: 14,
    minHeight: 128,
    gap: 14,
    justifyContent: "space-between",
  },
  categoryInnerCompact: {
    minHeight: 112,
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

  secondaryRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  randomPress: {
    borderRadius: 18,
    overflow: "hidden",
  },
  randomCard: {
    borderRadius: 18,
  },
  randomInner: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 8,
    minHeight: 132,
  },
  randomTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  randomTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  randomSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  randomHint: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
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
