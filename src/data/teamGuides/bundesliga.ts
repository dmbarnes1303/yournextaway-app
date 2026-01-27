// src/data/teamGuides/bundesliga.ts

import { makeGuide } from "./makeGuide";
import type { TeamGuide } from "./types";

/**
 * Bundesliga Team Guides
 * Season: 2025/26
 */

const bundesligaTeamGuides: TeamGuide[] = [
  makeGuide({
    teamKey: "augsburg",
    name: "FC Augsburg",
    city: "Augsburg",
    country: "Germany",
    stadium: "WWK Arena",
    sections: [
      { title: "Club Overview", body: "..." },
    ],
    links: [{ label: "Official Website", url: "https://www.fcaugsburg.de" }],
    updatedAt: "2026-01-27",
  }),

  // Add the next teams here as makeGuide({ ... })
];

export default bundesligaTeamGuides;
