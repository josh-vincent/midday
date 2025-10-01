"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody } from "@midday/ui/table";
import { useInView } from "react-intersection-observer";
import type { DataProvider } from "../../types/data-provider.types";
import type { Invoice } from "./types";
import { createInvoiceColumns } from "./columns";
import { EmptyState, NoResults } from "../../components/empty-states";
import { TableSkeleton } from "../../components/table-skeleton";
import { Receipt, Plus } from "lucide-react";

interface InvoiceTableProps {
  provider: DataProvider<Invoice>;
  loading?: boolean;
  hasFilters?: boolean;
  onInvoiceClick?: (invoice: Invoice) => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoice: Invoice) => void;
  onSendInvoice?: (invoice: Invoice) => void;
  onDuplicateInvoice?: (invoice: Invoice) => void;
  onMarkAsPaid?: (invoice: Invoice) => void;
  onCreateInvoice?: () => void;
  onImportInvoices?: () => void;
  onClearFilters?: () => void;
  pageSize?: number;
}

export function InvoiceTable({
  provider,
  loading = false,
  hasFilters = false,
  onInvoiceClick,
  onEditInvoice,
  onDeleteInvoice,
  onSendInvoice,
  onDuplicateInvoice,
  onMarkAsPaid,
  onCreateInvoice,
  onImportInvoices,
  onClearFilters,
  pageSize = 25,
}: InvoiceTableProps) {
  const [data, setData] = useState<Invoice[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  
  const { ref, inView } = useInView();

  // Create columns with action handlers
  const columns = useMemo(
    () => createInvoiceColumns({
      onEditInvoice,
      onDeleteInvoice,
      onSendInvoice,
      onDuplicateInvoice,
      onMarkAsPaid,
    }),
    [onEditInvoice, onDeleteInvoice, onSendInvoice, onDuplicateInvoice, onMarkAsPaid]
  );

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsFetching(true);
      try {
        const result = await provider.fetchPage({ pageSize });
        setData(result.data);
        setCursor(result.meta?.cursor);
        setHasMore(result.meta?.hasMore ?? false);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchInitialData();
  }, [provider, pageSize]);

  // Load more when scrolling
  useEffect(() => {
    const loadMore = async () => {
      if (!inView || !hasMore || isFetching || !cursor) return;

      setIsFetching(true);
      try {
        const result = await provider.fetchPage({ cursor, pageSize });
        setData(prev => [...prev, ...result.data]);
        setCursor(result.meta?.cursor);
        setHasMore(result.meta?.hasMore ?? false);
      } catch (error) {
        console.error("Failed to load more data:", error);
      } finally {
        setIsFetching(false);
      }
    };

    loadMore();
  }, [inView, hasMore, isFetching, cursor, provider, pageSize]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  if (loading || (isFetching && data.length === 0)) {
    return <TableSkeleton columns={8} rows={10} />;
  }

  if (hasFilters && !data.length) {
    return <NoResults onClearFilters={onClearFilters} />;
  }

  if (!data.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="No invoices yet"
        description="Start by creating your first invoice or import existing invoices from your accounting system"
        action={onCreateInvoice ? {
          label: "Create Invoice",
          onClick: onCreateInvoice
        } : undefined}
      />
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
        <Table>
          <TableHeader table={table} />
          <TableBody className="border-l-0 border-r-0">
            {table.getRowModel().rows.map((row) => (
              <InvoiceRow 
                key={row.id} 
                row={row} 
                onRowClick={onInvoiceClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Load more trigger */}
      {hasMore && (
        <div ref={ref} className="h-10 flex items-center justify-center">
          {isFetching && <span className="text-sm text-muted-foreground">Loading more...</span>}
        </div>
      )}
    </div>
  );
}

// These components would be imported from separate files in a real implementation
function TableHeader({ table }: any) {
  // Implementation would go here
  return null;
}

function InvoiceRow({ row, onRowClick }: any) {
  // Implementation would go here
  return null;
}