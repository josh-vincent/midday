"use client";

import { BulkLinkJobsDialog } from "@/components/bulk-link-jobs-dialog";
import { LoadMore } from "@/components/load-more";
import { useCustomerFilterParams } from "@/hooks/use-customer-filter-params";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTableScroll } from "@/hooks/use-table-scroll";
import { useCustomersStore } from "@/store/customers";
import { useTRPC } from "@/trpc/client";
import { Table, TableBody } from "@midday/ui/table";
import { useMutation, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
import { columns } from "./columns";
import { EmptyState, NoResults } from "./empty-states";
import { CustomerRow } from "./row";
import { TableHeader } from "./table-header";

export function DataTable() {
  const { ref, inView } = useInView();
  const { setParams } = useCustomerParams();
  const trpc = useTRPC();
  const { filter, hasFilters } = useCustomerFilterParams();
  const { params } = useSortParams();
  const { columnVisibility } = useCustomersStore();

  // State for bulk linking dialog
  const [showBulkLinkDialog, setShowBulkLinkDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);

  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 2,
  });

  const infiniteQueryOptions = trpc.customers.get.infiniteQueryOptions(
    {
      ...filter,
      sort: params.sort,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
      // Refetch every 30 seconds to sync with other devices
      refetchInterval: 30000,
      // Refetch when window regains focus
      refetchOnWindowFocus: true,
      // Keep data fresh
      staleTime: 10000,
    },
  );

  const { data, fetchNextPage, hasNextPage, refetch } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const deleteCustomerMutation = useMutation(
    trpc.customers.delete.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    }),
  );

  const handleDeleteCustomer = (id: string) => {
    deleteCustomerMutation.mutate({ id });
  };

  const handleShowBulkLinkDialog = (customerId: string, customerName: string) => {
    setSelectedCustomer({ id: customerId, name: customerName });
    setShowBulkLinkDialog(true);
  };

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const setOpen = (id?: string) => {
    if (id) {
      setParams({ customerId: id });
    } else {
      setParams(null);
    }
  };

  const table = useReactTable({
    data: tableData,
    getRowId: (row) => row.id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility,
    },
    meta: {
      deleteCustomer: handleDeleteCustomer,
      showBulkLinkDialog: handleShowBulkLinkDialog,
    },
  });

  if (!tableData.length && hasFilters) {
    return <NoResults />;
  }

  if (!tableData.length) {
    return <EmptyState />;
  }

  return (
    <div className="w-full" data-testid="customers-list">
      <div
        ref={tableScroll.containerRef}
        className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide"
      >
        <Table>
          <TableHeader table={table} tableScroll={tableScroll} />

          <TableBody className="border-l-0 border-r-0">
            {table.getRowModel().rows.map((row) => (
              <CustomerRow key={row.id} row={row} setOpen={setOpen} />
            ))}
          </TableBody>
        </Table>
      </div>

      <LoadMore ref={ref} hasNextPage={hasNextPage} />

      {/* Bulk Link Jobs Dialog */}
      {selectedCustomer && (
        <BulkLinkJobsDialog
          open={showBulkLinkDialog}
          onOpenChange={(open) => {
            setShowBulkLinkDialog(open);
            if (!open) {
              setSelectedCustomer(null);
            }
          }}
          customerName={selectedCustomer.name}
          customerId={selectedCustomer.id}
        />
      )}
    </div>
  );
}
