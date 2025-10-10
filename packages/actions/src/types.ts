import type { SafeActionClient } from "next-safe-action";

/**
 * Context type for actions
 */
export type ActionContext = {
  supabase?: any;
  analytics?: any;
  user: {
    id: string;
    email: string;
    fullName?: string | null;
    teamId?: string | null;
  };
  teamId?: string | null;
};

/**
 * Action factory dependencies that need to be passed from the app
 */
export type ActionFactoryDeps = {
  authActionClient: SafeActionClient<any, any, any>;
};

/**
 * Type for action factory functions
 */
export type ActionFactory<TInput = any, TOutput = any> = (
  deps: ActionFactoryDeps,
) => SafeActionClient<any, any, any, TInput, TOutput>;
