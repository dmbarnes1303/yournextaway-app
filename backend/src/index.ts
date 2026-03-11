import "dotenv/config";
import Fastify from "fastify";
import { env } from "./lib/env.js";
import { resolveTicket } from "./services/tickets/resolve.js";

const app = Fastify({
  logger: true,
});

function clean(v: unknown): string {
  return String(v ?? "").trim();
}

function toBool(v: unknown): boolean {
  const value = clean(v).toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

app.addHook("onSend", async (_request, reply, payload) => {
  reply.header("Cache-Control", "public, max-age=60");
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET,OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return payload;
});

app.options("*", async (_request, reply) => {
  reply.code(204).send();
});

app.get("/hello", async () => {
  return {
    ok: true,
    message: "YourNextAway backend is running",
  };
});

app.get("/health", async () => {
  return {
    ok: true,
    status: "ok",
    service: "yournextaway-backend",
    port: env.port,
    ftnConfigured: Boolean(
      env.ftnBaseUrl &&
        env.ftnUsername &&
        env.ftnAffiliateSecret &&
        env.ftnAffiliateId
    ),
    se365Configured: Boolean(env.se365BaseUrl && env.se365ApiKey),
    gigsbergConfigured: Boolean(env.gigsbergAffiliateId),
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
      error: "homeName, awayName and kickoffIso are required",
    };
  }

  request.log.info(
    {
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
    } as any);

    request.log.info(
      {
        fixtureId: fixtureId ?? null,
        homeName,
        awayName,
        kickoffIso,
        provider: result.provider,
        exact: result.exact,
        score: result.score,
        reason: result.reason,
        checkedProviders: result.checkedProviders,
        ok: result.ok,
        debugNoCache,
      },
      "Ticket resolve request completed"
    );

    if (!result.ok) {
      reply.code(404);
    }

    return result;
  } catch (error) {
    request.log.error(
      {
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
      error: "internal_ticket_resolution_error",
    };
  }
});

const start = async () => {
  try {
    await app.listen({
      port: env.port,
      host: "0.0.0.0",
    });

    app.log.info(`Backend running on http://localhost:${env.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
