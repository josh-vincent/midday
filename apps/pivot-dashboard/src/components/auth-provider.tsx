"use client";

import { createClient } from "@midday/supabase/client";
import { useEffect } from "react";

/**
 * AuthProvider sets up Supabase auth state change listener
 * This ensures tokens are automatically refreshed in the background
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();

    // Set up auth state change listener for automatic token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Log auth events in development
      if (process.env.NODE_ENV === "development") {
        console.log("[Auth]", event, session?.user?.email);
      }

      // Handle token refresh
      if (event === "TOKEN_REFRESHED") {
        console.log("[Auth] Token refreshed successfully");
      }

      // Handle session expiry
      if (event === "SIGNED_OUT") {
        console.log("[Auth] Session expired or signed out");
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
