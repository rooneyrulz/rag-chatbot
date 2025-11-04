import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
    dbCredentials: {
        url: process.env.NEON_DATABASE_URL!,
    },
    schema: "./src/lib/db-schema.ts",
    out: "./migrations",
    dialect: "postgresql",
});
