import { teams } from "@/src/data/teams";
import { stadiums } from "@/src/data/stadiums";

export function validateTeamStadiumLinks() {
  const teamErrors: string[] = [];
  const stadiumErrors: string[] = [];

  // Validate team → stadium
  Object.values(teams).forEach((team) => {
    if (!team.stadiumKey) return;

    if (!stadiums[team.stadiumKey]) {
      teamErrors.push(
        `Team "${team.teamKey}" references missing stadium "${team.stadiumKey}"`
      );
    }
  });

  // Validate stadium → team
  Object.values(stadiums).forEach((stadium) => {
    stadium.teamKeys.forEach((teamKey) => {
      if (!teams[teamKey]) {
        stadiumErrors.push(
          `Stadium "${stadium.stadiumKey}" references missing team "${teamKey}"`
        );
      }
    });
  });

  if (teamErrors.length === 0 && stadiumErrors.length === 0) {
    console.log("✅ Stadium / Team schema validated");
    return;
  }

  console.error("❌ Stadium validation errors detected");

  teamErrors.forEach((err) => console.error(err));
  stadiumErrors.forEach((err) => console.error(err));
}
