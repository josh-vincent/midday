import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../types";

const conWarn = console.warn;
const conLog = console.log;

const IGNORE_WARNINGS = [
  "Using the user object as returned from supabase.auth.getSession()",
];

console.warn = (...args) => {
  const match = args.find((arg) =>
    typeof arg === "string"
      ? IGNORE_WARNINGS.find((warning) => arg.includes(warning))
      : false,
  );
  if (!match) {
    conWarn(...args);
  }
};

console.log = (...args) => {
  const match = args.find((arg) =>
    typeof arg === "string"
      ? IGNORE_WARNINGS.find((warning) => arg.includes(warning))
      : false,
  );
  if (!match) {
    conLog(...args);
  }
};

type CreateClientOptions = {
  admin?: boolean;
  schema?: "public" | "storage";
};

export async function createClient(options?: CreateClientOptions) {
  const { admin = false, ...rest } = options ?? {};
  const cookieStore = await cookies();

  // Provide fallback values for Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ulncfblvuijlgniydjju.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk1OTE4NSwiZXhwIjoyMDcyNTM1MTg1fQ.S_hlGIzZYmMlSq5s8dypf1yGfbRb5_hIPIocsWT9ZgQ";

  const key = admin ? supabaseServiceKey : supabaseAnonKey;

  const auth = admin
    ? {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    : {};

  return createServerClient<Database>(
    supabaseUrl,
    key,
    {
      ...rest,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth,
    },
  );
}
