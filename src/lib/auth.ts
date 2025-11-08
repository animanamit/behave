import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: new Pool({
    // connection options
    connectionString: process.env.DATABASE_URL || "",
  }),
  secret: process.env.BETTER_AUTH_SECRET,

  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
});
