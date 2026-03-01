// app/trip/build.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import tripsStore from "@/src/state/trips";

import { LEAGUES, addDaysIso, clampFromIsoToTomorrow } from "@/src/constants/football";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

/* -------------------------------------------------------------------------- */
/* Param helpers                                                             */
/* -------------------------------------------------------------------------- */

function paramString(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || null;
  return null;
}

/* -------------------------------------------------------------------------- */
/* Fixture helpers                                                           */
/* -------------------------------------------------------------------------- */

function fixtureIdStr(r: any): string {
  const id = r?.fixture?.id;
  return id != null ? String(id) : "";
}

function fixtureDateOnly(r: FixtureListRow | null): string | null {
  const raw = r?.fixture?.date;
  if (!raw) return null;
  const m = String(raw).match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

function clean(v: any) {
  return String(v ?? "").trim();
}

/* -------------------------------------------------------------------------- */
/* Timeline builder                                                          */
/* -------------------------------------------------------------------------- */

function buildTimeline(
  fixture: FixtureListRow | null,
  startIso: string,
  endIso: string
) {
  if (!fixture || !fixture.fixture?.date) return [];

  const kickoff = new Date(fixture.fixture.date);
  const kickoffIso = kickoff.toISOString().slice(0, 10);

  const days: { iso: string; label: string }[] = [];

  const d0 = new Date(startIso);
  const d1 = new Date(endIso);

  for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);

    if (iso === kickoffIso) {
      const home = clean(fixture.teams?.home?.name);
      const away = clean(fixture.teams?.away?.name);
      days.push({ iso, label: `Match: ${home} vs ${away}` });
    } else if (iso === startIso) {
      days.push({ iso, label: "Arrival" });
    } else if (iso === endIso) {
      days.push({ iso, label: "Departure" });
    } else {
      days.push({ iso, label: "Stay / explore" });
    }
  }

  return days;
}

