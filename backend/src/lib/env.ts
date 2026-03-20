function req(name: string): string {
  const value = String(process.env[name] ?? "").trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function opt(name: string, fallback = ""): string {
  return String(process.env[name] ?? fallback).trim();
}

function optNumber(name: string, fallback: number): number {
  const raw = String(process.env[name] ?? "").trim();
  if (!raw) return fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function optList(name: string): string[] {
  const raw = String(process.env[name] ?? "").trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

const API_FOOTBALL_KEY_FALLBACK = "7ff4f17bb2968fdbdf4b24b7ec6397b9";

export const env = {
  nodeEnv: opt("NODE_ENV", "development"),
  port: optNumber("PORT", 3000),

  // CORS
  appCorsOrigins: optList("APP_CORS_ORIGINS"),

  // API-Football
  apiFootballBaseUrl: opt(
    "API_FOOTBALL_BASE_URL",
    "https://v3.football.api-sports.io"
  ),
  apiFootballKey: opt("API_FOOTBALL_KEY", API_FOOTBALL_KEY_FALLBACK),

  // FootballTicketNet
  ftnBaseUrl: opt("FTN_BASE_URL", "https://www.footballticketnet.com/api"),
  ftnUsername: opt("FTN_USERNAME", ""),
  ftnSecretName: opt("FTN_SECRET_NAME", ""),
  ftnAffiliateSecret: opt("FTN_AFFILIATE_SECRET", ""),
  ftnAffiliateId: opt("FTN_AFFILIATE_ID", "yournextaway"),

  // SportsEvents365
  se365BaseUrl: opt("SE365_BASE_URL", ""),
  se365ApiKey: opt("SE365_API_KEY", ""),
  se365AffiliateId: opt("SE365_AFFILIATE_ID", ""),

  // Gigsberg
  gigsbergBaseUrl: opt(
    "GIGSBERG_BASE_URL",
    "https://integration2.gigsberg.com/v2"
  ),
  gigsbergApiKey: opt("GIGSBERG_API_KEY", ""),
  gigsbergAffiliateId: opt("GIGSBERG_AFFILIATE_ID", "yournextaway"),
};

export function isProduction(): boolean {
  return env.nodeEnv.toLowerCase() === "production";
}

export function hasApiFootballConfig(): boolean {
  return Boolean(env.apiFootballBaseUrl && env.apiFootballKey);
}

export function hasFtnConfig(): boolean {
  return Boolean(
    env.ftnBaseUrl &&
      env.ftnUsername &&
      env.ftnAffiliateSecret &&
      env.ftnAffiliateId
  );
}

export function hasSe365Config(): boolean {
  return Boolean(env.se365BaseUrl && env.se365ApiKey);
}

export function hasGigsbergConfig(): boolean {
  return Boolean(
    env.gigsbergBaseUrl &&
      env.gigsbergApiKey &&
      env.gigsbergAffiliateId
  );
}

export { req };
