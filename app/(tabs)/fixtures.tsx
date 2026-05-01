// app/(tabs)/fixtures.tsx
import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import EmptyState from "@/src/components/EmptyState";
import GlassCard from "@/src/components/GlassCard";

import { theme } from "@/src/constants/theme";

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
    ...(cleanString(args.from)
      ? { from: cleanString(args.from) }
      : fallbackWindow.from
        ? { from: fallbackWindow.from }
        : {}),
    ...(cleanString(args.to)
      ? { to: cleanString(args.to) }
      : fallbackWindow.to
        ? { to: fallbackWindow.to }
        : {}),
    ...(cleanString(args.leagueId) ? { leagueId: cleanString(args.leagueId) } : {}),
    ...(cleanString(args.season) ? { season: cleanString(args.season) } : {}),
    ...(cleanString(args.city) ? { city: cleanString(args.city) } : {}),
  };
}

export default function FixturesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams() as RouteParams;

  const {
    effectiveRange,
    isRange,
    stripDays,
    selectedDay,

    allLeagues,
    selectedLeagueIds,
    selectedLeagues,
    toggleLeague,
    selectSingleLeague,
    selectAllLeagues,
    clearLeagues,
    resetToFeatured,
    competitionSummaryText,

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
    matchesSummaryTitle,
    matchesSummaryLine,
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

  const derivedTitleText = comboMode ? comboTitle || "Multi-match trip" : titleText;
  const derivedSubtitleText = comboMode
    ? "Selected fixtures for a stacked football trip."
    : subtitleText;

  const derivedSummaryTitle = comboMode
    ? `${visibleRows.length} selected match${visibleRows.length === 1 ? "" : "es"}`
    : matchesSummaryTitle;

  const derivedSummaryLine = comboMode
    ? `${headerDateLine} • Combo view`
    : matchesSummaryLine || helperLineText;

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
      ctx?: {
        leagueId?: number | null;
        season?: number | null;
        city?: string | null;
        kickoffIso?: string | null;
      }
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
        <GlassCard variant="glass" level="default" style={styles.headerCard} padding={14}>
          <FixturesHeader
            query={query}
            setQuery={setQuery}
            stripDays={stripDays}
            isRange={isRange}
            selectedDay={selectedDay}
            onTapStripDate={onTapStripDate}
            openCalendar={openCalendar}
            allLeagues={allLeagues}
            selectedLeagueIds={selectedLeagueIds}
            selectedLeagues={selectedLeagues}
            toggleLeague={toggleLeague}
            selectSingleLeague={selectSingleLeague}
            selectAllLeagues={selectAllLeagues}
            clearLeagues={clearLeagues}
            resetToFeatured={resetToFeatured}
            competitionSummaryText={competitionSummaryText}
            titleText={derivedTitleText}
            subtitleText={derivedSubtitleText}
            helperLineText={helperLineText}
            headerDateLine={headerDateLine}
            loading={showInlineRefresh}
            error={error}
            filteredCount={visibleRows.length}
          />
        </GlassCard>

        {!showInitialLoading && !showHardError ? (
          <View style={styles.summaryRow}>
            <GlassCard variant="brand" level="default" style={styles.summaryCard} padding={13}>
              <Text style={styles.summaryTitle}>{derivedSummaryTitle}</Text>
              <Text style={styles.summaryText}>{derivedSummaryLine}</Text>
            </GlassCard>
          </View>
        ) : null}

        {showInlineRefresh ? (
          <View style={styles.refreshRow}>
            <GlassCard variant="glass" level="default" style={styles.refreshCard}>
              <ActivityIndicator size="small" color={theme.colors.textSecondary} />
              <Text style={styles.refreshText}>Updating matches…</Text>
            </GlassCard>
          </View>
        ) : null}
      </View>
    ),
    [
      query,
      setQuery,
      stripDays,
      isRange,
      selectedDay,
      onTapStripDate,
      openCalendar,
      allLeagues,
      selectedLeagueIds,
      selectedLeagues,
      toggleLeague,
      selectSingleLeague,
      selectAllLeagues,
      clearLeagues,
      resetToFeatured,
      competitionSummaryText,
      derivedTitleText,
      derivedSubtitleText,
      helperLineText,
      headerDateLine,
      showInlineRefresh,
      error,
      visibleRows.length,
      showInitialLoading,
      showHardError,
      derivedSummaryTitle,
      derivedSummaryLine,
    ]
  );

  const emptyComponent = useMemo(() => {
    if (showInitialLoading) {
      return (
        <View style={[styles.content, styles.listWrap]}>
          <GlassCard variant="brand" level="default" style={styles.loadingCard}>
            <View style={styles.center}>
              <Text style={styles.loadingEyebrow}>Finding matches</Text>
              <ActivityIndicator color={theme.colors.gold} />
              <Text style={styles.loadingTitle}>Loading fixtures</Text>
              <Text style={styles.loadingText}>
                Checking the selected dates and competitions.
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
            <EmptyState
              title="Fixtures unavailable"
              message={error ?? "Failed to load fixtures."}
              iconName="alert-circle"
            />
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
                  ? "This saved trip view no longer matches the current filters. Widen the dates or reopen it from Discover."
                  : "Try another date, search term, or competition."
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
      const season =
        typeof (item?.league as { season?: unknown } | undefined)?.season === "number"
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
      mode="solid"
      solidColor={theme.colors.bgBase}
      overlayOpacity={0.42}
      topShadeOpacity={0.22}
      bottomShadeOpacity={0.46}
      centerShadeOpacity={0.06}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <FlatList
          data={showHardError || showInitialLoading || showEmpty ? [] : visibleRows}
          keyExtractor={(item, index) =>
            `${item?.league?.id ?? "L"}-${item?.fixture?.id ?? `row-${index}`}`
          }
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
  container: {
    flex: 1,
  },

  flatListContent: {
    paddingBottom: theme.spacing.xl,
  },

  headerWrap: {
    paddingTop: 2,
    gap: 12,
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
  },

  listWrap: {
    gap: 12,
  },

  headerCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.sheet,
  },

  summaryRow: {
    paddingHorizontal: theme.spacing.lg,
  },

  summaryCard: {
    gap: 4,
    borderRadius: 20,
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
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  refreshRow: {
    paddingHorizontal: theme.spacing.lg,
  },

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

  footerSpace: {
    height: 8,
  },
});
