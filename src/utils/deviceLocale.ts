// src/utils/deviceLocale.ts

export type DeviceLocaleInfo = {
  locale: string;
  timeZone: string;
  countryCode: string; // best-effort
};

function countryFromLocale(locale: string): string | null {
  // e.g. "en-GB", "es-ES", sometimes "en_GB" on some platforms.
  const m = locale.match(/[-_](?<cc>[A-Z]{2})\b/);
  return m?.groups?.cc ?? null;
}

function countryFromTimeZone(timeZone: string): string | null {
  // Best-effort mapping for your current rollout.
  // Do NOT pretend this is global; it’s a safe fallback.
  if (timeZone.includes("Europe/London")) return "GB";
  if (timeZone.includes("Europe/Madrid")) return "ES";
  if (timeZone.includes("Europe/Rome")) return "IT";
  if (timeZone.includes("Europe/Berlin")) return "DE";
  if (timeZone.includes("Europe/Paris")) return "FR";
  return null;
}

export function getDeviceLocaleInfo(fallbackCountryCode = "GB"): DeviceLocaleInfo {
  let locale = "";
  let timeZone = "";
  let countryCode = "";

  try {
    const opts = Intl.DateTimeFormat().resolvedOptions();
    locale = opts.locale || "";
    timeZone = opts.timeZone || "";
    countryCode = countryFromLocale(locale) || countryFromTimeZone(timeZone) || fallbackCountryCode;
  } catch {
    countryCode = fallbackCountryCode;
  }

  return {
    locale: locale || "en-" + fallbackCountryCode,
    timeZone: timeZone || "Europe/London",
    countryCode: (countryCode || fallbackCountryCode).toUpperCase(),
  };
}
