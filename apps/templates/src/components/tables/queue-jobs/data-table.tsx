"use client";

import { useState, useEffect, useMemo } from "react";
import { Table, TableBody } from "@midday/ui/table";
import {
  type VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { queueAPI, type MockJob } from "@/lib/mock/queue-mock";
import { columns } from "./columns";
import { TableHeader } from "./table-header";
import { QueueJobRow } from "./row";
import { QueueJobsSkeleton } from "./skeleton";
import { EmptyState, NoResults } from "./empty-states";

interface DataTableProps {
  queueFilter?: string;
  statusFilter?: string;
}

export function QueueJobsDataTable({ queueFilter, statusFilter }: DataTableProps) {
  const [data, setData] = useState<MockJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const jobs = await queueAPI.getJobs(queueFilter, statusFilter);
      setData(jobs);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [queueFilter, statusFilter]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  });

  const hasFilters = queueFilter !== "all" || statusFilter !== "all";

  if (loading) {
    return <QueueJobsSkeleton />;
  }

  if (hasFilters && data.length === 0) {
    return <NoResults />;
  }

  if (data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
        <Table>
          <TableHeader 
            table={table}
            sortColumn={sorting[0]?.id}
            sortDirection={sorting[0]?.desc ? "desc" : "asc"}
          />
          <TableBody className="border-l-0 border-r-0">
            {table.getRowModel().rows.map((row) => (
              <QueueJobRow key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}