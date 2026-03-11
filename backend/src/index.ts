import Fastify from "fastify";

const app = Fastify({
  logger: true
});

app.get("/hello", async () => {
  return {
    ok: true,
    message: "YourNextAway backend is running"
  };
});

const start = async () => {
  try {
    await app.listen({
      port: 3000,
      host: "0.0.0.0"
    });

    console.log("Backend running on http://localhost:3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
