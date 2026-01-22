// src/data/cityGuides/getCityGuide.ts
import cityGuides from "./index";
import type { CityGuide } from "./types";
import { normalizeCityKey } from "@/src/utils/city";

export function getCityGuide(cityInput: string | undefined | null) {
  const slug = normalizeCityKey(cityInput);

  const guides = cityGuides as Record<string, CityGuide>;
  const guide = slug ? guides[slug] ?? null : null;

  return { slug, guide };
}

export default getCityGuide;
