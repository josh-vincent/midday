import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

const OFFLINE_QUEUE_KEY = '@tocld_offline_queue';
const OFFLINE_DATA_PREFIX = '@tocld_data_';

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'job' | 'customer' | 'load';
  data: any;
  timestamp: number;
  retries: number;
}

export class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: OfflineOperation[] = [];
  private isOnline: boolean = true;
  private listeners: ((operations: OfflineOperation[]) => void)[] = [];

  private constructor() {
    this.loadQueue();
    this.setupNetworkListener();
  }

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline && this.queue.length > 0) {
        // Network is back, trigger sync
        this.processPendingOperations();
      }
    });
  }

  async addOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retries'>) {
    const newOp: OfflineOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(newOp);
    await this.saveQueue();

    if (this.isOnline) {
      this.processPendingOperations();
    }
  }

  async processPendingOperations() {
    if (!this.isOnline || this.queue.length === 0) return;

    const operations = [...this.queue];
    
    for (const operation of operations) {
      try {
        // This will be called by the sync service with actual API calls
        await this.processOperation(operation);
        
        // Remove successful operation from queue
        this.queue = this.queue.filter(op => op.id !== operation.id);
        await this.saveQueue();
      } catch (error) {
        console.error('Failed to process operation:', operation.id, error);
        
        // Increment retry count
        operation.retries++;
        
        // Remove if max retries exceeded
        if (operation.retries > 3) {
          this.queue = this.queue.filter(op => op.id !== operation.id);
          await this.saveQueue();
          
          // Store as failed operation for manual review
          await this.storeFailedOperation(operation);
        }
      }
    }
  }

  private async processOperation(operation: OfflineOperation): Promise<void> {
    // This will be overridden by the sync service
    throw new Error('Process operation not implemented');
  }

  private async storeFailedOperation(operation: OfflineOperation) {
    const failedKey = '@tocld_failed_operations';
    try {
      const existing = await AsyncStorage.getItem(failedKey);
      const failed = existing ? JSON.parse(existing) : [];
      failed.push(operation);
      await AsyncStorage.setItem(failedKey, JSON.stringify(failed));
    } catch (error) {
      console.error('Failed to store failed operation:', error);
    }
  }

  subscribe(listener: (operations: OfflineOperation[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.queue));
  }

  getQueue(): OfflineOperation[] {
    return [...this.queue];
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

// Hook for offline state and queue
export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<OfflineOperation[]>([]);

  useEffect(() => {
    const offlineQueue = OfflineQueue.getInstance();
    
    // Set initial queue
    setQueue(offlineQueue.getQueue());
    
    // Subscribe to queue changes
    const unsubscribe = offlineQueue.subscribe((operations) => {
      setQueue(operations);
    });
    
    // Subscribe to network state
    const unsubscribeNetwork = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    
    return () => {
      unsubscribe();
      unsubscribeNetwork();
    };
  }, []);

  return {
    isOnline,
    queue,
    queueCount: queue.length,
    addToQueue: (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retries'>) => {
      return OfflineQueue.getInstance().addOperation(operation);
    },
  };
}

// Cache management for offline data access
export class OfflineCache {
  static async set(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(`${OFFLINE_DATA_PREFIX}${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  static async get<T>(key: string, maxAge: number = 60 * 60 * 1000): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(`${OFFLINE_DATA_PREFIX}${key}`);
      if (!stored) return null;
      
      const { data, timestamp } = JSON.parse(stored);
      
      // Check if data is still fresh
      if (Date.now() - timestamp > maxAge) {
        await AsyncStorage.removeItem(`${OFFLINE_DATA_PREFIX}${key}`);
        return null;
      }
      
      return data as T;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(OFFLINE_DATA_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}