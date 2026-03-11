import Fastify from "fastify";
import dotenv from "dotenv";

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

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: "0.0.0.0",
    });

    console.log("Backend running on http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
