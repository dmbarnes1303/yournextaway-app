import type { FixtureListRow } from "@/src/services/apiFootball";

type TicketDifficulty = "easy" | "medium" | "hard" | "very_hard" | "unknown";

export type DiscoverPriceEstimate = {
  ticketFromGbp: number | null;
  tripFromGbp: number | null;
  hotelNightFromGbp: number | null;
  flightFromGbp: number | null;
  confidence: "low" | "medium" | "high";
  ticketLabel: string | null;
  tripLabel: string | null;
};

const EUROPEAN_LEAGUE_TIERS = new Map<number, number>([
  [2, 6],   // Champions League
  [3, 5],   // Europa League
  [848, 4], // Europa Conference League

  [39, 5],  // Premier League
  [140, 5], // La Liga
  [135, 5], // Serie A
  [78, 5],  // Bundesliga

  [61, 4],  // Ligue 1
  [88, 4],  // Eredivisie
  [94, 4],  // Primeira Liga
  [203, 4], // Super Lig

  [179, 3], // Scotland
  [144, 3], // Belgium
  [218, 3], // Austria
  [210, 3], // Switzerland
  [119, 3], // Denmark
  [113, 3], // Sweden
  [103, 3], // Norway
  [197, 3], // Greece
  [106, 3], // Poland
  [345, 3], // Czech Republic
  [207, 3], // Serbia
  [164, 3], // Iceland

  [271, 2], // Hungary
  [283, 2], // Romania
  [332, 2], // Slovakia
  [373, 2], // Slovenia
  [318, 2], // Cyprus
  [172, 2], // Bulgaria
  [315, 2], // Bosnia
]);

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function lower(value: unknown): string {
  return clean(value).toLowerCase();
}

function roundToNearest5(value: number): number {
  return Math.max(0, Math.round(value / 5) * 5);
}

function safeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getLeagueId(row: FixtureListRow): number | null {
  const id = row?.league?.id;
  return typeof id === "number" ? id : safeNumber(id);
}

function getLeagueName(row: FixtureListRow): string {
  return clean(row?.league?.name);
}

function getLeagueCountry(row: FixtureListRow): string {
  return clean((row?.league as any)?.country);
}

function getCity(row: FixtureListRow): string {
  return clean(row?.fixture?.venue?.city);
}

function getHomeName(row: FixtureListRow): string {
  return clean(row?.teams?.home?.name);
}

function getAwayName(row: FixtureListRow): string {
  return clean(row?.teams?.away?.name);
}

