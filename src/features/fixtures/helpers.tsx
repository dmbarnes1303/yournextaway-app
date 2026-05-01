// src/features/fixtures/helpers.ts
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

import { theme } from "@/src/constants/theme";
import { getFlagImageUrl } from "@/src/utils/flagImages";
import type { FixtureListRow } from "@/src/services/apiFootball";
import tripsStore from "@/src/state/trips";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";
import { kickoffIsoOrNull } from "@/src/utils/kickoffTbc";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";
import type { LeagueOption } from "@/src/constants/football";
import { getTeam } from "@/src/data/teams";

const EUROPEAN_COMPETITION_META: Record<
  number,
  {
    short: string;
    display: string;
    confirmedSecondary: string;
    tbcSecondary: string;
    likelySecondary: string;
  }
> = {
  2: {
    short: "UCL",
    display: "Champions League",
    confirmedSecondary: "Local kickoff",
    tbcSecondary: "Kickoff time not confirmed",
    likelySecondary: "Likely placeholder kickoff",
  },
  3: {
    short: "UEL",
    display: "Europa League",
    confirmedSecondary: "Local kickoff",
    tbcSecondary: "Kickoff time not confirmed",
    likelySecondary: "Likely placeholder kickoff",
  },
  848: {
    short: "UECL",
    display: "Conference League",
    confirmedSecondary: "Local kickoff",
    tbcSecondary: "Kickoff time not confirmed",
    likelySecondary: "Likely placeholder kickoff",
  },
};

function ordinal(day: number): string {
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  return `${day}${suffix}`;
}

function parseFixtureDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function formatShortFixtureDate(iso: string | null | undefined): string {
  const dt = parseFixtureDate(iso);
  if (!dt) return "Date TBC";

  return dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatFixtureLocalTime(iso: string | null | undefined): string {
  const dt = parseFixtureDate(iso);
  if (!dt) return "TBC";

  return dt.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function isEuropeanCompetitionLeagueId(leagueId?: number | null) {
  if (leagueId == null) return false;
  return !!EUROPEAN_COMPETITION_META[Number(leagueId)];
}

export function getEuropeanCompetitionMeta(leagueId?: number | null) {
  if (leagueId == null) return null;
  return EUROPEAN_COMPETITION_META[Number(leagueId)] ?? null;
}

export function ticketDifficultyLabel(d: TicketDifficulty | "unknown") {
  switch (d) {
    case "easy":
      return "Easy";
    case "medium":
      return "Moderate";
    case "hard":
      return "Hard";
    case "very_hard":
      return "Very hard";
    default:
      return "Check club sale";
  }
}

export function ticketDifficultyShortLabel(d: TicketDifficulty | "unknown") {
  switch (d) {
    case "easy":
      return "Easy";
    case "medium":
      return "Moderate";
    case "hard":
      return "Hard";
    case "very_hard":
      return "Very hard";
    default:
      return "TBC";
  }
}

export function formatFixtureDateDisplay(iso: string | null | undefined) {
  const dt = parseFixtureDate(iso);
  if (!dt) return "TBC";

  const day = dt.getUTCDate();
  const month = dt.toLocaleDateString("en-GB", {
    month: "long",
    timeZone: "UTC",
  });
  const year = dt.getUTCFullYear();

  return `${ordinal(day)} ${month} ${year}`;
}

export function formatFixtureDateRangeDisplay(
  fromIso: string | null | undefined,
  toIso: string | null | undefined
) {
  if (!fromIso && !toIso) return "Select dates";
  if (!fromIso || !toIso) return formatFixtureDateDisplay(fromIso || toIso);

  const from = parseFixtureDate(fromIso);
  const to = parseFixtureDate(toIso);

  if (!from || !to) return "Select dates";

  const fromDay = from.getUTCDate();
  const toDay = to.getUTCDate();

  const fromMonth = from.toLocaleDateString("en-GB", {
    month: "long",
    timeZone: "UTC",
  });
  const toMonth = to.toLocaleDateString("en-GB", {
    month: "long",
    timeZone: "UTC",
  });

  const fromYear = from.getUTCFullYear();
  const toYear = to.getUTCFullYear();

  if (fromIso === toIso) {
    return `${ordinal(fromDay)} ${fromMonth} ${fromYear}`;
  }

  if (fromMonth === toMonth && fromYear === toYear) {
    return `${ordinal(fromDay)} - ${ordinal(toDay)} ${toMonth} ${toYear}`;
  }

  if (fromYear === toYear) {
    return `${ordinal(fromDay)} ${fromMonth} - ${ordinal(toDay)} ${toMonth} ${toYear}`;
  }

  return `${ordinal(fromDay)} ${fromMonth} ${fromYear} - ${ordinal(toDay)} ${toMonth} ${toYear}`;
}

export function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

export function fixtureIsoDateOnly(r: FixtureListRow): string | null {
  const iso = kickoffIsoOrNull(r);
  if (!iso) return null;
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? null;
}

export function kickoffPresentation(r: FixtureListRow, placeholderIds?: Set<string>) {
  const certainty = getFixtureCertainty(r, { placeholderIds });
  const iso = kickoffIsoOrNull(r);
  const leagueId = r?.league?.id != null ? Number(r.league.id) : null;
  const europeanMeta = getEuropeanCompetitionMeta(leagueId);

  if (!iso) {
    return {
      primary: "TBC",
      date: "Date TBC",
      time: "TBC",
      secondary: europeanMeta?.tbcSecondary ?? "Kickoff time not confirmed",
      certainty,
    };
  }

  const date = formatShortFixtureDate(iso);
  const time = formatFixtureLocalTime(iso);

  if (certainty === "likely_tbc") {
    return {
      primary: `${date}\n${time}`,
      date,
      time,
      secondary: europeanMeta?.likelySecondary ?? "Likely placeholder kickoff",
      certainty,
    };
  }

  if (certainty === "tbc") {
    return {
      primary: `${date}\n${time}`,
      date,
      time,
      secondary: europeanMeta?.tbcSecondary ?? "Kickoff time not confirmed",
      certainty,
    };
  }

  return {
    primary: `${date}\n${time}`,
    date,
    time,
    secondary: europeanMeta?.confirmedSecondary ?? "Local kickoff",
    certainty,
  };
}

export function resolveTripForFixture(fixtureId: string): string | null {
  const trips = tripsStore.getState().trips;
  const hit = trips.find((t) => (t.matchIds ?? []).includes(String(fixtureId)));
  return hit ? String(hit.id) : null;
}

function getSpecialFlagUrl(code: string) {
  const raw = String(code ?? "").trim().toUpperCase();

  if (raw === "ENG" || raw === "ENGLAND") {
    return "https://flagcdn.com/w40/gb-eng.png";
  }

  if (raw === "SCO" || raw === "SCOTLAND") {
    return "https://flagcdn.com/w40/gb-sct.png";
  }

  return null;
}

export function LeagueFlag({
  code,
  size = "sm",
}: {
  code: string;
  size?: "sm" | "md";
}) {
  const specialUrl = getSpecialFlagUrl(code);
  const fallbackUrl = getFlagImageUrl(String(code ?? "").trim().toUpperCase());
  const url = specialUrl || fallbackUrl;

  if (!url) return null;

  return (
    <Image
      source={{ uri: url }}
      style={size === "md" ? styles.flagMd : styles.flag}
      resizeMode="cover"
    />
  );
}

export function LeagueLogo({
  logo,
  size = "md",
}: {
  logo?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  if (!logo) return null;

  const style =
    size === "lg"
      ? styles.leagueLogoLg
      : size === "sm"
        ? styles.leagueLogoSm
        : styles.leagueLogoMd;

  return <Image source={{ uri: logo }} style={style} resizeMode="contain" />;
}

export function initials(name: string) {
  const clean = String(name ?? "").trim();
  if (!clean) return "—";
  const parts = clean.split(/\s+/g).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function TeamCrest({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <View style={styles.crestWrap}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.crestImg} resizeMode="contain" />
      ) : (
        <Text style={styles.crestFallback}>{initials(name)}</Text>
      )}
    </View>
  );
}

export function prettifyKey(input: string) {
  return String(input ?? "")
    .trim()
    .split("-")
    .filter(Boolean)
    .map((part) => {
      if (part.toLowerCase() === "fc") return "FC";
      if (part.toLowerCase() === "if") return "IF";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

export function featuredClubLine(league: LeagueOption): string {
  const europeanMeta = getEuropeanCompetitionMeta(league.leagueId);
  if (europeanMeta) {
    const parts = (league.featuredClubKeys ?? []).slice(0, 3).map((key) => {
      const team = getTeam(key);
      if (team?.name) return team.name;
      return prettifyKey(key);
    });

    return parts.join(" • ");
  }

  const parts = (league.featuredClubKeys ?? []).slice(0, 2).map((key) => {
    const team = getTeam(key);
    if (team?.name && team?.city) return `${team.name} (${team.city})`;
    if (team?.name) return team.name;
    return prettifyKey(key);
  });

  return parts.join(" • ");
}

export function leagueScopeSubtitle(selectedLeagues: LeagueOption[]) {
  if (selectedLeagues.length === 0) return "All competitions";

  if (selectedLeagues.length === 1) {
    const one = selectedLeagues[0];
    const europeanMeta = getEuropeanCompetitionMeta(one.leagueId);
    if (europeanMeta) return europeanMeta.display;
    return `${one.label} • ${one.country}`;
  }

  const europeanCount = selectedLeagues.filter((league) =>
    isEuropeanCompetitionLeagueId(league.leagueId)
  ).length;

  if (europeanCount === selectedLeagues.length) {
    return `${selectedLeagues.length} European competitions`;
  }

  if (europeanCount > 0) {
    return `${selectedLeagues.length} competitions selected`;
  }

  return `${selectedLeagues.length} competitions selected`;
}

const styles = StyleSheet.create({
  flag: {
    width: 18,
    height: 13,
    borderRadius: 3,
    opacity: 0.95,
  },

  flagMd: {
    width: 22,
    height: 16,
    borderRadius: 4,
    opacity: 0.98,
  },

  leagueLogoSm: {
    width: 16,
    height: 16,
    opacity: 0.96,
  },

  leagueLogoMd: {
    width: 22,
    height: 22,
    opacity: 0.98,
  },

  leagueLogoLg: {
    width: 28,
    height: 28,
    opacity: 1,
  },

  crestWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.glass.bg.default,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  crestImg: {
    width: 38,
    height: 38,
    opacity: 0.95,
  },

  crestFallback: {
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
  },
});
