// src/data/stadiums/index.ts

import type { StadiumRecord } from "./types";

import premierLeagueStadiums from "./premierLeague";
import laLigaStadiums from "./laLiga";
import serieAStadiums from "./serieA";
import bundesligaStadiums from "./bundesliga";
import ligue1Stadiums from "./ligue1";

export const stadiums: Record<string, StadiumRecord> = {
  ...premierLeagueStadiums,
  ...laLigaStadiums,
  ...serieAStadiums,
  ...bundesligaStadiums,
  ...ligue1Stadiums,
};

export function getStadium(stadiumKey: string): StadiumRecord | null {
  const key = String(stadiumKey ?? "").trim().toLowerCase();
  return stadiums[key] ?? null;
}

export function getStadiumByTeam(teamKey: string): StadiumRecord | null {
  const key = String(teamKey ?? "").trim().toLowerCase();
  if (!key) return null;

  return (
    Object.values(stadiums).find((stadium) =>
      stadium.teamKeys.some((team) => String(team).trim().toLowerCase() === key)
    ) ?? null
  );
}

export function getStadiumsByCountry(country: string): StadiumRecord[] {
  const value = String(country ?? "").trim().toLowerCase();
  if (!value) return [];

  return Object.values(stadiums).filter(
    (stadium) => String(stadium.country ?? "").trim().toLowerCase() === value
  );
}

export function getStadiumsByCity(city: string): StadiumRecord[] {
  const value = String(city ?? "").trim().toLowerCase();
  if (!value) return [];

  return Object.values(stadiums).filter(
    (stadium) => String(stadium.city ?? "").trim().toLowerCase() === value
  );
}

export type { StadiumRecord } from "./types";
export { premierLeagueStadiums } from "./premierLeague";
export default stadiums;
