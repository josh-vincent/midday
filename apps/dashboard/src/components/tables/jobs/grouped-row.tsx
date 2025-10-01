"use client";

import { TableRow, TableCell } from "@midday/ui/table";
import type { Row } from "@tanstack/react-table";
import { useJobParams } from "@/hooks/use-job-params";
import type { Job } from "./columns";
import { Badge } from "@midday/ui/badge";
import { Layers } from "lucide-react";

type GroupedJob = Job & {
  isGrouped: boolean;
  jobCount: number;
  totalVolume: number;
  totalAmount: number;
  maxLoadNumber: number;
  jobIds?: string[];
  groupBy?: string[];
};

type Props = {
  row: Row<GroupedJob>;
};

export function GroupedJobRow({ row }: Props) {
  const { setParams } = useJobParams();
  const job = row.original;

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't open details if clicking on checkbox or actions
    const target = e.target as HTMLElement;
    if (
      target.closest('[role="checkbox"]') ||
      target.closest('[data-action-menu]') ||
      target.closest('button')
    ) {
      return;
    }
    
    // For grouped rows, we could potentially show a modal with all grouped jobs
    // For now, just open the first job in the group
    setParams({ jobId: job.id });
  };

  return (
    <TableRow
      className="group h-[57px] cursor-pointer bg-muted/20 hover:bg-[#F2F1EF] hover:dark:bg-secondary"
      onClick={handleRowClick}
    >
      {row.getVisibleCells().map((cell) => {
        // Add special rendering for grouped indicator
        if (cell.column.id === 'jobNumber' && job.isGrouped) {
          return (
            <TableCell 
              key={cell.id}
              style={{ width: undefined }}
              className=""
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {job.jobCount} jobs
                </span>
                <Badge variant="secondary" className="text-xs">
                  Max Load #{job.maxLoadNumber}
                </Badge>
              </div>
            </TableCell>
          );
        }
        
        // Show aggregated volume for cubic meters
        if (cell.column.id === 'cubicMetreCapacity' && job.isGrouped) {
          return (
            <TableCell 
              key={cell.id}
              style={{ width: undefined }}
              className=""
            >
              <span className="font-medium">
                {job.totalVolume?.toFixed(2) || '0.00'} m³
              </span>
            </TableCell>
          );
        }
        
        // Show aggregated amount for price
        if (cell.column.id === 'totalAmount' && job.isGrouped) {
          return (
            <TableCell 
              key={cell.id}
              style={{ width: undefined }}
              className=""
            >
              <span className="font-medium">
                ${job.totalAmount?.toFixed(2) || '0.00'}
              </span>
            </TableCell>
          );
        }

        return (
          <TableCell 
            key={cell.id}
            className={
              cell.column.id === 'select' 
                ? 'w-[40px] min-w-[40px] md:sticky md:left-0 bg-muted/20 z-10 border-r border-border' 
                : cell.column.id === 'companyName'
                ? 'w-[200px] min-w-[200px] md:sticky md:left-[40px] bg-muted/20 z-10 border-r border-border'
                : ''
            }
          >
            {cell.renderValue
              ? cell.column.columnDef.cell?.(cell.getContext())
              : null}
          </TableCell>
        );
      })}
    </TableRow>
  );
}