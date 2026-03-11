import Fastify from "fastify";
import dotenv from "dotenv";
import { env } from "./lib/env.js";
import { resolveTicket } from "./services/tickets/resolve.js";

dotenv.config();

const app = Fastify({
  logger: true,
});

app.get("/hello", async () => {
  return {
    ok: true,
    message: "YourNextAway backend is running",
  };
});

app.get("/health", async () => {
  return {
    status: "ok",
    service: "yournextaway-backend",
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
  const homeName = String(request.query.homeName ?? "").trim();
  const awayName = String(request.query.awayName ?? "").trim();
  const kickoffIso = String(request.query.kickoffIso ?? "").trim();

  if (!homeName || !awayName || !kickoffIso) {
    reply.code(400);
    return {
      ok: false,
      error: "homeName, awayName and kickoffIso are required",
    };
  }

  const result = await resolveTicket({
    fixtureId: request.query.fixtureId,
    homeName,
    awayName,
    kickoffIso,
    leagueName: request.query.leagueName,
    leagueId: request.query.leagueId,
  });

  return result;
});

const start = async () => {
  try {
    await app.listen({
      port: env.port,
      host: "0.0.0.0",
    });

    console.log(`Backend running on http://localhost:${env.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
