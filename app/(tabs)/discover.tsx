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

type RankedDiscoverPick = {
  item: ReturnType<typeof buildDiscoverScores>[number];
  score: number;
};

type InspirationPreset = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  vibe?: DiscoverVibe;
  category: DiscoverCategory;
  windowKey?: DiscoverWindowKey;
};

const INSPIRATION_PRESETS: InspirationPreset[] = [
  {
    id: "weekend",
    title: "Best this weekend",
    subtitle: "Strong live options for a quick football break",
    icon: "flash-outline",
    category: "perfectTrips",
    windowKey: "wknd",
  },
  {
    id: "easy",
    title: "Easy city breaks",
    subtitle: "Lower-friction trips with cleaner planning potential",
    icon: "navigate-outline",
    vibe: "easy",
    category: "easyTickets",
  },
  {
    id: "big",
    title: "Big atmospheres",
    subtitle: "Louder fixtures worth travelling for",
    icon: "megaphone-outline",
    vibe: "big",
    category: "bigMatches",
  },
  {
    id: "night",
    title: "Night game energy",
    subtitle: "Late kick-offs, lights, and stronger matchday mood",
    icon: "moon-outline",
    vibe: "nightlife",
    category: "nightMatches",
  },
  {
    id: "culture",
    title: "City + match weekends",
    subtitle: "Trips where the place matters as much as the game",
    icon: "business-outline",
    vibe: "culture",
    category: "matchdayCulture",
  },
  {
    id: "warm",
    title: "Warmer escapes",
    subtitle: "Football weekends with a softer climate pull",
    icon: "sunny-outline",
    vibe: "warm",
    category: "iconicCities",
  },
];

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

