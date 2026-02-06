import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import tripsStore, { type Trip } from "@/src/state/trips";

import {
  LEAGUES,
  getRollingWindowIso,
  toIsoDate,
  parseIsoDateOnly,
  addDaysIso,
  clampFromIsoToTomorrow,
  normalizeWindowIso,
  type LeagueOption,
} from "@/src/constants/football";

import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getTopThingsToDoForTrip } from "@/src/data/cityGuides";
import { buildAffiliateLinks } from "@/src/services/affiliateLinks";

import { computeLikelyPlaceholderTbcIds, isKickoffTbc } from "@/src/utils/kickoffTbc";
import { beginPartnerClick, openPartnerUrl } from "@/src/services/partnerClicks";
import type { PartnerId } from "@/src/core/partners";

/* ---------------------------------- */
/* helpers */
/* ---------------------------------- */

function paramString(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim() || null;
  return null;
}

function paramNumber(v: unknown): number | null {
  const s = paramString(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function paramBool(v: unknown): boolean {
  const s = paramString(v);
  if (!s) return false;
  return s === "1" || s === "true" || s === "yes";
}

function fixtureIdStr(r: any): string {
  const id = r?.fixture?.id;
  return id != null ? String(id) : "";
}

function SheetCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.sheetCard}>
      <View style={styles.sheetTint} pointerEvents="none" />
      <View style={styles.sheetContent}>{children}</View>
    </View>
  );
}

/* ---------------------------------- */
/* screen */
/* ---------------------------------- */

