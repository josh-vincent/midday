"use client";

import { useState, useEffect } from "react";
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
import { queueAPI, type MockWorker } from "@/lib/mock/queue-mock";
import { columns } from "./columns";
import { TableHeader } from "./table-header";
import { WorkerRow } from "./row";
import { WorkersSkeleton } from "./skeleton";
import { EmptyState, NoResults } from "./empty-states";

interface DataTableProps {
  statusFilter?: string;
}

export function WorkersDataTable({ statusFilter }: DataTableProps) {
  const [data, setData] = useState<MockWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const workers = await queueAPI.getWorkers();
      let filteredWorkers = workers;
      
      if (statusFilter && statusFilter !== "all") {
        filteredWorkers = workers.filter(worker => worker.status === statusFilter);
      }
      
      setData(filteredWorkers);
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [statusFilter]);

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

  const hasFilters = statusFilter !== "all";

  if (loading) {
    return <WorkersSkeleton />;
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
              <WorkerRow key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}