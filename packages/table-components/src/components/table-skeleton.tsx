"use client";

import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@midday/ui/table";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showCheckbox?: boolean;
  showActions?: boolean;
}

export function TableSkeleton({ 
  columns = 5, 
  rows = 10,
  showCheckbox = true,
  showActions = true
}: TableSkeletonProps) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {showCheckbox && (
                <TableHead className="w-[40px]">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
              )}
              {[...Array(columns)].map((_, i) => (
                <TableHead key={i} className="w-[120px]">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
              {showActions && (
                <TableHead className="w-[50px]">
                  <Skeleton className="h-4 w-4" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(rows)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {showCheckbox && (
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                )}
                {[...Array(columns)].map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
                {showActions && (
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}