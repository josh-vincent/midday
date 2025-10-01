import type { 
  DataProvider, 
  FetchParams, 
  PageResult, 
  MutationOperation,
  DataCallback,
  Unsubscribe 
} from '../types/data-provider.types';

export class MockDataProvider<T extends { id: string }> implements DataProvider<T> {
  private data: T[];
  private subscribers: Set<DataCallback<T>> = new Set();

  constructor(initialData: T[]) {
    this.data = [...initialData];
  }

  async fetchPage(params: FetchParams): Promise<PageResult<T>> {
    const { 
      cursor = '0', 
      pageSize = 25, 
      filter = {}, 
      sort, 
      search 
    } = params;

    // Apply filters
    let filteredData = this.filterData(this.data, filter, search);

    // Apply sorting
    if (sort) {
      filteredData = this.sortData(filteredData, sort[0], sort[1]);
    }

    // Apply pagination
    const startIndex = parseInt(cursor);
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      data: paginatedData,
      meta: {
        cursor: endIndex < filteredData.length ? endIndex.toString() : undefined,
        hasMore: endIndex < filteredData.length,
        total: filteredData.length
      }
    };
  }

  async mutate(operation: MutationOperation<T>): Promise<T | void> {
    switch (operation.type) {
      case 'create': {
        const newItem = {
          ...operation.data,
          id: `mock-${Date.now()}`
        } as T;
        this.data.push(newItem);
        this.notifySubscribers();
        return newItem;
      }
      
      case 'update': {
        const index = this.data.findIndex(item => item.id === operation.id);
        if (index !== -1) {
          this.data[index] = { ...this.data[index], ...operation.data };
          this.notifySubscribers();
          return this.data[index];
        }
        break;
      }
      
      case 'delete': {
        if (operation.ids) {
          this.data = this.data.filter(item => !operation.ids!.includes(item.id));
        } else if (operation.id) {
          this.data = this.data.filter(item => item.id !== operation.id);
        }
        this.notifySubscribers();
        break;
      }
    }
  }

  subscribe(callback: DataCallback<T>): Unsubscribe {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private filterData(data: T[], filter: Record<string, any>, search?: string): T[] {
    let result = [...data];

    // Apply search
    if (search) {
      result = result.filter(item => {
        const searchLower = search.toLowerCase();
        return Object.values(item as any).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;

      if (Array.isArray(value) && value.length > 0) {
        result = result.filter(item => {
          const itemValue = (item as any)[key];
          return value.includes(itemValue);
        });
      } else if (typeof value === 'object' && value.start && value.end) {
        // Date range filter
        result = result.filter(item => {
          const itemDate = new Date((item as any)[key]);
          const startDate = new Date(value.start);
          const endDate = new Date(value.end);
          return itemDate >= startDate && itemDate <= endDate;
        });
      } else if (typeof value === 'object' && (value.min !== undefined || value.max !== undefined)) {
        // Number range filter
        result = result.filter(item => {
          const itemValue = (item as any)[key];
          if (value.min !== undefined && itemValue < value.min) return false;
          if (value.max !== undefined && itemValue > value.max) return false;
          return true;
        });
      } else {
        // Exact match filter
        result = result.filter(item => (item as any)[key] === value);
      }
    });

    return result;
  }

  private sortData(data: T[], field: string, direction: 'asc' | 'desc'): T[] {
    return [...data].sort((a, b) => {
      const aValue = (a as any)[field];
      const bValue = (b as any)[field];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return direction === 'asc' ? comparison : -comparison;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.data));
  }
}