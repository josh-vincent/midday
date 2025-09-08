"use client";

import { formatAmount } from "@/utils/format";
import { Checkbox } from "@midday/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ActionsMenu } from "./actions-menu";
import { CompanyCell } from "./company-cell";

export type Job = {
  id: string;
  jobNumber: string;
  jobDate: string | null;
  companyName: string | null;
  customerName?: string | null;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "invoiced";
  totalAmount: number | null;
  currency: string;
  teamId: string;
  customerId: string | null;
  volume: number | null;
  weight: number | null;
  createdAt: string;
  updatedAt: string;
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  invoiced: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
};

export const columns: ColumnDef<Job>[] = [
  {
    id: "select",
    size: 40,
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div 
          className="flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
            }}
            aria-label="Select row"
          />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "jobNumber", 
    accessorKey: "jobNumber",
    header: "Job #",
    enableSorting: true,
    enableHiding: false, // Keep job number always visible
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("jobNumber") || "-"}</span>
    ),
  },
  {
    id: "jobDate",
    accessorKey: "jobDate", 
    header: "Date",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row, table }) => {
      const date = row.getValue("jobDate") as string | null;
      const dateFormat = (table.options.meta as any)?.dateFormat || "MMM d, yyyy";
      
      if (!date) return "-";
      
      return format(new Date(date), dateFormat);
    },
  },
  {
    id: "companyName",
    accessorKey: "companyName",
    header: "Company", 
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => (
      <CompanyCell job={row.original} />
    ),
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    enableHiding: true,
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return (
        <span className="truncate max-w-[300px]" title={description || ""}>
          {description || "-"}
        </span>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const status = row.getValue("status") as Job["status"];
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
            statusColors[status] || statusColors.pending
          }`}
        >
          {status.replace("_", " ")}
        </span>
      );
    },
  },
  {
    id: "volume",
    accessorKey: "volume",
    header: "Volume",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const volume = row.getValue("volume") as number | null;
      return volume ? `${volume} m³` : "-";
    },
  },
  {
    id: "weight",
    accessorKey: "weight",
    header: "Weight",
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const weight = row.getValue("weight") as number | null;
      return weight ? `${weight} kg` : "-";
    },
  },
  {
    id: "totalAmount",
    accessorKey: "totalAmount",
    header: () => <div className="text-right">Amount</div>,
    enableSorting: true,
    enableHiding: true,
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount") as number | null;
      const currency = row.original.currency || "USD";
      
      if (!amount) return <div className="text-right">-</div>;
      
      return (
        <div className="text-right font-medium">
          {formatAmount({
            amount,
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsMenu row={row} />,
  },
];