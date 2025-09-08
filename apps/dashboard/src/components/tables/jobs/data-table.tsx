"use client";

import { JobsActions } from "@/components/jobs-actions";
import { LoadMore } from "@/components/load-more";
import { useJobFilterParams } from "@/hooks/use-job-filter-params";
import { useSortParams } from "@/hooks/use-sort-params";
import { useTableScroll } from "@/hooks/use-table-scroll";
import { useUserQuery } from "@/hooks/use-user";
import { useJobsStore } from "@/store/jobs";
import { useTRPC } from "@/trpc/client";
import { Table, TableBody } from "@midday/ui/table";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { columns } from "./columns";
import { EmptyState, NoResults } from "./empty-states";
import { JobRow } from "./row";
import { TableHeader } from "./table-header";

export function DataTable() {
  const trpc = useTRPC();
  const { params } = useSortParams();
  const { filter, hasFilters } = useJobFilterParams();
  const { ref, inView } = useInView();
  const { data: user } = useUserQuery();
  const { rowSelection, setRowSelection, setJobs, jobs, resetRowSelection, columnVisibility } = useJobsStore();

  const tableScroll = useTableScroll({
    useColumnWidths: true,
    startFromColumn: 1,
  });

  const infiniteQueryOptions = trpc.job.list.infiniteQueryOptions(
    {
      sort: params.sort,
      ...filter,
    },
    {
      getNextPageParam: (lastPage) => {
        // If we have a cursor in the response, use it
        if (lastPage && typeof lastPage === 'object' && 'cursor' in lastPage) {
          return lastPage.cursor;
        }
        return undefined;
      },
    },
  );

  const { data, fetchNextPage, hasNextPage, isFetching } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const tableData = useMemo(() => {
    // Handle both array response and object with data property
    return data?.pages.flatMap((page) => {
      if (Array.isArray(page)) {
        return page;
      }
      if (page && typeof page === 'object' && 'data' in page) {
        return page.data ?? [];
      }
      return [];
    }) ?? [];
  }, [data]);

  // Update store with current jobs data using memoization
  const memoizedJobs = useMemo(() => tableData, [tableData]);
  useEffect(() => {
    setJobs(memoizedJobs);
  }, [memoizedJobs, setJobs]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Clear selection when component unmounts to prevent state leakage
  useEffect(() => {
    return () => {
      resetRowSelection();
    };
  }, [resetRowSelection]);

  const table = useReactTable({
    data: tableData,
    getRowId: ({ id }) => id,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      rowSelection,
      columnVisibility,
    },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    // meta: {
    //   dateFormat: user?.dateFormat,
    //   timeFormat: user?.timeFormat,
    // },
  });

  if (hasFilters && !tableData?.length) {
    return <NoResults />;
  }

  if (!tableData?.length && !isFetching) {
    return <EmptyState />;
  }

  return (
    <div className="w-full">
      <div
        ref={tableScroll.containerRef}
        className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide"
      >
        <Table>
          <TableHeader table={table} tableScroll={tableScroll} jobs={jobs} />

          <TableBody className="border-l-0 border-r-0">
            {table.getRowModel().rows.map((row) => (
              <JobRow key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </div>

      <LoadMore ref={ref} hasNextPage={hasNextPage} />
    </div>
  );
}