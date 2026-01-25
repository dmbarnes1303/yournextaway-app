import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Linking,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtures, getFixtureById } from "@/src/services/apiFootball";
import tripsStore from "@/src/state/trips";

import {
  LEAGUES,
  getRollingWindowIso,
  toIsoDate,
  parseIsoDateOnly,
  addDaysIso,
} from "@/src/constants/football";

import { formatUkDateOnly, formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { getTopThingsToDoForTrip } from "@/src/data/cityGuides";

/* ------------------ helpers ------------------ */

function paramString(v: unknown) {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return null;
}

function tomorrowIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return toIsoDate(d);
}

/* ------------------ component ------------------ */

export default function TripBuildScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const screenH = Dimensions.get("window").height;
  const SHEET_HEIGHT = Math.floor(screenH * 0.82);

  const rolling = getRollingWindowIso();
  const defaultFrom = tomorrowIso();

  const routeFixtureId = paramString(params.fixtureId);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedFixture, setSelectedFixture] = useState<any | null>(null);

  const [startIso, setStartIso] = useState(defaultFrom);
  const [endIso, setEndIso] = useState(addDaysIso(defaultFrom, 2));
  const [notes, setNotes] = useState("");

  /* ------------------ load fixtures ------------------ */

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const res = await getFixtures({
          league: LEAGUES[0].leagueId,
          season: LEAGUES[0].season,
          from: rolling.from,
          to: rolling.to,
        });
        if (!cancelled) setRows(res ?? []);
      } catch {}
      finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------ prefill from deep link ------------------ */

  useEffect(() => {
    if (!routeFixtureId) return;

    getFixtureById(routeFixtureId).then((r) => {
      if (r) setSelectedFixture(r);
    });
  }, [routeFixtureId]);

  /* ------------------ save ------------------ */

  async function onSave() {
    if (!selectedFixture) return;

    const fixtureId = String(selectedFixture.fixture.id);
    const city =
      selectedFixture.fixture.venue?.city ??
      selectedFixture.league?.country ??
      "Trip";

    const t = await tripsStore.addTrip({
      cityId: city,
      citySlug: city,
      matchIds: [fixtureId],
      startDate: startIso,
      endDate: endIso,
      notes,
    });

    setSelectedFixture(null);
    router.replace({ pathname: "/trip/[id]", params: { id: t.id } });
  }

  /* ------------------ derived ------------------ */

  const home = selectedFixture?.teams?.home?.name ?? "";
  const away = selectedFixture?.teams?.away?.name ?? "";
  const kick = formatUkDateTimeMaybe(selectedFixture?.fixture?.date);
  const venue = selectedFixture?.fixture?.venue?.name ?? "";
  const city = selectedFixture?.fixture?.venue?.city ?? "";

  const cityBundle = selectedFixture
    ? getTopThingsToDoForTrip(city)
    : null;

  /* ------------------ render ------------------ */

  return (
    <Background imageUrl={getBackground("trips")}>
      <Stack.Screen
        options={{
          title: "Build Trip",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 100,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.xxl,
          }}
        >
          <GlassCard>
            <Text style={styles.h1}>Pick a match</Text>

            {loading && <ActivityIndicator />}

            {!loading &&
              rows.map((r, i) => {
                const h = r?.teams?.home?.name;
                const a = r?.teams?.away?.name;
                const k = formatUkDateTimeMaybe(r?.fixture?.date);
                const v = r?.fixture?.venue?.name;

                return (
                  <Pressable
                    key={i}
                    style={styles.pickRow}
                    onPress={() => setSelectedFixture(r)}
                  >
                    <Text style={styles.rowTitle}>
                      {h} vs {a}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {k} • {v}
                    </Text>
                  </Pressable>
                );
              })}
          </GlassCard>
        </ScrollView>

        {/* ---------------- SHEET ---------------- */}

        <Modal visible={!!selectedFixture} transparent animationType="slide">
          <View style={styles.modalRoot}>
            <Pressable
              style={styles.backdrop}
              onPress={() => setSelectedFixture(null)}
            />

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View style={[styles.sheet, { height: SHEET_HEIGHT }]}>
                {/* HEADER */}
                <View style={styles.sheetHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.kicker}>Trip details</Text>
                    <Text style={styles.sheetTitle}>
                      {home} vs {away}
                    </Text>
                    <Text style={styles.sheetSub}>
                      {kick} • {venue} • {city}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setSelectedFixture(null)}
                    style={styles.closeBtn}
                  >
                    <Text style={styles.closeText}>Close</Text>
                  </Pressable>
                </View>

                {/* BODY (ONLY SCROLLER) */}
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 24,
                  }}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Dates */}
                  <View style={styles.row}>
                    <View style={styles.dateBox}>
                      <Text style={styles.label}>Start</Text>
                      <Text>{formatUkDateOnly(startIso)}</Text>
                    </View>

                    <View style={styles.dateBox}>
                      <Text style={styles.label}>End</Text>
                      <Text>{formatUkDateOnly(endIso)}</Text>
                    </View>
                  </View>

                  {/* City */}
                  <View style={styles.cityBlock}>
                    <Text style={styles.kicker}>In {city}</Text>
                    <Text style={styles.subhead}>Top things to do</Text>

                    {cityBundle?.items?.slice(0, 6).map((it, idx) => (
                      <Text key={idx} style={styles.thing}>
                        {idx + 1}. {it.title}
                      </Text>
                    ))}

                    {cityBundle?.tripAdvisorUrl && (
                      <Pressable
                        style={styles.taBtn}
                        onPress={() =>
                          Linking.openURL(cityBundle.tripAdvisorUrl)
                        }
                      >
                        <Text style={styles.taText}>Open TripAdvisor</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Notes */}
                  <TextInput
                    placeholder="Notes (hotel, trains, plans...)"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    style={styles.notes}
                  />
                </ScrollView>

                {/* FOOTER */}
                <View style={styles.footer}>
                  <Pressable style={styles.saveBtn} onPress={onSave}>
                    <Text style={styles.saveText}>Save Trip</Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

/* ------------------ styles ------------------ */

const styles = StyleSheet.create({
  h1: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },

  pickRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  rowTitle: {
    color: theme.colors.text,
    fontWeight: "800",
  },

  rowMeta: {
    marginTop: 4,
    color: theme.colors.textSecondary,
  },

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  sheet: {
    backgroundColor: "rgba(20,24,36,0.98)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  sheetHeader: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  kicker: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  sheetTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },

  sheetSub: {
    color: theme.colors.textSecondary,
    marginTop: 4,
  },

  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  closeText: {
    color: theme.colors.text,
    fontWeight: "800",
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  dateBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
  },

  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  cityBlock: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  subhead: {
    color: theme.colors.text,
    fontWeight: "800",
    marginTop: 6,
  },

  thing: {
    color: theme.colors.textSecondary,
    marginTop: 6,
  },

  taBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },

  taText: {
    color: theme.colors.text,
    fontWeight: "800",
  },

  notes: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    color: theme.colors.text,
  },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  saveBtn: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  saveText: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 16,
  },
});
