// app/match/[id].tsx
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Background from "@/src/components/Background";
import GlassCard from "@/src/components/GlassCard";
import EmptyState from "@/src/components/EmptyState";
import Button from "@/src/components/Button";

import { getFixtureBackdrop } from "@/src/constants/visualAssets";
import { theme } from "@/src/constants/theme";

import { useFixture } from "@/src/hooks/useFixtures";
import { useTripsStore } from "@/src/state/trips";

import { getStadiumByTeamFromRegistry } from "@/src/data/stadiumRegistry";
import { normalizeTeamKey } from "@/src/data/teams";
import { normalizeCityKey } from "@/src/utils/city";

import {
  LeagueFlag,
  isEuropeanCompetitionLeagueId,
} from "@/src/features/fixtures/helpers";

type RouteParams = Record<string, string | string[] | undefined>;

const CITY_COUNTRY_CODE: Record<string, string> = {
  london: "ENG",
  manchester: "ENG",
  liverpool: "ENG",
  birmingham: "ENG",
  newcastle: "ENG",
  glasgow: "SCO",
  edinburgh: "SCO",
  madrid: "ES",
  barcelona: "ES",
  seville: "ES",
  sevilla: "ES",
  valencia: "ES",
  bilbao: "ES",
  villarreal: "ES",
  "san sebastian": "ES",
  milan: "IT",
  milano: "IT",
  rome: "IT",
  roma: "IT",
  turin: "IT",
  torino: "IT",
  naples: "IT",
  napoli: "IT",
  florence: "IT",
  firenze: "IT",
  munich: "DE",
  münchen: "DE",
  dortmund: "DE",
  berlin: "DE",
  leipzig: "DE",
  leverkusen: "DE",
  frankfurt: "DE",
  paris: "FR",
  marseille: "FR",
  lyon: "FR",
  lille: "FR",
  monaco: "FR",
  amsterdam: "NL",
  rotterdam: "NL",
  eindhoven: "NL",
  almere: "NL",
  lisbon: "PT",
  lisboa: "PT",
  porto: "PT",
  istanbul: "TR",
  trabzon: "TR",
  brussels: "BE",
  bruges: "BE",
  brugge: "BE",
  anderlecht: "BE",
  vienna: "AT",
  wien: "AT",
  salzburg: "AT",
  zurich: "CH",
  zürich: "CH",
  basel: "CH",
  bern: "CH",
  athens: "GR",
  piraeus: "GR",
  thessaloniki: "GR",
  dublin: "IE",
  copenhagen: "DK",
  københavn: "DK",
  warsaw: "PL",
  poznan: "PL",
  krakow: "PL",
  prague: "CZ",
  praha: "CZ",
  zagreb: "HR",
  split: "HR",
  belgrade: "RS",
  beograd: "RS",
  budapest: "HU",
  bucharest: "RO",
  bucuresti: "RO",
  sofia: "BG",
  "stara zagora": "BG",
  bratislava: "SK",
  skalica: "SK",
  ljubljana: "SI",
  maribor: "SI",
  nicosia: "CY",
  sarajevo: "BA",
  banja: "BA",
  stockholm: "SE",
  malmo: "SE",
  malmö: "SE",
  oslo: "NO",
  bodo: "NO",
  bodø: "NO",
  helsinki: "FI",
  turku: "FI",
  reykjavik: "IS",
};

