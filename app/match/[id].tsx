// app/match/[id].tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  Platform,
  TextInput,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import { getBackground } from "@/src/constants/backgrounds";
import { theme } from "@/src/constants/theme";

import { getFixtureById, type FixtureListRow } from "@/src/services/apiFootball";
import { getRollingWindowIso, toIsoDate, addDaysIso, clampFromIsoToTomorrow, normalizeWindowIso } from "@/src/constants/football";
import { coerceNumber, coerceString } from "@/src/utils/params";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";

import authStore from "@/src/state/auth";
import useFollowStore from "@/src/state/followStore";

import { computeLikelyPlaceholderTbcIds, isKickoffTbc } from "@/src/utils/kickoffTbc";

function currentFootballSeasonStartYear(now = new Date()): number {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0=Jan
  return m >= 6 ? y : y - 1;
}

function enc(v: string) {
  return encodeURIComponent(v);
}

function isoDateOnly(isoMaybe?: string) {
  if (!isoMaybe) return undefined;
  const d = new Date(isoMaybe);
  if (Number.isNaN(d.getTime())) return undefined;
  return toIsoDate(d);
}

function subtitleOrFallback(value: string | null | undefined, fallback: string) {
  const v = String(value ?? "").trim();
  return v ? v : fallback;
}

async function safeOpenUrl(url: string) {
  const u = String(url ?? "").trim();
  if (!u) return;

  const hasScheme = /^https?:\/\//i.test(u);
  const candidate = hasScheme ? u : `https://${u}`;

  try {
    const can = await Linking.canOpenURL(candidate);
    if (!can) throw new Error("Cannot open URL");
    await Linking.openURL(candidate);
  } catch {
    Alert.alert("Couldn’t open link", "Your device could not open that link.");
  }
}

async function openMapsPreferNative(query: string) {
  const q = String(query ?? "").trim();
  if (!q) return safeOpenUrl("https://www.google.com/maps");

  const geo = `geo:0,0?q=${enc(q)}`;
  const web = `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;

  if (Platform.OS === "ios") return safeOpenUrl(web);

  try {
    const canGeo = await Linking.canOpenURL(geo);
    await safeOpenUrl(canGeo ? geo : web);
  } catch {
    await safeOpenUrl(web);
  }
}

function buildTicketsUrl(home?: string, away?: string, kickoffDateOnly?: string, league?: string) {
  const vs = home && away ? `${home} vs ${away}` : "match";
  const when = kickoffDateOnly ? ` ${kickoffDateOnly}` : "";
  const extra = league ? ` ${league}` : "";
  const q = `${vs}${when}${extra} tickets`;
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildMapsVenueUrl(venue?: string, city?: string) {
  const q = [venue, city].filter(Boolean).join(" ").trim();
  if (!q) return "https://www.google.com/maps";
  return `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
}

