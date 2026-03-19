import "dotenv/config";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import {
  env,
  hasApiFootballConfig,
  hasFtnConfig,
  hasGigsbergConfig,
  hasSe365Config,
  hasWalletWorkerConfig,
  isProduction,
} from "./lib/env.js";
import { resolveTicket } from "./services/tickets/resolve.js";

const app = Fastify({
  logger: true,
  requestIdHeader: "x-request-id",
  genReqId: () => `yna_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
});

await app.register(multipart, {
  attachFieldsToBody: false,
  limits: {
    files: 1,
    fileSize: 20 * 1024 * 1024,
  },
});

type ApiFootballEnvelope<T> = {
  get?: string;
  parameters?: Record<string, unknown>;
  errors?: Record<string, unknown> | unknown[];
  results?: number;
  paging?: { current?: number; total?: number };
  response?: T;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function toBool(value: unknown): boolean {
  const normalized = clean(value).toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function safeUrl(value: unknown): string | null {
  const raw = clean(value);
  if (!raw) return null;

  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

function getAllowedOrigin(requestOrigin: unknown): string | null {
  const origin = clean(requestOrigin);
  if (!origin) return null;

  const allowList = env.appCorsOrigins;
  if (!allowList.length) {
    return isProduction() ? null : origin;
  }

  return allowList.includes(origin) ? origin : null;
}

function applyCors(request: { headers: Record<string, unknown> }, reply: any): void {
  const allowedOrigin = getAllowedOrigin(request.headers.origin);

  if (allowedOrigin) {
    reply.header("Access-Control-Allow-Origin", allowedOrigin);
    reply.header("Vary", "Origin");
  }

  reply.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  reply.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Request-Id"
  );
}

function walletWorkerBaseUrl(): string {
  const safe = safeUrl(env.walletWorkerBaseUrl);
  return safe ? safe.replace(/\/+$/, "") : "";
}

async function apiFootballFetch<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>
): Promise<T> {
  if (!hasApiFootballConfig()) {
    throw new Error("api_football_not_configured");
  }

  const url = new URL(`${env.apiFootballBaseUrl.replace(/\/+$/, "")}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-apisports-key": env.apiFootballKey,
    },
  });

  const rawText = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`api_football_http_${res.status}:${rawText.slice(0, 400)}`);
  }

  let parsed: ApiFootballEnvelope<T>;
  try {
    parsed = rawText
      ? (JSON.parse(rawText) as ApiFootballEnvelope<T>)
      : ({ response: undefined } as ApiFootballEnvelope<T>);
  } catch {
    throw new Error("api_football_bad_json");
  }

  return parsed.response as T;
}

