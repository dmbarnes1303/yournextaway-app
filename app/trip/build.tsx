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
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";

import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import tripsStore from "@/src/state/trips";

import { LEAGUES } from "@/src/constants/football";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

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
  const [selectedFixture, setSelectedFixture] = useState<FixtureListRow | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------------------------------------------ */
  /* Prefill from fixture route                                         */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!routeFixtureId) return;

    let cancelled = false;

    (async () => {
      try {
        const fx = await getFixtureById(routeFixtureId);
        if (!cancelled) setSelectedFixture(fx);
      } catch {
        if (!cancelled) setError("Couldn’t load that fixture.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [routeFixtureId]);

  /* ------------------------------------------------------------------ */
  /* Load fixtures list (only if NOT prefilled)                         */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (isPrefilledFlow) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const batches = await Promise.all(
          LEAGUES.map((l) =>
            getFixtures({
              league: l.leagueId,
              season: l.season,
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
  /* Save trip                                                          */
  /* ------------------------------------------------------------------ */

  const onSave = useCallback(async () => {
    if (!selectedFixture?.fixture?.id) {
      setError("Select a match first.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const t = await tripsStore.addTrip({
        fixtureIdPrimary: String(selectedFixture.fixture.id),
        homeName: selectedFixture.teams?.home?.name,
        awayName: selectedFixture.teams?.away?.name,
        leagueName: selectedFixture.league?.name,
        venueName: selectedFixture.fixture?.venue?.name,
        venueCity: selectedFixture.fixture?.venue?.city,
        kickoffIso: selectedFixture.fixture?.date,
        displayCity: selectedFixture.fixture?.venue?.city,
      });

      router.replace({
        pathname: "/trip/[id]",
        params: { id: t.id },
      } as any);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }, [selectedFixture, router]);

  /* ------------------------------------------------------------------ */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const h = String(r?.teams?.home?.name ?? "").toLowerCase();
      const a = String(r?.teams?.away?.name ?? "").toLowerCase();
      const c = String(r?.fixture?.venue?.city ?? "").toLowerCase();
      return h.includes(q) || a.includes(q) || c.includes(q);
    });
  }, [rows, search]);

  /* ------------------------------------------------------------------ */

  function FixtureCard({ r }: { r: FixtureListRow }) {
    const home = r?.teams?.home?.name;
    const away = r?.teams?.away?.name;

    return (
      <Pressable
        onPress={() => setSelectedFixture(r)}
        style={({ pressed }) => [
          styles.fixtureCard,
          selectedFixture &&
            fixtureIdStr(selectedFixture) === fixtureIdStr(r) &&
            styles.fixtureSelected,
          pressed && { opacity: 0.9 },
        ]}
      >
        <Text style={styles.fixtureTeams}>
          {home} vs {away}
        </Text>
        <Text style={styles.fixtureMeta}>
          {formatUkDateTimeMaybe(r?.fixture?.date) || "Kickoff TBC"}
        </Text>
      </Pressable>
    );
  }

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
          {/* ---------- Prefilled fixture ---------- */}
          {isPrefilledFlow && selectedFixture && (
            <GlassCard>
              <Text style={styles.sectionTitle}>Selected match</Text>
              <FixtureCard r={selectedFixture} />
            </GlassCard>
          )}

          {/* ---------- Manual picker ---------- */}
          {!isPrefilledFlow && (
            <GlassCard>
              <Text style={styles.sectionTitle}>Pick a match</Text>

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search team / city"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.search}
              />

              {loading && <ActivityIndicator style={{ marginTop: 12 }} />}

              {!loading && filtered.slice(0, 20).map((r) => (
                <FixtureCard key={fixtureIdStr(r)} r={r} />
              ))}
            </GlassCard>
          )}

          {/* ---------- Save ---------- */}
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

const styles = StyleSheet.create({
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    marginBottom: 8,
  },

  search: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
  },

  fixtureCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  fixtureSelected: {
    borderColor: theme.colors.primary,
  },

  fixtureTeams: {
    color: theme.colors.text,
    fontWeight: "900",
  },

  fixtureMeta: {
    color: theme.colors.textSecondary,
    marginTop: 4,
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
});