const CITY_TIME_ZONE: Record<string, string> = {
  london: "Europe/London",
  manchester: "Europe/London",
  liverpool: "Europe/London",
  birmingham: "Europe/London",
  newcastle: "Europe/London",
  glasgow: "Europe/London",
  edinburgh: "Europe/London",
  madrid: "Europe/Madrid",
  barcelona: "Europe/Madrid",
  seville: "Europe/Madrid",
  sevilla: "Europe/Madrid",
  valencia: "Europe/Madrid",
  bilbao: "Europe/Madrid",
  villarreal: "Europe/Madrid",
  "san sebastian": "Europe/Madrid",
  milan: "Europe/Rome",
  milano: "Europe/Rome",
  rome: "Europe/Rome",
  roma: "Europe/Rome",
  turin: "Europe/Rome",
  torino: "Europe/Rome",
  naples: "Europe/Rome",
  napoli: "Europe/Rome",
  florence: "Europe/Rome",
  firenze: "Europe/Rome",
  munich: "Europe/Berlin",
  münchen: "Europe/Berlin",
  dortmund: "Europe/Berlin",
  berlin: "Europe/Berlin",
  leipzig: "Europe/Berlin",
  leverkusen: "Europe/Berlin",
  frankfurt: "Europe/Berlin",
  paris: "Europe/Paris",
  marseille: "Europe/Paris",
  lyon: "Europe/Paris",
  lille: "Europe/Paris",
  monaco: "Europe/Monaco",
  amsterdam: "Europe/Amsterdam",
  rotterdam: "Europe/Amsterdam",
  eindhoven: "Europe/Amsterdam",
  almere: "Europe/Amsterdam",
  lisbon: "Europe/Lisbon",
  lisboa: "Europe/Lisbon",
  porto: "Europe/Lisbon",
  istanbul: "Europe/Istanbul",
  trabzon: "Europe/Istanbul",
  brussels: "Europe/Brussels",
  bruges: "Europe/Brussels",
  brugge: "Europe/Brussels",
  anderlecht: "Europe/Brussels",
  vienna: "Europe/Vienna",
  wien: "Europe/Vienna",
  salzburg: "Europe/Vienna",
  zurich: "Europe/Zurich",
  zürich: "Europe/Zurich",
  basel: "Europe/Zurich",
  bern: "Europe/Zurich",
  athens: "Europe/Athens",
  piraeus: "Europe/Athens",
  thessaloniki: "Europe/Athens",
  dublin: "Europe/Dublin",
  copenhagen: "Europe/Copenhagen",
  københavn: "Europe/Copenhagen",
  warsaw: "Europe/Warsaw",
  poznan: "Europe/Warsaw",
  krakow: "Europe/Warsaw",
  prague: "Europe/Prague",
  praha: "Europe/Prague",
  zagreb: "Europe/Zagreb",
  split: "Europe/Zagreb",
  belgrade: "Europe/Belgrade",
  beograd: "Europe/Belgrade",
  budapest: "Europe/Budapest",
  bucharest: "Europe/Bucharest",
  bucuresti: "Europe/Bucharest",
  sofia: "Europe/Sofia",
  "stara zagora": "Europe/Sofia",
  bratislava: "Europe/Bratislava",
  skalica: "Europe/Bratislava",
  ljubljana: "Europe/Ljubljana",
  maribor: "Europe/Ljubljana",
  nicosia: "Asia/Nicosia",
  sarajevo: "Europe/Sarajevo",
  banja: "Europe/Sarajevo",
  stockholm: "Europe/Stockholm",
  malmo: "Europe/Stockholm",
  malmö: "Europe/Stockholm",
  oslo: "Europe/Oslo",
  bodo: "Europe/Oslo",
  bodø: "Europe/Oslo",
  helsinki: "Europe/Helsinki",
  turku: "Europe/Helsinki",
  reykjavik: "Atlantic/Reykjavik",
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalise(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9À-ÿ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getParam(params: RouteParams, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return clean(value[0]);
  return clean(value);
}

function fixtureDateOnly(iso?: string | null): string {
  const value = clean(iso);
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

function inferTripWindowFromKickoff(kickoffIso?: string | null): {
  from?: string;
  to?: string;
} {
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

function buildCanonicalTripBuildParams(args: {
  fixtureId: string;
  leagueId?: string;
  season?: string;
  city?: string;
  kickoffIso?: string;
  from?: string;
  to?: string;
}) {
  const fallbackWindow = inferTripWindowFromKickoff(args.kickoffIso);

  return {
    fixtureId: args.fixtureId,
    ...(clean(args.leagueId) ? { leagueId: clean(args.leagueId) } : {}),
    ...(clean(args.season) ? { season: clean(args.season) } : {}),
    ...(clean(args.city) ? { city: clean(args.city) } : {}),
    ...(clean(args.from)
      ? { from: clean(args.from) }
      : fallbackWindow.from
        ? { from: fallbackWindow.from }
        : {}),
    ...(clean(args.to)
      ? { to: clean(args.to) }
      : fallbackWindow.to
        ? { to: fallbackWindow.to }
        : {}),
  };
}

function resolveCityCountryCode(city?: string | null): string | null {
  const cityKey = normalise(city);
  if (!cityKey) return null;

  if (CITY_COUNTRY_CODE[cityKey]) return CITY_COUNTRY_CODE[cityKey];

  for (const part of cityKey.split(" ")) {
    if (CITY_COUNTRY_CODE[part]) return CITY_COUNTRY_CODE[part];
  }

  return null;
}

function resolveCityTimeZone(city?: string | null): string {
  const cityKey = normalise(city);
  if (!cityKey) return "Europe/London";

  if (CITY_TIME_ZONE[cityKey]) return CITY_TIME_ZONE[cityKey];

  for (const part of cityKey.split(" ")) {
    if (CITY_TIME_ZONE[part]) return CITY_TIME_ZONE[part];
  }

  return "Europe/London";
}

function formatKickoffLocal(iso?: string | null, city?: string | null) {
  if (!iso) {
    return {
      date: "Date TBC",
      time: "TBC",
      timeZone: resolveCityTimeZone(city),
    };
  }

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return {
      date: "Date TBC",
      time: "TBC",
      timeZone: resolveCityTimeZone(city),
    };
  }

  const timeZone = resolveCityTimeZone(city);

  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone,
  });

  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });

  return { date, time, timeZone };
}

