"use client";

import { Skeleton } from "@midday/ui/skeleton";
import { TableCell, TableRow } from "@midday/ui/table";

export function EmailTableSkeleton() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, index) => (
        <TableRow key={index} className="h-[65px]">
          {/* Select column */}
          <TableCell className="w-[40px] min-w-[40px] md:sticky md:left-0 bg-background z-20 border-r border-border">
            <div className="flex items-center justify-center">
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </TableCell>
          
          {/* From column */}
          <TableCell className="w-[200px] min-w-[200px] md:sticky md:left-0 bg-background z-20 border-r border-border">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-32" />
              </div>
            </div>
          </TableCell>
          
          {/* Subject column */}
          <TableCell className="min-w-[300px]">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-3" />
              </div>
              <Skeleton className="h-2 w-64" />
            </div>
          </TableCell>
          
          {/* Status column */}
          <TableCell className="w-[120px]">
            <div className="flex items-center space-x-1">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-4" />
            </div>
          </TableCell>
          
          {/* Labels column */}
          <TableCell className="w-[150px] min-w-[150px]">
            <div className="flex items-center space-x-1">
              <Skeleton className="h-4 w-8 rounded-full" />
              <Skeleton className="h-4 w-10 rounded-full" />
            </div>
          </TableCell>
          
          {/* Provider column */}
          <TableCell className="w-[100px] min-w-[100px]">
            <Skeleton className="h-4 w-12 rounded-full" />
          </TableCell>
          
          {/* Date column */}
          <TableCell className="w-[120px] min-w-[120px]">
            <Skeleton className="h-3 w-16" />
          </TableCell>
          
          {/* Actions column */}
          <TableCell className="w-[100px] md:sticky md:right-0 bg-background z-30">
            <div className="flex justify-end">
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function EmailSearchSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center space-x-2 flex-1">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

export function EmailTableWrapperSkeleton() {
  return (
    <div className="w-full">
      <EmailSearchSkeleton />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="w-[40px] min-w-[40px] p-2">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="w-[200px] min-w-[200px] p-2 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="min-w-[300px] p-2 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="w-[120px] p-2 text-left">
                <Skeleton className="h-4 w-14" />
              </th>
              <th className="w-[150px] min-w-[150px] p-2 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="w-[100px] min-w-[100px] p-2 text-left">
                <Skeleton className="h-4 w-18" />
              </th>
              <th className="w-[120px] min-w-[120px] p-2 text-left">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="w-[100px] p-2">
                <Skeleton className="h-4 w-16" />
              </th>
            </tr>
          </thead>
          <tbody>
            <EmailTableSkeleton />
          </tbody>
        </table>
      </div>
    </div>
  );
}