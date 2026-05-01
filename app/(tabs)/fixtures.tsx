import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import EmptyState from "@/src/components/EmptyState";
import GlassCard from "@/src/components/GlassCard";

import { theme } from "@/src/constants/theme";
import { getLeagueBackdropUrl } from "@/src/constants/visualAssets";

import { tomorrowIsoUtc, DAYS_AHEAD, addDaysIsoUtc } from "@/src/features/fixtures/date";
import { resolveTripForFixture } from "@/src/features/fixtures/helpers";
import FixturesHeader from "@/src/features/fixtures/FixturesHeader";
import FixtureRowCard from "@/src/features/fixtures/FixtureRowCard";
import FixturesCalendarModal from "@/src/features/fixtures/FixturesCalendarModal";
import { useFixturesScreenData } from "@/src/features/fixtures/useFixturesScreenData";
import type { RankedFixtureRow } from "@/src/features/fixtures/types";

type RouteParams = Record<string, string | string[] | undefined>;

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function getSingleParam(value: unknown): string {
  if (Array.isArray(value)) return cleanString(value[0]);
  return cleanString(value);
}

function getCsvParamSet(value: unknown): Set<string> {
  const raw = Array.isArray(value) ? value.join(",") : cleanString(value);
  return new Set(raw.split(",").map(cleanString).filter(Boolean));
}

function fixtureDateOnly(iso?: string | null): string {
  return cleanString(iso).match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
}