async function walletWorkerFetch(
  path: string,
  init?: RequestInit,
  query?: Record<string, string | number | undefined | null>
): Promise<Response> {
  if (!hasWalletWorkerConfig()) {
    throw new Error("wallet_worker_not_configured");
  }

  const base = walletWorkerBaseUrl();
  if (!base) {
    throw new Error("wallet_worker_bad_base_url");
  }

  const url = new URL(`${base}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  const headers = new Headers(init?.headers || {});
  headers.set("x-internal-wallet-key", env.walletWorkerApiKey);

  return fetch(url.toString(), {
    ...init,
    headers,
  });
}

app.addHook("onSend", async (request, reply, payload) => {
  reply.header("X-Request-Id", request.id);
  applyCors(request, reply);

  if (
    request.url.startsWith("/tickets/resolve") ||
    request.url.startsWith("/football/")
  ) {
    reply.header("Cache-Control", "public, max-age=60");
  } else {
    reply.header("Cache-Control", "no-store");
  }

  return payload;
});

app.options("*", async (request, reply) => {
  applyCors(request, reply);
  reply.code(204).send();
});

app.get("/", async (request) => {
  return {
    ok: true,
    message: "YourNextAway backend is running",
    service: "yournextaway-backend",
    requestId: request.id,
  };
});

app.get("/hello", async (request) => {
  return {
    ok: true,
    message: "YourNextAway backend is running",
    requestId: request.id,
  };
});

app.get("/health", async (request) => {
  if (isProduction()) {
    return {
      ok: true,
      status: "ok",
      service: "yournextaway-backend",
      requestId: request.id,
    };
  }

  return {
    ok: true,
    status: "ok",
    service: "yournextaway-backend",
    port: env.port,
    host: "0.0.0.0",
    nodeEnv: env.nodeEnv,
    requestId: request.id,
    providers: {
      apiFootball: { configured: hasApiFootballConfig() },
      walletWorker: { configured: hasWalletWorkerConfig() },
      footballticketsnet: { configured: hasFtnConfig() },
      sportsevents365: { configured: hasSe365Config() },
      gigsberg: {
        configured: hasGigsbergConfig(),
        baseUrl: env.gigsbergBaseUrl,
      },
    },
    cors: {
      configuredOrigins: env.appCorsOrigins,
    },
  };
});

app.get<{
  Querystring: {
    league?: string;
    season?: string;
    from?: string;
    to?: string;
  };
}>("/football/fixtures", async (request, reply) => {
  if (!hasApiFootballConfig()) {
    reply.code(503);
    return {
      ok: false,
      error: "api_football_not_configured",
      requestId: request.id,
    };
  }

  const league = clean(request.query.league);
  const season = clean(request.query.season);
  const from = clean(request.query.from);
  const to = clean(request.query.to);

  if (!league || !season) {
    reply.code(400);
    return {
      ok: false,
      error: "league and season are required",
      requestId: request.id,
    };
  }

  try {
    const response = await apiFootballFetch<unknown[]>("/fixtures", {
      league,
      season,
      from: from || undefined,
      to: to || undefined,
    });

    return {
      ok: true,
      response: Array.isArray(response) ? response : [],
      requestId: request.id,
    };
  } catch (error) {
    request.log.error(
      { err: error, league, season, from: from || null, to: to || null },
      "Football fixtures proxy failed"
    );

    reply.code(502);
    return {
      ok: false,
      error: "football_fixtures_fetch_failed",
      requestId: request.id,
    };
  }
});

app.get<{
  Querystring: {
    id?: string;
  };
}>("/football/fixture", async (request, reply) => {
  if (!hasApiFootballConfig()) {
    reply.code(503);
    return {
      ok: false,
      error: "api_football_not_configured",
      requestId: request.id,
    };
  }

  const id = clean(request.query.id);

  if (!id) {
    reply.code(400);
    return {
      ok: false,
      error: "id is required",
      requestId: request.id,
    };
  }

  try {
    const response = await apiFootballFetch<unknown[]>("/fixtures", { id });

    return {
      ok: true,
      response: Array.isArray(response) ? response : [],
      requestId: request.id,
    };
  } catch (error) {
    request.log.error({ err: error, id }, "Football fixture proxy failed");

    reply.code(502);
    return {
      ok: false,
      error: "football_fixture_fetch_failed",
      requestId: request.id,
    };
  }
});

app.get<{
  Querystring: {
    league?: string;
    season?: string;
    round?: string;
  };
}>("/football/fixtures/by-round", async (request, reply) => {
  if (!hasApiFootballConfig()) {
    reply.code(503);
    return {
      ok: false,
      error: "api_football_not_configured",
      requestId: request.id,
    };
  }

  const league = clean(request.query.league);
  const season = clean(request.query.season);
  const round = clean(request.query.round);

  if (!league || !season || !round) {
    reply.code(400);
    return {
      ok: false,
      error: "league, season and round are required",
      requestId: request.id,
    };
  }

  try {
    const response = await apiFootballFetch<unknown[]>("/fixtures", {
      league,
      season,
      round,
    });

    return {
      ok: true,
      response: Array.isArray(response) ? response : [],
      requestId: request.id,
    };
  } catch (error) {
    request.log.error(
      { err: error, league, season, round },
      "Football fixtures by round proxy failed"
    );

    reply.code(502);
    return {
      ok: false,
      error: "football_fixtures_by_round_fetch_failed",
      requestId: request.id,
    };
  }
});

app.get("/football/countries", async (request, reply) => {
  if (!hasApiFootballConfig()) {
    reply.code(503);
    return {
      ok: false,
      error: "api_football_not_configured",
      requestId: request.id,
    };
  }

  try {
    const response = await apiFootballFetch<unknown[]>("/countries");

    return {
      ok: true,
      response: Array.isArray(response) ? response : [],
      requestId: request.id,
    };
  } catch (error) {
    request.log.error({ err: error }, "Football countries proxy failed");

    reply.code(502);
    return {
      ok: false,
      error: "football_countries_fetch_failed",
      requestId: request.id,
    };
  }
});

app.get<{
  Querystring: {
    league?: string;
    season?: string;
  };
}>("/football/teams", async (request, reply) => {
  if (!hasApiFootballConfig()) {
    reply.code(503);
    return {
      ok: false,
      error: "api_football_not_configured",
      requestId: request.id,
    };
  }

  const league = clean(request.query.league);
  const season = clean(request.query.season);

  if (!league || !season) {
    reply.code(400);
    return {
      ok: false,
      error: "league and season are required",
      requestId: request.id,
    };
  }

  try {
    const response = await apiFootballFetch<unknown[]>("/teams", {
      league,
      season,
    });

    return {
      ok: true,
      response: Array.isArray(response) ? response : [],
      requestId: request.id,
    };
  } catch (error) {
    request.log.error(
      { err: error, league, season },
      "Football teams proxy failed"
    );

    reply.code(502);
    return {
      ok: false,
      error: "football_teams_fetch_failed",
      requestId: request.id,
    };
  }
});

// Wallet proxy routes

app.get<{
  Querystring: {
    prefix?: string;
    limit?: string;
    cursor?: string;
  };
}>("/wallet/list", async (request, reply) => {
  const prefix = clean(request.query.prefix) || "wallet/";
  const limit = clean(request.query.limit) || "200";
  const cursor = clean(request.query.cursor) || undefined;

  try {
    const upstream = await walletWorkerFetch(
      "/wallet/list",
      { method: "GET" },
      {
        prefix,
        limit,
        cursor,
      }
    );

    const text = await upstream.text();

    reply.code(upstream.status);
    reply.header("Content-Type", "application/json; charset=utf-8");
    return text;
  } catch (error) {
    request.log.error(
      { err: error, prefix, limit, cursor: cursor ?? null },
      "Wallet list proxy failed"
    );

    reply.code(502);
    return {
      ok: false,
      error: "wallet_list_proxy_failed",
      requestId: request.id,
    };
  }
});

app.post("/wallet/upload", async (request, reply) => {
  try {
    if (!request.isMultipart()) {
      reply.code(415);
      return {
        ok: false,
        error: "Expected multipart/form-data",
        requestId: request.id,
      };
    }

    const parts = request.parts();

    let fileBuffer: Buffer | null = null;
    let fileName = "upload";
    let mimeType = "application/octet-stream";
    let userId = "";
    let tripId = "";
    let matchId = "";
    let category = "";

    for await (const part of parts) {
      if (part.type === "file") {
        fileName = clean(part.filename) || "upload";
        mimeType = clean(part.mimetype) || "application/octet-stream";

        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        fileBuffer = Buffer.concat(chunks);
      } else {
        const value = clean(part.value);
        if (part.fieldname === "userId") userId = value;
        if (part.fieldname === "tripId") tripId = value;
        if (part.fieldname === "matchId") matchId = value;
        if (part.fieldname === "category") category = value;
      }
    }

    if (!fileBuffer) {
      reply.code(400);
      return {
        ok: false,
        error: "Missing file field",
        requestId: request.id,
      };
    }

    const form = new FormData();
    form.append(
      "file",
      new Blob([fileBuffer], { type: mimeType }),
      fileName
    );

    if (userId) form.append("userId", userId);
    if (tripId) form.append("tripId", tripId);
    if (matchId) form.append("matchId", matchId);
    if (category) form.append("category", category);

    const upstream = await walletWorkerFetch("/wallet/upload", {
      method: "POST",
      body: form,
    });

    const text = await upstream.text();

    reply.code(upstream.status);
    reply.header("Content-Type", "application/json; charset=utf-8");
    return text;
  } catch (error) {
    request.log.error({ err: error }, "Wallet upload proxy failed");

    reply.code(502);
    return {
      ok: false,
      error: "wallet_upload_proxy_failed",
      requestId: request.id,
    };
  }
});

app.get<{
  Querystring: {
    key?: string;
  };
}>("/wallet/file", async (request, reply) => {
  const key = clean(request.query.key);

  if (!key) {
    reply.code(400);
    return {
      ok: false,
      error: "Missing key",
      requestId: request.id,
    };
  }

  try {
    const upstream = await walletWorkerFetch(
      "/wallet/file",
      { method: "GET" },
      { key }
    );

    reply.code(upstream.status);

    upstream.headers.forEach((value, header) => {
      if (header.toLowerCase() === "transfer-encoding") return;
      reply.header(header, value);
    });

    const arrayBuffer = await upstream.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    request.log.error({ err: error, key }, "Wallet file proxy failed");

    reply.code(502);
    return {
      ok: false,
      error: "wallet_file_proxy_failed",
      requestId: request.id,
    };
  }
});

app.delete<{
  Querystring: {
    key?: string;
  };
}>("/wallet/file", async (request, reply) => {
  const key = clean(request.query.key);

  if (!key) {
    reply.code(400);
    return {
      ok: false,
      error: "Missing key",
      requestId: request.id,
    };
  }

  try {
    const upstream = await walletWorkerFetch(
      "/wallet/file",
      { method: "DELETE" },
      { key }
    );

    const text = await upstream.text();

    reply.code(upstream.status);
    reply.header("Content-Type", "application/json; charset=utf-8");
    return text;
  } catch (error) {
    request.log.error({ err: error, key }, "Wallet delete proxy failed");

    reply.code(502);
    return {
      ok: false,
      error: "wallet_delete_proxy_failed",
      requestId: request.id,
    };
  }
});

app.get<{
  Querystring: {
    fixtureId?: string;
    homeName?: string;
    awayName?: string;
    kickoffIso?: string;
    leagueName?: string;
    leagueId?: string;
    debugNoCache?: string;
  };
}>("/tickets/resolve", async (request, reply) => {
  const fixtureId = clean(request.query.fixtureId) || undefined;
  const homeName = clean(request.query.homeName);
  const awayName = clean(request.query.awayName);
  const kickoffIso = clean(request.query.kickoffIso);
  const leagueName = clean(request.query.leagueName) || undefined;
  const leagueId = clean(request.query.leagueId) || undefined;
  const debugNoCache = toBool(request.query.debugNoCache);

  if (!homeName || !awayName || !kickoffIso) {
    reply.code(400);
    return {
      ok: false,
      provider: null,
      exact: false,
      score: null,
      url: null,
      title: null,
      priceText: null,
      reason: "not_found",
      checkedProviders: [],
      options: [],
      error: "homeName, awayName and kickoffIso are required",
      requestId: request.id,
    };
  }

  request.log.info(
    {
      requestId: request.id,
      fixtureId: fixtureId ?? null,
      homeName,
      awayName,
      kickoffIso,
      leagueName: leagueName ?? null,
      leagueId: leagueId ?? null,
      debugNoCache,
    },
    "Ticket resolve request received"
  );

  try {
    const result = await resolveTicket({
      fixtureId,
      homeName,
      awayName,
      kickoffIso,
      leagueName,
      leagueId,
      debugNoCache,
    });

    request.log.info(
      {
        requestId: request.id,
        fixtureId: fixtureId ?? null,
        provider: result.provider,
        exact: result.exact,
        score: result.score,
        reason: result.reason,
        checkedProviders: result.checkedProviders,
        ok: result.ok,
      },
      "Ticket resolve request completed"
    );

    if (!result.ok) {
      reply.code(404);
    }

    return {
      ...result,
      requestId: request.id,
    };
  } catch (error) {
    request.log.error(
      {
        requestId: request.id,
        err: error,
        fixtureId: fixtureId ?? null,
        homeName,
        awayName,
        kickoffIso,
        leagueName: leagueName ?? null,
        leagueId: leagueId ?? null,
        debugNoCache,
      },
      "Ticket resolution failed"
    );

    reply.code(500);
    return {
      ok: false,
      provider: null,
      exact: false,
      score: null,
      url: null,
      title: null,
      priceText: null,
      reason: "not_found",
      checkedProviders: [],
      options: [],
      error: "internal_ticket_resolution_error",
      requestId: request.id,
    };
  }
});

async function start() {
  try {
    await app.listen({
      port: env.port,
      host: "0.0.0.0",
    });

    app.log.info(
      {
        port: env.port,
        localhost: `http://localhost:${env.port}`,
        nodeEnv: env.nodeEnv,
        corsOrigins: env.appCorsOrigins,
      },
      "Backend running"
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();

export { app };
export type App = typeof app;
