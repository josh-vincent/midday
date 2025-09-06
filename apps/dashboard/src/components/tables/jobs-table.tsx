"use client";

import { useJobsStore } from "@/store/jobs";
import { Badge } from "@midday/ui/badge";
import { Checkbox } from "@midday/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { format } from "date-fns";
import { Hash, MapPin, Package, Phone, Truck, User } from "lucide-react";
import { useEffect } from "react";

interface Job {
  id: string;
  jobNumber: string;
  contactPerson?: string;
  contactNumber?: string;
  rego?: string;
  loadNumber?: number;
  companyName?: string;
  addressSite?: string;
  equipmentType?: string;
  materialType?: string;
  pricePerUnit?: number;
  cubicMetreCapacity?: number;
  jobDate?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  totalAmount?: number;
  customerId: string;
  customerName?: string;
  createdAt: string;
  updatedAt?: string;
}

interface JobsTableProps {
  jobs: Job[];
}

export function JobsTable({ jobs }: JobsTableProps) {
  const { rowSelection, setRowSelection, columnVisibility, setJobs, filters } =
    useJobsStore();

  useEffect(() => {
    setJobs(jobs);
  }, [jobs, setJobs]);

  // Apply filters
  let filteredJobs = jobs;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredJobs = filteredJobs.filter(
      (job) =>
        job.jobNumber.toLowerCase().includes(searchLower) ||
        job.contactPerson?.toLowerCase().includes(searchLower) ||
        job.companyName?.toLowerCase().includes(searchLower) ||
        job.addressSite?.toLowerCase().includes(searchLower) ||
        job.rego?.toLowerCase().includes(searchLower),
    );
  }

  if (filters.status.length > 0) {
    filteredJobs = filteredJobs.filter((job) =>
      filters.status.includes(job.status),
    );
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection: Record<string, boolean> = {};
      filteredJobs.forEach((job) => {
        newSelection[job.id] = true;
      });
      setRowSelection(newSelection);
    } else {
      setRowSelection({});
    }
  };

  const handleSelectRow = (jobId: string, checked: boolean) => {
    const newSelection = { ...rowSelection };
    if (checked) {
      newSelection[jobId] = true;
    } else {
      delete newSelection[jobId];
    }
    setRowSelection(newSelection);
  };

  const getStatusColor = (status: Job["status"]) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "success";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const isAllSelected =
    filteredJobs.length > 0 &&
    filteredJobs.every((job) => rowSelection[job.id]);

  const isIndeterminate =
    filteredJobs.some((job) => rowSelection[job.id]) && !isAllSelected;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            {columnVisibility.jobDate !== false && <TableHead>Date</TableHead>}
            {columnVisibility.jobNumber !== false && (
              <TableHead>Job Details</TableHead>
            )}
            {columnVisibility.contact !== false && (
              <TableHead>Contact</TableHead>
            )}
            {columnVisibility.vehicle !== false && (
              <TableHead>Vehicle</TableHead>
            )}
            {columnVisibility.material !== false && (
              <TableHead>Material</TableHead>
            )}
            {columnVisibility.amount !== false && (
              <TableHead className="text-right">Amount</TableHead>
            )}
            {columnVisibility.status !== false && <TableHead>Status</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredJobs.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center py-8 text-muted-foreground"
              >
                No jobs found
              </TableCell>
            </TableRow>
          ) : (
            filteredJobs.map((job) => (
              <TableRow
                key={job.id}
                className={rowSelection[job.id] ? "bg-muted/50" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={rowSelection[job.id] || false}
                    onCheckedChange={(checked) =>
                      handleSelectRow(job.id, checked as boolean)
                    }
                  />
                </TableCell>
                {columnVisibility.jobDate !== false && (
                  <TableCell>
                    {job.jobDate
                      ? format(new Date(job.jobDate), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                )}
                {columnVisibility.jobNumber !== false && (
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1 font-medium">
                        <Hash className="h-3 w-3" />
                        {job.jobNumber}
                      </div>
                      {job.companyName && (
                        <div className="text-sm text-muted-foreground">
                          {job.companyName}
                        </div>
                      )}
                      {job.addressSite && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {job.addressSite}
                        </div>
                      )}
                    </div>
                  </TableCell>
                )}
                {columnVisibility.contact !== false && (
                  <TableCell>
                    <div className="space-y-1">
                      {job.contactPerson && (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3" />
                          {job.contactPerson}
                        </div>
                      )}
                      {job.contactNumber && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {job.contactNumber}
                        </div>
                      )}
                    </div>
                  </TableCell>
                )}
                {columnVisibility.vehicle !== false && (
                  <TableCell>
                    <div className="space-y-1">
                      {job.rego && (
                        <div className="flex items-center gap-1 text-sm">
                          <Truck className="h-3 w-3" />
                          {job.rego}
                        </div>
                      )}
                      {job.equipmentType && (
                        <div className="text-xs text-muted-foreground">
                          {job.equipmentType}
                        </div>
                      )}
                      {job.loadNumber && (
                        <Badge variant="outline" className="text-xs">
                          Load #{job.loadNumber}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                )}
                {columnVisibility.material !== false && (
                  <TableCell>
                    <div className="space-y-1">
                      {job.materialType && (
                        <div className="flex items-center gap-1 text-sm">
                          <Package className="h-3 w-3" />
                          {job.materialType}
                        </div>
                      )}
                      {job.cubicMetreCapacity && (
                        <div className="text-xs text-muted-foreground">
                          {job.cubicMetreCapacity} m³
                        </div>
                      )}
                    </div>
                  </TableCell>
                )}
                {columnVisibility.amount !== false && (
                  <TableCell className="text-right">
                    {job.pricePerUnit && job.cubicMetreCapacity ? (
                      <div>
                        <div className="font-medium">
                          $
                          {(job.pricePerUnit * job.cubicMetreCapacity).toFixed(
                            2,
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ${job.pricePerUnit}/m³
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                )}
                {columnVisibility.status !== false && (
                  <TableCell>
                    <Badge variant={getStatusColor(job.status)}>
                      {job.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