function inferTripWindowFromKickoff(kickoffIso?: string | null): { from?: string; to?: string } {
  const dateOnly = fixtureDateOnly(kickoffIso);
  if (!dateOnly) return {};

  const start = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(start.getTime())) return {};

  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  const toIso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(
    end.getDate()
  ).padStart(2, "0")}`;

  return { from: dateOnly, to: toIso };
}

function buildCanonicalTripStartParams(args: {
  fixtureId: string;
  leagueId?: number | string | null;
  season?: number | string | null;
  city?: string | null;
  kickoffIso?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  const fallbackWindow = inferTripWindowFromKickoff(args.kickoffIso);

  return {
    fixtureId: cleanString(args.fixtureId),
    ...(cleanString(args.from) ? { from: cleanString(args.from) } : fallbackWindow.from ? { from: fallbackWindow.from } : {}),
    ...(cleanString(args.to) ? { to: cleanString(args.to) } : fallbackWindow.to ? { to: fallbackWindow.to } : {}),
    ...(cleanString(args.leagueId) ? { leagueId: cleanString(args.leagueId) } : {}),
    ...(cleanString(args.season) ? { season: cleanString(args.season) } : {}),
    ...(cleanString(args.city) ? { city: cleanString(args.city) } : {}),
  };
}

function Surface({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "brand" | "gold" | "neutral";
}) {
  return (
    <GlassCard
      variant={tone === "gold" ? "gold" : tone === "brand" ? "brand" : "glass"}
      level="default"
      style={styles.surface}
      padding={12}
    >
      {children}
    </GlassCard>
  );
}

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as RouteParams;

  const {
    effectiveRange,
    isRange,
    stripDays,
    selectedDay,
    selectedLeagueIds,
    selectedLeagues,
    toggleLeague,
    selectSingleLeague,
    resetToFeatured,
    query,
    setQuery,
    followedIdSet,
    loading,
    error,
    filtered,
    onToggleFollowFromRow,
    calendarOpen,
    openCalendar,
    closeCalendar,
    calMonthYear,
    calGrid,
    calNorm,
    calIsRange,
    calPrevMonth,
    calNextMonth,
    calInRange,
    calIsEdge,
    onCalendarTapDay,
    applyCalendar,
    clearCalendarRange,
    onTapStripDate,
    titleText,
    subtitleText,
    helperLineText,
    headerDateLine,
    monthLabel,
  } = useFixturesScreenData();

  const comboMode = getSingleParam(params?.comboMode) === "1";
  const comboTitle = getSingleParam(params?.comboTitle);
  const comboIdSet = useMemo(() => getCsvParamSet(params?.comboIds), [params]);

  const minIso = useMemo(() => tomorrowIsoUtc(), []);
  const maxIso = useMemo(() => addDaysIsoUtc(minIso, DAYS_AHEAD - 1), [minIso]);

  const visibleRows = useMemo(() => {
    if (!comboMode || comboIdSet.size === 0) return filtered;
    return filtered.filter((item) => comboIdSet.has(String(item?.fixture?.id ?? "")));
  }, [filtered, comboMode, comboIdSet]);

  const selectedLeagueBackdrop = useMemo(() => {
    if (selectedLeagueIds.length === 1) return getLeagueBackdropUrl(selectedLeagueIds[0]);
    return getLeagueBackdropUrl(39);
  }, [selectedLeagueIds]);

  const derivedTitleText = comboMode ? comboTitle || "Multi-match trip" : titleText;
  const derivedSubtitleText = comboMode ? "Selected fixtures for a stacked football trip." : subtitleText;
  const derivedHelperLineText = comboMode
    ? `${visibleRows.length} selected fixture${visibleRows.length === 1 ? "" : "s"} • open one to build the trip around it`
    : helperLineText;
  const derivedHeaderDateLine = comboMode ? `${headerDateLine} • combo view` : headerDateLine;

  const goMatch = useCallback(
    (id: string, ctx?: { leagueId?: number | null; season?: number | null }) => {
      const fid = cleanString(id);
      if (!fid) return;

      router.push({
        pathname: "/match/[id]",
        params: {
          id: fid,
          from: effectiveRange.from,
          to: effectiveRange.to,
          ...(ctx?.leagueId ? { leagueId: String(ctx.leagueId) } : {}),
          ...(ctx?.season ? { season: String(ctx.season) } : {}),
        },
      } as never);
    },
    [router, effectiveRange.from, effectiveRange.to]
  );

  const goTripOrBuild = useCallback(
    (
      fixtureId: string,
      ctx?: { leagueId?: number | null; season?: number | null; city?: string | null; kickoffIso?: string | null }
    ) => {
      const fid = cleanString(fixtureId);
      if (!fid) return;

      const existingTripId = resolveTripForFixture(fid);
      if (existingTripId) {
        router.push({ pathname: "/trip/[id]", params: { id: existingTripId } } as never);
        return;
      }

      router.push({
        pathname: "/trip/build",
        params: buildCanonicalTripStartParams({
          fixtureId: fid,
          leagueId: ctx?.leagueId ?? null,
          season: ctx?.season ?? null,
          city: ctx?.city ?? null,
          kickoffIso: ctx?.kickoffIso ?? null,
          from: effectiveRange.from,
          to: effectiveRange.to,
        }),
      } as never);
    },
    [router, effectiveRange.from, effectiveRange.to]
  );

  const hasRows = visibleRows.length > 0;
  const showInitialLoading = loading && !hasRows;
  const showInlineRefresh = loading && hasRows;
  const showHardError = !!error && !hasRows;
  const showEmpty = !loading && !error && !hasRows;

  const headerComponent = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <Surface tone={comboMode ? "gold" : "brand"}>
          <FixturesHeader
            query={query}
            setQuery={setQuery}
            stripDays={stripDays}
            isRange={isRange}
            selectedDay={selectedDay}
            onTapStripDate={onTapStripDate}
            openCalendar={openCalendar}
            selectedLeagueIds={selectedLeagueIds}
            selectedLeagues={selectedLeagues}
            toggleLeague={toggleLeague}
            selectSingleLeague={selectSingleLeague}
            resetToFeatured={resetToFeatured}
          />
        </Surface>

        <View style={styles.contextWrap}>
          <Text style={styles.pageTitle}>{derivedTitleText}</Text>
          <Text style={styles.pageSubtitle}>{derivedSubtitleText}</Text>
          <Text style={styles.pageMeta}>{derivedHeaderDateLine}</Text>
        </View>

        {showInlineRefresh ? (
          <View style={styles.refreshRow}>
            <GlassCard variant="glass" level="default" style={styles.refreshCard}>
              <ActivityIndicator size="small" color={theme.colors.textSecondary} />
              <Text style={styles.refreshText}>Refreshing live fixtures…</Text>
            </GlassCard>
          </View>
        ) : null}

        {!showInitialLoading && !showHardError ? (
          <View style={styles.summaryRow}>
            <GlassCard variant={comboMode ? "gold" : "brand"} level="default" style={styles.summaryCard}>
              <Text style={styles.summaryEyebrow}>{comboMode ? "Combo mode" : "Live fixture pool"}</Text>
              <Text style={styles.summaryTitle}>
                {visibleRows.length} fixture{visibleRows.length === 1 ? "" : "s"} in view
              </Text>
              <Text style={styles.summaryText}>{derivedHelperLineText}</Text>
            </GlassCard>
          </View>
        ) : null}
      </View>
    ),
    [
      comboMode,
      query,
      setQuery,
      stripDays,
      isRange,
      selectedDay,
      onTapStripDate,
      openCalendar,
      selectedLeagueIds,
      selectedLeagues,
      toggleLeague,
      selectSingleLeague,
      resetToFeatured,
      derivedTitleText,
      derivedSubtitleText,
      derivedHeaderDateLine,
      derivedHelperLineText,
      showInlineRefresh,
      showInitialLoading,
      showHardError,
      visibleRows.length,
    ]
  );

  const emptyComponent = useMemo(() => {
    if (showInitialLoading) {
      return (
        <View style={[styles.content, styles.listWrap]}>
          <GlassCard variant="brand" level="default" style={styles.loadingCard}>
            <View style={styles.center}>
              <Text style={styles.loadingEyebrow}>Live scan</Text>
              <ActivityIndicator color={theme.colors.gold} />
              <Text style={styles.loadingTitle}>Loading fixtures</Text>
              <Text style={styles.loadingText}>
                Pulling the strongest current match options from the selected range.
              </Text>
            </View>
          </GlassCard>
        </View>
      );
    }

    if (showHardError) {
      return (
        <View style={[styles.content, styles.listWrap]}>
          <GlassCard variant="gold" level="default" style={styles.stateCard}>
            <EmptyState title="Fixtures unavailable" message={error ?? "Failed to load fixtures."} iconName="alert-circle" />
          </GlassCard>
        </View>
      );
    }

    if (showEmpty) {
      return (
        <View style={[styles.content, styles.listWrap]}>
          <GlassCard variant="glass" level="default" style={styles.stateCard}>
            <EmptyState
              title={comboMode ? "No combo fixtures found" : "No matches found"}
              message={
                comboMode
                  ? "This stacked trip no longer matches the current fixture view. Widen the date range or reopen it from Discover."
                  : "Try another date, another league, or a wider range."
              }
              iconName={comboMode ? "git-compare" : "search"}
            />
          </GlassCard>
        </View>
      );
    }

    return null;
  }, [showInitialLoading, showHardError, showEmpty, error, comboMode]);

  const renderRow = useCallback(
    ({ item, index }: { item: RankedFixtureRow; index: number }) => {
      const fixtureId = String(item?.fixture?.id ?? "");
      const isFollowed = fixtureId ? followedIdSet.has(fixtureId) : false;
      const leagueId = item?.league?.id ?? null;
      const season = typeof (item?.league as { season?: unknown } | undefined)?.season === "number"
        ? (item.league as { season: number }).season
        : null;
      const city = cleanString(item?.fixture?.venue?.city);
      const kickoffIso = cleanString(item?.fixture?.date);

      return (
        <FixtureRowCard
          key={`${fixtureId || index}`}
          item={item}
          expanded={false}
          isFollowed={isFollowed}
          onToggleFollow={() => onToggleFollowFromRow(item)}
          onPressMatch={goMatch}
          onPressBuildTrip={(id: string) =>
            goTripOrBuild(id, {
              leagueId,
              season,
              city: city || null,
              kickoffIso: kickoffIso || null,
            })
          }
        />
      );
    },
    [followedIdSet, onToggleFollowFromRow, goMatch, goTripOrBuild]
  );

  return (
    <Background
      imageUrl={selectedLeagueBackdrop}
      overlayOpacity={0.58}
      topShadeOpacity={0.28}
      bottomShadeOpacity={0.58}
      centerShadeOpacity={0.08}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <FlatList
          data={showHardError || showInitialLoading || showEmpty ? [] : visibleRows}
          keyExtractor={(item, index) => `${item?.league?.id ?? "L"}-${item?.fixture?.id ?? `row-${index}`}`}
          renderItem={renderRow}
          ListHeaderComponent={headerComponent}
          ListEmptyComponent={emptyComponent}
          ListFooterComponent={hasRows ? <View style={styles.footerSpace} /> : null}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
        />

        <FixturesCalendarModal
          visible={calendarOpen}
          onClose={closeCalendar}
          subtitle={calIsRange ? `Range: ${calNorm.from} → ${calNorm.to}` : `Day: ${calNorm.from}`}
          monthText={monthLabel(calMonthYear.y, calMonthYear.m0)}
          grid={calGrid}
          minIso={minIso}
          maxIso={maxIso}
          calIsRange={calIsRange}
          calInRange={calInRange}
          calIsEdge={calIsEdge}
          onPrevMonth={calPrevMonth}
          onNextMonth={calNextMonth}
          onTapDay={onCalendarTapDay}
          onClearRange={clearCalendarRange}
          onApply={applyCalendar}
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flatListContent: { paddingBottom: theme.spacing.xl },
  headerWrap: { paddingTop: 2, gap: 12 },
  content: { paddingHorizontal: theme.spacing.lg },
  listWrap: { gap: 12 },
  surface: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.sheet,
  },
  contextWrap: {
    paddingHorizontal: theme.spacing.lg,
    gap: 4,
  },
  pageTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.h1,
    lineHeight: 29,
    fontWeight: theme.fontWeight.black,
  },
  pageSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.meta,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },
  pageMeta: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.tiny,
    lineHeight: 15,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },
  summaryRow: { paddingHorizontal: theme.spacing.lg },
  summaryCard: {
    gap: 6,
    borderRadius: 22,
    padding: 15,
  },
  summaryEyebrow: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.tiny,
    lineHeight: 14,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  summaryTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.fontSize.body,
    lineHeight: 20,
    fontWeight: theme.fontWeight.black,
  },
  summaryText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },
  refreshRow: { paddingHorizontal: theme.spacing.lg },
  refreshCard: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.fontWeight.bold,
  },
  loadingCard: {
    borderRadius: 22,
    padding: 18,
  },
  stateCard: {
    borderRadius: 22,
    padding: 12,
  },
  center: {
    paddingVertical: 14,
    alignItems: "center",
    gap: 10,
  },
  loadingEyebrow: {
    color: theme.colors.emeraldSoft,
    fontSize: theme.fontSize.tiny,
    lineHeight: 14,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },
  loadingTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: theme.fontWeight.black,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
    maxWidth: 280,
  },
  footerSpace: { height: 8 },
});
