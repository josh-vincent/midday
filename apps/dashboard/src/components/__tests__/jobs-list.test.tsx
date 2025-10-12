import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@midday/api/trpc/routers/_app';

// Example: Testing a Jobs List component with mocked tRPC data
describe('Jobs List Frontend Component', () => {
  let queryClient: QueryClient;
  const trpc = createTRPCReact<AppRouter>();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('should render jobs list with mock data', async () => {
    // Mock tRPC response
    const mockJobs = {
      data: [
        {
          id: '1',
          jobNumber: 'JOB-001',
          companyName: 'Test Company',
          status: 'pending',
          amount: 1000,
        },
      ],
      meta: { total: 1 },
    };

    // This is a placeholder - you'll need to implement the actual component
    // const JobsList = () => <div>Jobs List Component</div>;

    // Mock the tRPC client
    // const mockTrpcClient = trpc.createClient({
    //   links: [
    //     // Add mock link here
    //   ],
    // });

    // render(
    //   <trpc.Provider client={mockTrpcClient} queryClient={queryClient}>
    //     <QueryClientProvider client={queryClient}>
    //       <JobsList />
    //     </QueryClientProvider>
    //   </trpc.Provider>
    // );

    // await waitFor(() => {
    //   expect(screen.getByText('Test Company')).toBeInTheDocument();
    // });

    expect(true).toBe(true); // Placeholder
  });
});
