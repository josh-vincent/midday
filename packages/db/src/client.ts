import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// import { withReplicas } from "./replicas";
import * as schema from "./schema";

// Optimized connection configuration for Cloudflare Workers and serverless
const connectionConfig = {
  prepare: false, // IMPORTANT: Must be false for Cloudflare Workers
  max: 1, // Cloudflare Workers should use minimal connections
  idle_timeout: 0, // Don't keep idle connections
  max_lifetime: 0, // Don't reuse connections
  connect_timeout: 5, // 5 second connection timeout
  fetch_types: false, // Skip fetching types for performance
  connection: {
    application_name: 'dirtworks_api',
    statement_timeout: 10000, // 10 second query timeout
  },
  onnotice: () => {}, // Disable notices for performance
  debug: false,
};

const getPrimaryDb = (databaseUrl?: string) => {
  // Determine the URL to use
  const urlToUse =
    databaseUrl ||
    process.env.DATABASE_PRIMARY_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

  // Create a fresh connection for each request (serverless best practice)
  const primaryPool = postgres(urlToUse, connectionConfig);

  return drizzle(primaryPool, {
    schema,
    casing: "snake_case",
  });
};

const getReplicaIndexForRegion = () => {
  switch (process.env.FLY_REGION) {
    case "fra":
      return 0;
    case "iad":
      return 1;
    case "sjc":
      return 2;
    default:
      return 0;
  }
};

export const connectDb = async (databaseUrl?: string) => {
  // Use the cached connection with the provided URL
  return getPrimaryDb(databaseUrl) as any;
};

export type Database = Awaited<ReturnType<typeof connectDb>>;

export type DatabaseWithPrimary = Database & {
  $primary?: Database;
  usePrimaryOnly?: () => Database;
};
