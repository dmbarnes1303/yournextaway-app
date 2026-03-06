import { teams } from "@/src/data/teams";
import { stadiums } from "./index";

/**
 * Dev-time validation to ensure every team.stadiumKey
 * points to a real stadium record.
 *
 * Run this once on app start in development.
 */
export function validateTeamStadiumLinks(): void {
  const errors: string[] = [];

  Object.values(teams).forEach((team) => {
    if (!team.stadiumKey) return;

    const stadium = stadiums[team.stadiumKey];

    if (!stadium) {
      errors.push(
        `Missing stadium: team "${team.teamKey}" references "${team.stadiumKey}"`
      );
    }
  });

  if (errors.length > 0) {
    console.warn("Stadium validation errors:");
    errors.forEach((e) => console.warn(e));
  } else {
    console.log("Stadium validation passed ✓");
  }
}
