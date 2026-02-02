// app/(tabs)/wallet.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import useFollowStore from "@/src/state/followStore";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import { isKickoffTbc } from "@/src/utils/kickoffTbc";

type FollowedAny = {
  fixtureId: string;
  leagueId?: number;
  season?: number;
  homeTeamId?: number;
  awayTeamId?: number;
  kickoffIso?: string | null;
  venue?: string | null;
  city?: string | null;
};

function safeArr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function asString(v: unknown) {
  const s = String(v ?? "").trim();
  return s ? s : "";
}

function initials(name: string) {
  const clean = asString(name);
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function TeamCrest({ name, logo }: { name: string; logo?: string | null }) {
  const n = asString(name) || "—";
  const l = logo ? String(logo) : "";

  return (
    <View style={styles.crestWrap}>
      {l ? (
        <Image source={{ uri: l }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(n)}</Text>
      )}
      <View pointerEvents="none" style={styles.crestRing} />
    </View>
  );
}

/**
 * Pull followed fixtures out of followStore without relying on one exact shape.
 * Supported shapes (common patterns):
 * - state.followed: FollowedMatch[]
 * - state.items: FollowedMatch[]
 * - state.follows: Record<fixtureId, FollowedMatch>
 * - state.byId: Record<fixtureId, FollowedMatch>
 */
function selectFollowedList(state: any): FollowedAny[] {
  const fromArray =
    safeArr<FollowedAny>(state?.followed) ||
    safeArr<FollowedAny>(state?.items) ||
    safeArr<FollowedAny>(state?.matches);

  if (fromArray.length > 0) {
    return fromArray
      .map((x) => ({ ...(x as any), fixtureId: asString((x as any)?.fixtureId) }))
      .filter((x) => !!x.fixtureId);
  }

  const fromMap: Record<string, any> =
    state?.follows || state?.byId || state?.map || state?.store || {};

  if (fromMap && typeof fromMap === "object") {
    return Object.values(fromMap)
      .map((x: any) => ({ ...(x as any), fixtureId: asString(x?.fixtureId) }))
      .filter((x: any) => !!x.fixtureId);
  }

  return [];
}

export default function WalletScreen() {
  const router = useRouter();

  // Read followed items (store-shape agnostic)
  const followed = useFollowStore((s: any) => selectFollowedList(s));

  // Some stores expose an "unfollow/remove" method. If not, we fall back to toggle.
  const toggle = useFollowStore((s: any) => s?.toggle);
  const remove = useFollowStore((s: any) => s?.remove || s?.unfollow || s?.delete);

  // Local cache of fixture details for rendering
  const [loading, setLoading] = useState(false);
  const [rowsById, setRowsById] = useState<Record<string, FixtureListRow | null>>({});
  const [error, setError] = useState<string | null>(null);

  const ids = useMemo(() => followed.map((f) => asString(f.fixtureId)).filter(Boolean), [followed]);

  const tbcCount = useMemo(() => {
    let n = 0;
    for (const f of followed) {
      // Store snapshot takes precedence: kickoffIso null = unconfirmed
      if (f.kickoffIso === null) {
        n++;
        continue;
      }
      const row = rowsById[f.fixtureId];
      if (row && isKickoffTbc(row)) n++;
    }
    return n;
  }, [followed, rowsById]);

  const confirmedCount = useMemo(() => Math.max(0, followed.length - tbcCount), [followed.length, tbcCount]);

  const fetchDetails = useCallback(async () => {
    if (ids.length === 0) {
      setRowsById({});
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const r = await getFixtureById(id);
            return [id, (r as FixtureListRow) ?? null] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );

      const next: Record<string, FixtureListRow | null> = {};
      for (const [id, r] of results) next[id] = r;

      setRowsById(next);
    } catch (e: any) {
      setError(e?.message ?? "Couldn’t load your followed matches.");
    } finally {
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    // Auto-refresh when list changes
    fetchDetails().catch(() => null);
  }, [fetchDetails]);

  const onUnfollow = useCallback(
    (f: FollowedAny) => {
      const fixtureId = asString(f.fixtureId);
      if (!fixtureId) return;

      Alert.alert("Unfollow match?", "You won’t get kickoff-change alerts for this fixture.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unfollow",
          style: "destructive",
          onPress: () => {
            if (typeof remove === "function") {
              remove(fixtureId);
              return;
            }
            if (typeof toggle === "function") {
              // toggle expects the payload used when following; we pass fixtureId and best-known meta
              toggle({
                fixtureId,
                leagueId: f.leagueId,
                season: f.season,
                homeTeamId: f.homeTeamId,
                awayTeamId: f.awayTeamId,
                kickoffIso: f.kickoffIso,
                venue: f.venue,
                city: f.city,
              });
            }
          },
        },
      ]);
    },
    [remove, toggle]
  );

  const title = "Alerts";
  const subtitle = "Followed matches + kickoff-change notifications";

  return (
    <Background imageSource={getBackground("wallet")} overlayOpacity={0.86}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statKicker}>Following</Text>
              <Text style={styles.statValue}>{followed.length}</Text>
            </View>

            <View style={styles.statPill}>
              <Text style={styles.statKicker}>Confirmed</Text>
              <Text style={styles.statValue}>{confirmedCount}</Text>
            </View>

            <View style={styles.statPill}>
              <Text style={styles.statKicker}>TBC</Text>
              <Text style={styles.statValue}>{tbcCount}</Text>
            </View>
          </View>

          <GlassCard style={styles.card} strength="default">
            <View style={styles.cardTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Kickoff alerts</Text>
                <Text style={styles.cardBody}>
                  Follow matches to get notified when kickoff is confirmed or changes. (Email now; push later.)
                </Text>
              </View>

              <Pressable
                onPress={fetchDetails}
                disabled={loading}
                style={[styles.refreshBtn, loading && { opacity: 0.7 }]}
                hitSlop={10}
                android_ripple={{ color: "rgba(79,224,138,0.10)" }}
              >
                <Text style={styles.refreshBtnText}>{loading ? "Refreshing…" : "Refresh"}</Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading followed matches…</Text>
              </View>
            ) : null}

            {!loading && error ? (
              <View style={{ marginTop: 12 }}>
                <EmptyState title="Couldn’t load alerts" message={error} />
              </View>
            ) : null}

            {!loading && !error && followed.length === 0 ? (
              <View style={{ marginTop: 12 }}>
                <EmptyState title="No followed matches" message="Go to Fixtures or a Match page and tap Follow." />
              </View>
            ) : null}

            {!loading && !error && followed.length > 0 ? (
              <View style={styles.list}>
                {followed.map((f) => {
                  const fixtureId = asString(f.fixtureId);
                  const row = rowsById[fixtureId] ?? null;

                  const home = row?.teams?.home?.name ? String(row.teams.home.name) : "Home";
                  const away = row?.teams?.away?.name ? String(row.teams.away.name) : "Away";
                  const homeLogo = row?.teams?.home?.logo ? String(row.teams.home.logo) : null;
                  const awayLogo = row?.teams?.away?.logo ? String(row.teams.away.logo) : null;

                  const venue = row?.fixture?.venue?.name ? String(row.fixture.venue.name) : asString(f.venue);
                  const city = row?.fixture?.venue?.city ? String(row.fixture.venue.city) : asString(f.city);
                  const place = [venue, city].filter(Boolean).join(" • ");

                  const storeSaysTbc = f.kickoffIso === null;
                  const utilSaysTbc = row ? isKickoffTbc(row) : false;

                  const tbc = storeSaysTbc || utilSaysTbc || !row?.fixture?.date;

                  const kickoffPretty = tbc ? "TBC" : formatUkDateTimeMaybe(String(row?.fixture?.date ?? "")) || "TBC";

                  return (
                    <View key={fixtureId} style={styles.alertRow}>
                      <View style={styles.alertTop}>
                        <TeamCrest name={home} logo={homeLogo} />
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <Text style={styles.alertTitle} numberOfLines={1}>
                            {home} vs {away}
                          </Text>
                          <Text style={styles.alertMeta} numberOfLines={2}>
                            {kickoffPretty}
                            {place ? ` • ${place}` : ""}
                          </Text>

                          <View style={[styles.statusPill, tbc ? styles.statusTbc : styles.statusConfirmed]}>
                            <Text style={[styles.statusText, tbc ? styles.statusTextTbc : styles.statusTextConfirmed]}>
                              {tbc ? "Kickoff TBC" : "Kickoff confirmed"}
                            </Text>
                          </View>
                        </View>
                        <TeamCrest name={away} logo={awayLogo} />
                      </View>

                      <View style={styles.actionsRow}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: "/match/[id]",
                              params: {
                                id: fixtureId,
                                ...(f.leagueId ? { leagueId: String(f.leagueId) } : {}),
                                ...(f.season ? { season: String(f.season) } : {}),
                              },
                            } as any)
                          }
                          style={({ pressed }) => [styles.actionBtn, styles.actionBtnGhost, pressed && { opacity: 0.92 }]}
                          android_ripple={{ color: "rgba(79,224,138,0.10)" }}
                        >
                          <Text style={styles.actionBtnGhostText}>Match</Text>
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: "/trip/build",
                              params: {
                                fixtureId,
                                ...(f.leagueId ? { leagueId: String(f.leagueId) } : {}),
                                ...(f.season ? { season: String(f.season) } : {}),
                              },
                            } as any)
                          }
                          style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.92 }]}
                          android_ripple={{ color: "rgba(79,224,138,0.12)" }}
                        >
                          <Text style={styles.actionBtnPrimaryText}>Build trip</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => onUnfollow(f)}
                          style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, pressed && { opacity: 0.92 }]}
                          android_ripple={{ color: "rgba(255,80,80,0.12)" }}
                        >
                          <Text style={styles.actionBtnDangerText}>Unfollow</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </GlassCard>

          <GlassCard style={styles.card} strength="subtle">
            <Text style={styles.smallNoteTitle}>What you’re actually building</Text>
            <Text style={styles.smallNote}>
              This tab is your alert control centre. Ticket PDFs and booking references can come later — but alerts need to be rock-solid now,
              because they drive repeat opens and retention.
            </Text>
          </GlassCard>

          <View style={{ height: 10 }} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },

  header: { paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xs },

  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.bold },

  statsRow: { flexDirection: "row", gap: 10 },
  statPill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.20)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statKicker: { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "900" },
  statValue: { marginTop: 4, color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "900" },

  card: { padding: theme.spacing.lg },

  cardTopRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },

  cardTitle: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "900" },
  cardBody: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  refreshBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.35)",
    backgroundColor: "rgba(0,0,0,0.22)",
    overflow: "hidden",
  },
  refreshBtnText: { color: theme.colors.text, fontSize: theme.fontSize.xs, fontWeight: "900" },

  center: { paddingVertical: 14, alignItems: "center", gap: 10, marginTop: 10 },
  muted: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: "700" },

  list: { marginTop: 14, gap: 12 },

  alertRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 14,
    gap: 12,
  },

  alertTop: { flexDirection: "row", gap: 12, alignItems: "center" },

  alertTitle: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "900", textAlign: "center" },
  alertMeta: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700", textAlign: "center" },

  statusPill: {
    marginTop: 10,
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusTbc: { borderColor: "rgba(255,184,0,0.35)", backgroundColor: "rgba(255,184,0,0.10)" },
  statusConfirmed: { borderColor: "rgba(0,255,136,0.35)", backgroundColor: "rgba(0,255,136,0.10)" },
  statusText: { fontSize: theme.fontSize.xs, fontWeight: "900" },
  statusTextTbc: { color: "rgba(255,210,110,0.95)" },
  statusTextConfirmed: { color: "rgba(79,224,138,0.92)" },

  actionsRow: { flexDirection: "row", gap: 10 },

  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  actionBtnPrimary: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.34)" },
  actionBtnPrimaryText: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "900" },

  actionBtnGhost: { borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(0,0,0,0.20)" },
  actionBtnGhostText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: "900" },

  actionBtnDanger: { borderColor: "rgba(255,80,80,0.35)", backgroundColor: "rgba(0,0,0,0.20)" },
  actionBtnDangerText: { color: "rgba(255,120,120,0.95)", fontSize: theme.fontSize.sm, fontWeight: "900" },

  crestWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  crestRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 14,
    borderColor: "rgba(79,224,138,0.12)",
  },
  crestImg: { width: 28, height: 28, opacity: 0.95 },
  crestFallback: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  smallNoteTitle: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: "900" },
  smallNote: { marginTop: 8, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },
});
