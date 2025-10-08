import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { getToken } from './auth';

// Type import - using type assertion for flexibility
// In production, this should match your API's AppRouter type
type AppRouter = any;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3334';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      async headers() {
        const token = await getToken();
        return token ? {
          authorization: `Bearer ${token}`,
        } : {};
      },
    }),
  ],
});

// Export a hook-like function for components to use
export function useTRPC() {
  return trpc;
}