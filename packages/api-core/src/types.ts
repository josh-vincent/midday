import type { Database } from "@midday/db/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnyRouter, ProcedureBuilder } from "@trpc/server";

/**
 * Context type for tRPC procedures
 */
export type TRPCContext = {
  session: any | null;
  supabase: SupabaseClient;
  db: Database;
  geo?: any;
  teamId?: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
};

/**
 * Router factory dependencies that need to be passed from the app
 */
export type RouterFactoryDeps = {
  createTRPCRouter: any;
  protectedProcedure: ProcedureBuilder<any, any>;
  publicProcedure?: ProcedureBuilder<any, any>;
  authProcedure?: ProcedureBuilder<any, any>;
};

/**
 * Type for router factory functions
 */
export type TRPCRouterFactory = (deps: RouterFactoryDeps) => AnyRouter;