function formatDay(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                    */
/* -------------------------------------------------------------------------- */

export default function TripBuildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const routeFixtureId = useMemo(
    () => paramString((params as any)?.fixtureId),
    [params]
  );

  const isPrefilledFlow = !!routeFixtureId;

  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<FixtureListRow | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(14);

  const [startIso, setStartIso] = useState(
    clampFromIsoToTomorrow(new Date().toISOString().slice(0, 10))
  );
  const [endIso, setEndIso] = useState(addDaysIso(startIso, 2));

  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* Prefill fixture                                                    */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!routeFixtureId) return;

    let cancelled = false;

    (async () => {
      try {
        const fx = await getFixtureById(routeFixtureId);
        if (cancelled) return;

        setSelectedFixture(fx);

        const d0 = fixtureDateOnly(fx);
        if (d0) {
          const start = clampFromIsoToTomorrow(d0);
          setStartIso(start);
          setEndIso(addDaysIso(start, 2));
        }
      } catch {
        if (!cancelled) setError("Couldn’t load that fixture.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeFixtureId]);

  /* ------------------------------------------------------------------ */
  /* Load fixtures                                                      */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (isPrefilledFlow) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const from = clampFromIsoToTomorrow(
          new Date().toISOString().slice(0, 10)
        );
        const to = addDaysIso(from, 30);

        const batches = await Promise.all(
          LEAGUES.map((l) =>
            getFixtures({
              league: l.leagueId,
              season: l.season,
              from,
              to,
            })
          )
        );

        if (!cancelled) setRows(batches.flat());
      } catch {
        if (!cancelled) setError("Failed to load fixtures.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPrefilledFlow]);

  /* ------------------------------------------------------------------ */
  /* Timeline                                                           */
  /* ------------------------------------------------------------------ */

  const timeline = useMemo(
    () => buildTimeline(selectedFixture, startIso, endIso),
    [selectedFixture, startIso, endIso]
  );

  /* ------------------------------------------------------------------ */
  /* Save                                                               */
  /* ------------------------------------------------------------------ */

  const onSave = useCallback(async () => {
    if (!selectedFixture?.fixture?.id) {
      setError("Select a match first.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (!tripsStore.getState().loaded) await tripsStore.loadTrips();

      const snap = {
        fixtureIdPrimary: String(selectedFixture.fixture.id),
        displayCity: clean(selectedFixture?.fixture?.venue?.city),
        homeName: clean(selectedFixture?.teams?.home?.name),
        awayName: clean(selectedFixture?.teams?.away?.name),
        leagueName: clean(selectedFixture?.league?.name),
        kickoffIso: selectedFixture?.fixture?.date,
        venueName: clean(selectedFixture?.fixture?.venue?.name),
        venueCity: clean(selectedFixture?.fixture?.venue?.city),
      };

      const trip = await tripsStore.addTrip({
        fixtureIdPrimary: snap.fixtureIdPrimary,
        matchIds: [snap.fixtureIdPrimary],
        displayCity: snap.displayCity,
        homeName: snap.homeName,
        awayName: snap.awayName,
        leagueName: snap.leagueName,
        kickoffIso: snap.kickoffIso,
        venueName: snap.venueName,
        venueCity: snap.venueCity,
        startDate: startIso,
        endDate: endIso,
        notes,
      });

      router.replace({ pathname: "/trip/[id]", params: { id: trip.id } } as any);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }, [selectedFixture, startIso, endIso, notes, router]);

  /* ------------------------------------------------------------------ */
  /* Filter                                                             */
  /* ------------------------------------------------------------------ */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const h = clean(r?.teams?.home?.name).toLowerCase();
      const a = clean(r?.teams?.away?.name).toLowerCase();
      const c = clean(r?.fixture?.venue?.city).toLowerCase();
      return h.includes(q) || a.includes(q) || c.includes(q);
    });
  }, [rows, search]);

  const visibleRows = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  /* ------------------------------------------------------------------ */
  /* UI                                                                 */
  /* ------------------------------------------------------------------ */

  return (
    <Background imageSource={getBackground("trips")} overlayOpacity={0.86}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Plan trip",
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
        >
          {/* Timeline */}
          {selectedFixture && timeline.length > 0 && (
            <GlassCard>
              <Text style={styles.timelineTitle}>Trip timeline</Text>

              {timeline.map((d) => (
                <View key={d.iso} style={styles.timelineRow}>
                  <Text style={styles.timelineDate}>{formatDay(d.iso)}</Text>
                  <Text style={styles.timelineLabel}>{d.label}</Text>
                </View>
              ))}
            </GlassCard>
          )}

          {loading && (
            <GlassCard>
              <ActivityIndicator />
              <Text style={{ color: theme.colors.textSecondary }}>
                Loading fixtures…
              </Text>
            </GlassCard>
          )}

          {!loading && (
            <GlassCard>
              <Text style={{ fontWeight: "900", color: theme.colors.text }}>
                Pick a match
              </Text>

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search team / city"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.search}
              />

              {visibleRows.map((r) => {
                const id = fixtureIdStr(r);
                const selected = fixtureIdStr(selectedFixture) === id;
                const home = r?.teams?.home?.name;
                const away = r?.teams?.away?.name;

                return (
                  <Pressable
                    key={id}
                    onPress={() => setSelectedFixture(r)}
                    style={[
                      styles.row,
                      selected && { borderColor: theme.colors.primary },
                    ]}
                  >
                    <Text style={styles.rowTitle}>
                      {home} vs {away}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {formatUkDateTimeMaybe(r?.fixture?.date) ||
                        "Kickoff TBC"}
                    </Text>
                  </Pressable>
                );
              })}
            </GlassCard>
          )}

          <Pressable
            onPress={onSave}
            disabled={!selectedFixture || saving}
            style={[
              styles.saveBtn,
              (!selectedFixture || saving) && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.saveText}>
              {saving ? "Saving…" : "Save trip"}
            </Text>
          </Pressable>

          {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  search: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
  },

  row: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  rowTitle: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  rowMeta: {
    color: theme.colors.textSecondary,
  },

  saveBtn: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: "center",
  },

  saveText: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  timelineTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 8,
  },

  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  timelineDate: {
    color: theme.colors.textSecondary,
    fontWeight: "700",
  },

  timelineLabel: {
    color: theme.colors.text,
    fontWeight: "700",
  },
});
