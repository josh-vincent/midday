import { type CookieOptions, createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

// Helper to decode JWT and check expiration locally (no API call)
function isTokenExpired(token: string): boolean {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decode the payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1]!, 'base64url').toString('utf-8')
    );

    // Check expiration (exp is in seconds, Date.now() is in milliseconds)
    const expirationTime = payload.exp * 1000;
    const now = Date.now();

    // Add 60 second buffer to refresh before actual expiration
    return now >= (expirationTime - 60000);
  } catch {
    return true; // If we can't decode, assume expired
  }
}

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
) {
  // In middleware, we need to use the hardcoded values or pass them in
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ulncfblvuijlgniydjju.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // Get session from cookies (fast, no API call)
  const { data: { session } } = await supabase.auth.getSession();

  // If we have a session, check if the token is expired locally
  if (session?.access_token) {
    const expired = isTokenExpired(session.access_token);

    if (expired) {
      // Try to refresh the session (one API call only when needed)
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();

      // If refresh fails, clear cookies
      if (error || !newSession) {
        const cookiesToClear = [
          'sb-ulncfblvuijlgniydjju-auth-token',
          'sb-ulncfblvuijlgniydjju-auth-token.0',
          'sb-ulncfblvuijlgniydjju-auth-token.1',
        ];

        for (const name of cookiesToClear) {
          response.cookies.set({
            name,
            value: '',
            maxAge: 0,
          });
        }
      }
    }
  }

  return response;
}
