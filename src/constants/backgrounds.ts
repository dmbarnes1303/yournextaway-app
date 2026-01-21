
// Remote background images for different screens
export const BACKGROUNDS = {
  landing: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80',
  onboarding: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80',
  home: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=80',
  fixtures: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80',
  trips: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
  wallet: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80',
  profile: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1200&q=80',
};

export type BackgroundKey = keyof typeof BACKGROUNDS;

export function getBackground(key: BackgroundKey): string {
  return BACKGROUNDS[key] || BACKGROUNDS.default;
}
