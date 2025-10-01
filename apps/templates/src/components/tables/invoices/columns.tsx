"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@midday/ui/checkbox";
import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { 
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  DollarSign,
  Eye
} from "lucide-react";
import type { MockInvoice } from "@/lib/mock/invoices-mock";

const statusConfig = {
  draft: { 
    label: "Draft", 
    variant: "secondary" as const,
    icon: FileText,
    color: "text-gray-500"
  },
  sent: { 
    label: "Sent", 
    variant: "default" as const,
    icon: Clock,
    color: "text-blue-500"
  },
  paid: { 
    label: "Paid", 
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-500"
  },
  partially_paid: { 
    label: "Partial", 
    variant: "secondary" as const,
    icon: DollarSign,
    color: "text-yellow-500"
  },
  overdue: { 
    label: "Overdue", 
    variant: "destructive" as const,
    icon: AlertCircle,
    color: "text-red-500"
  },
  cancelled: { 
    label: "Cancelled", 
    variant: "outline" as const,
    icon: XCircle,
    color: "text-gray-400"
  },
};

export const columns: ColumnDef<MockInvoice>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "number",
    header: "Invoice",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("number")}</div>
    ),
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original.customer;
      return (
        <div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-xs text-muted-foreground">{customer.email}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {format(new Date(row.getValue("date")), "MMM dd, yyyy")}
      </div>
    ),
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      const dueDate = new Date(row.getValue("dueDate"));
      const isOverdue = dueDate < new Date() && row.original.status !== "paid";
      
      return (
        <div className={cn(
          "whitespace-nowrap",
          isOverdue && "text-red-500 font-medium"
        )}>
          {format(dueDate, "MMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => {
      const amount = row.getValue("total") as number;
      const currency = row.original.currency;
      
      return (
        <div className="font-medium">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
          }).format(amount)}
        </div>
      );
    },
  },
  {
    accessorKey: "amountDue",
    header: "Amount Due",
    cell: ({ row }) => {
      const amount = row.getValue("amountDue") as number;
      const currency = row.original.currency;
      
      if (amount === 0) {
        return <span className="text-muted-foreground">—</span>;
      }
      
      return (
        <div className="font-medium text-orange-500">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
          }).format(amount)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusConfig;
      const config = statusConfig[status];
      const Icon = config.icon;
      const invoice = row.original;
      
      return (
        <div className="flex items-center space-x-2">
          <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
          {invoice.viewedAt && status === "sent" && (
            <Eye className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
  },
];