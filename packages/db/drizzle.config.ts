import type { Config } from "drizzle-kit";
import { config as loadEnv } from "dotenv";
import path from "path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_SESSION_POOLER! || "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres",
  },
} satisfies Config;
