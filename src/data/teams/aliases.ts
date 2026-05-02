// src/data/teams/aliases.ts

import type { TeamRecord, TeamRegistry } from "./types";

import premierLeagueTeams from "./premierLeague";
import laLigaTeams from "./laLiga";
import serieATeams from "./serieA";
import bundesligaTeams from "./bundesliga";
import ligue1Teams from "./ligue1";
import primeiraLigaTeams from "./primeiraLiga";
import eredivisieTeams from "./eredivisie";
import scottishPremiershipTeams from "./scottishPremiership";
import superLigTeams from "./superLig";
import proLeagueTeams from "./proLeague";
import superLeagueGreeceTeams from "./superLeagueGreece";
import austrianBundesligaTeams from "./austrianBundesliga";
import superligaDenmarkTeams from "./superligaDenmark";
import swissSuperLeagueTeams from "./swissSuperLeague";
import czechFirstLeagueTeams from "./czechFirstLeague";
import ekstraklasaTeams from "./ekstraklasa";
import allsvenskanTeams from "./allsvenskan";
import eliteserienTeams from "./eliteserien";
import veikkausliigaTeams from "./veikkausliiga";
import bestaDeildTeams from "./bestaDeild";
import nbITeams from "./nbI";
import superLigaTeams from "./superLiga";
import hnlTeams from "./hnl";
import superLigaSerbiaTeams from "./superLigaSerbia";
import superLigaSlovakiaTeams from "./superLigaSlovakia";
import prvaLigaSloveniaTeams from "./prvaLigaSlovenia";
import firstLeagueBulgariaTeams from "./firstLeagueBulgaria";
import firstDivisionCyprusTeams from "./firstDivisionCyprus";
import premierLeagueBosniaTeams from "./premierLeagueBosnia";
import leagueOfIrelandPremierTeams from "./leagueOfIrelandPremier";

type AliasMap = Record<string, string[]>;

const SOURCES: TeamRegistry[] = [
  premierLeagueTeams,
  laLigaTeams,
  serieATeams,
  bundesligaTeams,
  ligue1Teams,
  primeiraLigaTeams,
  eredivisieTeams,
  scottishPremiershipTeams,
  superLigTeams,
  proLeagueTeams,
  superLeagueGreeceTeams,
  austrianBundesligaTeams,
  superligaDenmarkTeams,
  swissSuperLeagueTeams,
  czechFirstLeagueTeams,
  ekstraklasaTeams,
  allsvenskanTeams,
  eliteserienTeams,
  veikkausliigaTeams,
  bestaDeildTeams,
  nbITeams,
  superLigaTeams,
  hnlTeams,
  superLigaSerbiaTeams,
  superLigaSlovakiaTeams,
  prvaLigaSloveniaTeams,
  firstLeagueBulgariaTeams,
  firstDivisionCyprusTeams,
  premierLeagueBosniaTeams,
  leagueOfIrelandPremierTeams,
];

const MANUAL_ALIASES: AliasMap = {
  arsenal: ["Arsenal", "Arsenal FC"],
  chelsea: ["Chelsea", "Chelsea FC"],
  liverpool: ["Liverpool", "Liverpool FC"],
  "manchester-united": ["Manchester United", "Man United", "Man Utd", "Manchester Utd"],
  "manchester-city": ["Manchester City", "Man City"],
  tottenham: ["Tottenham", "Tottenham Hotspur", "Spurs"],
  newcastle: ["Newcastle", "Newcastle United"],
  "aston-villa": ["Aston Villa"],
  "west-ham": ["West Ham", "West Ham United"],
  wolves: ["Wolves", "Wolverhampton", "Wolverhampton Wanderers"],
  brighton: ["Brighton", "Brighton & Hove Albion", "Brighton and Hove Albion"],
  "nottingham-forest": ["Nottingham Forest", "Nottm Forest", "Forest"],

  inter: ["Inter", "Inter Milan", "Internazionale", "FC Internazionale Milano"],
  milan: ["Milan", "AC Milan", "A.C. Milan"],
  juventus: ["Juventus", "Juve", "Juventus FC"],
  roma: ["Roma", "AS Roma", "A.S. Roma"],
  lazio: ["Lazio", "SS Lazio", "S.S. Lazio"],
  napoli: ["Napoli", "SSC Napoli", "S.S.C. Napoli"],
  fiorentina: ["Fiorentina", "ACF Fiorentina"],
  atalanta: ["Atalanta", "Atalanta BC"],

  barcelona: ["Barcelona", "FC Barcelona", "Barca", "Barça"],
  "real-madrid": ["Real Madrid", "Real Madrid CF"],
  "atletico-madrid": ["Atletico Madrid", "Atlético Madrid", "Atleti", "Club Atletico de Madrid"],
  "real-betis": ["Real Betis", "Betis", "Real Betis Balompie", "Real Betis Balompié"],
  "real-sociedad": ["Real Sociedad", "Sociedad", "Real Sociedad de Futbol", "Real Sociedad de Fútbol"],
  "athletic-club": ["Athletic Club", "Athletic Bilbao", "Bilbao", "Athletic Club Bilbao"],

  psg: ["PSG", "Paris SG", "Paris Saint-Germain", "Paris Saint Germain"],
  marseille: ["Marseille", "Olympique Marseille", "Olympique de Marseille"],
  lyon: ["Lyon", "Olympique Lyonnais"],
  monaco: ["Monaco", "AS Monaco"],

  "bayern-munich": ["Bayern Munich", "Bayern München", "Bayern", "FC Bayern", "FC Bayern Munich"],
  "borussia-dortmund": ["Borussia Dortmund", "Dortmund", "BVB"],
  "bayer-leverkusen": ["Bayer Leverkusen", "Leverkusen", "Bayer 04 Leverkusen"],
  "borussia-monchengladbach": [
    "Borussia Monchengladbach",
    "Borussia Mönchengladbach",
    "Monchengladbach",
    "Mönchengladbach",
    "Gladbach",
  ],

  ajax: ["Ajax", "AFC Ajax"],
  psv: ["PSV", "PSV Eindhoven"],
  feyenoord: ["Feyenoord", "Feyenoord Rotterdam"],

  benfica: ["Benfica", "SL Benfica", "Sport Lisboa e Benfica"],
  sporting: [
    "Sporting",
    "Sporting CP",
    "Sporting Lisbon",
    "Sporting Lisboa",
    "Sporting Club Portugal",
    "Sporting Clube Portugal",
    "Sporting Clube de Portugal",
  ],
  porto: ["Porto", "FC Porto", "F.C. Porto"],
  "gil-vicente": ["Gil Vicente", "Gil Vicente FC", "GIL Vicente"],

  celtic: ["Celtic", "Celtic FC"],
  rangers: ["Rangers", "Rangers FC"],

  galatasaray: ["Galatasaray", "Galatasaray SK"],
  fenerbahce: ["Fenerbahce", "Fenerbahçe", "Fenerbahce SK", "Fenerbahçe SK"],
  besiktas: ["Besiktas", "Beşiktaş", "Besiktas JK", "Beşiktaş JK"],
};

