const config = {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql" as const,
  ...(process.env.DATABASE_URL
    ? {
        dbCredentials: {
          url: process.env.DATABASE_URL,
        },
      }
    : {}),
  // PGlite doesn't need connection details - migrations are applied in code
  // In production with DATABASE_URL, drizzle-kit can connect to Neon
  migrations: {
    prefix: "timestamp" as const, // Ensures unique migration filenames across branches
  },
};

export default config;
