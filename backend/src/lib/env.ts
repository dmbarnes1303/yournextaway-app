function req(name: string): string {
  const value = String(process.env[name] ?? "").trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function opt(name: string, fallback = ""): string {
  return String(process.env[name] ?? fallback).trim();
}

export const env = {
  port: Number(opt("PORT", "3000")) || 3000,

  ftnBaseUrl: opt("FTN_BASE_URL", "https://www.footballticketnet.com/api"),
  ftnUsername: opt("FTN_USERNAME", ""),
  ftnSecretName: opt("FTN_SECRET_NAME", ""),
  ftnAffiliateSecret: opt("FTN_AFFILIATE_SECRET", ""),
  ftnAffiliateId: opt("FTN_AFFILIATE_ID", "yournextaway"),

  se365BaseUrl: opt("SE365_BASE_URL", ""),
  se365ApiKey: opt("SE365_API_KEY", ""),
  se365AffiliateId: opt("SE365_AFFILIATE_ID", ""),

  gigsbergBaseUrl: opt("GIGSBERG_BASE_URL", ""),
  gigsbergApiKey: opt("GIGSBERG_API_KEY", ""),
  gigsbergAffiliateId: opt("GIGSBERG_AFFILIATE_ID", "yournextaway"),
};

export function hasFtnConfig() {
  return Boolean(env.ftnBaseUrl && env.ftnUsername && env.ftnAffiliateSecret);
}

export function hasSe365Config() {
  return Boolean(env.se365BaseUrl && env.se365ApiKey);
}

export function hasGigsbergConfig() {
  return Boolean(env.gigsbergAffiliateId);
}
