import type { DiscoverFixture } from "./discoverEngine"
import type { FixtureListRow } from "@/src/services/apiFootball"
import { getTicketDifficultyBadge } from "@/src/data/ticketGuides"
import type { TicketDifficulty } from "@/src/data/ticketGuides/types"
import { POPULAR_TEAM_IDS } from "@/src/data/teams"

export type DiscoverCategory =
  | "bigMatches"
  | "derbies"
  | "atmospheres"
  | "valueTrips"
  | "legendaryStadiums"
  | "iconicCities"
  | "perfectTrips"
  | "nightMatches"
  | "titleDrama"
  | "easyTickets"
  | "bucketList"
  | "matchdayCulture"
  | "underratedTrips"

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase()
}

function leagueWeight(leagueId: number | null): number {
  if (leagueId === 39) return 120
  if (leagueId === 140) return 105
  if (leagueId === 135) return 100
  if (leagueId === 78) return 95
  if (leagueId === 61) return 90
  if (leagueId === 88) return 82
  if (leagueId === 94) return 80
  if (leagueId === 203) return 78
  if (leagueId === 179) return 75
  return 60
}

function baseFixtureScore(r: FixtureListRow): number {
  const lid = r?.league?.id != null ? Number(r.league.id) : null
  let s = leagueWeight(lid)

  const homeId = r?.teams?.home?.id
  const awayId = r?.teams?.away?.id

  if (typeof homeId === "number" && POPULAR_TEAM_IDS.has(homeId)) s += 60
  if (typeof awayId === "number" && POPULAR_TEAM_IDS.has(awayId)) s += 60

  const venue = String(r?.fixture?.venue?.name ?? "").trim()
  const city = String(r?.fixture?.venue?.city ?? "").trim()

  if (venue) s += 10
  if (city) s += 6

  const dt = r?.fixture?.date ? new Date(r.fixture.date) : null
  if (dt && !Number.isNaN(dt.getTime())) {
    const day = dt.getDay()
    if (day === 5 || day === 6 || day === 0) s += 12

    const hr = dt.getHours()
    if (hr >= 17 && hr <= 21) s += 8
  }

  return s
}

function ticketDifficultyRank(d: TicketDifficulty | "unknown") {
  switch (d) {
    case "easy":
      return 4
    case "medium":
      return 3
    case "hard":
      return 2
    case "very_hard":
      return 1
    default:
      return 0
  }
}

function cityPrestigeScore(city: string): number {
  const key = norm(city)

  if (
    [
      "london",
      "madrid",
      "barcelona",
      "milan",
      "rome",
      "munich",
      "amsterdam",
      "lisbon",
      "paris",
      "glasgow",
      "istanbul",
      "dortmund",
      "liverpool",
      "manchester",
    ].includes(key)
  ) {
    return 3
  }

  if (
    [
      "porto",
      "seville",
      "turin",
      "naples",
      "rotterdam",
      "marseille",
      "berlin",
      "vienna",
      "prague",
    ].includes(key)
  ) {
    return 2
  }

  return 0
}

function iconicCityScore(scored: DiscoverFixture) {
  const city = String(scored.fixture?.fixture?.venue?.city ?? "")

  return (
    cityPrestigeScore(city) * 50 +
    baseFixtureScore(scored.fixture) +
    scored.scores.stadiumScore * 18
  )
}

function bucketListScore(scored: DiscoverFixture) {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.stadiumScore * 36 +
    scored.scores.atmosphereScore * 26 +
    scored.scores.derbyScore * 18 +
    scored.scores.nightScore * 12
  )
}

function perfectTripScore(scored: DiscoverFixture) {
  return (
    baseFixtureScore(scored.fixture) +
    scored.scores.atmosphereScore * 28 +
    scored.scores.valueScore * 24 +
    scored.scores.nightScore * 18 +
    scored.scores.stadiumScore * 20 +
    scored.scores.derbyScore * 16
  )
}

function underratedTripScore(scored: DiscoverFixture) {
  const r = scored.fixture
  const base = baseFixtureScore(r)

  const homeId = r?.teams?.home?.id
  const awayId = r?.teams?.away?.id

  const glamourPenalty =
    (typeof homeId === "number" && POPULAR_TEAM_IDS.has(homeId) ? 28 : 0) +
    (typeof awayId === "number" && POPULAR_TEAM_IDS.has(awayId) ? 28 : 0)

  return (
    base +
    scored.scores.atmosphereScore * 26 +
    scored.scores.valueScore * 24 +
    scored.scores.nightScore * 10 -
    glamourPenalty
  )
}

export function discoverScoreForCategory(
  category: DiscoverCategory,
  scored: DiscoverFixture
): number {
  const r = scored.fixture
  const base = baseFixtureScore(r)

  const home = String(r?.teams?.home?.name ?? "")
  const rawDifficulty = home ? getTicketDifficultyBadge(home) : null

  const difficulty: TicketDifficulty | "unknown" = rawDifficulty ?? "unknown"
  const easyRank = ticketDifficultyRank(difficulty)

  switch (category) {
    case "bigMatches":
      return (
        base +
        scored.scores.derbyScore * 34 +
        scored.scores.atmosphereScore * 28 +
        scored.scores.nightScore * 14 +
        scored.scores.titleDramaScore * 18
      )

    case "derbies":
      return (
        base +
        scored.scores.derbyScore * 60 +
        scored.scores.atmosphereScore * 18 +
        scored.scores.nightScore * 8
      )

    case "atmospheres":
      return (
        base +
        scored.scores.atmosphereScore * 42 +
        scored.scores.derbyScore * 14 +
        scored.scores.nightScore * 10
      )

    case "valueTrips":
      return (
        base * 0.45 +
        scored.scores.valueScore * 60 +
        easyRank * 10 +
        scored.scores.nightScore * 6
      )

    case "legendaryStadiums":
      return (
        base +
        scored.scores.stadiumScore * 52 +
        scored.scores.atmosphereScore * 12 +
        scored.scores.derbyScore * 8
      )

    case "iconicCities":
      return iconicCityScore(scored)

    case "perfectTrips":
      return perfectTripScore(scored)

    case "nightMatches":
      return (
        base +
        scored.scores.nightScore * 60 +
        scored.scores.atmosphereScore * 18 +
        scored.scores.derbyScore * 10
      )

    case "titleDrama":
      return (
        base +
        scored.scores.titleDramaScore * 60 +
        scored.scores.derbyScore * 10 +
        scored.scores.atmosphereScore * 10
      )

    case "easyTickets":
      return easyRank * 80 + scored.scores.valueScore * 12 + base * 0.2

    case "bucketList":
      return bucketListScore(scored)

    case "matchdayCulture":
      return (
        base +
        scored.scores.atmosphereScore * 34 +
        scored.scores.derbyScore * 18 +
        scored.scores.nightScore * 12
      )

    case "underratedTrips":
      return underratedTripScore(scored)

    default:
      return base
  }
    }
