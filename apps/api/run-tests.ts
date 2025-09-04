#!/usr/bin/env bun

// Set up environment variables FIRST before any imports
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "test_resend_key";
process.env.RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "test_audience_id";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test_anon_key";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test_service_key";
process.env.POSTHOG_CLIENT_KEY = process.env.POSTHOG_CLIENT_KEY || "test_posthog_key";
process.env.POSTHOG_HOST = process.env.POSTHOG_HOST || "https://app.posthog.com";
process.env.JWT_SHARED_SECRET = process.env.JWT_SHARED_SECRET || "test_jwt_secret";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";
process.env.UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "test_unsplash_key";

// Now run tests using Bun's spawn
import { spawnSync } from "bun";

const result = spawnSync(["bun", "test", "./src/trpc/routers/"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ["inherit", "inherit", "inherit"]
});

process.exit(result.exitCode || 0);