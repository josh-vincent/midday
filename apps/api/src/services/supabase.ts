import type { Database } from "@midday/supabase/types";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Helper to get env vars that works in both Node.js and Cloudflare Workers
function getEnv(key: string): string {
  // @ts-ignore - Cloudflare Workers env
  if (typeof process === 'undefined' || !process.env) {
    throw new Error(`Environment variable ${key} is not available`);
  }
  return process.env[key] || '';
}

export async function createClient(accessToken?: string, supabaseUrl?: string, supabaseServiceKey?: string) {
  const url = supabaseUrl || getEnv('SUPABASE_URL');
  const serviceKey = supabaseServiceKey || getEnv('SUPABASE_SERVICE_KEY');

  return createSupabaseClient<Database>(
    url,
    serviceKey,
    {
      accessToken() {
        return Promise.resolve(accessToken || "");
      },
    },
  );
}
