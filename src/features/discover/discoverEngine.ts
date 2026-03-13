import type { FixtureListRow } from "@/src/services/apiFootball"
import { atmosphereScore } from "./atmosphereScore"

export type DiscoverScores = {
  derbyScore: number
  atmosphereScore: number
  stadiumScore: number
  valueScore: number
  nightScore: number
  titleDramaScore: number
}

export type DiscoverFixture = {
  fixture: FixtureListRow
  scores: DiscoverScores
}

function isDerby(home: string, away: string) {
  const pair = `${home} ${away}`.toLowerCase()

  const derbyPairs = [
    "arsenal tottenham",
    "barcelona real madrid",
    "inter milan",
    "celtic rangers",
    "manchester united manchester city",
    "liverpool everton",
    "roma lazio",
  ]

  return derbyPairs.some((d) => pair.includes(d))
}

function nightMatchScore(dateIso?: string | null) {
  if (!dateIso) return 0

  const d = new Date(dateIso)
  const hour = d.getHours()

  if (hour >= 19) return 2
  if (hour >= 17) return 1

  return 0
}

function stadiumScore(home: string) {
  const legendary = [
    "barcelona",
    "real madrid",
    "manchester united",
    "liverpool",
    "bayern",
    "milan",
    "inter",
    "juventus",
  ]

  const lower = home.toLowerCase()

  if (legendary.some((t) => lower.includes(t))) return 2

  return 0
}

function valueScore(f: FixtureListRow) {
  const league = f.league?.name ?? ""

  if (league.includes("Bundesliga")) return 2
  if (league.includes("Portugal")) return 2
  if (league.includes("Belgium")) return 2

  return 0
}

function titleDramaScore(f: FixtureListRow) {
  const round = f.league?.round ?? ""

  if (round.toLowerCase().includes("round 34")) return 2
  if (round.toLowerCase().includes("round 35")) return 2
  if (round.toLowerCase().includes("round 36")) return 2

  return 0
}

export function scoreFixture(f: FixtureListRow): DiscoverFixture {
  const home = f.teams?.home?.name ?? ""
  const away = f.teams?.away?.name ?? ""

  const scores: DiscoverScores = {
    derbyScore: isDerby(home, away) ? 3 : 0,
    atmosphereScore: atmosphereScore(home),
    stadiumScore: stadiumScore(home),
    valueScore: valueScore(f),
    nightScore: nightMatchScore(f.fixture?.date),
    titleDramaScore: titleDramaScore(f),
  }

  return {
    fixture: f,
    scores,
  }
}

export function buildDiscoverScores(fixtures: FixtureListRow[]) {
  return fixtures.map(scoreFixture)
}
