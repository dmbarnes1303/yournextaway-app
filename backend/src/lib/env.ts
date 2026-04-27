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

export const env = {
  nodeEnv: opt("NODE_ENV", "development"),
  port: optNumber("PORT", 3000),

  appCorsOrigins: optList("APP_CORS_ORIGINS"),

  apiFootballBaseUrl: opt(
    "API_FOOTBALL_BASE_URL",
    "https://v3.football.api-sports.io"
  ),
  apiFootballKey: opt("API_FOOTBALL_KEY", ""),
  apiFootballTimeoutMs: optNumber("API_FOOTBALL_TIMEOUT_MS", 10000),

  walletWorkerBaseUrl: opt("WALLET_WORKER_BASE_URL", ""),
  walletWorkerApiKey: opt("WALLET_WORKER_API_KEY", ""),

  ftnBaseUrl: opt("FTN_BASE_URL", "https://www.footballticketnet.com/api"),
  ftnUsername: opt("FTN_USERNAME", ""),
  ftnAffiliateSecret: opt("FTN_AFFILIATE_SECRET", ""),
  ftnAffiliateId: opt("FTN_AFFILIATE_ID", "yournextaway"),

  se365BaseUrl: opt("SE365_BASE_URL", "https://api-v2.sandbox365.com"),
  se365ApiKey: opt("SE365_API_KEY", ""),
  se365ApiPassword: opt("SE365_API_PASSWORD", ""),
  se365HttpUsername: opt("SE365_HTTP_USERNAME", "yournextaway"),
  se365HttpSource: opt("SE365_HTTP_SOURCE", ""),
  se365AffiliateId: opt("SE365_AFFILIATE_ID", "69834e80ec9d3"),

  gigsbergBaseUrl: opt("GIGSBERG_BASE_URL", "https://api.gigsberg.com/v1"),
  gigsbergApiKey: opt("GIGSBERG_API_KEY", ""),
  gigsbergAffiliateId: opt("GIGSBERG_AFFILIATE_ID", "yournextaway"),
  gigsbergUserId: opt("GIGSBERG_USER_ID", ""),
  gigsbergJwt: opt("GIGSBERG_JWT", ""),
  gigsbergRefreshToken: opt("GIGSBERG_REFRESH_TOKEN", ""),

  aviasalesBaseUrl: opt(
    "AVIASALES_BASE_URL",
    "https://api.travelpayouts.com"
  ),
  aviasalesToken: opt("AVIASALES_TOKEN", ""),
  aviasalesMarker: opt("AVIASALES_MARKER", ""),
};

export function isProduction(): boolean {
  return env.nodeEnv.toLowerCase() === "production";
}

export function hasApiFootballConfig(): boolean {
  return Boolean(env.apiFootballBaseUrl && env.apiFootballKey);
}

export function requireApiFootballConfig(): void {
  if (!hasApiFootballConfig()) {
    throw new Error("Missing required env var: API_FOOTBALL_KEY");
  }
}

export function hasWalletWorkerConfig(): boolean {
  return Boolean(env.walletWorkerBaseUrl && env.walletWorkerApiKey);
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
  return Boolean(
    env.se365BaseUrl &&
      env.se365ApiKey &&
      env.se365ApiPassword &&
      env.se365HttpUsername &&
      env.se365AffiliateId
  );
}

export function hasGigsbergConfig(): boolean {
  return Boolean(
    env.gigsbergBaseUrl &&
      env.gigsbergApiKey &&
      env.gigsbergAffiliateId
  );
}

export function hasGigsbergJwtAuthConfig(): boolean {
  return Boolean(
    env.gigsbergBaseUrl &&
      env.gigsbergApiKey &&
      env.gigsbergUserId
  );
}

export function hasGigsbergStoredJwt(): boolean {
  return Boolean(env.gigsbergJwt);
}

export function hasGigsbergRefreshToken(): boolean {
  return Boolean(env.gigsbergRefreshToken);
}

export function requireGigsbergJwtAuthConfig(): void {
  if (!hasGigsbergJwtAuthConfig()) {
    throw new Error(
      "Missing required env vars for Gigsberg JWT auth: GIGSBERG_API_KEY and GIGSBERG_USER_ID"
    );
  }
}

export function hasAviasalesConfig(): boolean {
  return Boolean(
    env.aviasalesBaseUrl &&
      env.aviasalesToken &&
      env.aviasalesMarker
  );
}

export { req };
