import "dotenv/config";
import Fastify from "fastify";
import { env, hasFtnConfig, hasGigsbergConfig, hasSe365Config } from "./lib/env.js";
import { resolveTicket } from "./services/tickets/resolve.js";

const app = Fastify({
  logger: true,
  requestIdHeader: "x-request-id",
  genReqId: () => `yna_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
});

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function toBool(value: unknown): boolean {
  const normalized = clean(value).toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

app.addHook("onSend", async (request, reply, payload) => {
  reply.header("X-Request-Id", request.id);
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET,OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-Id");

  if (request.url.startsWith("/tickets/resolve")) {
    reply.header("Cache-Control", "public, max-age=60");
  } else {
    reply.header("Cache-Control", "no-store");
  }

  return payload;
});

app.options("*", async (_request, reply) => {
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
  return {
    ok: true,
    status: "ok",
    service: "yournextaway-backend",
    port: env.port,
    host: "0.0.0.0",
    requestId: request.id,
    providers: {
      footballticketsnet: { configured: hasFtnConfig() },
      sportsevents365: { configured: hasSe365Config() },
      gigsberg: {
        configured: hasGigsbergConfig(),
        baseUrl: env.gigsbergBaseUrl,
      },
    },
  };
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