function buildStadiumInfoUrl(venue?: string, homeTeam?: string, city?: string) {
  const q = [venue || "stadium", homeTeam, city, "bag policy entry time seats"].filter(Boolean).join(" ");
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildFoodDrinkUrl(venue?: string, city?: string) {
  const q = [venue || "", city || "", "best pubs bars restaurants near"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

function buildTransportUrl(venue?: string, city?: string) {
  const q = [venue || "stadium", city || "", "how to get there public transport"].join(" ").trim();
  return `https://www.google.com/search?q=${enc(q)}`;
}

function clampNum(n: unknown, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

export default function MatchDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // boot auth (only used for "alerts later" messaging for now)
  const booted = authStore((s) => s.booted);
  const user = authStore((s) => s.user);
  const initAuth = authStore((s) => s.init);
  const signInWithMagicLink = authStore((s) => s.signInWithMagicLink);
  const signOut = authStore((s) => s.signOut);

  useEffect(() => {
    if (!booted) initAuth().catch(() => null);
  }, [booted, initAuth]);

  const id = useMemo(() => coerceString((params as any)?.id), [params]);

  // Routing context
  const rolling = useMemo(() => getRollingWindowIso(), []);

  const window = useMemo(() => {
    const routeFrom = coerceString((params as any)?.from);
    const routeTo = coerceString((params as any)?.to);

    const from = clampFromIsoToTomorrow(routeFrom ?? rolling.from);
    const to = routeTo ?? rolling.to ?? addDaysIso(from, 30);

    return normalizeWindowIso({ from, to }, 30);
  }, [params, rolling.from, rolling.to]);

  const fromIso = window.from;
  const toIso = window.to;

  const routeLeagueId = useMemo(() => coerceNumber((params as any)?.leagueId), [params]);
  const routeSeason = useMemo(() => coerceNumber((params as any)?.season), [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<FixtureListRow | null>(null);

  // Follow (local) state
  const isFollowing = useFollowStore((s) => s.isFollowing);
  const toggleFollow = useFollowStore((s) => s.toggle);
  const upsertLatestSnapshot = useFollowStore((s) => s.upsertLatestSnapshot);

  // sign-in UI
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!id) {
        setError("Missing match id.");
        return;
      }

      setLoading(true);
      setError(null);
      setRow(null);

      try {
        const r = await getFixtureById(id);
        if (cancelled) return;

        if (!r) {
          setError("Match not found.");
          return;
        }

        setRow(r);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load match details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const fixtureId = useMemo(() => {
    const apiId = row?.fixture?.id;
    if (apiId != null) return String(apiId);
    return id ?? "";
  }, [row, id]);

  // For single row, placeholder dominance can’t be inferred from a list.
  // But we *can* still feed the util a 1-row list so it uses explicit status + strict heuristics consistently.
  const placeholderTbcIds = useMemo(() => {
    if (!row) return new Set<string>();
    return computeLikelyPlaceholderTbcIds([row]);
  }, [row]);

  const home = String(row?.teams?.home?.name ?? "Home").trim() || "Home";
  const away = String(row?.teams?.away?.name ?? "Away").trim() || "Away";

  const kickoffDateOnly = isoDateOnly(row?.fixture?.date as string | undefined);

  const venue = String(row?.fixture?.venue?.name ?? "").trim();
  const city = String(row?.fixture?.venue?.city ?? "").trim();
  const place = [venue, city].filter(Boolean).join(" • ");

  const leagueName = String(row?.league?.name ?? "League").trim() || "League";
  const apiLeagueId = typeof row?.league?.id === "number" ? row!.league!.id : null;
  const effectiveLeagueId = apiLeagueId ?? routeLeagueId ?? null;

  const apiSeason = (row as any)?.league?.season;
  const effectiveSeason =
    routeSeason ?? (typeof apiSeason === "number" ? apiSeason : null) ?? currentFootballSeasonStartYear();

  const tbc = useMemo(() => isKickoffTbc(row, placeholderTbcIds), [row, placeholderTbcIds]);

  const kickoffDisplay = useMemo(() => {
    if (!row) return null;
    if (tbc) return null;
    return formatUkDateTimeMaybe(row?.fixture?.date) || null;
  }, [row, tbc]);

  // Keep followed snapshot fresh when we load the match
  useEffect(() => {
    if (!row || !fixtureId) return;

    const kickoffIso = !tbc && row?.fixture?.date ? String(row.fixture.date) : null;

    upsertLatestSnapshot(fixtureId, {
      leagueId: effectiveLeagueId ?? undefined,
      season: typeof effectiveSeason === "number" ? effectiveSeason : undefined,
      homeTeamId: row?.teams?.home?.id ?? undefined,
      awayTeamId: row?.teams?.away?.id ?? undefined,
      kickoffIso,
      venue: venue || null,
      city: city || null,
    });
  }, [row, fixtureId, tbc, upsertLatestSnapshot, effectiveLeagueId, effectiveSeason, venue, city]);

  const ticketsUrl = useMemo(
    () => buildTicketsUrl(home, away, kickoffDateOnly, leagueName),
    [home, away, kickoffDateOnly, leagueName]
  );
  const mapsUrl = useMemo(() => buildMapsVenueUrl(venue, city), [venue, city]);
  const stadiumInfoUrl = useMemo(() => buildStadiumInfoUrl(venue, home, city), [venue, home, city]);
  const foodDrinkUrl = useMemo(() => buildFoodDrinkUrl(venue, city), [venue, city]);
  const transportUrl = useMemo(() => buildTransportUrl(venue, city), [venue, city]);

  const ticketsSub = useMemo(() => {
    const when = kickoffDateOnly ? ` • ${kickoffDateOnly}` : "";
    return `${home} vs ${away}${when}`;
  }, [home, away, kickoffDateOnly]);

  const directionsSub = useMemo(() => {
    const v = subtitleOrFallback(venue, "Search stadium location");
    const c = subtitleOrFallback(city, "");
    return [v, c].filter(Boolean).join(" • ");
  }, [venue, city]);

  const onPlanTrip = useCallback(() => {
    if (!fixtureId) return;

    router.push({
      pathname: "/trip/build",
      params: {
        fixtureId,
        ...(effectiveLeagueId ? { leagueId: String(effectiveLeagueId) } : {}),
        ...(effectiveSeason ? { season: String(effectiveSeason) } : {}),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }, [router, fixtureId, effectiveLeagueId, effectiveSeason, fromIso, toIso]);

  const onOpenFixtures = useCallback(() => {
    router.push({
      pathname: "/(tabs)/fixtures",
      params: {
        ...(effectiveLeagueId ? { leagueId: String(effectiveLeagueId) } : {}),
        ...(effectiveSeason ? { season: String(effectiveSeason) } : {}),
        from: fromIso,
        to: toIso,
      },
    } as any);
  }, [router, effectiveLeagueId, effectiveSeason, fromIso, toIso]);

  const onShare = useCallback(async () => {
    const title = `${home} vs ${away}`;
    const when = tbc ? "Kickoff: TBC" : kickoffDisplay ? `Kickoff: ${kickoffDisplay}` : "Kickoff: —";
    const where = place ? `Venue: ${place}` : "Venue: —";
    const meta = `League: ${leagueName} • Season: ${String(effectiveSeason)}`;

    const message = `${title}\n${when}\n${where}\n${meta}\n\nTickets: ${ticketsUrl}\nMaps: ${mapsUrl}`;

    try {
      await Share.share(Platform.OS === "ios" ? { message, url: ticketsUrl } : { message });
    } catch {
      // non-critical
    }
  }, [home, away, tbc, kickoffDisplay, place, leagueName, effectiveSeason, ticketsUrl, mapsUrl]);

  const following = useMemo(() => (fixtureId ? isFollowing(fixtureId) : false), [fixtureId, isFollowing]);

  const onToggleFollow = useCallback(() => {
    if (!row || !fixtureId) return;

    const kickoffIso = !tbc && row?.fixture?.date ? String(row.fixture.date) : null;

    toggleFollow({
      fixtureId,
      leagueId: clampNum(effectiveLeagueId),
      season: clampNum(effectiveSeason),
      homeTeamId: clampNum(row?.teams?.home?.id),
      awayTeamId: clampNum(row?.teams?.away?.id),
      kickoffIso,
      venue: venue || null,
      city: city || null,
    });

    if (!following) {
      Alert.alert(
        "Following",
        tbc
          ? "We’ll keep an eye on this fixture. Kickoff is TBC — you’ll see it update when confirmed."
          : "Fixture saved. You’ll see it update if kickoff changes."
      );
    }
  }, [row, fixtureId, toggleFollow, effectiveLeagueId, effectiveSeason, venue, city, tbc, following]);

  const onSendMagicLink = useCallback(async () => {
    const e = String(email ?? "").trim();
    if (!e) {
      Alert.alert("Email required", "Enter an email to sign in.");
      return;
    }

    try {
      Keyboard.dismiss();
      await signInWithMagicLink(e);
      Alert.alert("Check your email", "Tap the link to finish signing in.");
      setEmail("");
    } catch (err: any) {
      Alert.alert("Sign in failed", err?.message ?? "Could not send magic link.");
    }
  }, [email, signInWithMagicLink]);

  return (
    <Background imageUrl={getBackground("fixtures")}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Match",
          headerTransparent: true,
          headerTintColor: theme.colors.text,
        }}
      />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card} intensity={26}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>Loading match…</Text>
              </View>
            ) : null}

            {!loading && error ? <EmptyState title="Match unavailable" message={error} /> : null}

            {!loading && !error && row ? (
              <>
                <View style={styles.topRow}>
                  <Text style={styles.kicker}>{leagueName}</Text>

                  <Pressable
                    onPress={onToggleFollow}
                    style={[styles.followPill, following && styles.followPillActive]}
                  >
                    <Text style={[styles.followPillText, following && styles.followPillTextActive]}>
                      {following ? "Following" : "Follow"}
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.title} numberOfLines={2}>
                  {home} vs {away}
                </Text>

                <View style={styles.metaBlock}>
                  <Text style={styles.metaLine}>
                    <Text style={styles.metaLabel}>Kickoff: </Text>
                    {tbc ? (
                      <>
                        <Text style={styles.tbcText}>TBC</Text>
                        <Text style={styles.metaHint}> (league confirms later)</Text>
                      </>
                    ) : kickoffDisplay || "—"}
                  </Text>

                  <Text style={styles.metaLine}>
                    <Text style={styles.metaLabel}>Venue: </Text>
                    {place || "—"}
                  </Text>

                  <Text style={styles.metaLine}>
                    <Text style={styles.metaLabel}>Season: </Text>
                    {String(effectiveSeason)}
                  </Text>
                </View>

                {!user ? (
                  <View style={styles.signInBox}>
                    <Text style={styles.signInTitle}>Sign in for alerts</Text>
                    <Text style={styles.signInBody}>
                      Following works offline. Signing in enables email/push alerts later.
                    </Text>

                    <View style={styles.inputRow}>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@email.com"
                        placeholderTextColor={theme.colors.textTertiary}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        style={styles.input}
                        returnKeyType="done"
                        onSubmitEditing={onSendMagicLink}
                      />
                      <Pressable onPress={onSendMagicLink} style={styles.inputBtn}>
                        <Text style={styles.inputBtnText}>Send</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.accountRow}>
                    <Text style={styles.accountText}>{user.email ?? "Signed in"}</Text>
                    <Pressable onPress={async () => signOut()} style={styles.signOutBtn}>
                      <Text style={styles.signOutText}>Sign out</Text>
                    </Pressable>
                  </View>
                )}

                <View style={styles.ctaGrid}>
                  <Pressable onPress={() => safeOpenUrl(ticketsUrl)} style={[styles.bigBtn, styles.bigBtnPrimary]}>
                    <Text style={styles.bigKicker}>Tickets</Text>
                    <Text style={styles.bigTitle}>Find tickets</Text>
                    <Text style={styles.bigSub}>{ticketsSub}</Text>
                  </Pressable>

                  <Pressable
                    onPress={async () => {
                      const q = [venue, city].filter(Boolean).join(" ").trim();
                      if (!q) return safeOpenUrl(mapsUrl);
                      await openMapsPreferNative(q);
                    }}
                    style={[styles.bigBtn, styles.bigBtnSecondary]}
                  >
                    <Text style={styles.bigKicker}>Directions</Text>
                    <Text style={styles.bigTitle}>Open maps</Text>
                    <Text style={styles.bigSub}>{directionsSub}</Text>
                  </Pressable>

                  <Pressable onPress={onPlanTrip} style={[styles.bigBtn, styles.bigBtnSecondary]}>
                    <Text style={styles.bigKicker}>Trip</Text>
                    <Text style={styles.bigTitle}>Plan this trip</Text>
                    <Text style={styles.bigSub}>Pre-fills this match</Text>
                  </Pressable>

                  <Pressable onPress={onShare} style={[styles.bigBtn, styles.bigBtnSecondary]}>
                    <Text style={styles.bigKicker}>Share</Text>
                    <Text style={styles.bigTitle}>Share match</Text>
                    <Text style={styles.bigSub}>Copy-friendly summary</Text>
                  </Pressable>
                </View>

                <View style={styles.smallRow}>
                  <Pressable onPress={onOpenFixtures} style={styles.smallBtn}>
                    <Text style={styles.smallBtnText}>Open Fixtures</Text>
                  </Pressable>

                  <Pressable onPress={() => safeOpenUrl(stadiumInfoUrl)} style={styles.smallBtn}>
                    <Text style={styles.smallBtnText}>Stadium info</Text>
                  </Pressable>
                </View>

                <Text style={styles.smallPrint}>Match ID: {fixtureId}</Text>
              </>
            ) : null}
          </GlassCard>

          {!loading && !error && row ? (
            <GlassCard style={styles.card} intensity={22}>
              <Text style={styles.h2}>Matchday essentials</Text>
              <Text style={styles.muted}>Neutral traveller view: arrive smoothly, enjoy the city, keep it simple.</Text>

              <View style={styles.opsList}>
                <View style={styles.opsItem}>
                  <Text style={styles.opsTitle}>Arrive early</Text>
                  <Text style={styles.opsBody}>
                    Aim for 60–90 minutes before kickoff if you’re collecting tickets or navigating security.
                  </Text>
                </View>

                <View style={styles.opsItem}>
                  <Text style={styles.opsTitle}>Bag policy and entry</Text>
                  <Text style={styles.opsBody}>
                    Policies vary. If you’re carrying a bag, double-check restrictions before you travel.
                  </Text>
                  <Pressable onPress={() => safeOpenUrl(stadiumInfoUrl)} style={styles.inlineBtn}>
                    <Text style={styles.inlineBtnText}>Search stadium entry rules</Text>
                  </Pressable>
                </View>

                <View style={styles.opsItem}>
                  <Text style={styles.opsTitle}>Transport plan</Text>
                  <Text style={styles.opsBody}>
                    Public transport is usually easiest; event traffic and parking are unpredictable near kickoff.
                  </Text>
                  <Pressable onPress={() => safeOpenUrl(transportUrl)} style={styles.inlineBtn}>
                    <Text style={styles.inlineBtnText}>Search transport options</Text>
                  </Pressable>
                </View>

                <View style={styles.opsItem}>
                  <Text style={styles.opsTitle}>Food & drinks nearby</Text>
                  <Text style={styles.opsBody}>
                    Pick something walkable so you’re not rushing. Atmosphere is often best around the stadium district.
                  </Text>
                  <Pressable onPress={() => safeOpenUrl(foodDrinkUrl)} style={styles.inlineBtn}>
                    <Text style={styles.inlineBtnText}>Search nearby spots</Text>
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 100 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, gap: theme.spacing.lg },

  card: { padding: theme.spacing.lg },

  center: { paddingVertical: theme.spacing.xl, alignItems: "center", gap: 10 },
  muted: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },

  kicker: { color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: "900", letterSpacing: 0.6 },
  title: { marginTop: 8, fontSize: theme.fontSize.xl, fontWeight: "900", color: theme.colors.text, lineHeight: 30 },

  followPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  followPillActive: {
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  followPillText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
  followPillTextActive: { color: "rgba(79,224,138,0.92)" },

  metaBlock: { marginTop: 12, gap: 6 },
  metaLine: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },
  metaLabel: { color: theme.colors.text, fontWeight: "900" },
  metaHint: { color: theme.colors.textSecondary, fontWeight: "700" },
  tbcText: { color: "rgba(242,244,246,0.92)", fontWeight: "900" },

  h2: { marginTop: 2, fontSize: theme.fontSize.lg, fontWeight: "900", color: theme.colors.text },

  signInBox: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.18)",
    padding: 12,
  },
  signInTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 13 },
  signInBody: { marginTop: 6, color: theme.colors.textSecondary, fontWeight: "700", fontSize: 12, lineHeight: 16 },
  inputRow: { marginTop: 10, flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    paddingHorizontal: 12,
    color: theme.colors.text,
    backgroundColor: "rgba(0,0,0,0.16)",
    fontWeight: "800",
  },
  inputBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(79,224,138,0.35)",
    backgroundColor: "rgba(79,224,138,0.10)",
  },
  inputBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: 12 },

  accountRow: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  accountText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },
  signOutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  signOutText: { color: theme.colors.textSecondary, fontWeight: "900", fontSize: 12 },

  ctaGrid: { marginTop: 14, gap: 10 },
  bigBtn: { borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
  bigBtnPrimary: { borderColor: "rgba(0,255,136,0.55)", backgroundColor: "rgba(0,0,0,0.34)" },
  bigBtnSecondary: { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.22)" },
  bigKicker: { color: theme.colors.primary, fontWeight: "900", fontSize: theme.fontSize.xs, letterSpacing: 0.2 },
  bigTitle: { marginTop: 6, color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.md },
  bigSub: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  smallRow: { marginTop: 10, flexDirection: "row", gap: 10 },
  smallBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
  },
  smallBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },

  smallPrint: { marginTop: 12, color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: "700" },

  opsList: { marginTop: 12, gap: 12 },
  opsItem: { borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.18)", padding: 12 },
  opsTitle: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.sm },
  opsBody: { marginTop: 6, color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 18, fontWeight: "700" },

  inlineBtn: { marginTop: 10, alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: "rgba(0,255,136,0.35)", backgroundColor: "rgba(0,0,0,0.18)" },
  inlineBtnText: { color: theme.colors.text, fontWeight: "900", fontSize: theme.fontSize.xs },
});