function kickoffDate(row: FixtureListRow): Date | null {
  const raw = clean(row?.fixture?.date);
  if (!raw) return null;
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isWeekend(row: FixtureListRow): boolean {
  const dt = kickoffDate(row);
  if (!dt) return false;
  const day = dt.getUTCDay();
  return day === 5 || day === 6 || day === 0;
}

function isEvening(row: FixtureListRow): boolean {
  const dt = kickoffDate(row);
  if (!dt) return false;
  const h = dt.getUTCHours();
  return h >= 18 && h <= 21;
}

function leagueTier(row: FixtureListRow): number {
  const id = getLeagueId(row);
  if (id != null && EUROPEAN_LEAGUE_TIERS.has(id)) {
    return EUROPEAN_LEAGUE_TIERS.get(id) ?? 2;
  }

  const league = lower(getLeagueName(row));
  const country = lower(getLeagueCountry(row));
  const combined = `${league} ${country}`;

  if (
    combined.includes("champions league") ||
    combined.includes("uefa champions")
  ) return 6;

  if (combined.includes("europa league")) return 5;
  if (combined.includes("conference league")) return 4;

  if (
    combined.includes("premier league") ||
    combined.includes("la liga") ||
    combined.includes("serie a") ||
    combined.includes("bundesliga")
  ) return 5;

  if (
    combined.includes("ligue 1") ||
    combined.includes("eredivisie") ||
    combined.includes("primeira liga") ||
    combined.includes("super lig")
  ) return 4;

  if (
    combined.includes("scotland") ||
    combined.includes("belgium") ||
    combined.includes("austria") ||
    combined.includes("switzerland") ||
    combined.includes("denmark") ||
    combined.includes("sweden") ||
    combined.includes("norway") ||
    combined.includes("greece") ||
    combined.includes("poland") ||
    combined.includes("czech") ||
    combined.includes("serbia") ||
    combined.includes("iceland")
  ) return 3;

  return 2;
}

function isBigClub(name: string): boolean {
  const key = lower(name);
  if (!key) return false;

  return [
    "real madrid",
    "barcelona",
    "atletico madrid",
    "arsenal",
    "chelsea",
    "liverpool",
    "manchester city",
    "manchester united",
    "tottenham",
    "newcastle",
    "milan",
    "inter",
    "juventus",
    "napoli",
    "roma",
    "lazio",
    "bayern",
    "borussia dortmund",
    "psg",
    "paris saint-germain",
    "marseille",
    "ajax",
    "feyenoord",
    "psv",
    "benfica",
    "porto",
    "sporting",
    "celtic",
    "rangers",
    "galatasaray",
    "fenerbahce",
    "besiktas",
  ].some((club) => key.includes(club));
}

function derbyIntensity(row: FixtureListRow): number {
  const home = lower(getHomeName(row));
  const away = lower(getAwayName(row));

  const pairs: Array<[string[], string[], number]> = [
    [["arsenal"], ["tottenham", "spurs"], 4],
    [["barcelona", "barca"], ["real madrid"], 5],
    [["manchester united", "man united"], ["manchester city", "man city"], 4],
    [["liverpool"], ["everton"], 4],
    [["celtic"], ["rangers"], 5],
    [["inter"], ["milan", "ac milan"], 5],
    [["roma"], ["lazio"], 4],
    [["fenerbahce"], ["galatasaray"], 5],
    [["real betis", "betis"], ["sevilla"], 4],
    [["atletico madrid"], ["real madrid"], 4],
  ];

  for (const [a, b, score] of pairs) {
    const forward = a.some((x) => home.includes(x)) && b.some((x) => away.includes(x));
    const reverse = a.some((x) => away.includes(x)) && b.some((x) => home.includes(x));
    if (forward || reverse) return score;
  }

  return 0;
}

function ticketDifficulty(row: FixtureListRow): TicketDifficulty {
  const home = lower(getHomeName(row));
  const away = lower(getAwayName(row));
  const tier = leagueTier(row);
  const derby = derbyIntensity(row);
  const bigCount = Number(isBigClub(home)) + Number(isBigClub(away));

  if (derby >= 5) return "very_hard";
  if (tier >= 6 && bigCount >= 1) return "very_hard";
  if (tier >= 5 && bigCount >= 2) return "hard";
  if (tier >= 5 && derby >= 3) return "hard";
  if (tier >= 4 && bigCount >= 1) return "medium";
  if (tier <= 2) return "easy";
  return "medium";
}

function cityHotelFloor(city: string, country: string, tier: number): number {
  const c = lower(city);
  const k = lower(country);

  if (["london", "paris", "amsterdam", "munich", "milan"].includes(c)) return 110;

  if (
    ["madrid", "barcelona", "rome", "lisbon", "istanbul", "liverpool", "manchester"].includes(c)
  ) {
    return 95;
  }

  if (
    ["porto", "seville", "valencia", "naples", "turin", "dortmund", "glasgow", "marseille"].includes(c)
  ) {
    return 80;
  }

  if (
    [
      "spain",
      "portugal",
      "italy",
      "greece",
      "turkey",
      "croatia",
      "poland",
      "czech republic",
      "hungary",
      "romania",
      "serbia",
      "bulgaria",
      "bosnia",
      "slovakia",
      "slovenia",
      "cyprus",
      "iceland",
    ].some((x) => k.includes(x))
  ) {
    return tier >= 4 ? 75 : 60;
  }

  return tier >= 4 ? 85 : 65;
}

function flightFloor(country: string, city: string, tier: number): number {
  const c = lower(city);
  const k = lower(country);

  if (["london", "manchester", "liverpool", "glasgow"].includes(c)) return 35;
  if (["paris", "amsterdam", "brussels", "dortmund", "munich"].includes(c)) return 55;
  if (["madrid", "barcelona", "rome", "milan", "lisbon", "porto"].includes(c)) return 70;
  if (["istanbul", "athens", "split", "reykjavik"].includes(c)) return 95;

  if (
    ["spain", "portugal", "italy", "germany", "france", "netherlands", "belgium"].some((x) =>
      k.includes(x)
    )
  ) {
    return tier >= 4 ? 70 : 60;
  }

  return 80;
}

function ticketFloor(row: FixtureListRow): number {
  const tier = leagueTier(row);
  const derby = derbyIntensity(row);
  const home = lower(getHomeName(row));
  const away = lower(getAwayName(row));
  const difficulty = ticketDifficulty(row);

  let base =
    tier >= 6 ? 95 :
    tier >= 5 ? 70 :
    tier >= 4 ? 45 :
    tier >= 3 ? 30 :
    20;

  if (isBigClub(home)) base += 12;
  if (isBigClub(away)) base += 12;
  if (derby >= 4) base += 35;
  else if (derby >= 3) base += 20;

  if (isWeekend(row)) base += 8;
  if (isEvening(row)) base += 5;

  if (difficulty === "easy") base -= 8;
  if (difficulty === "hard") base += 15;
  if (difficulty === "very_hard") base += 35;

  return roundToNearest5(base);
}

function tripFloor(row: FixtureListRow, hotelNightFromGbp: number, flightFromGbp: number): number {
  const ticket = ticketFloor(row);
  const weekendBump = isWeekend(row) ? 15 : 0;
  const eveningBump = isEvening(row) ? 5 : 0;
  const trip = ticket + hotelNightFromGbp + flightFromGbp + weekendBump + eveningBump;
  return roundToNearest5(trip);
}

function confidenceFor(row: FixtureListRow): "low" | "medium" | "high" {
  const venue = clean(row?.fixture?.venue?.name);
  const city = clean(row?.fixture?.venue?.city);
  const league = clean(row?.league?.name);
  const home = clean(row?.teams?.home?.name);
  const away = clean(row?.teams?.away?.name);

  const filled = [venue, city, league, home, away].filter(Boolean).length;
  if (filled >= 5) return "high";
  if (filled >= 3) return "medium";
  return "low";
}

export function formatFromPrice(value: number | null, prefix = "From"): string | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return `${prefix} £${Math.round(value)}`;
}

export function estimateFixturePricing(row: FixtureListRow): DiscoverPriceEstimate {
  const country = getLeagueCountry(row);
  const city = getCity(row);
  const tier = leagueTier(row);

  const hotelNightFromGbp = cityHotelFloor(city, country, tier);
  const flightFromGbp = flightFloor(country, city, tier);
  const ticketFromGbp = ticketFloor(row);
  const tripFromGbp = tripFloor(row, hotelNightFromGbp, flightFromGbp);

  return {
    ticketFromGbp,
    tripFromGbp,
    hotelNightFromGbp,
    flightFromGbp,
    confidence: confidenceFor(row),
    ticketLabel: formatFromPrice(ticketFromGbp),
    tripLabel: formatFromPrice(tripFromGbp),
  };
}
