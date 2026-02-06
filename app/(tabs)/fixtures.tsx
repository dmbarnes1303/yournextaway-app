// app/(tabs)/fixtures.tsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Platform,
  Keyboard,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";
import { getFixtures, type FixtureListRow } from "@/src/services/apiFootball";

import {
  LEAGUES,
  getRollingWindowIso,
  normalizeWindowIso,
  type LeagueOption,
} from "@/src/constants/football";

import { coerceNumber, coerceString } from "@/src/utils/params";
import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getFlagImageUrl } from "@/src/utils/flagImages";

import useFollowStore from "@/src/state/followStore";
import tripsStore from "@/src/state/trips";

import {
  computeLikelyPlaceholderTbcIds,
  kickoffIsoOrNull,
  isKickoffTbc,
} from "@/src/utils/kickoffTbc";

/* -------------------------------------------------------------------------- */
/* Helpers */
/* -------------------------------------------------------------------------- */

type LeagueMode = "single" | "multi";

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function fixtureIsoDateOnly(r: FixtureListRow): string | null {
  const raw = r?.fixture?.date;
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function kickoffLabel(r: FixtureListRow, placeholderIds?: Set<string>) {
  const tbc = isKickoffTbc(r, placeholderIds);
  if (tbc) return "TBC";
  const raw = r?.fixture?.date;
  if (!raw) return "TBC";
  const pretty = formatUkDateTimeMaybe(String(raw));
  return pretty || "TBC";
}

/**
 * Resolve whether a fixture already belongs to an existing trip.
 */
function resolveTripForFixture(fixtureId: string): string | null {
  const trips = tripsStore.getState().trips;
  const hit = trips.find((t) => (t.matchIds ?? []).includes(String(fixtureId)));
  return hit ? String(hit.id) : null;
}

/* -------------------------------------------------------------------------- */

function resolveLeagueSelection(
  paramsLeagueId: unknown,
  paramsSeason: unknown
): {
  mode: LeagueMode;
  selected?: LeagueOption;
  selectedMany?: LeagueOption[];
} {
  const leagueIdNum = coerceNumber(paramsLeagueId);
  const seasonNum = coerceNumber(paramsSeason);

  if (!leagueIdNum) return { mode: "single", selected: LEAGUES[0] };

  const match = LEAGUES.find((l) => l.leagueId === leagueIdNum);
  if (!match) return { mode: "single", selected: LEAGUES[0] };

  const season = seasonNum ?? match.season;
  return { mode: "single", selected: { ...match, season } };
}

function LeagueFlag({ code }: { code: string }) {
  const url = getFlagImageUrl(code);
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.flag} />;
}

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function TeamCrest({
  name,
  logo,
}: {
  name: string;
  logo?: string | null;
}) {
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

/* -------------------------------------------------------------------------- */
/* Screen */
/* -------------------------------------------------------------------------- */

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromParam = useMemo(() => coerceString(params.from), [params.from]);
  const toParam = useMemo(() => coerceString(params.to), [params.to]);

  const window = useMemo(
    () =>
      normalizeWindowIso(
        { from: fromParam ?? rolling.from, to: toParam ?? rolling.to },
        90
      ),
    [fromParam, toParam, rolling.from, rolling.to]
  );

  const from = window.from;
  const to = window.to;

  const selection = useMemo(
    () => resolveLeagueSelection(params.leagueId, params.season),
    [params.leagueId, params.season]
  );

  const [selectedSingle, setSelectedSingle] = useState<LeagueOption>(
    selection.selected ?? LEAGUES[0]
  );

  const dateStrip = useMemo(() => {
    const base = new Date(`${from}T00:00:00Z`);
    return Array.from({ length: 10 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      return {
        iso,
        labelTop: d.toLocaleDateString("en-GB", { weekday: "short" }),
        labelBottom: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      };
    });
  }, [from]);

  const [activeDay, setActiveDay] = useState(dateStrip[0]?.iso ?? from);

  const [query, setQuery] = useState("");
  const qNorm = query.trim().toLowerCase();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setRows([]);

      try {
        const res = await getFixtures({
          league: selectedSingle.leagueId,
          season: selectedSingle.season,
          from,
          to,
        });

        if (cancelled) return;
        setRows(Array.isArray(res) ? res : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedSingle.leagueId, selectedSingle.season, from, to]);

  const placeholderIds = useMemo(
    () => computeLikelyPlaceholderTbcIds(rows),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows
      .filter((r) => fixtureIsoDateOnly(r) === activeDay)
      .filter((r) => {
        if (!qNorm) return true;
        return (
          norm(r?.teams?.home?.name).includes(qNorm) ||
          norm(r?.teams?.away?.name).includes(qNorm) ||
          norm(r?.fixture?.venue?.name).includes(qNorm) ||
          norm(r?.fixture?.venue?.city).includes(qNorm)
        );
      });
  }, [rows, activeDay, qNorm]);

  /* ---------------------------------------------------------------------- */

  function goMatch(id: string) {
    router.push({ pathname: "/match/[id]", params: { id } } as any);
  }

  function goTripOrBuild(id: string) {
    const existingTripId = resolveTripForFixture(id);

    if (existingTripId) {
      router.push({ pathname: "/trip/[id]", params: { id: existingTripId } } as any);
    } else {
      router.push({
        pathname: "/trip/build",
        params: {
          fixtureId: id,
          leagueId: String(selectedSingle.leagueId),
          season: String(selectedSingle.season),
          from,
          to,
        },
      } as any);
    }
  }

  /* ---------------------------------------------------------------------- */

  const renderRow = (r: FixtureListRow) => {
    const id = r?.fixture?.id ? String(r.fixture.id) : "";
    if (!id) return null;

    const expanded = expandedId === id;

    const home = String(r?.teams?.home?.name ?? "Home");
    const away = String(r?.teams?.away?.name ?? "Away");

    const kickoff = kickoffLabel(r, placeholderIds);
    const venue = r?.fixture?.venue?.name ?? "";
    const city = r?.fixture?.venue?.city ?? "";

    return (
      <View key={id} style={styles.rowWrap}>
        <GlassCard noPadding style={styles.rowCard}>
          <Pressable
            onPress={() => setExpandedId(expanded ? null : id)}
            style={styles.rowMain}
          >
            <View style={styles.rowInner}>
              <TeamCrest name={home} logo={r?.teams?.home?.logo} />

              <View style={styles.centerBlock}>
                <Text style={styles.teamLine}>{home}</Text>
                <Text style={styles.vs}>vs</Text>
                <Text style={styles.teamLine}>{away}</Text>
                <Text style={styles.meta}>
                  {kickoff}
                  {venue || city ? ` • ${[venue, city].filter(Boolean).join(" • ")}` : ""}
                </Text>
                <Text style={styles.tapHint}>Tap for actions</Text>
              </View>

              <TeamCrest name={away} logo={r?.teams?.away?.logo} />
            </View>
          </Pressable>

          {expanded ? (
            <View style={styles.expandArea}>
              <Pressable onPress={() => goMatch(id)} style={styles.expandGhost}>
                <Text style={styles.expandGhostText}>Match</Text>
              </Pressable>

              <Pressable onPress={() => goTripOrBuild(id)} style={styles.expandPrimary}>
                <Text style={styles.expandPrimaryText}>Build trip</Text>
              </Pressable>
            </View>
          ) : null}
        </GlassCard>
      </View>
    );
  };

  /* ---------------------------------------------------------------------- */

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Fixtures</Text>
          <Text style={styles.subtitle}>{selectedSingle.label}</Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search team, city, or venue"
            placeholderTextColor={theme.colors.textTertiary}
            style={styles.search}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dateStrip.map((d) => (
              <Pressable
                key={d.iso}
                onPress={() => setActiveDay(d.iso)}
                style={[
                  styles.datePill,
                  d.iso === activeDay && styles.datePillActive,
                ]}
              >
                <Text style={styles.dateTop}>{d.labelTop}</Text>
                <Text style={styles.dateBottom}>{d.labelBottom}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {LEAGUES.map((l) => (
              <Pressable
                key={l.leagueId}
                onPress={() => setSelectedSingle(l)}
                style={[
                  styles.leaguePill,
                  l.leagueId === selectedSingle.leagueId && styles.leaguePillActive,
                ]}
              >
                <Text style={styles.leagueText}>{l.label}</Text>
                <LeagueFlag code={l.countryCode} />
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <GlassCard style={styles.card}>
            {loading && (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            )}

            {!loading && error && <EmptyState title="Error" message={error} />}

            {!loading && !error && filtered.length === 0 && (
              <EmptyState title="No matches found" message="Try another day or search." />
            )}

            {!loading && !error && filtered.map(renderRow)}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    padding: theme.spacing.lg,
    gap: 12,
  },

  title: { color: theme.colors.text, fontSize: 22, fontWeight: "700" },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13 },

  search: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
  },

  datePill: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 10,
    marginRight: 8,
  },
  datePillActive: {
    borderColor: "rgba(79,224,138,0.35)",
  },
  dateTop: { color: theme.colors.textSecondary, fontSize: 12 },
  dateBottom: { color: theme.colors.text },

  leaguePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  leaguePillActive: { borderColor: "rgba(79,224,138,0.35)" },
  leagueText: { color: theme.colors.textSecondary },

  content: { padding: theme.spacing.lg },
  card: { padding: theme.spacing.md },

  rowWrap: { marginBottom: 10 },
  rowCard: { borderRadius: 18 },
  rowMain: {},

  rowInner: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  crestWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  crestImg: { width: 30, height: 30 },
  crestFallback: { color: theme.colors.textSecondary },

  centerBlock: { flex: 1, alignItems: "center", gap: 4 },

  teamLine: { color: theme.colors.text, fontSize: 15 },
  vs: { color: theme.colors.textSecondary, fontSize: 12 },
  meta: { color: theme.colors.textSecondary, fontSize: 12, textAlign: "center" },
  tapHint: { color: theme.colors.textTertiary, fontSize: 11 },

  expandArea: { flexDirection: "row", gap: 10, padding: 12 },

  expandGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  expandGhostText: { color: theme.colors.textSecondary },

  expandPrimary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.35)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  expandPrimaryText: { color: theme.colors.text },

  center: { paddingVertical: 20, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary },

  flag: { width: 18, height: 13, borderRadius: 3 },
});
