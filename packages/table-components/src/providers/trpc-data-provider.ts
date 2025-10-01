import type { 
  DataProvider, 
  FetchParams, 
  PageResult, 
  MutationOperation,
  DataCallback,
  Unsubscribe 
} from '../types/data-provider.types';

/**
 * TRPCDataProvider - Adapter for tRPC-based data fetching
 * 
 * This provider integrates with workbooks-turbo's tRPC setup,
 * supporting useSuspenseInfiniteQuery and mutations.
 */
export class TRPCDataProvider<T> implements DataProvider<T> {
  private trpcClient: any;
  private endpoint: string;
  private subscribers: Set<DataCallback<T>> = new Set();

  constructor(trpcClient: any, endpoint: string) {
    this.trpcClient = trpcClient;
    this.endpoint = endpoint;
  }

  async fetchPage(params: FetchParams): Promise<PageResult<T>> {
    // This will be implemented to work with tRPC's infiniteQueryOptions
    // Example usage in workbooks-turbo:
    // const infiniteQueryOptions = trpc[endpoint].get.infiniteQueryOptions(params)
    
    throw new Error('TRPCDataProvider implementation pending - use with actual tRPC client');
  }

  async mutate(operation: MutationOperation<T>): Promise<T | void> {
    // This will use tRPC mutations
    // Example: trpc[endpoint].create.mutate(data)
    
    throw new Error('TRPCDataProvider mutations pending - use with actual tRPC client');
  }

  subscribe(callback: DataCallback<T>): Unsubscribe {
    // Could integrate with tRPC subscriptions or polling
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }
}