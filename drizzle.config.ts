import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

if (!process.env.NEON_DATABASE_URL) {
  throw new Error("NEON_DATABASE_URL environment variable is required");
}

export default defineConfig({
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL,
  },
  schema: "./src/lib/db-schema.ts",
  out: "./migrations",
  dialect: "postgresql",
});
