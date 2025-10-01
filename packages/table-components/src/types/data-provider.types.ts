export interface PageResult<T> {
  data: T[];
  meta?: {
    cursor?: string;
    hasMore?: boolean;
    total?: number;
  };
}

export interface FetchParams {
  cursor?: string;
  pageSize?: number;
  filter?: Record<string, any>;
  sort?: [string, 'asc' | 'desc'];
  search?: string;
}

export interface MutationOperation<T> {
  type: 'create' | 'update' | 'delete';
  data?: Partial<T>;
  id?: string;
  ids?: string[];
}

export type DataCallback<T> = (data: T[]) => void;
export type Unsubscribe = () => void;

export interface DataProvider<T> {
  fetchPage: (params: FetchParams) => Promise<PageResult<T>>;
  mutate?: (operation: MutationOperation<T>) => Promise<T | void>;
  subscribe?: (callback: DataCallback<T>) => Unsubscribe;
}

export interface TableDataProviderProps<T> {
  provider: DataProvider<T>;
  initialData?: T[];
  pageSize?: number;
  enableInfiniteScroll?: boolean;
  enableRealtime?: boolean;
}