// app/trip/build.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import tripsStore, { type Trip } from "@/src/state/trips";

import { LEAGUES, addDaysIso, clampFromIsoToTomorrow, type LeagueOption } from "@/src/constants/football";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { computeLikelyPlaceholderTbcIds, isKickoffTbc } from "@/src/utils/kickoffTbc";

/* -------------------------------------------------------------------------- */
/* helpers */
/* -------------------------------------------------------------------------- */

function paramString(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || null;
  return null;
}

function fixtureIdStr(r: any): string {
  const id = r?.fixture?.id;
  return id != null ? String(id) : "";
}

function fixtureDateOnly(r: FixtureListRow | null): string | null {
  const raw = r?.fixture?.date;
  if (!raw) return null;
  const s = String(raw);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

/* -------------------------------------------------------------------------- */
/* screen */
/* -------------------------------------------------------------------------- */

export default function TripBuildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const routeTripId = useMemo(() => paramString((params as any)?.tripId), [params]);
  const isEditing = !!routeTripId;

  const routeFixtureId = useMemo(() => paramString((params as any)?.fixtureId), [params]);

  // If fixtureId is provided and we're NOT editing, this is the “Build trip from fixture” flow.
  const isPrefilledFlow = !!routeFixtureId && !isEditing;

  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [placeholderTbcIds, setPlaceholderTbcIds] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  const [selectedFixture, setSelectedFixture] = useState<FixtureListRow | null>(null);

  const [startIso, setStartIso] = useState(clampFromIsoToTomorrow(new Date().toISOString().slice(0, 10)));
  const [endIso, setEndIso] = useState(addDaysIso(startIso, 2));
  const [notes, setNotes] = useState("");

  /* -------------------------------------------------------------------------- */
  /* Load edit trip */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!routeTripId) return;

    let cancelled = false;

    async function run() {
      setPrefillLoading(true);

      if (!tripsStore.getState().loaded) await tripsStore.loadTrips();
      if (cancelled) return;

      const t = tripsStore.getState().trips.find((x) => x.id === routeTripId) ?? null;

      if (!t) {
        setError("Trip not found.");
        setPrefillLoading(false);
        return;
      }

      setStartIso(t.startDate);
      setEndIso(t.endDate);
      setNotes(t.notes ?? "");

      const mid = t.matchIds?.[0];
      if (mid) {
        const fx = await getFixtureById(String(mid));
        if (!cancelled) setSelectedFixture(fx);
      }

      setPrefillLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [routeTripId]);

  /* -------------------------------------------------------------------------- */
  /* Prefill fixture (new trip) */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!isPrefilledFlow) return;
    if (!routeFixtureId) return;

    let cancelled = false;

    async function run() {
      setPrefillLoading(true);
      setError(null);

      try {
        const r = await getFixtureById(routeFixtureId);
        if (cancelled) return;

        setSelectedFixture(r);

        const d0 = fixtureDateOnly(r);
        if (d0) {
          const start = clampFromIsoToTomorrow(d0);
          setStartIso(start);
          setEndIso(addDaysIso(start, 2));
        }
      } catch {
        if (!cancelled) setError("Couldn’t load that fixture.");
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [routeFixtureId, isPrefilledFlow]);

  /* -------------------------------------------------------------------------- */
  /* Fallback picker mode (only when NOT prefilled) */
  /* -------------------------------------------------------------------------- */

  const ALL_LEAGUES: LeagueOption & { key: string } = useMemo(
    () => ({
      label: "All leagues",
      leagueId: 0,
      season: LEAGUES[0].season,
      countryCode: "EU",
      key: "all",
    }),
    []
  );

  const leagueOptions = useMemo(() => [ALL_LEAGUES, ...LEAGUES], [ALL_LEAGUES]);

  const [selectedLeague, setSelectedLeague] = useState<LeagueOption>(ALL_LEAGUES);

  useEffect(() => {
    if (isEditing) return;
    if (isPrefilledFlow) return; // critical: do NOT load fixture lists in prefilled flow

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        // Small rolling window for picker only (tomorrow -> +30 days)
        const from = clampFromIsoToTomorrow(new Date().toISOString().slice(0, 10));
        const to = addDaysIso(from, 30);

        let res: FixtureListRow[] = [];

        if (selectedLeague.leagueId === 0) {
          const batches = await Promise.all(
            LEAGUES.map((l) => getFixtures({ league: l.leagueId, season: l.season, from, to }))
          );
          res = batches.flat();
        } else {
          res = (await getFixtures({ league: selectedLeague.leagueId, season: selectedLeague.season, from, to })) || [];
        }

        if (!cancelled) {
          res.sort((a, b) => String(a?.fixture?.date ?? "").localeCompare(String(b?.fixture?.date ?? "")));
          setRows(res);
          setPlaceholderTbcIds(computeLikelyPlaceholderTbcIds(res));
        }
      } catch {
        if (!cancelled) setError("Failed to load fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedLeague, isEditing, isPrefilledFlow]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const h = String(r?.teams?.home?.name ?? "").toLowerCase();
      const a = String(r?.teams?.away?.name ?? "").toLowerCase();
      const v = String(r?.fixture?.venue?.name ?? "").toLowerCase();
      const c = String(r?.fixture?.venue?.city ?? "").toLowerCase();
      return h.includes(q) || a.includes(q) || v.includes(q) || c.includes(q);
    });
  }, [rows, search]);

  const visibleRows = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  /* -------------------------------------------------------------------------- */
  /* Save trip */
  /* -------------------------------------------------------------------------- */

  async function onSave() {
    if (!selectedFixture?.fixture?.id) {
      setError("Select a fixture first.");
      return;
    }

    setSaving(true);
    setError(null);

    const fixtureId = String(selectedFixture.fixture.id);
    const city = String(selectedFixture?.fixture?.venue?.city ?? "").trim() || "Trip";

    const patch: Partial<Omit<Trip, "id">> = {
      cityId: city,
      matchIds: [fixtureId],
      startDate: startIso,
      endDate: endIso,
      notes: notes.trim(),
    };

    try {
      if (!tripsStore.getState().loaded) await tripsStore.loadTrips();

      if (isEditing && routeTripId) {
        await tripsStore.updateTrip(routeTripId, patch);
        router.replace({ pathname: "/trip/[id]", params: { id: routeTripId } } as any);
      } else {
        const t = await tripsStore.addTrip(patch as any);
        router.replace({ pathname: "/trip/[id]", params: { id: t.id } } as any);
      }
    } catch {
      setError("Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* UI */
  /* -------------------------------------------------------------------------- */

  const selectedTitle = useMemo(() => {
    const h = String(selectedFixture?.teams?.home?.name ?? "Home");
    const a = String(selectedFixture?.teams?.away?.name ?? "Away");
    return `${h} vs ${a}`;
  }, [selectedFixture]);

  const selectedKick = useMemo(() => {
    if (!selectedFixture) return "TBC";
    const tbc = isKickoffTbc(selectedFixture, placeholderTbcIds);
    if (tbc) return "TBC";
    return formatUkDateTimeMaybe(selectedFixture?.fixture?.date) || "TBC";
  }, [selectedFixture, placeholderTbcIds]);

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.86}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isEditing ? "Edit Trip" : "Build Trip",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: 100,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl + insets.bottom,
            gap: theme.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {(loading || prefillLoading) && (
            <GlassCard>
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading…</Text>
              </View>
            </GlassCard>
          )}

          {!prefillLoading && error && (
            <GlassCard>
              <EmptyState title="Problem" message={error} />
            </GlassCard>
          )}

          {/* Prefilled flow: show summary only (no picker) */}
          {isPrefilledFlow && !prefillLoading && selectedFixture ? (
            <GlassCard>
              <Text style={styles.h1}>Selected match</Text>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>{selectedTitle}</Text>
                <Text style={styles.summaryMeta}>{selectedKick}</Text>
                <Text style={styles.summaryMeta}>
                  {String(selectedFixture?.fixture?.venue?.name ?? "").trim() || "Venue TBC"}
                  {String(selectedFixture?.fixture?.venue?.city ?? "").trim()
                    ? ` • ${String(selectedFixture?.fixture?.venue?.city ?? "").trim()}`
                    : ""}
                </Text>
              </View>

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Anything you want to remember…"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.notes}
                multiline
              />
            </GlassCard>
          ) : null}

          {/* Picker mode (only if not prefilled and not editing prefilled) */}
          {!isPrefilledFlow && !prefillLoading && !error ? (
            <GlassCard>
              <Text style={styles.h1}>Pick a match</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 12 }}>
                {leagueOptions.map((l) => {
                  const active = l.leagueId === selectedLeague.leagueId;
                  return (
                    <Pressable
                      key={l.key ?? String(l.leagueId)}
                      onPress={() => setSelectedLeague(l)}
                      style={[styles.leaguePill, active && styles.leaguePillActive]}
                    >
                      <Text style={[styles.leaguePillText, active && styles.leaguePillTextActive]}>
                        {l.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <TextInput
                value={search}
                onChangeText={(t) => {
                  setSearch(t);
                  setVisibleCount(12);
                }}
                placeholder="Search team / venue / city"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.search}
              />

              {visibleRows.length === 0 && !loading ? (
                <EmptyState title="No fixtures" message="Try another league." />
              ) : null}

              {visibleRows.map((r, i) => {
                const id = fixtureIdStr(r);
                const home = r?.teams?.home?.name ?? "Home";
                const away = r?.teams?.away?.name ?? "Away";
                const selected = fixtureIdStr(selectedFixture) === id;

                const tbc = isKickoffTbc(r, placeholderTbcIds);
                const kick = tbc ? "TBC" : formatUkDateTimeMaybe(r?.fixture?.date) || "TBC";

                return (
                  <Pressable
                    key={id || String(i)}
                    onPress={() => setSelectedFixture(r)}
                    style={[styles.pickRow, selected && styles.pickRowSelected]}
                  >
                    <Text style={styles.rowTitle}>
                      {home} vs {away}
                    </Text>
                    <Text style={styles.rowMeta}>{kick}</Text>
                  </Pressable>
                );
              })}

              {visibleCount < filtered.length ? (
                <Pressable onPress={() => setVisibleCount((n) => n + 12)} style={styles.moreBtn}>
                  <Text style={styles.moreText}>Show more</Text>
                </Pressable>
              ) : null}

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Anything you want to remember…"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.notes}
                multiline
              />
            </GlassCard>
          ) : null}

          {/* Save */}
          <Pressable
            onPress={onSave}
            disabled={saving || prefillLoading}
            style={[styles.saveBtn, (saving || prefillLoading) && { opacity: 0.7 }]}
          >
            <Text style={styles.saveText}>{saving ? "Saving…" : isEditing ? "Update Trip" : "Save Trip"}</Text>
          </Pressable>

          {error ? <Text style={styles.err}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* styles */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  h1: {
    fontSize: theme.fontSize.lg,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 10,
  },

  summaryBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  summaryTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  summaryMeta: { color: theme.colors.textSecondary, marginTop: 6, fontWeight: "700" },

  label: {
    marginTop: 14,
    color: theme.colors.textSecondary,
    fontWeight: "800",
  },

  notes: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    minHeight: 84,
    textAlignVertical: "top",
  },

  leaguePill: {
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  leaguePillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  leaguePillText: { color: theme.colors.textSecondary, fontWeight: "900" },
  leaguePillTextActive: { color: theme.colors.text },

  search: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
  },

  center: { paddingVertical: 14, alignItems: "center", gap: 10 },
  muted: { color: theme.colors.textSecondary, fontWeight: "800" },

  pickRow: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  pickRowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  rowTitle: { color: theme.colors.text, fontWeight: "900" },
  rowMeta: { color: theme.colors.textSecondary, marginTop: 4, fontWeight: "800" },

  moreBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  moreText: { color: theme.colors.text, fontWeight: "900" },

  saveBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.55)",
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
  },
  saveText: { color: theme.colors.text, fontWeight: "900" },

  err: {
    marginTop: 10,
    color: "rgba(255,80,80,0.95)",
    fontWeight: "900",
  },
});
