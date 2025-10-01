"use client";

import { Skeleton } from "@midday/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@midday/ui/table";

export function DatabaseTablesTableSkeleton() {
  return (
    <div className="w-full">
      <div className="overflow-x-auto overscroll-x-none md:border-l md:border-r border-border scrollbar-hide">
        <Table>
          <TableHeader className="border-l-0 border-r-0">
            <TableRow>
              <TableHead className="w-[40px] min-w-[40px]">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead className="w-[200px] min-w-[200px]">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="w-[150px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[120px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[120px]">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              <TableHead className="w-[100px]">
                <Skeleton className="h-4 w-10" />
              </TableHead>
              <TableHead className="w-[150px]">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              <TableHead className="w-[100px]">
                <Skeleton className="h-4 w-14" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="h-[57px]">
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-6" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-3 w-3 rounded" />
                      <Skeleton className="h-3 w-4" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-3 rounded" />
                    <Skeleton className="h-4 w-6" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}