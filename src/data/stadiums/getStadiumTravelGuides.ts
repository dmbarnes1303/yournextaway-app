import { getStadium } from "./index";

export type StadiumTravelGuide = {
  stadiumName: string;
  city: string;
  transit?: {
    label: string;
    minutes?: number;
    note?: string;
  }[];
  stayAreas?: {
    area: string;
    why: string;
  }[];
  tips?: string[];
};

export function getStadiumTravelGuide(stadiumKey: string): StadiumTravelGuide | null {
  const stadium = getStadium(stadiumKey);
  if (!stadium) return null;

  return {
    stadiumName: stadium.name,
    city: stadium.city,
    transit: stadium.transit ?? [],
    stayAreas: stadium.stayAreas ?? [],
    tips: stadium.tips ?? [],
  };
}
