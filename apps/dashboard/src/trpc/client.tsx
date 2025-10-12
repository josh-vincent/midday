"use client";

import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { createClient } from "@midday/supabase/client";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider, isServer } from "@tanstack/react-query";
import { type TRPCLink, createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { observable } from "@trpc/server/observable";
import { useState } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  }

  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();

  return browserQueryClient;
}

// Custom error link to handle authentication errors
const errorLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          // Enhanced error logging to track permission issues
          console.error("tRPC Error");

          // Handle UNAUTHORIZED errors (expired sessions)
          if (err.data?.code === "UNAUTHORIZED") {
            // Clear any stale session data
            const supabase = createClient();
            supabase.auth.signOut().then(() => {
              // Redirect to login with return path
              if (typeof window !== "undefined") {
                const returnTo = window.location.pathname + window.location.search;
                window.location.href = `/login?return_to=${encodeURIComponent(returnTo)}`;
              }
            });
          }
          observer.error(err);
        },
        complete() {
          observer.complete();
        },
      });
      return unsubscribe;
    });
  };
};

export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        errorLink,
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
          transformer: superjson,
          async headers() {
            const supabase = createClient();

            // First get the current session
            const {
              data: { session },
            } = await supabase.auth.getSession();

            // If session exists, check if token is expired or will expire soon (within 60 seconds)
            if (session?.expires_at) {
              const expiresAt = session.expires_at * 1000; // Convert to milliseconds
              const now = Date.now();
              const bufferTime = 60 * 1000; // 60 seconds buffer

              // If token is expired or will expire soon, refresh it
              if (expiresAt - now < bufferTime) {
                const {
                  data: { session: refreshedSession },
                } = await supabase.auth.refreshSession();

                return {
                  Authorization: `Bearer ${refreshedSession?.access_token || session.access_token}`,
                };
              }
            }

            return {
              Authorization: `Bearer ${session?.access_token}`,
            };
          },
        }),
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
