import { env, hasFtnConfig } from "../../lib/env.js";
import { getPreferredTeamName } from "./teamAliases.js";

/**
 * FTN strategy for now:
 * - Use FTN API only to find the correct event page slug/path
 * - Monetisation is done with the affiliate query param ?aff=yournextaway
 * - Do NOT guess event ids for public URLs
 * - Do NOT use marketplace/search fallback when we can build the exact match page
 */

const FTN_FETCH_TIMEOUT_MS = 7000;
const FTN_BASE_PUBLIC_URL = "https://www.footballticketnet.com";
const FTN_AFFILIATE_PARAM = "aff";
const FTN_AFFILIATE_VALUE = "yournextaway";

function clean(value) {
  return String(value ?? "").trim();
}

function stripAccents(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeName(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\bfc\b/g, " ")
    .replace(/\bcf\b/g, " ")
    .replace(/\bac\b/g, " ")
    .replace(/\bafc\b/g, " ")
    .replace(/\bsc\b/g, " ")
    .replace(/\bsk\b/g, " ")
    .replace(/\bclub\b/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "-");
}

function safeDate(value) {
  const raw = clean(value);
  if (!raw) return null;

  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : null;
}

function toUtcDayStart(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function absDays(a, b) {
  return Math.floor(Math.abs(toUtcDayStart(a) - toUtcDayStart(b)) / 86400000);
}

function buildFtnHash({ username, action, timestamp, secret, eventId = "" }) {
  const payload = eventId
    ? `${username}-${action}-${eventId}-${timestamp}-${secret}`
    : `${username}-${action}-${timestamp}-${secret}`;

  return crypto.subtle
    ? null
    : null;
}

/**
 * Node has crypto built in. Keep it local here so this file stays self-contained.
 */
import crypto from "node:crypto";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildListEventsUrl(input) {
  const username = clean(env.ftnUsername);
  const secret = clean(env.ftnAffiliateSecret);
  const action = "list_events";
  const timestamp = Math.floor(Date.now() / 1000);

  const hash = sha256(`${username}-${action}-${timestamp}-${secret}`);

  const url = new URL(clean(env.ftnBaseUrl) || `${FTN_BASE_PUBLIC_URL}/api`);
  url.searchParams.set("action", action);
  url.searchParams.set("u", username);
  url.searchParams.set("s", hash);
  url.searchParams.set("ts", String(timestamp));

  const kickoff = safeDate(input.kickoffIso);
  if (kickoff) {
    const from = new Date(kickoff);
    from.setUTCDate(from.getUTCDate() - 2);

    const to = new Date(kickoff);
    to.setUTCDate(to.getUTCDate() + 2);

    url.searchParams.set("from_date", formatDdMmYyyy(from));
    url.searchParams.set("to_date", formatDdMmYyyy(to));
  }

  const homeName = clean(getPreferredTeamName(input.homeName));
  const awayName = clean(getPreferredTeamName(input.awayName));

  if (homeName) url.searchParams.set("home_team_name", homeName);
  if (awayName) url.searchParams.set("away_team_name", awayName);

  return url.toString();
}

function formatDdMmYyyy(date) {
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getUTCFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FTN_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json,text/plain,*/*",
      },
    });

    const body = await res.text().catch(() => "");

    return {
      ok: res.ok,
      status: res.status,
      body,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        status: 408,
        body: "",
      };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonSafe(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function extractEvents(payload) {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.events)) return payload.events;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;

  return [];
}

function eventId(ev) {
  return clean(ev?.event_id ?? ev?.id);
}

function eventName(ev) {
  return clean(ev?.event_name ?? ev?.name ?? ev?.title);
}

function eventDate(ev) {
  return clean(ev?.event_date ?? ev?.date ?? ev?.dateOfEvent ?? ev?.startDate);
}

function eventHomeName(ev) {
  return clean(ev?.home_team_name ?? ev?.homeTeamName ?? ev?.home_team ?? ev?.home);
}

function eventAwayName(ev) {
  return clean(ev?.away_team_name ?? ev?.awayTeamName ?? ev?.away_team ?? ev?.away);
}

function eventLeagueName(ev) {
  return clean(ev?.league_name ?? ev?.league ?? ev?.competition ?? ev?.category_name);
}

function eventUrl(ev) {
  return clean(ev?.event_url ?? ev?.url ?? ev?.link);
}

function appendAffiliate(urlValue) {
  const raw = clean(urlValue);
  if (!raw) return "";

  try {
    const url = new URL(raw.startsWith("http") ? raw : `${FTN_BASE_PUBLIC_URL}${raw}`);
    url.searchParams.set(FTN_AFFILIATE_PARAM, FTN_AFFILIATE_VALUE);
    return url.toString();
  } catch {
    return "";
  }
}

function buildPublicEventUrlFromSlugParts(input) {
  const leagueSlug = slugify(input.leagueName || "football-tickets");
  const homeSlug = slugify(getPreferredTeamName(input.homeName));
  const awaySlug = slugify(getPreferredTeamName(input.awayName));

  if (!homeSlug || !awaySlug) return "";

  return `${FTN_BASE_PUBLIC_URL}/${leagueSlug}/${homeSlug}-vs-${awaySlug}`;
}

function scoreNameMatch(candidate, target) {
  const c = normalizeName(candidate);
  const t = normalizeName(target);

  if (!c || !t) return 0;
  if (c === t) return 100;
  if (c.includes(t) || t.includes(c)) return 80;

  const cTokens = new Set(c.split(" ").filter(Boolean));
  const tTokens = t.split(" ").filter(Boolean);

  if (!tTokens.length) return 0;

  let matched = 0;
  for (const token of tTokens) {
    if (cTokens.has(token)) matched += 1;
  }

  return Math.round((matched / tTokens.length) * 70);
}

function scoreEvent(ev, input) {
  let score = 0;

  const homeScore = scoreNameMatch(eventHomeName(ev) || eventName(ev), input.homeName);
  const awayScore = scoreNameMatch(eventAwayName(ev) || eventName(ev), input.awayName);
  const titleHomeScore = scoreNameMatch(eventName(ev), input.homeName);
  const titleAwayScore = scoreNameMatch(eventName(ev), input.awayName);

  const bestHome = Math.max(homeScore, titleHomeScore);
  const bestAway = Math.max(awayScore, titleAwayScore);

  if (bestHome < 70 || bestAway < 70) return -1000;

  score += bestHome + bestAway;

  const kickoff = safeDate(input.kickoffIso);
  const evDt = safeDate(eventDate(ev));

  if (kickoff && evDt) {
    const diff = absDays(kickoff, evDt);
    if (diff === 0) score += 40;
    else if (diff === 1) score += 20;
    else if (diff === 2) score += 5;
    else return -1000;
  }

  const league = normalizeName(input.leagueName);
  const evLeague = normalizeName(eventLeagueName(ev));
  if (league && evLeague && (league.includes(evLeague) || evLeague.includes(league))) {
    score += 15;
  }

  if (eventUrl(ev)) score += 10;
  if (eventId(ev)) score += 5;

  return score;
}

function pickBestEvent(events, input) {
  const scored = events
    .map((ev) => ({
      ev,
      score: scoreEvent(ev, input),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0] ?? null;
}

export async function resolveFtnCandidate(input) {
  if (!hasFtnConfig()) {
    console.log("[FTN] skipped: missing config");
    return null;
  }

  const homeName = clean(getPreferredTeamName(input.homeName));
  const awayName = clean(getPreferredTeamName(input.awayName));
  const kickoffIso = clean(input.kickoffIso);

  if (!homeName || !awayName || !kickoffIso) {
    console.log("[FTN] skipped: missing required input", {
      homeName,
      awayName,
      kickoffIso,
    });
    return null;
  }

  const apiUrl = buildListEventsUrl({
    homeName,
    awayName,
    kickoffIso,
    leagueName: clean(input.leagueName),
  });

  const res = await fetchText(apiUrl);

  if (!res.ok) {
    console.log("[FTN] list_events failed", {
      status: res.status,
      url: apiUrl,
      body: res.body.slice(0, 500),
    });

    const fallbackUrl = appendAffiliate(
      buildPublicEventUrlFromSlugParts({
        homeName,
        awayName,
        leagueName: clean(input.leagueName) || "italian-serie-a",
      })
    );

    if (!fallbackUrl) return null;

    return {
      provider: "footballticketnet",
      exact: false,
      score: 20,
      rawScore: 20,
      url: fallbackUrl,
      title: `Tickets: ${homeName} vs ${awayName}`,
      priceText: null,
      reason: "search_fallback",
      urlQuality: "listing",
    };
  }

  const parsed = parseJsonSafe(res.body);
  const events = extractEvents(parsed);

  const best = pickBestEvent(events, {
    homeName,
    awayName,
    kickoffIso,
    leagueName: clean(input.leagueName),
  });

  if (!best) {
    const fallbackUrl = appendAffiliate(
      buildPublicEventUrlFromSlugParts({
        homeName,
        awayName,
        leagueName: clean(input.leagueName) || "italian-serie-a",
      })
    );

    if (!fallbackUrl) return null;

    console.log("[FTN] no strong API match, using slug fallback", {
      fallbackUrl,
      homeName,
      awayName,
      leagueName: clean(input.leagueName),
    });

    return {
      provider: "footballticketnet",
      exact: false,
      score: 24,
      rawScore: 24,
      url: fallbackUrl,
      title: `Tickets: ${homeName} vs ${awayName}`,
      priceText: null,
      reason: "partial_match",
      urlQuality: "listing",
    };
  }

  const directEventUrl =
    appendAffiliate(eventUrl(best.ev)) ||
    appendAffiliate(
      buildPublicEventUrlFromSlugParts({
        homeName,
        awayName,
        leagueName: clean(input.leagueName) || "italian-serie-a",
      })
    );

  if (!directEventUrl) return null;

  console.log("[FTN] matched event", {
    id: eventId(best.ev) || null,
    name: eventName(best.ev) || null,
    date: eventDate(best.ev) || null,
    url: directEventUrl,
    score: best.score,
  });

  return {
    provider: "footballticketnet",
    exact: best.score >= 180,
    score: best.score,
    rawScore: best.score,
    url: directEventUrl,
    title: `Tickets: ${homeName} vs ${awayName}`,
    priceText: null,
    reason: best.score >= 180 ? "exact_event" : "partial_match",
    urlQuality: "listing",
  };
}
