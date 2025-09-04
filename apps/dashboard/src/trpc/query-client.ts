import {
  QueryClient,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import superjson from "superjson";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error: any) => {
          // Check if the error indicates user has no team
          if (error?.message === "NO_TEAM" || error?.data?.message === "NO_TEAM") {
            // Don't retry, redirect to team creation page
            if (typeof window !== 'undefined') {
              window.location.href = '/teams/create';
            }
            return false;
          }
          // Default retry logic (3 retries)
          return failureCount < 3;
        },
      },
      mutations: {
        onError: (error: any) => {
          // Check if the error indicates user has no team
          if (error?.message === "NO_TEAM" || error?.data?.message === "NO_TEAM") {
            // Redirect to team creation page
            if (typeof window !== 'undefined') {
              window.location.href = '/teams/create';
            }
          }
        },
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