function createStableSeed(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function rotateStable<T>(arr: T[], seed: number) {
  if (!arr.length) return arr;
  const offset = seed % arr.length;
  return [...arr.slice(offset), ...arr.slice(0, offset)];
}

function clampVibes(next: DiscoverVibe[]) {
  if (next.length <= 3) return next;
  return next.slice(next.length - 3);
}

function categorySeedFromVibes(vibes: DiscoverVibe[]): DiscoverCategory {
  if (vibes.includes("big")) return "bigMatches";
  if (vibes.includes("nightlife")) return "nightMatches";
  if (vibes.includes("culture")) return "matchdayCulture";
  if (vibes.includes("warm")) return "iconicCities";
  if (vibes.includes("easy")) return "easyTickets";
  return "perfectTrips";
}

function prioritiseCategories(
  categories: DiscoverCategory[],
  preferred: DiscoverCategory
): DiscoverCategory[] {
  const deduped = categories.filter(
    (category, index) => categories.indexOf(category) === index
  );
  const withoutPreferred = deduped.filter((category) => category !== preferred);
  return deduped.includes(preferred) ? [preferred, ...withoutPreferred] : deduped;
}

function buildDiscoverSeedKey(params: {
  window: ShortcutWindow;
  windowKey: DiscoverWindowKey;
  origin: string;
  tripLength: DiscoverTripLength;
  vibes: DiscoverVibe[];
  category: DiscoverCategory;
}) {
  return [
    params.window.from,
    params.window.to,
    params.windowKey,
    params.origin.trim().toLowerCase(),
    params.tripLength,
    params.vibes.slice().sort().join(","),
    params.category,
  ].join("|");
}

async function fetchDiscoverPool(params: {
  window: ShortcutWindow;
  windowKey: DiscoverWindowKey;
  origin: string;
  tripLength: DiscoverTripLength;
  vibes: DiscoverVibe[];
  category: DiscoverCategory;
  minFixtures?: number;
  maxLeagueFetches?: number;
  batchSize?: number;
}) {
  const {
    window,
    windowKey,
    origin,
    tripLength,
    vibes,
    category,
    minFixtures = 40,
    maxLeagueFetches = 18,
    batchSize = 6,
  } = params;

  const seedKey = buildDiscoverSeedKey({
    window,
    windowKey,
    origin,
    tripLength,
    vibes,
    category,
  });

  const seed = createStableSeed(seedKey);
  const orderedLeagues = rotateStable(LEAGUES, seed);
  const collected: FixtureListRow[] = [];

  for (let i = 0; i < orderedLeagues.length && i < maxLeagueFetches; i += batchSize) {
    const batch = orderedLeagues.slice(i, Math.min(i + batchSize, maxLeagueFetches));

    const results = await Promise.all(
      batch.map(async (league) => {
        try {
          const res = await getFixtures({
            league: league.leagueId,
            season: league.season,
            from: window.from,
            to: window.to,
          });
          return Array.isArray(res) ? res : [];
        } catch {
          return [];
        }
      })
    );

    const flat = results.flat().filter((row) => row?.fixture?.id != null);
    collected.push(...flat);

    if (collected.length >= minFixtures) break;
  }

  const deduped = new Map<string, FixtureListRow>();

  for (const row of collected) {
    const id = row?.fixture?.id != null ? String(row.fixture.id) : null;
    if (!id) continue;
    if (!deduped.has(id)) deduped.set(id, row);
  }

  return Array.from(deduped.values()).filter((row) => {
    const venue = String(row?.fixture?.venue?.name ?? "").trim();
    return !!venue;
  });
}

function FilterChip({
  label,
  active,
  onPress,
  compact = false,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        compact && styles.chipCompact,
        active && styles.chipActive,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          compact && styles.chipTextCompact,
          active && styles.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [discoverWindowKey, setDiscoverWindowKey] = useState<DiscoverWindowKey>("wknd");
  const [discoverTripLength, setDiscoverTripLength] = useState<DiscoverTripLength>("2");
  const [discoverVibes, setDiscoverVibes] = useState<DiscoverVibe[]>(["easy"]);
  const [discoverOrigin, setDiscoverOrigin] = useState("");
  const [loadingRandom, setLoadingRandom] = useState(false);

  const toggleVibe = useCallback((vibe: DiscoverVibe) => {
    setDiscoverVibes((prev) => {
      const has = prev.includes(vibe);
      const next = has ? prev.filter((value) => value !== vibe) : [...prev, vibe];
      return clampVibes(next);
    });
  }, []);

  const resetFilters = useCallback(() => {
    setDiscoverWindowKey("wknd");
    setDiscoverTripLength("2");
    setDiscoverVibes(["easy"]);
    setDiscoverOrigin("");
  }, []);

  const currentWindow = useMemo(
    () => windowForKey(discoverWindowKey),
    [discoverWindowKey]
  );

  const seededCategory = useMemo(
    () => categorySeedFromVibes(discoverVibes),
    [discoverVibes]
  );

  const prioritisedPrimaryCategories = useMemo(
    () => prioritiseCategories(DISCOVER_PRIMARY_CATEGORIES, seededCategory),
    [seededCategory]
  );

  const prioritisedSecondaryCategories = useMemo(() => {
    const primarySet = new Set(prioritisedPrimaryCategories);
    return prioritiseCategories(
      DISCOVER_SECONDARY_CATEGORIES.filter((category) => !primarySet.has(category)),
      seededCategory
    );
  }, [prioritisedPrimaryCategories, seededCategory]);

  const leadCategory = prioritisedPrimaryCategories[0];
  const remainingPrimaryCategories = prioritisedPrimaryCategories.slice(1);

  const filterSummary = useMemo(() => {
    const parts = [
      labelForKey(discoverWindowKey),
      labelForTripLength(discoverTripLength),
      discoverVibes.length ? discoverVibes.map(labelForVibe).join(" • ") : "Any vibe",
    ];

    if (discoverOrigin.trim()) parts.push(`From ${discoverOrigin.trim()}`);

    return parts.join("  •  ");
  }, [discoverWindowKey, discoverTripLength, discoverVibes, discoverOrigin]);

  const browseModeLabel = useMemo(() => {
    const meta = DISCOVER_CATEGORY_META[seededCategory];
    return meta?.title ?? "Best-fit routes";
  }, [seededCategory]);

  const goFixturesCategory = useCallback(
    (category: DiscoverCategory) => {
      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: currentWindow.from,
          to: currentWindow.to,
          discover: category,
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength,
          discoverVibes: discoverVibes.join(","),
        },
      } as any);
    },
    [
      router,
      currentWindow.from,
      currentWindow.to,
      discoverOrigin,
      discoverTripLength,
      discoverVibes,
    ]
  );

  const applyPreset = useCallback(
    (preset: InspirationPreset) => {
      if (preset.windowKey) setDiscoverWindowKey(preset.windowKey);
      if (preset.vibe) setDiscoverVibes([preset.vibe]);

      router.push({
        pathname: "/(tabs)/fixtures",
        params: {
          from: windowForKey(preset.windowKey ?? discoverWindowKey).from,
          to: windowForKey(preset.windowKey ?? discoverWindowKey).to,
          discover: preset.category,
          discoverFrom: discoverOrigin.trim() || undefined,
          discoverTripLength,
          discoverVibes: preset.vibe ? preset.vibe : discoverVibes.join(","),
        },
      } as any);
    },
    [router, discoverWindowKey, discoverOrigin, discoverTripLength, discoverVibes]
  );

  const goRandomTrip = useCallback(async () => {
    if (loadingRandom) return;

    setLoadingRandom(true);

    try {
      const window = windowForKey(discoverWindowKey);

      const pool = await fetchDiscoverPool({
        window,
        windowKey: discoverWindowKey,
        origin: discoverOrigin,
        tripLength: discoverTripLength,
        vibes: discoverVibes,
        category: seededCategory,
      });

      if (!pool.length) return;

      const scored = buildDiscoverScores(pool);

      const ranked: RankedDiscoverPick[] = scored
        .map((item) => ({
          item,
          score: discoverScoreForCategory(seededCategory, item, {
            origin: discoverOrigin.trim() || null,
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
          prefFrom: discoverOrigin.trim() ? discoverOrigin.trim() : undefined,
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
    discoverOrigin,
    discoverTripLength,
    discoverVibes,
    seededCategory,
    router,
  ]);

  const renderLeadCategoryCard = useCallback(
    (category: DiscoverCategory) => {
      const meta = DISCOVER_CATEGORY_META[category];

      return (
        <Pressable
          key={category}
          onPress={() => goFixturesCategory(category)}
          style={({ pressed }) => [styles.leadPress, pressed && styles.pressed]}
        >
          <GlassCard strength="default" style={styles.leadCard} noPadding>
            <View style={styles.leadInner}>
              <View style={styles.leadTopRow}>
                <View style={styles.leadIconWrap}>
                  <Ionicons name={meta.icon} size={20} color={theme.colors.text} />
                </View>

                <View style={styles.bestFitPill}>
                  <Text style={styles.bestFitPillText}>Best fit</Text>
                </View>
              </View>

              <View style={styles.leadTextWrap}>
                <Text style={styles.leadTitle}>{meta.title}</Text>
                <Text style={styles.leadSubtitle}>{meta.subtitle}</Text>
              </View>

              <View style={styles.leadBottomRow}>
                <Text style={styles.leadHint}>See best options</Text>
                <Text style={styles.leadArrow}>›</Text>
              </View>
            </View>
          </GlassCard>
        </Pressable>
      );
    },
    [goFixturesCategory]
  );

  const renderPrimaryCategoryCard = useCallback(
    (category: DiscoverCategory) => {
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
            style={[styles.categoryCard, primary && styles.categoryCardPrimary]}
            noPadding
          >
            <View style={styles.categoryInner}>
              <View style={styles.categoryTopRow}>
                <View
                  style={[
                    styles.categoryIconWrap,
                    primary && styles.categoryIconWrapPrimary,
                  ]}
                >
                  <Ionicons name={meta.icon} size={18} color={theme.colors.text} />
                </View>
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

  const renderSecondaryCategoryCard = useCallback(
    (category: DiscoverCategory) => {
      const meta = DISCOVER_CATEGORY_META[category];

      return (
        <Pressable
          key={category}
          onPress={() => goFixturesCategory(category)}
          style={({ pressed }) => [styles.categoryPressCompact, pressed && styles.pressed]}
        >
          <GlassCard strength="default" style={styles.categoryCardCompact} noPadding>
            <View style={styles.categoryInnerCompact}>
              <View style={styles.secondaryIconWrap}>
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
    <Background
      imageSource={getBackground("explore")}
      overlayOpacity={0.04}
      topShadeOpacity={0.30}
      bottomShadeOpacity={0.36}
      centerShadeOpacity={0.03}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard strength="strong" style={styles.hero} noPadding>
            <View style={styles.heroInner}>
              <Text style={styles.kicker}>DISCOVER</Text>
              <Text style={styles.title}>Find your next football weekend</Text>
              <Text style={styles.sub}>
                Big atmospheres, easy city breaks, and match trips worth actually taking.
              </Text>

              <View style={styles.heroSummaryBox}>
                <Text style={styles.heroSummaryLabel}>Current setup</Text>
                <Text style={styles.heroSummaryText}>{filterSummary}</Text>
              </View>
            </View>
          </GlassCard>

          <View style={styles.section}>
            <View style={styles.sectionHeaderStack}>
              <Text style={styles.sectionTitle}>Start with a mood</Text>
              <Text style={styles.sectionSub}>
                Fast entry points for the kind of trip that already sounds good.
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.inspirationRow}
            >
              {INSPIRATION_PRESETS.map((preset) => (
                <Pressable
                  key={preset.id}
                  onPress={() => applyPreset(preset)}
                  style={({ pressed }) => [styles.inspirationPress, pressed && styles.pressed]}
                >
                  <GlassCard strength="default" style={styles.inspirationCard} noPadding>
                    <View style={styles.inspirationInner}>
                      <View style={styles.inspirationIconWrap}>
                        <Ionicons name={preset.icon} size={18} color={theme.colors.text} />
                      </View>

                      <View style={styles.inspirationTextWrap}>
                        <Text style={styles.inspirationTitle}>{preset.title}</Text>
                        <Text style={styles.inspirationSub}>{preset.subtitle}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Trip setup</Text>
                <Text style={styles.sectionSub}>
                  Tighten the search before you browse.
                </Text>
              </View>

              <Pressable onPress={resetFilters} style={styles.resetPill}>
                <Text style={styles.resetPillText}>Reset</Text>
              </Pressable>
            </View>

            <GlassCard strength="default" style={styles.panel} noPadding>
              <View style={styles.panelInner}>
                <View style={styles.inputBlock}>
                  <Text style={styles.label}>Flying from</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons
                      name="airplane-outline"
                      size={16}
                      color={theme.colors.textTertiary}
                    />
                    <TextInput
                      value={discoverOrigin}
                      onChangeText={setDiscoverOrigin}
                      placeholder="Optional: London, LGW, MAN"
                      placeholderTextColor={theme.colors.textTertiary}
                      style={styles.input}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={styles.filterBlock}>
                  <Text style={styles.label}>Date window</Text>
                  <View style={styles.chipsRow}>
                    {(["wknd", "d7", "d14", "d30"] as DiscoverWindowKey[]).map((key) => (
                      <FilterChip
                        key={key}
                        label={labelForKey(key)}
                        active={discoverWindowKey === key}
                        onPress={() => setDiscoverWindowKey(key)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.filterBlock}>
                  <Text style={styles.label}>Trip length</Text>
                  <View style={styles.chipsRow}>
                    {(["day", "1", "2", "3"] as DiscoverTripLength[]).map((length) => (
                      <FilterChip
                        key={length}
                        label={labelForTripLength(length)}
                        active={discoverTripLength === length}
                        onPress={() => setDiscoverTripLength(length)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.filterBlock}>
                  <View style={styles.inlineLabelRow}>
                    <Text style={styles.label}>Vibe</Text>
                    <Text style={styles.labelHint}>Pick up to 3</Text>
                  </View>

                  <View style={styles.chipsRow}>
                    {(["easy", "big", "nightlife", "culture", "warm"] as DiscoverVibe[]).map(
                      (vibe) => (
                        <FilterChip
                          key={vibe}
                          label={labelForVibe(vibe)}
                          active={discoverVibes.includes(vibe)}
                          onPress={() => toggleVibe(vibe)}
                        />
                      )
                    )}
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderStack}>
              <Text style={styles.sectionTitle}>Ranked routes</Text>
              <Text style={styles.sectionSub}>
                Based on your current setup,{" "}
                <Text style={styles.sectionSubStrong}>{browseModeLabel}</Text> is the best
                place to start.
              </Text>
            </View>

            {leadCategory ? renderLeadCategoryCard(leadCategory) : null}

            <View style={styles.primaryGrid}>
              {remainingPrimaryCategories.map((category) =>
                renderPrimaryCategoryCard(category)
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderStack}>
              <Text style={styles.sectionTitle}>More ways to browse</Text>
              <Text style={styles.sectionSub}>
                Narrower angles when you want city pull, atmosphere, or more specific trip types.
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.secondaryRow}
            >
              {prioritisedSecondaryCategories.map((category) =>
                renderSecondaryCategoryCard(category)
              )}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderStack}>
              <Text style={styles.sectionTitle}>Concierge pick</Text>
              <Text style={styles.sectionSub}>
                Give the app your setup and let it surface one of the stronger live options.
              </Text>
            </View>

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
                    <View style={styles.randomTopText}>
                      <Text style={styles.randomTitle}>Let the app choose</Text>
                      <Text style={styles.randomSub}>
                        We rank a live pool against your setup before making the pick.
                      </Text>
                    </View>

                    <View style={styles.randomIconWrap}>
                      {loadingRandom ? (
                        <ActivityIndicator />
                      ) : (
                        <Ionicons
                          name="sparkles-outline"
                          size={18}
                          color={theme.colors.text}
                        />
                      )}
                    </View>
                  </View>

                  <View style={styles.randomSummaryBox}>
                    <Text style={styles.randomSummaryLabel}>Using</Text>
                    <Text style={styles.randomHint}>{filterSummary}</Text>
                  </View>

                  <View style={styles.randomButton}>
                    <Text style={styles.randomButtonText}>
                      {loadingRandom ? "Finding a strong option..." : "Pick a trip for me"}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          </View>

          <GlassCard strength="default" style={styles.modeCard} noPadding>
            <View style={styles.modeInner}>
              <View style={styles.modeBlock}>
                <Text style={styles.modeTitle}>Use Discover</Text>
                <Text style={styles.modeText}>
                  When you know the type of trip you want, but not the exact fixture yet.
                </Text>
              </View>

              <View style={styles.modeDivider} />

              <View style={styles.modeBlock}>
                <Text style={styles.modeTitle}>Use Fixtures</Text>
                <Text style={styles.modeText}>
                  When you already want a direct match browse without discovery leading.
                </Text>
              </View>
            </View>
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
    padding: 16,
    gap: 10,
  },

  kicker: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 1.2,
  },

  title: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: theme.fontWeight.black,
  },

  sub: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: theme.fontWeight.bold,
  },

  heroSummaryBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },

  heroSummaryLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  heroSummaryText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  section: {
    gap: 10,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionHeaderText: {
    flex: 1,
    gap: 3,
  },

  sectionHeaderStack: {
    gap: 4,
  },

  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  sectionSubStrong: {
    color: theme.colors.text,
    fontWeight: theme.fontWeight.black,
  },

  inspirationRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  inspirationPress: {
    width: 220,
    borderRadius: 18,
    overflow: "hidden",
  },

  inspirationCard: {
    borderRadius: 18,
    minHeight: 116,
  },

  inspirationInner: {
    padding: 14,
    minHeight: 116,
    gap: 12,
    justifyContent: "space-between",
  },

  inspirationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  inspirationTextWrap: {
    gap: 6,
  },

  inspirationTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  inspirationSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  resetPill: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.05)",
  },

  resetPillText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  panel: {
    borderRadius: 24,
  },

  panelInner: {
    padding: 14,
    gap: 14,
  },

  inputBlock: {
    gap: 7,
  },

  filterBlock: {
    gap: 8,
  },

  label: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  inlineLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  labelHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },

  inputWrap: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
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
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingVertical: 8,
    paddingHorizontal: 11,
  },

  chipCompact: {
    paddingVertical: 7,
    paddingHorizontal: 10,
  },

  chipActive: {
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
  },

  chipText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  chipTextCompact: {
    fontSize: 11,
  },

  chipTextActive: {
    color: theme.colors.text,
  },

  leadPress: {
    borderRadius: 22,
    overflow: "hidden",
  },

  leadCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.22)",
  },

  leadInner: {
    padding: 16,
    gap: 14,
    minHeight: 156,
  },

  leadTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leadIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  bestFitPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.24)",
    backgroundColor: "rgba(87,162,56,0.10)",
  },

  bestFitPillText: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  leadTextWrap: {
    gap: 6,
  },

  leadTitle: {
    color: theme.colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: theme.fontWeight.black,
  },

  leadSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  leadBottomRow: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leadHint: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  leadArrow: {
    color: theme.colors.textTertiary,
    fontSize: 22,
    marginTop: -2,
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

  categoryCard: {
    borderRadius: 18,
    minHeight: 128,
  },

  categoryCardPrimary: {
    borderColor: "rgba(87,162,56,0.16)",
  },

  categoryInner: {
    padding: 14,
    minHeight: 128,
    gap: 14,
    justifyContent: "space-between",
  },

  categoryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  categoryIconWrapPrimary: {
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  categoryTextWrap: {
    gap: 6,
  },

  categoryTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  categorySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  secondaryRow: {
    gap: 10,
    paddingRight: theme.spacing.lg,
  },

  categoryPressCompact: {
    width: 192,
    borderRadius: 18,
    overflow: "hidden",
  },

  categoryCardCompact: {
    borderRadius: 18,
    minHeight: 116,
  },

  categoryInnerCompact: {
    padding: 14,
    minHeight: 116,
    gap: 12,
    justifyContent: "space-between",
  },

  secondaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  randomPress: {
    borderRadius: 22,
    overflow: "hidden",
  },

  randomCard: {
    borderRadius: 22,
    borderColor: "rgba(87,162,56,0.16)",
  },

  randomInner: {
    padding: 16,
    gap: 14,
  },

  randomTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  randomTopText: {
    flex: 1,
    gap: 4,
  },

  randomTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: theme.fontWeight.black,
  },

  randomSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  randomIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.18)",
    backgroundColor: "rgba(87,162,56,0.08)",
  },

  randomSummaryBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },

  randomSummaryLabel: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.3,
  },

  randomHint: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  randomButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(87,162,56,0.28)",
    backgroundColor:
      Platform.OS === "android" ? "rgba(87,162,56,0.10)" : "rgba(87,162,56,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  randomButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  modeCard: {
    borderRadius: 22,
    marginBottom: 4,
  },

  modeInner: {
    padding: 14,
    gap: 12,
  },

  modeBlock: {
    gap: 6,
  },

  modeDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  modeTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.fontWeight.black,
  },

  modeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
});
