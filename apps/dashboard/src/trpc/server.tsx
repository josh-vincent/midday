import "server-only";

import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { getCountryCode, getLocale, getTimezone } from "@midday/location";
import { createClient } from "@midday/supabase/server";
import { HydrationBoundary } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import {
  type TRPCQueryOptions,
  createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import { cache } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
  queryClient: getQueryClient,
  client: createTRPCClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
        transformer: superjson,
        async headers() {
          console.log("[tRPC] Creating headers for request");
          console.log("[tRPC] API URL:", process.env.NEXT_PUBLIC_API_URL);

          const supabase = await createClient();

          const {
            data: { session },
          } = await supabase.auth.getSession();

          console.log("[tRPC] Session exists:", !!session);
          console.log("[tRPC] Access token exists:", !!session?.access_token);

          // Build headers object - only include Authorization if we have a valid token
          const headers: Record<string, string> = {
            "x-user-timezone": await getTimezone(),
            "x-user-locale": await getLocale(),
            "x-user-country": await getCountryCode(),
          };

          // Only add Authorization header if we have a valid access token
          if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
            console.log("[tRPC] Authorization header added");
          } else {
            console.log("[tRPC] No access token - skipping Authorization header");
          }

          console.log("[tRPC] Headers created:", {
            "x-user-timezone": headers["x-user-timezone"],
            "x-user-locale": headers["x-user-locale"],
            "x-user-country": headers["x-user-country"],
            hasAuth: !!headers.Authorization,
          });

          return headers;
        },
      }),
      loggerLink({
        enabled: (opts) => {
          const shouldLog = process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error);
          return shouldLog;
        },
      }),
    ],
  }),
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  console.log("[prefetch] Starting prefetch for:", queryOptions.queryKey);

  const queryClient = getQueryClient();
  console.log("[prefetch] Got query client");

  // Return a promise that handles the prefetch
  if (queryOptions.queryKey[1]?.type === "infinite") {
    console.log("[prefetch] Prefetching infinite query");
    return queryClient.prefetchInfiniteQuery(queryOptions as any)
      .then(() => {
        console.log("[prefetch] Infinite query prefetch successful");
      })
      .catch((error) => {
        console.error("[prefetch] Error during infinite query prefetch");
      });
  } else {
    console.log("[prefetch] Prefetching regular query");
    return queryClient.prefetchQuery(queryOptions)
      .then(() => {
        console.log("[prefetch] Regular query prefetch successful");
      })
      .catch((error) => {
        console.error("[prefetch] Error during regular query prefetch");
      });
  }
}

export function batchPrefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptionsArray: T[],
) {
  console.log("[batchPrefetch] Starting batch prefetch for", queryOptionsArray.length, "queries");

  const queryClient = getQueryClient();

  queryOptionsArray.forEach((queryOptions) => {
    if (queryOptions.queryKey[1]?.type === "infinite") {
      void queryClient.prefetchInfiniteQuery(queryOptions as any)
        .catch((error) => {
          console.error("[batchPrefetch] Error during infinite query prefetch");
        });
    } else {
      void queryClient.prefetchQuery(queryOptions)
        .catch((error) => {
          console.error("[batchPrefetch] Error during regular query prefetch");
        });
    }
  });
}
