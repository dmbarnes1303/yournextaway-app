import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import EmptyState from "@/src/components/EmptyState";

import { theme } from "@/src/constants/theme";
import { getBackground } from "@/src/constants/backgrounds";

import { tomorrowIsoUtc, DAYS_AHEAD, addDaysIsoUtc } from "@/src/features/fixtures/date";
import { resolveTripForFixture } from "@/src/features/fixtures/helpers";
import FixturesHeader from "@/src/features/fixtures/FixturesHeader";
import FixtureRowCard from "@/src/features/fixtures/FixtureRowCard";
import FixturesCalendarModal from "@/src/features/fixtures/FixturesCalendarModal";
import { useFixturesScreenData } from "@/src/features/fixtures/useFixturesScreenData";
import type { RankedFixtureRow } from "@/src/features/fixtures/types";

export default function FixturesScreen() {
  const router = useRouter();

  const {
    effectiveRange,
    isRange,
    stripDays,

    selectedDay,
    selectedLeagueIds,
    selectedLeagues,
    activeRegion,
    setActiveRegion,
    leaguesByRegion,
    toggleLeague,
    selectSingleLeague,
    resetToFeatured,

    query,
    setQuery,

    followedIdSet,
    loading,
    error,
    filtered,
    expandedKey,
    setExpandedKey,
    placeholderIds,
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

  const minIso = useMemo(() => tomorrowIsoUtc(), []);
  const maxIso = useMemo(() => addDaysIsoUtc(minIso, DAYS_AHEAD - 1), [minIso]);

  const goMatch = useCallback(
    (id: string, ctx?: { leagueId?: number | null; season?: number | null }) => {
      const fid = String(id ?? "").trim();
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
      } as any);
    },
    [router, effectiveRange.from, effectiveRange.to]
  );

  const goTripOrBuild = useCallback(
    (fixtureId: string, ctx?: { leagueId?: number | null; season?: number | null }) => {
      const fid = String(fixtureId ?? "").trim();
      if (!fid) return;

      const existingTripId = resolveTripForFixture(fid);

      if (existingTripId) {
        router.push({ pathname: "/trip/[id]", params: { id: existingTripId } } as any);
        return;
      }

      router.push({
        pathname: "/trip/build",
        params: {
          fixtureId: fid,
          from: effectiveRange.from,
          to: effectiveRange.to,
          ...(ctx?.leagueId ? { leagueId: String(ctx.leagueId) } : {}),
          ...(ctx?.season ? { season: String(ctx.season) } : {}),
        },
      } as any);
    },
    [router, effectiveRange.from, effectiveRange.to]
  );

  const bg = useMemo(() => getBackground("fixtures"), []);
  const bgProps =
    typeof bg === "string"
      ? ({ imageUrl: bg } as const)
      : ({ imageSource: bg } as const);

  return (
    <Background {...bgProps} overlayOpacity={0}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <FlatList
          data={loading || error ? [] : filtered}
          keyExtractor={(item, index) => {
            const fid =
              item?.fixture?.id != null ? String(item.fixture.id) : `row-${index}`;
            const lid = item?.league?.id != null ? String(item.league.id) : "L";
            return `${lid}-${fid}`;
          }}
          renderItem={({ item }) => {
            const fixtureId = item?.fixture?.id != null ? String(item.fixture.id) : "";
            const rowKey = `${String(item?.league?.id ?? "L")}-${fixtureId}`;
            const expanded = expandedKey === rowKey;
            const isFollowed = followedIdSet.has(fixtureId);

            return (
              <FixtureRowCard
                item={item}
                expanded={expanded}
                isFollowed={isFollowed}
                placeholderIds={placeholderIds}
                onToggleExpanded={() => setExpandedKey(expanded ? null : rowKey)}
                onToggleFollow={() => onToggleFollowFromRow(item as RankedFixtureRow)}
                onPressMatch={goMatch}
                onPressBuildTrip={goTripOrBuild}
              />
            );
          }}
          ListHeaderComponent={
            <FixturesHeader
              titleText={titleText}
              subtitleText={subtitleText}
              headerDateLine={headerDateLine}
              query={query}
              setQuery={setQuery}
              stripDays={stripDays}
              isRange={isRange}
              selectedDay={selectedDay}
              onTapStripDate={onTapStripDate}
              selectedLeagueIds={selectedLeagueIds}
              resetToFeatured={resetToFeatured}
              selectSingleLeague={selectSingleLeague}
              activeRegion={activeRegion}
              setActiveRegion={setActiveRegion}
              leaguesByRegion={leaguesByRegion}
              toggleLeague={toggleLeague}
              selectedLeagues={selectedLeagues}
              helperLineText={helperLineText}
              loading={loading}
              error={error}
              filteredCount={filtered.length}
              openCalendar={openCalendar}
            />
          }
          ListEmptyComponent={
            <View style={[styles.content, styles.listWrap]}>
              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator />
                </View>
              ) : null}

              {!loading && error ? (
                <EmptyState title="Error" message={error} iconName="alert-circle" />
              ) : null}

              {!loading && !error ? (
                <EmptyState
                  title="No matches found"
                  message="Try another date, another region, or a different league selection."
                  iconName="search"
                />
              ) : null}
            </View>
          }
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
        />

        <FixturesCalendarModal
          visible={calendarOpen}
          onClose={closeCalendar}
          subtitle={
            calIsRange ? `Range: ${calNorm.from} → ${calNorm.to}` : `Day: ${calNorm
