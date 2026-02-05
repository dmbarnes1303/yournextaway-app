// metro-config.js
const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

// IMPORTANT: Package exports can pull in ESM-only builds that contain `import.meta`,
// which will crash Expo Web (Metro) with: "Cannot use 'import.meta' outside a module".
// Leave this OFF for stability.
config.resolver = config.resolver || {};
config.resolver.unstable_enablePackageExports = false;

// Cache store
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, "node_modules", ".cache", "metro") }),
];

// Custom server middleware to receive console.log messages from the app
const LOG_FILE_PATH = path.join(__dirname, ".natively", "app_console.log");
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB

const logDir = path.dirname(LOG_FILE_PATH);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    const url = req.url || "";
    const pathname = url.split("?")[0];

    // DEBUG: log metro bundle requests
    if (url.includes("index.bundle") || url.includes(".bundle")) {
      console.log("[METRO] Request:", req.method, url);
    }

    // Handle log receiving endpoint
    if (pathname === "/natively-logs" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => {
        try {
          const logData = JSON.parse(body);
          const timestamp = logData.timestamp || new Date().toISOString();
          const level = String(logData.level || "log").toUpperCase();
          const message = String(logData.message || "");
          const source = String(logData.source || "");
          const platform = String(logData.platform || "");

          const platformInfo = platform ? `[${platform}] ` : "";
          const sourceInfo = source ? `[${source}] ` : "";
          const logLine = `[${timestamp}] ${platformInfo}[${level}] ${sourceInfo}${message}\n`;

          // Rotate log file if too large
          try {
            if (
              fs.existsSync(LOG_FILE_PATH) &&
              fs.statSync(LOG_FILE_PATH).size > MAX_LOG_SIZE
            ) {
              const content = fs.readFileSync(LOG_FILE_PATH, "utf8");
              const lines = content.split("\n");
              fs.writeFileSync(
                LOG_FILE_PATH,
                lines.slice(Math.floor(lines.length / 2)).join("\n")
              );
            }
          } catch {
            // ignore rotation errors
          }

          fs.appendFileSync(LOG_FILE_PATH, logLine);

          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify({ status: "ok" }));
        } catch (e) {
          res.writeHead(500, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify({ error: e?.message || String(e) }));
        }
      });
      return;
    }

    // Handle CORS preflight for log endpoint
    if (pathname === "/natively-logs" && req.method === "OPTIONS") {
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      });
      res.end();
      return;
    }

    return middleware(req, res, next);
  };
};

module.exports = config;
