// Comprehensive test environment setup
// Set all required environment variables before any imports

// Database - Use actual Supabase database for tests
// Use pooler URL for all connections (the db.* hostname doesn't resolve)
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";
process.env.DATABASE_SESSION_POOLER =
  process.env.DATABASE_SESSION_POOLER ||
  "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";
process.env.DATABASE_TRANSACTION_POOLER =
  process.env.DATABASE_TRANSACTION_POOLER ||
  "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";
process.env.DATABASE_SUPAVISOR =
  process.env.DATABASE_SUPAVISOR ||
  "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";
// Don't set DATABASE_PRIMARY_URL as it uses an unresolvable hostname
// process.env.DATABASE_PRIMARY_URL = ...;

// Supabase - Use actual Supabase instance for tests
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || "https://ulncfblvuijlgniydjju.supabase.co";
process.env.SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk1OTE4NSwiZXhwIjoyMDcyNTM1MTg1fQ.S_hlGIzZYmMlSq5s8dypf1yGfbRb5_hIPIocsWT9ZgQ";
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ulncfblvuijlgniydjju.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";
process.env.SUPABASE_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET ||
  "YSpRbMnGme4gsWvY7mcRL1PEF2rcMnHPF3LoGMsJ5exSfwmGsCmAIv4wvSe3nMKOiKT1raDGymJaVd7jkLOLqw==";

// Resend Email Service
process.env.RESEND_API_KEY =
  process.env.RESEND_API_KEY || "re_test_key_123456789";
process.env.RESEND_AUDIENCE_ID =
  process.env.RESEND_AUDIENCE_ID || "test_audience_id";
process.env.RESEND_FROM = process.env.RESEND_FROM || "test@example.com";

// Application URLs
process.env.MIDDAY_API_URL =
  process.env.MIDDAY_API_URL || "http://localhost:3334";
process.env.MIDDAY_DASHBOARD_URL =
  process.env.MIDDAY_DASHBOARD_URL || "http://localhost:3333";
process.env.NEXT_PUBLIC_URL =
  process.env.NEXT_PUBLIC_URL || "http://localhost:3333";
process.env.NEXT_PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3334";

// Authentication
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3333";
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || "test_secret_key_for_nextauth";

// Feature Flags
process.env.NEXT_PUBLIC_POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "";
process.env.NEXT_PUBLIC_POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "";
process.env.NEXT_PUBLIC_SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || "";

// Upstash Redis (optional, but prevents warnings)
process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || "";
process.env.UPSTASH_REDIS_REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || "";

// Rate limiting
process.env.RATE_LIMIT_API = process.env.RATE_LIMIT_API || "100";

// File storage
process.env.MIDDAY_STORAGE_BUCKET =
  process.env.MIDDAY_STORAGE_BUCKET || "vault";

// Encryption
process.env.MIDDAY_ENCRYPTION_KEY =
  process.env.MIDDAY_ENCRYPTION_KEY || "test_encryption_key_32_bytes_long!!";

// Export for use in tests
export const testEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  MIDDAY_DASHBOARD_URL: process.env.MIDDAY_DASHBOARD_URL,
};
