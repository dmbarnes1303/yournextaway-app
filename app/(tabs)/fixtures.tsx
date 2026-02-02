// app/(tabs)/fixtures.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type LeagueMode = "single" | "multi";
type WindowKey = "d7" | "d14" | "d30" | "d90";

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function isoDayUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

function addDaysUTC(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function parseIsoDayUTC(iso: string) {
  // stable: treat input as UTC midnight
  return new Date(`${iso}T00:00:00.000Z`);
}

function weekdayShort(d: Date) {
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

function dayMonth(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function pickDateStrip(fromIso: string, countDays: number) {
  const base = parseIsoDayUTC(fromIso);
  const out: { iso: string; labelTop: string; labelBottom: string }[] = [];
  for (let i = 0; i < countDays; i++) {
    const d = addDaysUTC(base, i);
    out.push({
      iso: isoDayUTC(d),
      labelTop: weekdayShort(d),
      labelBottom: dayMonth(d),
    });
  }
  return out;
}

function fixtureIsoDateOnly(r: FixtureListRow): string | null {
  const raw = r?.fixture?.date;
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function rowTitle(r: FixtureListRow) {
  const home = r?.teams?.home?.name ?? "Home";
  const away = r?.teams?.away?.name ?? "Away";
  return `${home} vs ${away}`;
}

function rowMeta(r: FixtureListRow) {
  const kickoff = formatUkDateTimeMaybe(r?.fixture?.date);
  const venue = r?.fixture?.venue?.name ?? "";
  const city = r?.fixture?.venue?.city ?? "";
  const extra = [venue, city].filter(Boolean).join(" • ");
  return extra ? `${kickoff} • ${extra}` : kickoff;
}

function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function LeagueFlag({ code }: { code: string }) {
  const url = getFlagImageUrl(code);
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.flag} />;
}

function CrestSquare({ r }: { r: FixtureListRow }) {
  const homeName = r?.teams?.home?.name ?? "";
  const logo = r?.teams?.home?.logo;

  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(homeName)}</Text>
      )}
      <View pointerEvents="none" style={styles.crestRing} />
    </View>
  );
}

function resolveInitialSelection(params: {
  leagueId?: unknown;
  season?: unknown;
  mode?: unknown;
}): { mode: LeagueMode; single: LeagueOption; many: LeagueOption[] } {
  const modeStr = String(params.mode ?? "").trim().toLowerCase();
  const leagueIdStr = String(params.leagueId ?? "").trim().toLowerCase();
  const leagueIdNum = coerceNumber(params.leagueId);
  const seasonNum = coerceNumber(params.season);

  // explicit multi
  if (modeStr === "multi" || leagueIdStr === "all") {
    return { mode: "multi", single: LEAGUES[0], many: LEAGUES };
  }

  // default single
  if (!leagueIdNum) {
    return { mode: "single", single: LEAGUES[0], many: LEAGUES };
  }

  const match = LEAGUES.find((l) => l.leagueId === leagueIdNum) ?? LEAGUES[0];
  const season = seasonNum ?? match.season;

  return { mode: "single", single: { ...match, season }, many: LEAGUES };
}

function windowLabel(k: WindowKey) {
  if (k === "d7") return "7 days";
  if (k === "d14") return "14 days";
  if (k === "d30") return "30 days";
  return "90 days";
}

function windowDays(k: WindowKey) {
  if (k === "d7") return 7;
  if (k === "d14") return 14;
  if (k === "d30") return 30;
  return 90;
}

function computeWindowFromKey(key: WindowKey, override?: { from?: string | null; to?: string | null }) {
  // If caller passed from/to explicitly, keep them (normalized).
  const rawFrom = override?.from ?? null;
  const rawTo = override?.to ?? null;
  if (rawFrom && rawTo) {
    return normalizeWindowIso({ from: rawFrom, to: rawTo }, 90);
  }

  // else compute rolling window for the selected key
  const days = windowDays(key);
  return getRollingWindowIso({ days });
}

