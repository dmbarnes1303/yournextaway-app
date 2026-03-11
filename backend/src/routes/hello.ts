import type { App } from "../index.js";

export function registerHelloRoutes(app: App) {
  app.route({
    method: "GET",
    path: "/hello",
    handler: async () => {
      return {
        ok: true,
        message: "YourNextAway backend is working",
      };
    },
  });
}