function clean(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bfootball\b/g, " ")
    .replace(/\bsoccer\b/g, " ")
    .replace(/\bassociation\b/g, " ")
    .replace(/\bcalcio\b/g, " ")
    .replace(/\bclub\b/g, " ")
    .replace(/\bfc\b/g, " ")
    .replace(/\bcf\b/g, " ")
    .replace(/\bafc\b/g, " ")
    .replace(/\bsc\b/g, " ")
    .replace(/\bcp\b/g, " ")
    .replace(/\bsl\b/g, " ")
    .replace(/\bss\b/g, " ")
    .replace(/\bas\b/g, " ")
    .replace(/\bac\b/g, " ")
    .replace(/\bsk\b/g, " ")
    .replace(/\bjk\b/g, " ")
    .replace(/\bde\b/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\bbalompie\b/g, "betis")
    .replace(/\bbalompie\b/g, "betis")
    .replace(/\bmunchen\b/g, "munich")
    .replace(/\bmuenchen\b/g, "munich")
    .replace(/\s+/g, " ")
    .trim();
}

function key(value: unknown): string {
  return clean(value).replace(/\s+/g, "-");
}

function titleCase(value: string): string {
  return clean(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function unique(values: unknown[]): string[] {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function looseVariants(value: unknown): string[] {
  const base = clean(value);
  if (!base) return [];

  const parts = base.split(" ").filter(Boolean);
  const out = new Set<string>([base]);

  if (parts.length > 1) {
    out.add(parts[0]);
    out.add(parts.slice(0, 2).join(" "));
    out.add(parts.slice(-1).join(" "));
  }

  const stripped = base
    .replace(/\bunited\b/g, "")
    .replace(/\bcity\b/g, "")
    .replace(/\bhotspur\b/g, "")
    .replace(/\bwanderers\b/g, "")
    .replace(/\balbion\b/g, "")
    .replace(/\bathletic\b/g, "")
    .replace(/\breal\b/g, "")
    .replace(/\bsporting\b/g, "sporting")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped) out.add(stripped);

  return Array.from(out).filter(Boolean);
}

function aliasesFromTeam(team: TeamRecord): string[] {
  return unique([
    team.teamKey,
    team.name,
    team.city,
    ...(team.aliases ?? []),
    ...looseVariants(team.name),
    ...looseVariants(team.teamKey),
    ...(team.aliases ?? []).flatMap(looseVariants),
  ]);
}

function buildTeamAliases(): AliasMap {
  const map: AliasMap = {};

  for (const source of SOURCES) {
    for (const team of Object.values(source)) {
      if (!team?.teamKey || !team?.name) continue;

      const teamKey = key(team.teamKey);
      const generated = aliasesFromTeam(team);
      const manual = MANUAL_ALIASES[teamKey] ?? [];

      map[teamKey] = unique([...(map[teamKey] ?? []), ...generated, ...manual]);
    }
  }

  for (const [manualKey, aliases] of Object.entries(MANUAL_ALIASES)) {
    map[manualKey] = unique([...(map[manualKey] ?? []), manualKey, ...aliases]);
  }

  return map;
}

export const teamAliases: AliasMap = buildTeamAliases();

export function expandTeamAliases(name: string): string[] {
  const input = clean(name);
  if (!input) return [];

  for (const aliases of Object.values(teamAliases)) {
    const normalized = unique(aliases);
    if (normalized.includes(input)) {
      return unique([...normalized, ...normalized.flatMap(looseVariants)]);
    }
  }

  return unique([input, ...looseVariants(input)]);
}

export function getPreferredTeamName(name: string): string {
  const aliases = expandTeamAliases(name);
  return aliases[0] ? titleCase(aliases[0]) : titleCase(name);
}

export default teamAliases;
