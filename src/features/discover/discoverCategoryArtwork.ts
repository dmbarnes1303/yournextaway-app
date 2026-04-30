import type { DiscoverCategory } from "./discoverCategories";

export type DiscoverCategoryArtwork = {
  imageUrl: string;
  eyebrow?: string;
};

const FALLBACK_ARTWORK: DiscoverCategoryArtwork = {
  eyebrow: "Football trips",
  imageUrl:
    "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1600&q=80",
};

export const DISCOVER_CATEGORY_ARTWORK: Record<DiscoverCategory, DiscoverCategoryArtwork> = {
  bigMatches: {
    eyebrow: "Global pull",
    imageUrl:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80",
  },

  derbies: {
    eyebrow: "Rivalry edge",
    imageUrl:
      "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=1600&q=80",
  },

  atmospheres: {
    eyebrow: "Noise & chaos",
    imageUrl:
      "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1600&q=80",
  },

  valueTrips: {
    eyebrow: "Smarter spend",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  },

  perfectTrips: {
    eyebrow: "All-rounders",
    imageUrl:
      "https://images.unsplash.com/photo-1508098682722-e99c643e7485?auto=format&fit=crop&w=1600&q=80",
  },

  easyTickets: {
    eyebrow: "Lower friction",
    imageUrl:
      "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1600&q=80",
  },

  multiMatchTrips: {
    eyebrow: "Stackable trips",
    imageUrl:
      "https://images.unsplash.com/photo-1508098682722-e99c643e7485?auto=format&fit=crop&w=1600&q=80",
  },

  weekendTrips: {
    eyebrow: "Short breaks",
    imageUrl:
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1600&q=80",
  },

  europeanNights: {
    eyebrow: "Continental",
    imageUrl:
      "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1600&q=80",
  },

  legendaryStadiums: {
    eyebrow: "Bucket-list grounds",
    imageUrl:
      "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1600&q=80",
  },

  iconicCities: {
    eyebrow: "City first",
    imageUrl:
      "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1600&q=80",
  },

  nightMatches: {
    eyebrow: "Lights on",
    imageUrl:
      "https://images.unsplash.com/photo-1508098682722-e99c643e7485?auto=format&fit=crop&w=1600&q=80",
  },

  titleDrama: {
    eyebrow: "Pressure games",
    imageUrl:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1600&q=80",
  },

  bucketList: {
    eyebrow: "Do this once",
    imageUrl:
      "https://images.unsplash.com/photo-1570498839593-e565b39455fc?auto=format&fit=crop&w=1600&q=80",
  },

  matchdayCulture: {
    eyebrow: "Beyond the 90",
    imageUrl:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=80",
  },

  underratedTrips: {
    eyebrow: "Less obvious",
    imageUrl:
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1600&q=80",
  },
};

export function getDiscoverCategoryArtwork(category: DiscoverCategory): DiscoverCategoryArtwork {
  return DISCOVER_CATEGORY_ARTWORK[category] ?? FALLBACK_ARTWORK;
}
