// src/constants/affiliates.ts
export const AFFILIATES = {
  flightsBase: "https://www.skyscanner.net/",
  hotelsBase: "https://www.booking.com/",
  ticketsBase: "https://www.stubhub.com/", // replace as needed
};

/**
 * Minimal URL builders. Replace with your true affiliate deep links later.
 * Keep signatures stable so UI doesn't change when you upgrade affiliate logic.
 */
export function buildFlightsUrl(opts: { cityName?: string; country?: string }) {
  const q = encodeURIComponent([opts.cityName, opts.country].filter(Boolean).join(", "));
  // Placeholder: send to homepage with query in fragment for later
  return `${AFFILIATES.flightsBase}?q=${q}`;
}

export function buildHotelsUrl(opts: { cityName?: string; country?: string }) {
  const q = encodeURIComponent([opts.cityName, opts.country].filter(Boolean).join(", "));
  return `${AFFILIATES.hotelsBase}?ss=${q}`;
}

export function buildTicketsUrl(opts: { teamName?: string; cityName?: string }) {
  const q = encodeURIComponent([opts.teamName, opts.cityName].filter(Boolean).join(" "));
  return `${AFFILIATES.ticketsBase}?q=${q}`;
}
