import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

import { theme } from "@/src/constants/theme";
import { getFlagImageUrl } from "@/src/utils/flagImages";
import { formatUkDateTimeMaybe } from "@/src/utils/formatters";
import type { FixtureListRow } from "@/src/services/apiFootball";
import tripsStore from "@/src/state/trips";
import { getFixtureCertainty } from "@/src/utils/fixtureCertainty";
import { kickoffIsoOrNull } from "@/src/utils/kickoffTbc";
import type { TicketDifficulty } from "@/src/data/ticketGuides/types";
import type { LeagueOption } from "@/src/constants/football";
import { getTeam } from "@/src/data/teams";

export function ticketDifficultyLabel(d: TicketDifficulty | "unknown") {
  switch (d) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "very_hard":
      return "Very hard";
    default:
      return "Unknown";
  }
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

  if (!iso) {
    return { primary: "TBC", secondary: "Kickoff time not set yet", certainty };
  }

  const formatted = formatUkDateTimeMaybe(iso) || "TBC";

  if (certainty === "likely_tbc") {
    return {
      primary: formatted,
      secondary: "Likely placeholder (TV schedule not confirmed)",
      certainty,
    };
  }

  if (certainty === "tbc") {
    return {
      primary: formatted,
      secondary: "Kickoff time not confirmed",
      certainty,
    };
  }

  return {
    primary: formatted,
    secondary: null as string | null,
    certainty,
  };
}

export function resolveTripForFixture(fixtureId: string): string | null {
  const trips = tripsStore.getState().trips;
  const hit = trips.find((t) => (t.matchIds ?? []).includes(String(fixtureId)));
  return hit ? String(hit.id) : null;
}

export function LeagueFlag({ code, size = "sm" }: { code: string; size?: "sm" | "md" }) {
  const url = getFlagImageUrl(code);
  if (!url) return null;
  return (
    <Image source={{ uri: url }} style={size === "md" ? styles.flagMd : styles.flag} />
  );
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
  const parts = (league.featuredClubKeys ?? []).slice(0, 2).map((key) => {
    const team = getTeam(key);
    if (team?.name && team?.city) return `${team.name} (${team.city})`;
    if (team?.name) return team.name;
    return prettifyKey(key);
  });

  return parts.join(" • ");
}

export function leagueScopeSubtitle(selectedLeagues: LeagueOption[]) {
  if (selectedLeagues.length === 0) return "Featured leagues";
  if (selectedLeagues.length === 1) {
    const one = selectedLeagues[0];
    return `${one.label} • ${one.country}`;
  }
  return `${selectedLeagues.length} leagues selected`;
}

const styles = StyleSheet.create({
  flag: { width: 18, height: 13, borderRadius: 3, opacity: 0.9 },
  flagMd: { width: 22, height: 16, borderRadius: 4, opacity: 0.95 },

  crestWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
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
