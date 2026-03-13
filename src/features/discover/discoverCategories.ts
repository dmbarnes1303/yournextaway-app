export type DiscoverCategory =
  | "derbies"
  | "atmospheres"
  | "europeanNights"
  | "legendaryStadiums"
  | "perfectWeekends"
  | "iconicCities"
  | "easyTickets"
  | "valueTrips"
  | "titleDrama"
  | "bucketList"
  | "matchdayCulture"
  | "underratedTrips";

export const DISCOVER_ROWS: DiscoverCategory[][] = [
  [
    "derbies",
    "atmospheres",
    "europeanNights",
    "legendaryStadiums",
    "perfectWeekends",
  ],
  [
    "iconicCities",
    "easyTickets",
    "valueTrips",
    "titleDrama",
  ],
  [
    "bucketList",
    "matchdayCulture",
    "underratedTrips",
  ],
];

export const DISCOVER_CATEGORY_META = {
  derbies: {
    title: "Derby Weekends",
    icon: "🔥",
  },

  atmospheres: {
    title: "Insane Atmospheres",
    icon: "🏟",
  },

  europeanNights: {
    title: "European Nights",
    icon: "🌙",
  },

  legendaryStadiums: {
    title: "Legendary Stadiums",
    icon: "🏛",
  },

  perfectWeekends: {
    title: "Perfect Football Weekends",
    icon: "🧭",
  },

  iconicCities: {
    title: "Iconic Football Cities",
    icon: "🌍",
  },

  easyTickets: {
    title: "Easy Ticket Matches",
    icon: "🎟",
  },

  valueTrips: {
    title: "Best Value Trips",
    icon: "💸",
  },

  titleDrama: {
    title: "Title Race Drama",
    icon: "🏆",
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
