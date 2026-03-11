import type { App } from "../index.js";

export function registerHelloRoutes(app: App) {
  app.get("/hello", async () => {
    return {
      ok: true,
      message: "YourNextAway backend is working",
    };
  });
}
