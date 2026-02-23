// src/constants/iataCities.ts
/**
 * Single place for:
 * - city name normalization (canonical string used across app)
 * - IATA city lookup (best-effort)
 * - dev warnings (non-fatal)
 *
 * IMPORTANT:
 * Keep this module "light" to avoid circular deps and runtime undefined exports.
 */

import { Platform } from "react-native";

// Reuse your existing mapping module (you already import these elsewhere)
import { getIataCityCodeForCity as _getIataFromData, debugCityKey } from "@/src/data/iataCityCodes";

/* -------------------------------------------------------------------------- */
/* Normalization */
/* -------------------------------------------------------------------------- */

/**
 * Converts "raw" city strings from APIs into a stable canonical form.
 * Goal: keep the same city string everywhere (Trips, Affiliate links, City guides).
 */
export function normalizeCityName(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  // Collapse whitespace
  let s = raw.replace(/\s+/g, " ");

  // Remove trailing weird punctuation
  s = s.replace(/[,\s]+$/g, "");

  // Normalize common separators
  s = s.replace(/\s*\/\s*/g, " / ");
  s = s.replace(/\s*-\s*/g, " - ");

  // If API gives "City, Region" keep only city (most IATA mapping keys expect city)
  // But don't break places like "San Sebastián" (no comma anyway).
  if (s.includes(",")) {
    const first = s.split(",")[0]?.trim();
    if (first) s = first;
  }

  // Title-case-ish (keeps existing casing for acronyms)
  s = s
    .split(" ")
    .map((w) => {
      const t = w.trim();
      if (!t) return t;
      if (/^[A-Z]{2,}$/.test(t)) return t; // keep acronyms
      return t[0].toUpperCase() + t.slice(1).toLowerCase();
    })
    .join(" ");

  return s;
}

/* -------------------------------------------------------------------------- */
/* IATA lookup */
/* -------------------------------------------------------------------------- */

/**
 * Best-effort lookup:
 * - normalize input
 * - use your mapping table via src/data/iataCityCodes
 */
export function getIataCityCodeForCity(city: string): string | null {
  const canon = normalizeCityName(city);
  if (!canon) return null;

  try {
    const code = _getIataFromData(canon);
    return code ? String(code).trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

/**
 * Dev-only warning helper (does not throw, does not block UI).
 * Keeps services from importing Alert and crashing in non-UI contexts.
 */
export function devWarnIfUnknownCity(city: string, source: string) {
  // @ts-ignore
  const isDev = typeof __DEV__ !== "undefined" && __DEV__;
  if (!isDev) return;

  const canon = normalizeCityName(city);
  if (!canon) return;

  const code = getIataCityCodeForCity(canon);
  if (code) return;

  // Use your existing debug key helper so you can paste directly into mappings.
  let key = "";
  try {
    key = debugCityKey(canon) || "";
  } catch {
    key = "";
  }

  // Console-only: services shouldn't pop Alerts.
  // This shows clearly in Metro logs + device logs.
  const msg =
    `[IATA] Missing mapping` +
    ` | source=${source}` +
    ` | city="${canon}"` +
    (key ? ` | key="${key}"` : "") +
    ` | platform=${Platform.OS}`;

  // eslint-disable-next-line no-console
  console.warn(msg);
}
