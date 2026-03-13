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
import EmptyState from "@/src/components/EmptyState";
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
  ["bigMatches", "derbies", "atmospheres", "valueTrips", "legendaryStadiums"],
  ["iconicCities", "perfectTrips", "nightMatches", "titleDrama", "easyTickets"],
  ["bucketList", "matchdayCulture", "underratedTrips"],
];

const DISCOVER_CATEGORY_META: Record<
  DiscoverCategory,
  { title: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  bigMatches: { title: "Big Matches", icon: "star-outline" },
  derbies: { title: "Derbies & Rivalries", icon: "flame-outline" },
  atmospheres: { title: "Insane Atmospheres", icon: "radio-outline" },
  valueTrips: { title: "Best Value Football Trips", icon: "cash-outline" },
  legendaryStadiums: { title: "Legendary Stadiums", icon: "business-outline" },
  iconicCities: { title: "Iconic Football Cities", icon: "earth-outline" },
  perfectTrips: { title: "Perfect Football Trips", icon: "navigate-outline" },
  nightMatches: { title: "Night Matches", icon: "moon-outline" },
  titleDrama: { title: "Title Race Drama", icon: "trophy-outline" },
  easyTickets: { title: "Easy Ticket Matches", icon: "ticket-outline" },
  bucketList: { title: "Football Bucket List", icon: "bookmark-outline" },
  matchdayCulture: { title: "Best Matchday Culture", icon: "people-outline" },
  underratedTrips: { title: "Underrated Trips", icon: "sparkles-outline" },
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

  const currentWindow = useMemo(
    () => windowForKey(discoverWindowKey),
    [discoverWindowKey]
  );

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
            const blocked = new Set(["london", "paris", "rome", "barcelona", "amsterdam", "lisbon"]);
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
              <Text style={styles.title}>Find trips worth taking</Text>
              <Text style={styles.sub}>
                This tab is for inspiration first, planning second. Browse themes, use filters, then jump straight into Fixtures or Build Trip.
              </Text>
            </View>
          </GlassCard>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick discovery</Text>

            <View style={styles.grid2}>
              <Pressable
                onPress={() => goDiscover("surprise")}
                disabled={loadingMode !== null}
                style={({ pressed }) => [styles.tilePress, (pressed || loadingMode === "surprise") && styles.pressed]}
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
                      {labelForKey(discoverWindowKey)} • {labelForTripLength(discoverTripLength)}
                    </Text>
                    <Text style={styles.tileHint}>
                      {discoverVibes.length ? discoverVibes.map(labelForVibe).join(" • ") : "Any vibe"}
                    </Text>
                  </View>
                </GlassCard>
              </Pressable>

              <Pressable
                onPress={() => goDiscover("hidden")}
                disabled={loadingMode !== null}
                style={({ pressed }) => [styles.tilePress, (pressed || loadingMode === "hidden") && styles.pressed]}
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
                    <Text style={styles.tileSub}>Avoid obvious football cities</Text>
                    <Text style={styles.tileHint}>Rough heuristic, not magic</Text>
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
                {(["wknd", "d7", "d14", "d30"] as DiscoverWindowKey[]).map((k) => {
                  const active = discoverWindowKey === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setDiscoverWindowKey(k)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {labelForKey(k)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Trip length</Text>
              <View style={styles.chipsRow}>
                {(["day", "1", "2", "3"] as DiscoverTripLength[]).map((k) => {
                  const active = discoverTripLength === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setDiscoverTripLength(k)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {labelForTripLength(k)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Vibe (up to 3)</Text>
              <View style={styles.chipsRow}>
                {(["easy", "big", "hidden", "nightlife", "culture", "warm"] as DiscoverVibe[]).map((v) => {
                  const active = discoverVibes.includes(v);
                  return (
                    <Pressable
                      key={v}
                      onPress={() => toggleVibe(v)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {labelForVibe(v)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </GlassCard>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse by theme</Text>

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
                    return (
                      <Pressable
                        key={category}
                        onPress={() => goFixturesCategory(category)}
                        style={({ pressed }) => [styles.categoryPress, pressed && styles.pressed]}
                      >
                        <GlassCard strength="default" style={styles.categoryCard} noPadding>
                          <View style={styles.categoryInner}>
                            <View style={styles.categoryIconWrap}>
                              <Ionicons
                                name={meta.icon}
                                size={18}
                                color={theme.colors.text}
                              />
                            </View>
                            <Text style={styles.categoryTitle}>{meta.title}</Text>
                          </View>
                        </GlassCard>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ))}
            </View>
          </View>

          <GlassCard strength="default" style={styles.noteCard}>
            <Text style={styles.noteTitle}>Reality check</Text>
            <Text style={styles.noteText}>
              These category tiles are now wired as a proper Discover entry point, but the category-specific ranking logic still needs building. Right now they route cleanly into Fixtures with discover params, which is the correct structure before layering intelligence on top.
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
    gap: 8,
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

  section: { gap: 10 },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
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
    lineHeight: 16,
  },
  tileHint: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "800",
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
    width: 172,
    borderRadius: 18,
    overflow: "hidden",
  },
  categoryCard: {
    borderRadius: 18,
  },
  categoryInner: {
    padding: 14,
    minHeight: 96,
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
  categoryTitle: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },

  noteCard: {
    padding: 14,
  },
  noteTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },
  noteText: {
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
