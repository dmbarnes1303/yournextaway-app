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
  | "underratedTrips";

export const DISCOVER_ROWS: DiscoverCategory[][] = [
  [
    "bigMatches",
    "derbies",
    "atmospheres",
    "valueTrips",
    "legendaryStadiums",
  ],
  [
    "iconicCities",
    "perfectTrips",
    "nightMatches",
    "titleDrama",
    "easyTickets",
  ],
  [
    "bucketList",
    "matchdayCulture",
    "underratedTrips",
  ],
];

export const DISCOVER_CATEGORY_META = {
  bigMatches: {
    title: "Big Matches",
    icon: "⭐",
  },

  derbies: {
    title: "Derbies & Rivalries",
    icon: "🔥",
  },

  atmospheres: {
    title: "Insane Atmospheres",
    icon: "🏟",
  },

  valueTrips: {
    title: "Best Value Football Trips",
    icon: "💸",
  },

  legendaryStadiums: {
    title: "Legendary Stadiums",
    icon: "🏛",
  },

  iconicCities: {
    title: "Iconic Football Cities",
    icon: "🌍",
  },

  perfectTrips: {
    title: "Perfect Football Trips",
    icon: "🧭",
  },

  nightMatches: {
    title: "Night Matches",
    icon: "🌙",
  },

  titleDrama: {
    title: "Title Race Drama",
    icon: "🏆",
  },

  easyTickets: {
    title: "Easy Ticket Matches",
    icon: "🎟",
  },

  bucketList: {
    title: "Football Bucket List",
    icon: "⭐",
  },

  matchdayCulture: {
    title: "Best Matchday Culture",
    icon: "🍻",
  },

  underratedTrips: {
    title: "Underrated Trips",
    icon: "🧠",
  },
};
