// src/utils/stadiums.ts

import { stadiums } from "@/src/data/stadiums";
import type { StadiumContext } from "@/src/types/stadiumContext";

/**
 * Safe stadium lookup by teamKey
 */
export function getStadium(teamKey: string): StadiumContext | null {
  return stadiums[teamKey] || null;
}
