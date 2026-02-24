// src/utils/tripTimeline.ts

import type { FixtureTiming } from "@/src/types/fixtureTiming";

export interface TripTimeline {
  arrival: string;
  preMatch: string;
  kickoff: string;
  postMatch: string;
  departure: string;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatLocalTime(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function generateTripTimeline(timing: FixtureTiming): TripTimeline {
  // Unknown kickoff: conservative defaults
  if (!timing.kickoffIso) {
    return {
      arrival: "Arrive the day before (kickoff not confirmed yet)",
      preMatch: "Plan to be near the stadium 60–90 min before kickoff",
      kickoff: timing.likelySlot ? `Likely ${timing.likelySlot}` : "Kickoff TBC",
      postMatch: "Allow extra time after the match (transport may vary)",
      departure: "Leave the day after for flexibility",
    };
  }

  const kickoff = new Date(timing.kickoffIso);
  const kickoffLocal = formatLocalTime(kickoff);

  const isEvening = kickoff.getHours() >= 18;

  return {
    arrival: isEvening ? "Same-day arrival is possible (aim earlier)" : "Arrive the day before (recommended)",
    preMatch: "Arrive stadium area 60–90 min before kickoff",
    kickoff: `Kickoff ${kickoffLocal}`,
    postMatch: "Return 45–90 min after full-time (buffer for queues)",
    departure: isEvening ? "Depart next morning (recommended)" : "Same day or next day (depends on travel)",
  };
}
