import type { ColumnDef, Table } from "@tanstack/react-table";

export interface TableColumn<T = any> extends ColumnDef<T> {
  meta?: {
    className?: string;
    sticky?: boolean;
  };
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  hasFilters?: boolean;
  onRowClick?: (row: T) => void;
  onRowSelect?: (rows: T[]) => void;
  enableSelection?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterParams {
  search?: string;
  status?: string | string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  categories?: string[];
  tags?: string[];
  amount?: {
    min?: number;
    max?: number;
  };
  [key: string]: any;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}