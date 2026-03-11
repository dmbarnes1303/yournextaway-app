import Fastify from "fastify";
import dotenv from "dotenv";
import { env } from "./lib/env.js";
import { resolveTicket } from "./services/tickets/resolve.js";

dotenv.config();

const app = Fastify({
  logger: true,
});

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
  };
}>("/tickets/resolve", async (request, reply) => {
  const fixtureId = String(request.query.fixtureId ?? "").trim() || undefined;
  const homeName = String(request.query.homeName ?? "").trim();
  const awayName = String(request.query.awayName ?? "").trim();
  const kickoffIso = String(request.query.kickoffIso ?? "").trim();
  const leagueName = String(request.query.leagueName ?? "").trim() || undefined;
  const leagueId = String(request.query.leagueId ?? "").trim() || undefined;

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

  try {
    const result = await resolveTicket({
      fixtureId,
      homeName,
      awayName,
      kickoffIso,
      leagueName,
      leagueId,
    });

    if (!result.ok) {
      reply.code(404);
    }

    return result;
  } catch (error) {
    request.log.error(
      {
        err: error,
        fixtureId,
        homeName,
        awayName,
        kickoffIso,
        leagueName,
        leagueId,
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
