import { getBackendBaseUrl } from "../config/env";

export type TicketUrlQuality = "event" | "listing" | "search" | "unknown";

export type TicketResolutionOption = {
  provider: string;
  exact: boolean;
  score: number;
  rawScore?: number | null;
  url: string;
  title: string;
  priceText?: string | null;
  reason: "exact_event" | "search_fallback" | "partial_match";
  urlQuality?: TicketUrlQuality;
};

export type TicketResolutionResult = {
  ok: boolean;
  provider: string | null;
  exact: boolean;
  score: number | null;
  rawScore?: number | null;
  url: string | null;
  title: string | null;
  priceText?: string | null;
  reason: "exact_event" | "search_fallback" | "partial_match" | "not_found";
  urlQuality?: TicketUrlQuality;
  checkedProviders?: string[];
  options?: TicketResolutionOption[];
  error?: string;
};

export type ResolveTicketArgs = {
  fixtureId?: string | number;
  homeName: string;
  awayName: string;
  kickoffIso: string;
  leagueName?: string;
  leagueId?: string | number;
  debugNoCache?: boolean;
};

const REQUEST_TIMEOUT_MS = 20000;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function normalizeProvider(provider: unknown): string {
  return clean(provider).toLowerCase();
}

function isSe365(provider: unknown): boolean {
  const p = normalizeProvider(provider);
  return p === "sportsevents365" || p === "se365";
}

function isFtn(provider: unknown): boolean {
  const p = normalizeProvider(provider);
  return (
    p === "footballticketnet" ||
    p === "footballticketsnet" ||
    p === "footballticketnet.com" ||
    p === "footballticketsnet.com" ||
    p === "ftn"
  );
}

function providerPriority(provider: unknown): number {
  if (isSe365(provider)) return 300;
  if (isFtn(provider)) return 200;
  return 100;
}

function canonicalizeProvider(provider: unknown): string {
  if (isSe365(provider)) return "sportsevents365";
  if (isFtn(provider)) return "footballticketnet";
  return clean(provider);
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function safeUrl(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function buildResolveUrl(base: string, args: ResolveTicketArgs): string | null {
  const normalizedBase = clean(base);
  const homeName = clean(args.homeName);
  const awayName = clean(args.awayName);
  const kickoffIso = clean(args.kickoffIso);

  if (!normalizedBase || !homeName || !awayName || !kickoffIso) return null;

  const qs = new URLSearchParams({
    homeName,
    awayName,
    kickoffIso,
    _ts: String(Date.now()),
  });

  const fixtureId = clean(args.fixtureId);
  const leagueName = clean(args.leagueName);
  const leagueId = clean(args.leagueId);

  if (fixtureId) qs.set("fixtureId", fixtureId);
  if (leagueName) qs.set("leagueName", leagueName);
  if (leagueId) qs.set("leagueId", leagueId);
  if (args.debugNoCache) qs.set("debugNoCache", "1");

  return `${normalizedBase}/tickets/resolve?${qs.toString()}`;
}

function normalizeUrlQuality(value: unknown): TicketUrlQuality {
  const raw = clean(value).toLowerCase();

  if (raw === "event") return "event";
  if (raw === "listing") return "listing";
  if (raw === "search") return "search";
  return "unknown";
}

function normalizeReason(value: unknown): TicketResolutionOption["reason"] {
  const raw = clean(value);

  if (raw === "exact_event") return "exact_event";
  if (raw === "partial_match") return "partial_match";
  return "search_fallback";
}

function normalizeTopLevelReason(
  value: unknown,
  hasProvider: boolean,
  hasOptions: boolean
): TicketResolutionResult["reason"] {
  const raw = clean(value);

  if (raw === "exact_event") return "exact_event";
  if (raw === "partial_match") return "partial_match";
  if (raw === "search_fallback") return "search_fallback";
  if (raw === "not_found") return "not_found";

  return hasProvider || hasOptions ? "search_fallback" : "not_found";
}

function normalizeScore(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeOption(input: unknown): TicketResolutionOption | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const obj = input as Record<string, unknown>;

  const provider = canonicalizeProvider(obj.provider);
  const url = safeUrl(obj.url);
  const title = clean(obj.title);
  const score = normalizeScore(obj.score);

  if (!provider || !url || !title || score == null) return null;

  return {
    provider,
    exact: Boolean(obj.exact),
    score,
    rawScore: normalizeScore(obj.rawScore),
    url,
    title,
    priceText: clean(obj.priceText) || null,
    reason: normalizeReason(obj.reason),
    urlQuality: normalizeUrlQuality(obj.urlQuality),
  };
}

function dedupeAndSortOptions(options: TicketResolutionOption[]): TicketResolutionOption[] {
  const byKey = new Map<string, TicketResolutionOption>();

  for (const option of options) {
    const key = `${normalizeProvider(option.provider)}|${option.url}`;

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, option);
      continue;
    }

    const shouldReplace =
      (option.exact && !existing.exact) ||
      option.score > existing.score ||
      (option.score === existing.score &&
        Boolean(clean(option.priceText)) &&
        !Boolean(clean(existing.priceText)));

    if (shouldReplace) {
      byKey.set(key, option);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const aPriority = providerPriority(a.provider);
    const bPriority = providerPriority(b.provider);

    if (a.exact && !b.exact) return -1;
    if (!a.exact && b.exact) return 1;

    if (aPriority !== bPriority) return bPriority - aPriority;
    if (b.score !== a.score) return b.score - a.score;

    const aHasPrice = Boolean(clean(a.priceText));
    const bHasPrice = Boolean(clean(b.priceText));
    if (aHasPrice && !bHasPrice) return -1;
    if (!aHasPrice && bHasPrice) return 1;

    return a.provider.localeCompare(b.provider);
  });
}

function normalizeCheckedProviders(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const
