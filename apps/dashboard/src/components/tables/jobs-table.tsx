"use client";

import { useJobsStore } from "@/store/jobs";
import { getInitials } from "@/utils/format";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
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
import { RegoInput } from "../rego-input";

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
  weightKg?: number;
  notes?: string;
  jobDate?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "invoiced";
  totalAmount?: number;
  customerId: string;
  customerName?: string;
  invoiceNumber?: string | null;
  invoiceStatus?: "draft" | "unpaid" | "paid" | "canceled" | "overdue" | null;
  createdAt: string;
  updatedAt?: string;
}

interface JobsTableProps {
  jobs: Job[];
}

export function JobsTable({ jobs }: JobsTableProps) {
  const rowSelection = useJobsStore((state) => state.rowSelection);
  const setRowSelection = useJobsStore((state) => state.setRowSelection);
  const columnVisibility = useJobsStore((state) => state.columnVisibility);
  const setJobs = useJobsStore((state) => state.setJobs);
  const filters = useJobsStore((state) => state.filters);

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
      case "invoiced":
        return "outline";
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
    <div className="rounded-md border" data-testid="jobs-list">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] text-center px-3">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onCheckedChange={handleSelectAll}
                />
              </div>
            </TableHead>
            {(columnVisibility.jobDate ?? true) && <TableHead>Date</TableHead>}
            {(columnVisibility.jobNumber ?? true) && (
              <TableHead>Job Details</TableHead>
            )}
            {(columnVisibility.contact ?? true) && (
              <TableHead>Contact</TableHead>
            )}
            {(columnVisibility.vehicle ?? true) && (
              <TableHead>Vehicle</TableHead>
            )}
            {(columnVisibility.material ?? true) && (
              <TableHead>Material</TableHead>
            )}
            {(columnVisibility.amount ?? true) && (
              <TableHead className="text-right">Amount</TableHead>
            )}
            {(columnVisibility.invoiceNumber ?? true) && <TableHead>Invoice #</TableHead>}
            {(columnVisibility.invoiceStatus ?? true) && <TableHead>Invoice Status</TableHead>}
            {(columnVisibility.volume ?? true) && <TableHead>Volume</TableHead>}
            {(columnVisibility.weight ?? true) && <TableHead>Weight</TableHead>}
            {(columnVisibility.description ?? true) && <TableHead>Description</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredJobs.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={13}
                className="text-center py-8 text-muted-foreground"
              >
                No jobs found
              </TableCell>
            </TableRow>
          ) : (
            filteredJobs.map((job) => (
              <TableRow
                key={job.id}
                data-testid="job-item"
                className={rowSelection[job.id] ? "bg-muted/50" : ""}
              >
                <TableCell className="text-center px-3">
                  <div className="flex items-center justify-center relative">
                    <Checkbox
                      checked={rowSelection[job.id] || false}
                      onCheckedChange={(checked) =>
                        handleSelectRow(job.id, checked as boolean)
                      }
                    />
                    <span
                      className={`absolute top-0 right-1 w-2 h-2 rounded-full ${
                        job.invoiceStatus === "paid" || job.status === "invoiced"
                          ? "bg-purple-500"
                          : job.invoiceStatus === "overdue"
                          ? "bg-orange-500"
                          : job.invoiceStatus === "unpaid"
                          ? "bg-red-500"
                          : job.status === "in_progress"
                          ? "bg-blue-500"
                          : job.status === "completed" || job.status === "delivered"
                          ? "bg-green-500"
                          : job.status === "cancelled"
                          ? "bg-gray-500"
                          : "bg-yellow-500"
                      }`}
                      title={job.invoiceStatus ? `${job.status} - ${job.invoiceStatus}` : job.status}
                    />
                  </div>
                </TableCell>
                {(columnVisibility.jobDate ?? true) && (
                  <TableCell>
                    {job.jobDate
                      ? format(new Date(job.jobDate), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                )}
                {(columnVisibility.jobNumber ?? true) && (
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1 font-medium">
                        <Hash className="h-3 w-3" />
                        {job.jobNumber}
                      </div>
                      {job.companyName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Avatar className="h-6 w-6 rounded-none">
                            <AvatarFallback className="rounded-none text-xs font-medium bg-accent text-accent-foreground">
                              {getInitials(job.companyName)}
                            </AvatarFallback>
                          </Avatar>
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
                {(columnVisibility.contact ?? true) && (
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
                {(columnVisibility.vehicle ?? true) && (
                  <TableCell>
                    <div className="space-y-1">
                      {job.rego && (
                        <Badge variant="outline" className="justify-self-start text-2xl font-bold border-2 border-primary">
                        {job.rego}
                        </Badge>
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
                {(columnVisibility.material ?? true) && (
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
                {(columnVisibility.amount ?? true) && (
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
                {(columnVisibility.invoiceNumber ?? true) && (
                  <TableCell>
                    {job.invoiceNumber ? (
                      <span className="font-mono text-sm">{job.invoiceNumber}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                {(columnVisibility.invoiceStatus ?? true) && (
                  <TableCell>
                    {job.invoiceStatus ? (
                      <Badge variant="outline" className="rounded-none">
                        {job.invoiceStatus}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                {(columnVisibility.volume ?? true) && (
                  <TableCell>
                    {job.cubicMetreCapacity ? `${job.cubicMetreCapacity} m³` : "-"}
                  </TableCell>
                )}
                {(columnVisibility.weight ?? true) && (
                  <TableCell>
                    {job.weightKg ? `${(job.weightKg / 1000).toFixed(2)} t` : "-"}
                  </TableCell>
                )}
                {(columnVisibility.description ?? true) && (
                  <TableCell className="max-w-[200px]">
                    <div className="truncate" title={job.notes || ""}>
                      {job.notes || "-"}
                    </div>
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