export default function TripBuildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const listRef = useRef<ScrollView | null>(null);

  /* ---------- route params ---------- */

  const routeTripId = useMemo(() => paramString((params as any)?.tripId), [params]);
  const isEditing = !!routeTripId;

  const routeFixtureId = useMemo(() => paramString((params as any)?.fixtureId), [params]);
  const routeLeagueId = useMemo(() => paramNumber((params as any)?.leagueId), [params]);
  const routeSeason = useMemo(() => paramNumber((params as any)?.season), [params]);
  const routeGlobal = useMemo(() => paramBool((params as any)?.global), [params]);

  /* ---------- rolling window ---------- */

  const rolling = useMemo(() => getRollingWindowIso(), []);
  const fromParam = useMemo(() => paramString((params as any)?.from), [params]);
  const toParam = useMemo(() => paramString((params as any)?.to), [params]);

  const window = useMemo(
    () =>
      normalizeWindowIso({
        from: fromParam ?? rolling.from,
        to: toParam ?? rolling.to,
      }),
    [fromParam, toParam, rolling]
  );

  const from = useMemo(() => clampFromIsoToTomorrow(window.from), [window.from]);
  const to = useMemo(() => window.to, [window.to]);

  /* ---------- leagues ---------- */

  const ALL_LEAGUES: LeagueOption & { key: string } = {
    label: "All leagues",
    leagueId: 0,
    season: routeSeason ?? LEAGUES[0].season,
    countryCode: "EU",
    key: "all",
  };

  const leagueOptions = useMemo(() => [ALL_LEAGUES, ...LEAGUES], [ALL_LEAGUES]);

  const [selectedLeague, setSelectedLeague] = useState<LeagueOption>(
    routeGlobal ? ALL_LEAGUES : LEAGUES[0]
  );

  /* ---------- state ---------- */

  const [rows, setRows] = useState<FixtureListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

  const [selectedFixture, setSelectedFixture] = useState<FixtureListRow | null>(null);
  const [placeholderTbcIds, setPlaceholderTbcIds] = useState<Set<string>>(new Set());

  const [startIso, setStartIso] = useState(from);
  const [endIso, setEndIso] = useState(addDaysIso(from, 2));
  const [notes, setNotes] = useState("");

  const editDatesLockRef = useRef(false);
  const editSnapshotRef = useRef<any>(null);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);

  /* ---------------------------------- */
  /* data loading */
  /* ---------------------------------- */

  useEffect(() => {
    if (!routeTripId) return;

    let cancelled = false;

    async function loadTrip() {
      setPrefillLoading(true);

      if (!tripsStore.getState().loaded) {
        await tripsStore.loadTrips();
      }

      if (cancelled) return;

      const t = tripsStore.getState().trips.find((x) => x.id === routeTripId) ?? null;
      setEditTrip(t);

      if (!t) {
        setError("Trip not found.");
        setPrefillLoading(false);
        return;
      }

      setStartIso(t.startDate);
      setEndIso(t.endDate);
      setNotes(t.notes ?? "");

      editDatesLockRef.current = true;

      const matchId = t.matchIds?.[0];
      if (matchId) {
        const r = await getFixtureById(String(matchId));
        if (!cancelled) setSelectedFixture(r);
      }

      setPrefillLoading(false);
    }

    loadTrip();
    return () => {
      cancelled = true;
    };
  }, [routeTripId]);

  useEffect(() => {
    if (isEditing) return;
    if (!routeFixtureId) return;

    let cancelled = false;

    async function prefill() {
      setPrefillLoading(true);
      const r = await getFixtureById(routeFixtureId);
      if (!cancelled) setSelectedFixture(r);
      setPrefillLoading(false);
    }

    prefill();
    return () => {
      cancelled = true;
    };
  }, [routeFixtureId, isEditing]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setRows([]);

      try {
        let res: FixtureListRow[] = [];

        if (selectedLeague.leagueId === 0) {
          const batches = await Promise.all(
            LEAGUES.map((l) =>
              getFixtures({ league: l.leagueId, season: l.season, from, to })
            )
          );
          res = batches.flat();
        } else {
          res =
            (await getFixtures({
              league: selectedLeague.leagueId,
              season: selectedLeague.season,
              from,
              to,
            })) || [];
        }

        if (!cancelled) {
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
  }, [selectedLeague, from, to]);

  /* ---------------------------------- */
  /* derived */
  /* ---------------------------------- */

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

  const visibleRows = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  /* ---------------------------------- */
  /* save */
  /* ---------------------------------- */

  async function onSave() {
    if (!selectedFixture?.fixture?.id) {
      setError("Select a fixture first.");
      return;
    }

    setSaving(true);
    setError(null);

    const fixtureId = String(selectedFixture.fixture.id);
    const city =
      String(selectedFixture?.fixture?.venue?.city ?? "").trim() || "Trip";

    const patch: Partial<Omit<Trip, "id">> = {
      cityId: city,
      matchIds: [fixtureId],
      startDate: startIso,
      endDate: endIso,
      notes: notes.trim(),
    };

    try {
      if (isEditing && routeTripId) {
        await tripsStore.updateTrip(routeTripId, patch);
        router.replace({ pathname: "/trip/[id]", params: { id: routeTripId } });
      } else {
        const t = await tripsStore.addTrip(patch as any);
        router.replace({ pathname: "/trip/[id]", params: { id: t.id } });
      }
    } catch {
      setError("Failed to save trip.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------- */
  /* PARTNER OPEN FLOW (CRITICAL FIX) */
  /* ---------------------------------- */

  async function openUntracked(url?: string) {
    if (!url) return;
    try {
      await openPartnerUrl(url);
    } catch {
      Alert.alert("Couldn’t open link");
    }
  }

  async function openTrackedPartner(args: {
    partnerId: PartnerId;
    url: string;
    title: string;
    metadata?: Record<string, any>;
  }) {
    if (!routeTripId) {
      Alert.alert(
        "Save trip first",
        "Save this trip before booking so we can track your confirmations in Wallet."
      );
      return;
    }

    if (args.partnerId === "googlemaps") {
      await openUntracked(args.url);
      return;
    }

    try {
      await beginPartnerClick({
        tripId: routeTripId,
        partnerId: args.partnerId,
        url: args.url,
        title: args.title,
        metadata: args.metadata,
      });
    } catch {
      await openUntracked(args.url);
    }
  }

  /* ---------------------------------- */
  /* UI */
  /* ---------------------------------- */

  return (
    <Background imageSource={getBackground("trips")}>
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
          ref={(r) => (listRef.current = r)}
          contentContainerStyle={{
            paddingTop: 100,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl + insets.bottom,
            gap: theme.spacing.lg,
          }}
        >
          <GlassCard>
            <Text style={styles.h1}>Pick a match</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {leagueOptions.map((l) => {
                const active = l.leagueId === selectedLeague.leagueId;
                return (
                  <Pressable
                    key={l.key ?? String(l.leagueId)}
                    onPress={() => setSelectedLeague(l)}
                    style={[
                      styles.leaguePill,
                      active && styles.leaguePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.leaguePillText,
                        active && styles.leaguePillTextActive,
                      ]}
                    >
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

            {loading || prefillLoading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading…</Text>
              </View>
            ) : null}

            {!loading && visibleRows.length === 0 ? (
              <EmptyState title="No fixtures" message="Try another league or date window." />
            ) : null}

            {visibleRows.map((r, i) => {
              const id = fixtureIdStr(r);
              const home = r?.teams?.home?.name ?? "Home";
              const away = r?.teams?.away?.name ?? "Away";
              const selected = fixtureIdStr(selectedFixture) === id;

              const tbc = isKickoffTbc(r, placeholderTbcIds);
              const kick = tbc
                ? "TBC"
                : formatUkDateTimeMaybe(r?.fixture?.date) || "TBC";

              return (
                <Pressable
                  key={id || i}
                  onPress={() => {
                    editDatesLockRef.current = false;
                    setSelectedFixture(r);
                  }}
                  style={[
                    styles.pickRow,
                    selected && styles.pickRowSelected,
                  ]}
                >
                  <Text style={styles.rowTitle}>
                    {home} vs {away}
                  </Text>
                  <Text style={styles.rowMeta}>{kick}</Text>
                </Pressable>
              );
            })}

            {visibleCount < filtered.length ? (
              <Pressable
                onPress={() => setVisibleCount((n) => n + 12)}
                style={styles.moreBtn}
              >
                <Text style={styles.moreText}>Show more</Text>
              </Pressable>
            ) : null}
          </GlassCard>

          <Pressable
            onPress={onSave}
            disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          >
            <Text style={styles.saveText}>
              {saving ? "Saving…" : isEditing ? "Update Trip" : "Save Trip"}
            </Text>
          </Pressable>

          {error ? <Text style={styles.err}>{error}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

/* ---------------------------------- */
/* styles */
/* ---------------------------------- */

const styles = StyleSheet.create({
  h1: {
    fontSize: theme.fontSize.lg,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 10,
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
  leaguePillText: { color: theme.colors.textSecondary },
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

  center: { paddingVertical: 14, alignItems: "center" },
  muted: { color: theme.colors.textSecondary },

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

  rowTitle: { color: theme.colors.text, fontWeight: "800" },
  rowMeta: { color: theme.colors.textSecondary, marginTop: 4 },

  moreBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  moreText: { color: theme.colors.text, fontWeight: "800" },

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

  err: { marginTop: 10, color: "rgba(255,80,80,0.95)", fontWeight: "800" },

  sheetCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.38)",
    backgroundColor: "rgba(0,0,0,0.30)",
  },
  sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(26,31,46,0.60)" },
  sheetContent: { padding: theme.spacing.md },
});
