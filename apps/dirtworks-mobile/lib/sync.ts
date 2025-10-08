import { OfflineQueue, OfflineOperation, OfflineCache } from './offline';
import { useTRPC } from './trpc';
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

export class SyncService {
  private static instance: SyncService;
  private trpc: any;
  private isSyncing: boolean = false;
  private listeners: ((status: SyncStatus) => void)[] = [];

  private constructor() {
    this.setupSyncMonitor();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  setTRPCClient(trpc: any) {
    this.trpc = trpc;
  }

  private setupSyncMonitor() {
    // Monitor network changes
    NetInfo.addEventListener(async (state) => {
      if (state.isConnected && !this.isSyncing) {
        await this.syncPendingOperations();
      }
    });

    // Periodic sync check (every 30 seconds when online)
    setInterval(async () => {
      const netState = await NetInfo.fetch();
      if (netState.isConnected && !this.isSyncing) {
        await this.syncPendingOperations();
      }
    }, 30000);
  }

  async syncPendingOperations(): Promise<void> {
    if (this.isSyncing || !this.trpc) return;

    const queue = OfflineQueue.getInstance();
    const operations = queue.getQueue();
    
    if (operations.length === 0) return;

    this.isSyncing = true;
    this.notifyStatus({ 
      isSyncing: true, 
      pendingCount: operations.length,
      currentOperation: null 
    });

    let successCount = 0;
    let failedCount = 0;

    for (const operation of operations) {
      try {
        this.notifyStatus({ 
          isSyncing: true, 
          pendingCount: operations.length - successCount,
          currentOperation: operation.type + ' ' + operation.entity
        });

        await this.processOperation(operation);
        
        // Remove from queue after successful sync
        const currentQueue = queue.getQueue();
        const updatedQueue = currentQueue.filter(op => op.id !== operation.id);
        await queue.clearQueue();
        for (const op of updatedQueue) {
          await queue.addOperation({
            type: op.type,
            entity: op.entity,
            data: op.data
          });
        }
        
        successCount++;
      } catch (error) {
        console.error('Sync failed for operation:', operation, error);
        failedCount++;
      }
    }

    this.isSyncing = false;
    this.notifyStatus({ 
      isSyncing: false, 
      pendingCount: failedCount,
      currentOperation: null 
    });

    if (successCount > 0) {
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${successCount} operation${successCount > 1 ? 's' : ''}.${
          failedCount > 0 ? ` ${failedCount} operation${failedCount > 1 ? 's' : ''} failed.` : ''
        }`
      );
    }
  }

  private async processOperation(operation: OfflineOperation): Promise<void> {
    if (!this.trpc) throw new Error('TRPC client not initialized');

    switch (operation.entity) {
      case 'job':
        await this.syncJobOperation(operation);
        break;
      case 'customer':
        await this.syncCustomerOperation(operation);
        break;
      case 'load':
        await this.syncLoadOperation(operation);
        break;
      default:
        throw new Error(`Unknown entity type: ${operation.entity}`);
    }
  }

  private async syncJobOperation(operation: OfflineOperation) {
    switch (operation.type) {
      case 'create':
        await this.trpc.job.create.mutate(operation.data);
        break;
      case 'update':
        await this.trpc.job.update.mutate(operation.data);
        break;
      case 'delete':
        await this.trpc.job.delete.mutate({ id: operation.data.id });
        break;
    }
  }

  private async syncCustomerOperation(operation: OfflineOperation) {
    switch (operation.type) {
      case 'create':
        await this.trpc.customers.create.mutate(operation.data);
        break;
      case 'update':
        await this.trpc.customers.update.mutate(operation.data);
        break;
      case 'delete':
        await this.trpc.customers.delete.mutate({ id: operation.data.id });
        break;
    }
  }

  private async syncLoadOperation(operation: OfflineOperation) {
    if (operation.type === 'create') {
      await this.trpc.job.addLoadWithDirtType.mutate(operation.data);
    }
  }

  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyStatus(status: SyncStatus) {
    this.listeners.forEach(listener => listener(status));
  }
}

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  currentOperation: string | null;
}

// Hook for sync status
export function useSync() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    currentOperation: null,
  });
  const trpc = useTRPC();

  useEffect(() => {
    const syncService = SyncService.getInstance();
    syncService.setTRPCClient(trpc);

    const unsubscribe = syncService.subscribe(setStatus);

    // Initial sync check
    syncService.syncPendingOperations();

    return unsubscribe;
  }, [trpc]);

  return {
    ...status,
    syncNow: () => SyncService.getInstance().syncPendingOperations(),
  };
}

// Enhanced mutation hook with offline support
export function useOfflineMutation<TData, TVariables>(
  options: {
    mutationFn: (variables: TVariables) => Promise<TData>;
    entity: 'job' | 'customer' | 'load';
    type: 'create' | 'update' | 'delete';
    onSuccess?: (data: TData) => void;
    onError?: (error: any) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const queue = OfflineQueue.getInstance();

  const mutate = async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check network status
      const netState = await NetInfo.fetch();
      
      if (netState.isConnected) {
        // Online - execute mutation directly
        const result = await options.mutationFn(variables);
        options.onSuccess?.(result);
        return result;
      } else {
        // Offline - add to queue
        await queue.addOperation({
          type: options.type,
          entity: options.entity,
          data: variables,
        });
        
        // Simulate success for optimistic UI update
        options.onSuccess?.(variables as any);
        Alert.alert(
          'Offline Mode',
          'Your changes have been saved locally and will sync when you\'re back online.'
        );
        return variables;
      }
    } catch (err) {
      setError(err);
      
      // If online request failed, add to offline queue
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || (err as any).message?.includes('Network')) {
        await queue.addOperation({
          type: options.type,
          entity: options.entity,
          data: variables,
        });
        
        Alert.alert(
          'Saved Offline',
          'Unable to sync now. Your changes will be synced automatically when connection is restored.'
        );
        options.onSuccess?.(variables as any);
      } else {
        options.onError?.(err);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    error,
  };
}