function formatRoundOrStage(round?: string | null): string {
  const value = clean(round);
  if (!value) return "";

  return value
    .replace(/\bRegular Season\b/gi, "Matchday")
    .replace(/\bRound\b/gi, "Round")
    .replace(/\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatStatus(status?: { short?: string | null; long?: string | null }) {
  const short = clean(status?.short);
  const long = clean(status?.long);

  if (short === "TBD" || short === "NS") return long || "Fixture scheduled";
  if (long) return long;
  if (short) return short;

  return "Fixture scheduled";
}

function Crest({ name, uri }: { name: string; uri?: string | null }) {
  const fallback = clean(name).slice(0, 2).toUpperCase() || "—";

  return (
    <View style={styles.crest}>
      {uri ? (
        <Image source={{ uri }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{fallback}</Text>
      )}
    </View>
  );
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoPill}>
      <Ionicons name={icon} size={15} color={theme.colors.emeraldSoft} />
      <View style={styles.infoPillTextWrap}>
        <Text style={styles.infoPillLabel}>{label}</Text>
        <Text style={styles.infoPillValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function GuideCard({
  icon,
  eyebrow,
  title,
  subtitle,
  buttonLabel,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.guideCard, disabled && styles.guideCardDisabled]}>
      <View style={styles.guideIcon}>
        <Ionicons name={icon} size={18} color={theme.colors.emeraldSoft} />
      </View>

      <View style={styles.guideCardTextWrap}>
        <Text style={styles.guideEyebrow}>{eyebrow}</Text>
        <Text style={styles.guideCardTitle}>{title}</Text>
        <Text style={styles.guideCardText}>{subtitle}</Text>

        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.guideButton,
            disabled && styles.guideButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.guideButtonText}>{buttonLabel}</Text>
          <Ionicons
            name="arrow-forward"
            size={13}
            color={disabled ? theme.colors.textMuted : theme.colors.textPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}

function LocalBasicsCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.localInfoCard}>
      <View style={styles.localInfoIcon}>
        <Ionicons name={icon} size={16} color={theme.badge.textGold} />
      </View>

      <View style={styles.localInfoTextWrap}>
        <Text style={styles.localInfoLabel}>{label}</Text>
        <Text style={styles.localInfoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function MatchScreen() {
  const router = useRouter();
  const rawParams = useLocalSearchParams() as RouteParams;

  const fixtureId = getParam(rawParams, "id");
  const tripId = getParam(rawParams, "tripId");
  const routeFrom = getParam(rawParams, "from");
  const routeTo = getParam(rawParams, "to");
  const routeLeagueId = getParam(rawParams, "leagueId");
  const routeSeason = getParam(rawParams, "season");

  const { fixture, loading } = useFixture(fixtureId);

  const trip = useTripsStore((s) =>
    tripId ? s.trips.find((t) => t.id === tripId) ?? null : null
  );

  const home = clean(trip?.homeName ?? fixture?.teams?.home?.name);
  const away = clean(trip?.awayName ?? fixture?.teams?.away?.name);

  const kickoffIso = clean(trip?.kickoffIso ?? fixture?.fixture?.date);

  const venueName = clean(fixture?.fixture?.venue?.name);
  const venueCity = clean(fixture?.fixture?.venue?.city);
  const venueLine = [venueCity, venueName].filter(Boolean).join(" • ");

  const crestHome = fixture?.teams?.home?.logo;
  const crestAway = fixture?.teams?.away?.logo;

  const effectiveLeagueId = clean(trip?.leagueId) || clean(fixture?.league?.id) || routeLeagueId;
  const effectiveLeagueName = clean(trip?.leagueName ?? fixture?.league?.name) || "Competition";
  const effectiveLeagueLogo = clean((fixture?.league as any)?.logo);
  const effectiveLeagueCountry = clean((fixture?.league as any)?.country);
  const effectiveSeason =
    routeSeason || clean((fixture?.league as { season?: unknown } | undefined)?.season);
  const effectiveRound = formatRoundOrStage(fixture?.league?.round);

  const leagueIdNumber = Number(effectiveLeagueId);
  const isEuropeanCompetition =
    Number.isFinite(leagueIdNumber) && isEuropeanCompetitionLeagueId(leagueIdNumber);

  const venueCountryCode = resolveCityCountryCode(venueCity);
  const headerCountryCode = isEuropeanCompetition ? venueCountryCode : null;

  const kickoff = useMemo(
    () => formatKickoffLocal(kickoffIso, venueCity),
    [kickoffIso, venueCity]
  );

  const stadium = useMemo(() => {
    return home ? getStadiumByTeamFromRegistry(normalizeTeamKey(home)) : null;
  }, [home]);

  const teamGuideKey = useMemo(() => {
    return home ? normalizeTeamKey(home) : "";
  }, [home]);

  const cityGuideKey = useMemo(() => {
    return venueCity ? normalizeCityKey(venueCity) : "";
  }, [venueCity]);

  const tripBuildParams = useMemo(
    () =>
      buildCanonicalTripBuildParams({
        fixtureId,
        leagueId: effectiveLeagueId,
        season: effectiveSeason,
        city: venueCity || trip?.displayCity,
        kickoffIso,
        from: routeFrom,
        to: routeTo,
      }),
    [
      fixtureId,
      effectiveLeagueId,
      effectiveSeason,
      venueCity,
      trip?.displayCity,
      kickoffIso,
      routeFrom,
      routeTo,
    ]
  );

  const backdrop = useMemo(
    () =>
      getFixtureBackdrop({
        leagueId: Number.isFinite(leagueIdNumber) ? leagueIdNumber : effectiveLeagueId,
        countryCode: venueCountryCode,
        countryName: effectiveLeagueCountry,
      }),
    [effectiveLeagueCountry, effectiveLeagueId, leagueIdNumber, venueCountryCode]
  );

  function goBack() {
    if (tripId) {
      router.push({ pathname: "/trip/[id]", params: { id: tripId } } as never);
      return;
    }

    router.back();
  }

  function buildTrip() {
    router.push({
      pathname: "/trip/build",
      params: tripBuildParams,
    } as never);
  }

  function openTeamGuide() {
    if (!teamGuideKey) return;

    router.push({
      pathname: "/team/[teamKey]",
      params: {
        teamKey: teamGuideKey,
        from: routeFrom || tripBuildParams.from,
        to: routeTo || tripBuildParams.to,
      },
    } as never);
  }

  function openCityGuide() {
    if (!cityGuideKey) return;

    router.push({
      pathname: "/city/key/[cityKey]",
      params: {
        cityKey: cityGuideKey,
        from: routeFrom || tripBuildParams.from,
        to: routeTo || tripBuildParams.to,
      },
    } as never);
  }

  if (!fixtureId) {
    return (
      <Background mode="solid" solidColor={theme.colors.bgBase} overlayOpacity={0.3}>
        <SafeAreaView style={styles.safe}>
          <EmptyState title="Match not found" />
        </SafeAreaView>
      </Background>
    );
  }

  const heroContent = (
    <>
      <View style={styles.heroOverlay} />
      <View style={styles.heroTopShade} />
      <View style={styles.heroBottomShade} />

      <View style={styles.heroInner}>
        <View style={styles.heroTopRow}>
          <View style={styles.leagueRow}>
            {effectiveLeagueLogo ? (
              <Image
                source={{ uri: effectiveLeagueLogo }}
                style={styles.leagueLogo}
                resizeMode="contain"
              />
            ) : null}

            <Text style={styles.leagueName} numberOfLines={1}>
              {effectiveLeagueName}
            </Text>

            {headerCountryCode ? (
              <View style={styles.headerFlagWrap}>
                <LeagueFlag code={headerCountryCode} size="sm" />
              </View>
            ) : null}
          </View>

          <View style={styles.timeChip}>
            <Ionicons name="time-outline" size={13} color={theme.colors.emeraldSoft} />
            <Text style={styles.timeChipText}>{kickoff.time}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{kickoff.date}</Text>
        </View>

        <View style={styles.teamsRow}>
          <View style={styles.teamCol}>
            <Crest name={home || "Home"} uri={crestHome} />
            <Text style={styles.teamLabel} numberOfLines={2}>
              {home || "Home"}
            </Text>
          </View>

          <View style={styles.vsPlate}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.teamCol}>
            <Crest name={away || "Away"} uri={crestAway} />
            <Text style={styles.teamLabel} numberOfLines={2}>
              {away || "Away"}
            </Text>
          </View>
        </View>

        {!!venueLine && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color={theme.colors.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {venueLine}
            </Text>
          </View>
        )}

        <View style={styles.heroActions}>
          <Button label="Start trip from this match" tone="primary" onPress={buildTrip} glow />
        </View>
      </View>
    </>
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
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={18} color={theme.colors.textPrimary} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {backdrop ? (
            <ImageBackground
              source={{ uri: backdrop }}
              style={styles.heroCard}
              imageStyle={styles.heroImage}
              resizeMode="cover"
            >
              {heroContent}
            </ImageBackground>
          ) : (
            <View style={[styles.heroCard, styles.heroFallback]}>{heroContent}</View>
          )}

          <GlassCard level="default" variant="glass" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Match details</Text>
              <Text style={styles.sectionTitle}>Know what you are building around</Text>
              <Text style={styles.sectionSub}>
                Core fixture details before you commit this match to a trip.
              </Text>
            </View>

            <View style={styles.infoGrid}>
              <InfoPill icon="calendar-outline" label="Date" value={kickoff.date} />
              <InfoPill icon="time-outline" label="Kickoff" value={`${kickoff.time} local`} />
              <InfoPill icon="trophy-outline" label="Competition" value={effectiveLeagueName} />
              <InfoPill icon="flag-outline" label="Status" value={formatStatus(fixture?.fixture?.status)} />
            </View>

            {effectiveRound ? (
              <View style={styles.roundBox}>
                <Text style={styles.roundLabel}>Round / stage</Text>
                <Text style={styles.roundValue}>{effectiveRound}</Text>
              </View>
            ) : null}
          </GlassCard>

          <GlassCard level="default" variant="glass" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Trip context</Text>
              <Text style={styles.sectionTitle}>Plan the weekend properly</Text>
              <Text style={styles.sectionSub}>
                Jump into the home team and city guides before building the full trip.
              </Text>
            </View>

            <View style={styles.guideList}>
              <GuideCard
                icon="shirt-outline"
                eyebrow="Home team"
                title={home ? `${home} guide` : "Home team guide"}
                subtitle={
                  home
                    ? `Matchday feel, stadium context and useful planning notes for ${home}.`
                    : "Home team data is still loading for this fixture."
                }
                buttonLabel="Open team guide"
                onPress={openTeamGuide}
                disabled={!teamGuideKey}
              />

              <GuideCard
                icon="business-outline"
                eyebrow="City"
                title={venueCity ? `${venueCity} guide` : "City guide"}
                subtitle={
                  venueCity
                    ? `Stay areas, transport basics and city-break context for ${venueCity}.`
                    : "City data is still loading for this fixture."
                }
                buttonLabel="Open city guide"
                onPress={openCityGuide}
                disabled={!cityGuideKey}
              />
            </View>
          </GlassCard>

          <GlassCard level="default" variant="glass" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Local basics</Text>
              <Text style={styles.sectionTitle}>Quick planning notes</Text>
              <Text style={styles.sectionSub}>
                Enough context to judge whether this fixture works as a realistic trip.
              </Text>
            </View>

            <View style={styles.localInfoWrap}>
              <LocalBasicsCard
                icon="location-outline"
                label="Stadium area"
                value={venueName ? `${venueName}${venueCity ? ` • ${venueCity}` : ""}` : "Stadium details loading"}
              />

              {stadium?.airport ? (
                <LocalBasicsCard icon="airplane-outline" label="Nearest airport" value={stadium.airport} />
              ) : (
                <LocalBasicsCard
                  icon="airplane-outline"
                  label="Airport planning"
                  value={venueCity ? `Use the ${venueCity} city guide for airport and transfer planning.` : "Airport guidance will appear once the city is known."}
                />
              )}

              {Array.isArray(stadium?.transit) && stadium.transit.length > 0 ? (
                <LocalBasicsCard
                  icon="train-outline"
                  label="Best transport angle"
                  value={`${stadium.transit[0].label}${
                    typeof stadium.transit[0].minutes === "number"
                      ? ` • ${stadium.transit[0].minutes} min`
                      : ""
                  }`}
                />
              ) : (
                <LocalBasicsCard
                  icon="train-outline"
                  label="Transport"
                  value="Check the city guide before booking hotels. Stadium transfer times can decide whether this is a good trip."
                />
              )}

              {Array.isArray(stadium?.stayAreas) && stadium.stayAreas.length > 0 ? (
                <LocalBasicsCard icon="bed-outline" label="Best area to stay" value={stadium.stayAreas[0].area} />
              ) : (
                <LocalBasicsCard
                  icon="bed-outline"
                  label="Stay area"
                  value={venueCity ? `Start with central ${venueCity}, then refine around transport to the stadium.` : "Stay guidance will appear once the city is known."}
                />
              )}
            </View>
          </GlassCard>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={theme.colors.textSecondary} />
              <Text style={styles.loadingText}>Loading match details…</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  backButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.button,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Platform.OS === "android" ? theme.glass.android.default : theme.glass.bg.default,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  backText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: 14,
  },

  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgSurface,
  },

  heroImage: {
    borderRadius: 30,
    opacity: 0.82,
  },

  heroFallback: {
    backgroundColor: theme.colors.bgSurface,
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  heroTopShade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 92,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  heroBottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 132,
    backgroundColor: "rgba(0,0,0,0.34)",
  },

  heroInner: {
    padding: 18,
    gap: 14,
  },

  heroTopRow: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  leagueRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  leagueLogo: {
    width: 22,
    height: 22,
  },

  leagueName: {
    flexShrink: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  headerFlagWrap: {
    marginLeft: 2,
  },

  timeChip: {
    minHeight: 31,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  timeChipText: {
    color: theme.badge.textEmerald,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  dateRow: {
    alignItems: "center",
    gap: 2,
  },

  dateText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  teamCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 8,
  },

  crest: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestImg: {
    width: 56,
    height: 56,
    opacity: 0.98,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 14,
  },

  teamLabel: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
  },

  vsPlate: {
    minWidth: 42,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(0,0,0,0.34)",
  },

  vsText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  locationRow: {
    minHeight: 34,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(0,0,0,0.32)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  locationText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: theme.fontWeight.bold,
  },

  heroActions: {
    gap: 10,
  },

  sectionCard: {
    padding: 16,
    borderRadius: 24,
    gap: 13,
  },

  sectionHeader: {
    gap: 4,
  },

  sectionEyebrow: {
    color: theme.colors.emeraldSoft,
    fontSize: 11,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.1,
  },

  sectionSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  infoGrid: {
    gap: 9,
  },

  infoPill: {
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: Platform.OS === "android" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  infoPillTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },

  infoPillLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },

  infoPillValue: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: theme.fontWeight.bold,
  },

  roundBox: {
    padding: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(0,0,0,0.22)",
    gap: 4,
  },

  roundLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },

  roundValue: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.bold,
  },

  guideList: {
    gap: 10,
  },

  guideCard: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: Platform.OS === "android" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
    flexDirection: "row",
    gap: 12,
  },

  guideCardDisabled: {
    opacity: 0.66,
  },

  guideIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
  },

  guideCardTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },

  guideEyebrow: {
    color: theme.badge.textGold,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  guideCardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: theme.fontWeight.black,
  },

  guideCardText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  guideButton: {
    marginTop: 7,
    alignSelf: "flex-start",
    minHeight: 34,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: theme.borderRadius.pill,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
    backgroundColor: theme.badge.bgEmerald,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  guideButtonDisabled: {
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  guideButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  localInfoWrap: {
    gap: 10,
  },

  localInfoCard: {
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: Platform.OS === "android" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.03)",
    flexDirection: "row",
    gap: 11,
  },

  localInfoIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.badge.bgGold,
    borderWidth: 1,
    borderColor: theme.badge.borderGold,
  },

  localInfoTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },

  localInfoLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: theme.fontWeight.black,
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },

  localInfoValue: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.fontWeight.medium,
  },

  loadingCard: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
