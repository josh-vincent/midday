"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../types";

export const createClient = () => {
  // Provide fallback values for Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ulncfblvuijlgniydjju.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik";
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          // Check if we're in the browser
          if (typeof window === 'undefined' || typeof document === 'undefined') {
            return undefined;
          }
          const cookies = document.cookie.split('; ');
          const cookie = cookies.find(c => c.startsWith(`${name}=`));
          return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined;
        },
        set(name: string, value: string, options?: any) {
          // Check if we're in the browser
          if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
          }
          let cookieString = `${name}=${encodeURIComponent(value)}`;
          if (options?.maxAge) {
            cookieString += `; Max-Age=${options.maxAge}`;
          }
          if (options?.path) {
            cookieString += `; Path=${options.path}`;
          }
          cookieString += '; SameSite=Lax';
          // Only add Secure flag for production
          if (window.location.protocol === 'https:') {
            cookieString += '; Secure';
          }
          document.cookie = cookieString;
        },
        remove(name: string, options?: any) {
          // Check if we're in the browser
          if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
          }
          document.cookie = `${name}=; Max-Age=0; Path=${options?.path || '/'}`;
        },
      },
    }
  );
};
