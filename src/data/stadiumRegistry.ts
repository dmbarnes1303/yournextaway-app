
// src/data/stadiumRegistry.ts

import type { StadiumRecord } from "@/src/data/stadiums/types";

import premierLeagueStadiums from "@/src/data/stadiums/premierLeague";
import laLigaStadiums from "@/src/data/stadiums/laLiga";
import serieAStadiums from "@/src/data/stadiums/serieA";
import bundesligaStadiums from "@/src/data/stadiums/bundesliga";
import ligue1Stadiums from "@/src/data/stadiums/ligue1";
import primeiraLigaStadiums from "@/src/data/stadiums/primeiraLiga";
import eredivisieStadiums from "@/src/data/stadiums/eredivisie";
import scottishPremiershipStadiums from "@/src/data/stadiums/scottishPremiership";
import superLigStadiums from "@/src/data/stadiums/superLig";
import proLeagueStadiums from "@/src/data/stadiums/proLeague";
import superLeagueGreeceStadiums from "@/src/data/stadiums/superLeagueGreece";
import austrianBundesligaStadiums from "@/src/data/stadiums/austrianBundesliga";
import superligaDenmarkStadiums from "@/src/data/stadiums/superligaDenmark";
import swissSuperLeagueStadiums from "@/src/data/stadiums/swissSuperLeague";
import czechFirstLeagueStadiums from "@/src/data/stadiums/czechFirstLeague";
import ekstraklasaStadiums from "@/src/data/stadiums/ekstraklasa";

export const stadiumRegistry: Record<string, StadiumRecord> = {
  ...premierLeagueStadiums,
  ...laLigaStadiums,
  ...serieAStadiums,
  ...bundesligaStadiums,
  ...ligue1Stadiums,
  ...primeiraLigaStadiums,
  ...eredivisieStadiums,
  ...scottishPremiershipStadiums,
  ...superLigStadiums,
  ...proLeagueStadiums,
  ...superLeagueGreeceStadiums,
  ...austrianBundesligaStadiums,
  ...superligaDenmarkStadiums,
  ...swissSuperLeagueStadiums,
  ...czechFirstLeagueStadiums,
  ...ekstraklasaStadiums,
};

export function getAllStadiums(): StadiumRecord[] {
  return Object.values(stadiumRegistry);
}

export function getStadiumFromRegistry(stadiumKey?: string | null): StadiumRecord | null {
  const key = String(stadiumKey ?? "").trim().toLowerCase();
  if (!key) return null;
  return stadiumRegistry[key] ?? null;
}

export function getStadiumByTeamFromRegistry(teamKey?: string | null): StadiumRecord | null {
  const key = String(teamKey ?? "").trim().toLowerCase();
  if (!key) return null;

  return (
    Object.values(stadiumRegistry).find((stadium) =>
      Array.isArray(stadium.teamKeys) &&
      stadium.teamKeys.some((team) => String(team ?? "").trim().toLowerCase() === key)
    ) ?? null
  );
}

export default stadiumRegistry;