function passesQueryFactory(qNorm: string) {
  const q = qNorm.trim().toLowerCase();
  if (!q) return () => true;

  // keep it simple + fast: direct substring against team + venue + city
  return (r: FixtureListRow) => {
    const home = norm(r?.teams?.home?.name);
    const away = norm(r?.teams?.away?.name);
    const venue = norm(r?.fixture?.venue?.name);
    const city = norm(r?.fixture?.venue?.city);
    return home.includes(q) || away.includes(q) || venue.includes(q) || city.includes(q);
  };
}

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ---- Params (accept both q and venue as "prefill search") ----
  const fromParam = useMemo(() => coerceString(params.from), [params.from]);
  const toParam = useMemo(() => coerceString(params.to), [params.to]);

  const qParam = useMemo(() => coerceString((params as any).q), [params]);
  const venueParam = useMemo(() => coerceString((params as any).venue), [params]);

  const focusDateParam = useMemo(() => coerceString((params as any).focusDate), [params]);
  const modeParam = useMemo(() => coerceString((params as any).mode), [params]);
  const initialWindowKeyParam = useMemo(() => {
    const w = String((params as any).window ?? "").trim().toLowerCase();
    if (w === "7" || w === "d7") return "d7";
    if (w === "14" || w === "d14") return "d14";
    if (w === "30" || w === "d30") return "d30";
    if (w === "90" || w === "d90") return "d90";
    return null;
  }, [params]);

  const initialSelection = useMemo(
    () =>
      resolveInitialSelection({
        leagueId: params.leagueId,
        season: params.season,
        mode: modeParam,
      }),
    [params.leagueId, params.season, modeParam]
  );

  // ---- Mode + Leagues ----
  const [mode, setMode] = useState<LeagueMode>(initialSelection.mode);
  const [selectedSingle, setSelectedSingle] = useState<LeagueOption>(initialSelection.single);
  const [selectedMany] = useState<LeagueOption[]>(initialSelection.many); // currently fixed to LEAGUES

  useEffect(() => {
    // update if deep link changes
    setMode(initialSelection.mode);
    setSelectedSingle(initialSelection.single);
    // selectedMany stays LEAGUES for now (multi selection modal can come later)
  }, [initialSelection.mode, initialSelection.single]);

  // ---- Window controls ----
  const [windowKey, setWindowKey] = useState<WindowKey>(initialWindowKeyParam ?? "d14");

  const computedWindow = useMemo(() => {
    // if explicit from/to provided, respect them
    if (fromParam && toParam) {
      return computeWindowFromKey("d90", { from: fromParam, to: toParam }); // key irrelevant when explicit
    }
    return computeWindowFromKey(windowKey);
  }, [fromParam, toParam, windowKey]);

  const window = useMemo(() => normalizeWindowIso(computedWindow, 90), [computedWindow]);
  const from = window.from;
  const to = window.to;

  // ---- Date strip (drives filtering only; do NOT refetch per-day) ----
  const stripDays = useMemo(() => {
    // Show up to 7 chips always. In short windows, use window length; otherwise 7-day strip.
    const days = windowDays(windowKey);
    return Math.max(7, Math.min(7, days)); // currently always 7, intentionally stable UI
  }, [windowKey]);

  const dateStrip = useMemo(() => pickDateStrip(from, stripDays), [from, stripDays]);

  const [activeDay, setActiveDay] = useState<string>(dateStrip[0]?.iso ?? from);

  useEffect(() => {
    // If focusDate provided and within range, prefer it; else default to strip[0]
    const focus = (focusDateParam ?? "").trim();
    const stripSet = new Set(dateStrip.map((d) => d.iso));
    if (focus && stripSet.has(focus)) {
      setActiveDay(focus);
      return;
    }
    setActiveDay(dateStrip[0]?.iso ?? from);
  }, [from, dateStrip, focusDateParam]);

  // ---- Search ----
  const prefill = useMemo(() => (venueParam ?? qParam ?? "").trim(), [venueParam, qParam]);
  const [query, setQuery] = useState<string>(prefill);
  const qNorm = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    // only overwrite query if the incoming prefill changed (prevents clobber while typing)
    setQuery(prefill);
  }, [prefill]);

  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);
  const clearQuery = useCallback(() => {
    setQuery("");
    Keyboard.dismiss();
  }, []);

  // ---- Fetch state ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rowsSingle, setRowsSingle] = useState<FixtureListRow[]>([]);
  const [rowsMulti, setRowsMulti] = useState<Record<number, FixtureListRow[]>>({});

  const fetchKeyRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    async function runSingle() {
      setError(null);
      setLoading(true);

      try {
        const res = await getFixtures({
          league: selectedSingle.leagueId,
          season: selectedSingle.season,
          from,
          to,
        });

        if (cancelled) return;
        setRowsSingle(Array.isArray(res) ? res : []);
        setRowsMulti({});
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load fixtures.");
        setRowsSingle([]);
        setRowsMulti({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function runMulti() {
      setError(null);
      setLoading(true);

      try {
        const results = await Promise.all(
          selectedMany.map(async (l) => {
            const res = await getFixtures({
              league: l.leagueId,
              season: l.season,
              from,
              to,
            });
            return [l.leagueId, Array.isArray(res) ? res : []] as const;
          })
        );

        if (cancelled) return;

        const map: Record<number, FixtureListRow[]> = {};
        for (const [leagueId, rows] of results) map[leagueId] = rows;

        setRowsMulti(map);
        setRowsSingle([]);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load fixtures.");
        setRowsSingle([]);
        setRowsMulti({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const key =
      mode === "single"
        ? `single:${selectedSingle.leagueId}:${selectedSingle.season}:${from}:${to}`
        : `multi:${selectedMany.map((l) => `${l.leagueId}-${l.season}`).join(",")}:${from}:${to}`;

    // Avoid double-fetch if React re-renders quickly
    if (fetchKeyRef.current === key) return;
    fetchKeyRef.current = key;

    if (mode === "single") runSingle();
    else runMulti();

    return () => {
      cancelled = true;
    };
  }, [mode, selectedSingle.leagueId, selectedSingle.season, selectedMany, from, to]);

  // ---- Filtering ----
  const passesQuery = useMemo(() => passesQueryFactory(qNorm), [qNorm]);

  const isActiveDay = useCallback(
    (r: FixtureListRow) => {
      const d = fixtureIsoDateOnly(r);
      return !!d && d === activeDay;
    },
    [activeDay]
  );

  const dayRowsSingleUnfiltered = useMemo(() => rowsSingle.filter((r) => isActiveDay(r)), [rowsSingle, isActiveDay]);
  const dayRowsSingleFiltered = useMemo(
    () => rowsSingle.filter((r) => isActiveDay(r)).filter((r) => passesQuery(r)),
    [rowsSingle, isActiveDay, passesQuery]
  );

  const dayRowsMultiUnfiltered = useMemo(() => {
    const out: Record<number, FixtureListRow[]> = {};
    for (const l of selectedMany) {
      const rows = rowsMulti[l.leagueId] ?? [];
      out[l.leagueId] = rows.filter((r) => isActiveDay(r));
    }
    return out;
  }, [rowsMulti, selectedMany, isActiveDay]);

  const dayRowsMultiFiltered = useMemo(() => {
    const out: Record<number, FixtureListRow[]> = {};
    for (const l of selectedMany) {
      const rows = rowsMulti[l.leagueId] ?? [];
      out[l.leagueId] = rows.filter((r) => isActiveDay(r)).filter((r) => passesQuery(r));
    }
    return out;
  }, [rowsMulti, selectedMany, isActiveDay, passesQuery]);

  // ---- Empty-state intelligence ----
  const nextStripDayWithMatches = useMemo(() => {
    // Find the next date chip in the strip that has ANY fixtures (ignores query)
    const strip = dateStrip.map((d) => d.iso);
    const idx = Math.max(0, strip.indexOf(activeDay));

    const hasAnyOnDay = (iso: string) => {
      if (mode === "single") {
        return rowsSingle.some((r) => fixtureIsoDateOnly(r) === iso);
      }
      // multi
      for (const l of selectedMany) {
        const rows = rowsMulti[l.leagueId] ?? [];
        if (rows.some((r) => fixtureIsoDateOnly(r) === iso)) return true;
      }
      return false;
    };

    for (let i = idx + 1; i < strip.length; i++) {
      if (hasAnyOnDay(strip[i])) return strip[i];
    }
    for (let i = 0; i < idx; i++) {
      if (hasAnyOnDay(strip[i])) return strip[i];
    }
    return null;
  }, [dateStrip, activeDay, mode, rowsSingle, rowsMulti, selectedMany]);

  const emptyState = useMemo(() => {
    const hasQuery = !!qNorm;
    const dayLabel = formatUkDateOnly(activeDay);

    // Search filtered everything out, but there ARE fixtures that day.
    if (mode === "single") {
      if (hasQuery && dayRowsSingleFiltered.length === 0 && dayRowsSingleUnfiltered.length > 0) {
        return {
          title: "No matches match your search",
          message: `There are fixtures on ${dayLabel}, but none match “${qNorm}”. Try a different search term or clear the filter.`,
          kind: "search" as const,
        };
      }
      // No fixtures at all on that day (ignoring query)
      if (dayRowsSingleUnfiltered.length === 0) {
        const next = nextStripDayWithMatches ? formatUkDateOnly(nextStripDayWithMatches) : null;
        return {
          title: "No matches on this day",
          message: next
            ? `No fixtures on ${dayLabel}. Try ${next}, switch league, or expand the window.`
            : `No fixtures on ${dayLabel}. Try another day, switch league, or expand the window.`,
          kind: "day" as const,
        };
      }
      // Otherwise: filtered empty and unfiltered empty handled, so generic
      if (dayRowsSingleFiltered.length === 0) {
        return {
          title: "No matches found",
          message: hasQuery
            ? `Try a different search term or clear the filter.`
            : `Try a different day or switch leagues.`,
          kind: "generic" as const,
        };
      }
      return null;
    }

    // multi mode
    const anyUnfiltered = selectedMany.some((l) => (dayRowsMultiUnfiltered[l.leagueId]?.length ?? 0) > 0);
    const anyFiltered = selectedMany.some((l) => (dayRowsMultiFiltered[l.leagueId]?.length ?? 0) > 0);

    if (hasQuery && !anyFiltered && anyUnfiltered) {
      return {
        title: "No matches match your search",
        message: `There are fixtures on ${dayLabel}, but none match “${qNorm}”. Try a different search term or clear the filter.`,
        kind: "search" as const,
      };
    }

    if (!anyUnfiltered) {
      const next = nextStripDayWithMatches ? formatUkDateOnly(nextStripDayWithMatches) : null;
      return {
        title: "No matches on this day",
        message: next
          ? `No fixtures on ${dayLabel}. Try ${next} or expand the window.`
          : `No fixtures on ${dayLabel}. Try another day or expand the window.`,
        kind: "day" as const,
      };
    }

    if (!anyFiltered) {
      return {
        title: "No matches found",
        message: hasQuery
          ? `Try a different search term or clear the filter.`
          : `Try a different day or switch mode.`,
        kind: "generic" as const,
      };
    }

    return null;
  }, [
    mode,
    qNorm,
    activeDay,
    dayRowsSingleFiltered.length,
    dayRowsSingleUnfiltered.length,
    selectedMany,
    dayRowsMultiUnfiltered,
    dayRowsMultiFiltered,
    nextStripDayWithMatches,
  ]);

  // ---- Header subtitle ----
  const subtitle = useMemo(() => {
    if (mode === "single") return selectedSingle.label;
    return "Top leagues";
  }, [mode, selectedSingle.label]);

  // ---- Navigation ----
  const goMatchWithContext = useCallback(
    (fixtureIdStr: string, leagueIdForRow?: number, seasonForRow?: number) => {
      const lid = mode === "single" ? selectedSingle.leagueId : leagueIdForRow ?? selectedSingle.leagueId;
      const sea = mode === "single" ? selectedSingle.season : seasonForRow ?? selectedSingle.season;

      router.push({
        pathname: "/match/[id]",
        params: {
          id: fixtureIdStr,
          leagueId: String(lid),
          season: String(sea),
          from,
          to,
          ...(qNorm ? { q: qNorm } : {}),
          focusDate: activeDay,
          mode,
        },
      } as any);
    },
    [router, mode, selectedSingle.leagueId, selectedSingle.season, from, to, qNorm, activeDay]
  );

  const goBuildTripWithContext = useCallback(
    (fixtureIdStr: string, leagueIdForRow?: number, seasonForRow?: number) => {
      const lid = mode === "single" ? selectedSingle.leagueId : leagueIdForRow ?? selectedSingle.leagueId;
      const sea = mode === "single" ? selectedSingle.season : seasonForRow ?? selectedSingle.season;

      router.push({
        pathname: "/trip/build",
        params: {
          fixtureId: fixtureIdStr,
          leagueId: String(lid),
          season: String(sea),
          from,
          to,
          ...(qNorm ? { q: qNorm } : {}),
          focusDate: activeDay,
          source: "fixtures",
          mode,
        },
      } as any);
    },
    [router, mode, selectedSingle.leagueId, selectedSingle.season, from, to, qNorm, activeDay]
  );

  // ---- Mode / window actions ----
  const toggleMode = useCallback(() => {
    setMode((m) => (m === "single" ? "multi" : "single"));
  }, []);

  const onPickWindow = useCallback((k: WindowKey) => {
    // If the user came in with explicit from/to, switching windows should take control back (reset to rolling)
    setWindowKey(k);
  }, []);

  const showWindowPicker = useMemo(() => !(fromParam && toParam), [fromParam, toParam]);

  // ---- Derived: multi-mode emptiness ----
  const multiHasAny = useMemo(() => {
    if (mode !== "multi") return false;
    return selectedMany.some((l) => (dayRowsMultiFiltered[l.leagueId]?.length ?? 0) > 0);
  }, [mode, selectedMany, dayRowsMultiFiltered]);

  return (
    <Background imageSource={getBackground("fixtures")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Fixtures</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <Pressable onPress={toggleMode} style={styles.modePill} hitSlop={10} android_ripple={{ color: "rgba(79,224,138,0.10)" }}>
              <Text style={styles.modePillText}>{mode === "single" ? "One league" : "Top leagues"}</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <View pointerEvents="none" style={styles.searchSheen} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search team, city, or venue"
              placeholderTextColor={theme.colors.textTertiary}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={dismissKeyboard}
            />

            {qNorm.length > 0 ? (
              <Pressable onPress={clearQuery} style={styles.clearBtn} hitSlop={10} android_ripple={{ color: "rgba(79,224,138,0.10)" }}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Window pills (only when not deep-linked with explicit from/to) */}
          {showWindowPicker ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.windowRow}>
              {(["d7", "d14", "d30", "d90"] as WindowKey[]).map((k) => {
                const active = windowKey === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => onPickWindow(k)}
                    style={[styles.windowPill, active && styles.windowPillActive]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={[styles.windowPillText, active && styles.windowPillTextActive]}>{windowLabel(k)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.windowLockedNote}>
              Window: {formatUkDateOnly(from)} → {formatUkDateOnly(to)}
            </Text>
          )}

          {/* Date strip */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dateStrip.map((d) => {
              const active = d.iso === activeDay;
              return (
                <Pressable
                  key={d.iso}
                  onPress={() => setActiveDay(d.iso)}
                  style={[styles.datePill, active && styles.datePillActive]}
                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                >
                  <Text style={[styles.dateTop, active && styles.dateTopActive]}>{d.labelTop}</Text>
                  <Text style={[styles.dateBottom, active && styles.dateBottomActive]}>{d.labelBottom}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* League pills (single mode only) */}
          {mode === "single" ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueRow}>
              {LEAGUES.map((l) => {
                const active = l.leagueId === selectedSingle.leagueId;
                return (
                  <Pressable
                    key={l.leagueId}
                    onPress={() => setSelectedSingle(l)}
                    style={[styles.leaguePill, active && styles.leaguePillActive]}
                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                  >
                    <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>{l.label}</Text>
                    <LeagueFlag code={l.countryCode} />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        {/* BODY */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <GlassCard strength="default" style={styles.card}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading fixtures…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Couldn’t load fixtures" message={error} /> : null}

            {!loading && !error ? (
              mode === "single" ? (
                dayRowsSingleFiltered.length === 0 ? (
                  <View style={{ gap: 12 }}>
                    <EmptyState title={emptyState?.title ?? "No matches found"} message={emptyState?.message ?? "Try another day or switch leagues."} />
                    <View style={styles.emptyActionsRow}>
                      {nextStripDayWithMatches ? (
                        <Pressable
                          onPress={() => setActiveDay(nextStripDayWithMatches)}
                          style={[styles.smallBtn, styles.smallGhost]}
                          android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                        >
                          <Text style={styles.smallGhostText}>Try {formatUkDateOnly(nextStripDayWithMatches)}</Text>
                        </Pressable>
                      ) : null}

                      {qNorm ? (
                        <Pressable
                          onPress={clearQuery}
                          style={[styles.smallBtn, styles.smallPrimary]}
                          android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                        >
                          <Text style={styles.smallPrimaryText}>Clear search</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => setWindowKey((k) => (k === "d30" ? "d90" : "d30"))}
                          style={[styles.smallBtn, styles.smallPrimary]}
                          android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                        >
                          <Text style={styles.smallPrimaryText}>{windowKey === "d30" ? "Expand to 90 days" : "Expand to 30 days"}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.list}>
                    {dayRowsSingleFiltered.map((r, idx) => {
                      const id = r?.fixture?.id;
                      const fixtureIdStr = id ? String(id) : null;
                      const key = fixtureIdStr ?? `idx-${idx}`;

                      return (
                        <GlassCard key={key} strength="subtle" noPadding style={styles.rowCard}>
                          <Pressable
                            disabled={!fixtureIdStr}
                            onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr) : null)}
                            style={styles.rowMain}
                            android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                          >
                            <View style={styles.rowInner}>
                              <CrestSquare r={r} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.rowTitle}>{rowTitle(r)}</Text>
                                <Text style={styles.rowMeta}>{rowMeta(r)}</Text>
                              </View>
                              <Text style={styles.chev}>›</Text>
                            </View>
                          </Pressable>

                          <View style={styles.actionsRow}>
                            <Pressable
                              disabled={!fixtureIdStr}
                              onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr) : null)}
                              style={[styles.smallBtn, styles.smallGhost, !fixtureIdStr && styles.disabled]}
                              android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                            >
                              <Text style={styles.smallGhostText}>View match</Text>
                            </Pressable>

                            <Pressable
                              disabled={!fixtureIdStr}
                              onPress={() => (fixtureIdStr ? goBuildTripWithContext(fixtureIdStr) : null)}
                              style={[styles.smallBtn, styles.smallPrimary, !fixtureIdStr && styles.disabled]}
                              android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                            >
                              <Text style={styles.smallPrimaryText}>Plan trip</Text>
                            </Pressable>
                          </View>
                        </GlassCard>
                      );
                    })}
                  </View>
                )
              ) : !multiHasAny ? (
                <View style={{ gap: 12 }}>
                  <EmptyState title={emptyState?.title ?? "No matches found"} message={emptyState?.message ?? "Try another day or expand the window."} />
                  <View style={styles.emptyActionsRow}>
                    {nextStripDayWithMatches ? (
                      <Pressable
                        onPress={() => setActiveDay(nextStripDayWithMatches)}
                        style={[styles.smallBtn, styles.smallGhost]}
                        android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                      >
                        <Text style={styles.smallGhostText}>Try {formatUkDateOnly(nextStripDayWithMatches)}</Text>
                      </Pressable>
                    ) : null}

                    {qNorm ? (
                      <Pressable
                        onPress={clearQuery}
                        style={[styles.smallBtn, styles.smallPrimary]}
                        android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                      >
                        <Text style={styles.smallPrimaryText}>Clear search</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => setWindowKey((k) => (k === "d30" ? "d90" : "d30"))}
                        style={[styles.smallBtn, styles.smallPrimary]}
                        android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                      >
                        <Text style={styles.smallPrimaryText}>{windowKey === "d30" ? "Expand to 90 days" : "Expand to 30 days"}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.multiWrap}>
                  {selectedMany.map((l) => {
                    const leagueRows = dayRowsMultiFiltered[l.leagueId] ?? [];
                    if (leagueRows.length === 0) return null;

                    return (
                      <View key={l.leagueId} style={styles.leagueGroup}>
                        <View style={styles.groupHeader}>
                          <View style={styles.groupTitleRow}>
                            <Text style={styles.groupTitle}>{l.label}</Text>
                            <LeagueFlag code={l.countryCode} />
                          </View>
                          <Text style={styles.groupMeta}>{formatUkDateOnly(activeDay)}</Text>
                        </View>

                        <View style={styles.list}>
                          {leagueRows.map((r, idx) => {
                            const id = r?.fixture?.id;
                            const fixtureIdStr = id ? String(id) : null;
                            const key = fixtureIdStr ?? `l-${l.leagueId}-${idx}`;

                            return (
                              <GlassCard key={key} strength="subtle" noPadding style={styles.rowCard}>
                                <Pressable
                                  disabled={!fixtureIdStr}
                                  onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr, l.leagueId, l.season) : null)}
                                  style={styles.rowMain}
                                  android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                                >
                                  <View style={styles.rowInner}>
                                    <CrestSquare r={r} />
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.rowTitle}>{rowTitle(r)}</Text>
                                      <Text style={styles.rowMeta}>{rowMeta(r)}</Text>
                                    </View>
                                    <Text style={styles.chev}>›</Text>
                                  </View>
                                </Pressable>

                                <View style={styles.actionsRow}>
                                  <Pressable
                                    disabled={!fixtureIdStr}
                                    onPress={() => (fixtureIdStr ? goMatchWithContext(fixtureIdStr, l.leagueId, l.season) : null)}
                                    style={[styles.smallBtn, styles.smallGhost, !fixtureIdStr && styles.disabled]}
                                    android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                                  >
                                    <Text style={styles.smallGhostText}>View match</Text>
                                  </Pressable>

                                  <Pressable
                                    disabled={!fixtureIdStr}
                                    onPress={() => (fixtureIdStr ? goBuildTripWithContext(fixtureIdStr, l.leagueId, l.season) : null)}
                                    style={[styles.smallBtn, styles.smallPrimary, !fixtureIdStr && styles.disabled]}
                                    android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                                  >
                                    <Text style={styles.smallPrimaryText}>Plan trip</Text>
                                  </Pressable>
                                </View>
                              </GlassCard>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )
            ) : null}
          </GlassCard>

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: 12,
  },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },

  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: theme.fontWeight.black,
  },

  subtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
  },

  modePill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    overflow: "hidden",
  },
  modePillText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
  },

  // Search
  searchBox: {
    borderWidth: 1,
    borderColor: theme.glass.border,
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  searchSheen: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    opacity: 0.55,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 6 : 4,
    fontWeight: theme.fontWeight.bold,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.22)",
    backgroundColor: "rgba(0,0,0,0.14)",
    overflow: "hidden",
  },
  clearBtnText: {
    color: "rgba(242,244,246,0.72)",
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    letterSpacing: 0.3,
  },

  // Window pills
  windowRow: { gap: 10, paddingRight: theme.spacing.lg },
  windowPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    paddingVertical: 7,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  windowPillActive: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  windowPillText: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black },
  windowPillTextActive: { color: theme.colors.text, fontWeight: theme.fontWeight.black },

  windowLockedNote: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
    marginTop: -2,
  },

  // Date strip
  dateRow: { gap: 10, paddingRight: theme.spacing.lg },
  datePill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 74,
    alignItems: "center",
    overflow: "hidden",
  },
  datePillActive: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  dateTop: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.black },
  dateTopActive: { color: theme.colors.textSecondary },
  dateBottom: { marginTop: 2, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },
  dateBottomActive: { color: theme.colors.text },

  // League pills (single only)
  leagueRow: { gap: 10, paddingRight: theme.spacing.lg },
  leaguePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  leaguePillActive: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  leaguePillText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.black },
  leaguePillTextActive: { color: theme.colors.text, fontWeight: theme.fontWeight.black },

  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },

  // Body
  scrollView: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  card: { minHeight: 260, padding: theme.spacing.md },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },

  // Lists
  list: { gap: 10 },
  rowCard: { borderRadius: 16 },
  rowMain: { borderRadius: 16 },
  rowInner: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  crestWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.12)",
    borderRadius: 14,
  },
  crestImg: { width: 30, height: 30, opacity: 0.95 },
  crestFallback: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: theme.fontWeight.black, letterSpacing: 0.4 },

  rowTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  rowMeta: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 13, fontWeight: theme.fontWeight.bold },
  chev: { color: theme.colors.textTertiary, fontSize: 24, marginTop: -2 },

  actionsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingBottom: 12 },

  emptyActionsRow: { flexDirection: "row", gap: 10 },

  smallBtn: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: "center", borderWidth: 1, overflow: "hidden" },

  smallPrimary: {
    borderColor: "rgba(79,224,138,0.28)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.default : theme.glass.iosBg.default,
  },
  smallPrimaryText: { color: theme.colors.text, fontWeight: theme.fontWeight.black, fontSize: 14 },

  smallGhost: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Platform.OS === "android" ? theme.glass.androidBg.subtle : theme.glass.iosBg.subtle,
  },
  smallGhostText: { color: theme.colors.textSecondary, fontWeight: theme.fontWeight.black, fontSize: 14 },

  disabled: { opacity: 0.55 },

  // Multi grouping
  multiWrap: { gap: 18 },
  leagueGroup: { gap: 10 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  groupTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupTitle: { color: theme.colors.text, fontSize: 15, fontWeight: theme.fontWeight.black },
  groupMeta: { color: theme.colors.textTertiary, fontSize: 12, fontWeight: theme.fontWeight.bold },
});
