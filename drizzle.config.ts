import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts", // Update path
  out: "./drizzle", // Shorter path for migrations
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
