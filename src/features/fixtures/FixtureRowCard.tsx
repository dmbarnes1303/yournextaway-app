// src/features/fixtures/FixtureRowCard.tsx
import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Button from "@/src/components/Button";
import { theme } from "@/src/constants/theme";
import { getFixtureBackdrop } from "@/src/constants/visualAssets";

import {
  LeagueFlag,
  TeamCrest,
  kickoffPresentation,
  isEuropeanCompetitionLeagueId,
} from "./helpers";
import type { RankedFixtureRow, FixtureRouteCtx } from "./types";

type Props = {
  item: RankedFixtureRow;
  expanded: boolean;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onPressMatch: (id: string, ctx?: FixtureRouteCtx) => void;
  onPressBuildTrip: (id: string, ctx?: FixtureRouteCtx) => void;
};

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

function getLocationLine(item: RankedFixtureRow): string {
  const city = clean(item?.fixture?.venue?.city);
  const venue = clean(item?.fixture?.venue?.name);
  return [city, venue].filter(Boolean).join(" • ");
}

function resolveVenueCountryCode(item: RankedFixtureRow): string | null {
  const city = normalise(item?.fixture?.venue?.city);
  if (!city) return null;

  if (CITY_COUNTRY_CODE[city]) return CITY_COUNTRY_CODE[city];

  for (const part of city.split(" ")) {
    if (CITY_COUNTRY_CODE[part]) return CITY_COUNTRY_CODE[part];
  }

  return null;
}

function Row({
  item,
  isFollowed,
  onToggleFollow,
  onPressMatch,
  onPressBuildTrip,
}: Props) {
  const fixtureId = String(item?.fixture?.id ?? "");

  const home = clean(item?.teams?.home?.name) || "Home";
  const away = clean(item?.teams?.away?.name) || "Away";

  const leagueId = item?.league?.id ?? null;
  const leagueName = clean(item?.league?.name) || "Competition";
  const leagueLogo = (item?.league as any)?.logo ?? null;
  const countryCode = (item?.league as any)?.countryCode ?? null;
  const countryName = (item?.league as any)?.country ?? null;

  const isEuropeanCompetition = isEuropeanCompetitionLeagueId(
    leagueId == null ? null : Number(leagueId)
  );

  const headerCountryCode = isEuropeanCompetition
    ? resolveVenueCountryCode(item) ?? countryCode
    : null;

  const kickoff = kickoffPresentation(item, new Set());
  const locationLine = getLocationLine(item);

  const routeCtx: FixtureRouteCtx = {
    leagueId,
    season: (item?.league as any)?.season ?? null,
  };

  const backdrop = getFixtureBackdrop({
    leagueId,
    countryCode,
    countryName,
  });

  const content = (
    <>
      <View style={styles.bgOverlay} />
      <View style={styles.vignetteTop} />
      <View style={styles.vignetteBottom} />

      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <View style={styles.leagueRow}>
            {leagueLogo ? (
              <Image
                source={{ uri: leagueLogo }}
                style={styles.leagueLogo}
                resizeMode="contain"
              />
            ) : null}

            <Text style={styles.leagueText} numberOfLines={1}>
              {leagueName}
            </Text>

            {headerCountryCode ? (
              <View style={styles.europeFlagWrap}>
                <LeagueFlag code={headerCountryCode} size="sm" />
              </View>
            ) : null}
          </View>

          <View style={styles.timeChip}>
            <Ionicons
              name="time-outline"
              size={13}
              color={theme.colors.emeraldSoft}
            />
            <Text style={styles.timeChipText} numberOfLines={1}>
              {kickoff.time}
            </Text>
          </View>
        </View>

        <Text style={styles.dateText} numberOfLines={1}>
          {kickoff.date}
        </Text>

        <View style={styles.matchRow}>
          <View style={styles.teamCol}>
            <TeamCrest name={home} logo={item?.teams?.home?.logo} />
            <Text style={styles.teamName} numberOfLines={2}>
              {home}
            </Text>
          </View>

          <View style={styles.vsPlate}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.teamCol}>
            <TeamCrest name={away} logo={item?.teams?.away?.logo} />
            <Text style={styles.teamName} numberOfLines={2}>
              {away}
            </Text>
          </View>
        </View>

        {locationLine ? (
          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={theme.colors.textMuted}
            />
            <Text style={styles.location} numberOfLines={1}>
              {locationLine}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <Button
            label="Start trip"
            onPress={() => onPressBuildTrip(fixtureId, routeCtx)}
            tone="primary"
            size="sm"
            style={styles.primary}
            glow
          />

          <Button
            label="Details"
            onPress={() => onPressMatch(fixtureId, routeCtx)}
            tone="secondary"
            size="sm"
            style={styles.secondary}
          />

          <Pressable
            onPress={onToggleFollow}
            style={({ pressed }) => [
              styles.follow,
              isFollowed && styles.followActive,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
          >
            <Ionicons
              name={isFollowed ? "notifications" : "notifications-outline"}
              size={16}
              color={
                isFollowed
                  ? theme.badge.textEmerald
                  : theme.colors.textSecondary
              }
            />
          </Pressable>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.wrap}>
      {backdrop ? (
        <ImageBackground
          source={{ uri: backdrop }}
          style={styles.card}
          imageStyle={styles.cardImage}
          resizeMode="cover"
        >
          {content}
        </ImageBackground>
      ) : (
        <View style={[styles.card, styles.fallbackCard]}>{content}</View>
      )}
    </View>
  );
}

export default memo(Row);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 12,
  },

  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgSurface,
  },

  cardImage: {
    borderRadius: 24,
    opacity: 0.78,
  },

  fallbackCard: {
    backgroundColor: theme.colors.bgSurface,
  },

  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.53)",
  },

  vignetteTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 72,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  vignetteBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 92,
    backgroundColor: "rgba(0,0,0,0.24)",
  },

  inner: {
    padding: 14,
    gap: 11,
  },

  headerRow: {
    minHeight: 31,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  leagueRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },

  leagueLogo: {
    width: 20,
    height: 20,
  },

  leagueText: {
    flexShrink: 1,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.black,
    fontSize: 12,
    lineHeight: 15,
  },

  europeFlagWrap: {
    marginLeft: 2,
    opacity: 0.96,
  },

  timeChip: {
    minHeight: 31,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.badge.bgEmerald,
    borderWidth: 1,
    borderColor: theme.badge.borderEmerald,
  },

  timeChipText: {
    color: theme.badge.textEmerald,
    fontSize: 12,
    fontWeight: theme.fontWeight.black,
  },

  dateText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  teamCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 7,
  },

  teamName: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.black,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 18,
  },

  vsPlate: {
    minWidth: 42,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(0,0,0,0.30)",
  },

  vsText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: theme.fontWeight.black,
    letterSpacing: 0.4,
  },

  locationRow: {
    minHeight: 31,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  location: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.fontWeight.bold,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },

  primary: {
    flex: 1.4,
  },

  secondary: {
    flex: 1,
  },

  follow: {
    width: 42,
    borderRadius: theme.borderRadius.button,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: "rgba(0,0,0,0.26)",
  },

  followActive: {
    backgroundColor: theme.badge.bgEmerald,
    borderColor: theme.badge.borderEmerald,
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
});
