import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
// import { withReplicas } from "./replicas";
import * as schema from "./schema";

// Optimized connection configuration for stateful Fly VMs (3 instances)
const connectionConfig = {
  prepare: false,
  max: 10, // Increased connections for development
  idle_timeout: 90, // fewer disconnects
  max_lifetime: 0, // disable forced recycling
  connect_timeout: 30, // Longer timeout for development
};

// Use DATABASE_URL or fallback to Supabase URL
const databaseUrl =
  process.env.DATABASE_PRIMARY_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres.ulncfblvuijlgniydjju:MikeTheDogSupabase!@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres";

const primaryPool = postgres(databaseUrl, connectionConfig);

// For now, use the same URL for all replicas
const fraPool = postgres(databaseUrl, connectionConfig);
const sjcPool = postgres(databaseUrl, connectionConfig);
const iadPool = postgres(databaseUrl, connectionConfig);

export const primaryDb = drizzle(primaryPool, {
  schema,
  casing: "snake_case",
});

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

export const connectDb = async () => {
  // Temporarily disable replicas - use primary only
  return primaryDb as any;
};

export type Database = Awaited<ReturnType<typeof connectDb>>;

export type DatabaseWithPrimary = Database & {
  $primary?: Database;
  usePrimaryOnly?: () => Database;
};
