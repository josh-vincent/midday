"use client";

import { formatAmount } from "@/utils/format";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ActionsMenu } from "./actions-menu";

export type Job = {
  id: string;
  jobNumber: string;
  jobDate: string | null;
  companyName: string | null;
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
    accessorKey: "jobNumber",
    header: "Job #",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("jobNumber") || "-"}</span>
    ),
  },
  {
    accessorKey: "jobDate",
    header: "Date",
    cell: ({ row, table }) => {
      const date = row.getValue("jobDate") as string | null;
      const dateFormat = (table.options.meta as any)?.dateFormat || "MMM d, yyyy";
      
      if (!date) return "-";
      
      return format(new Date(date), dateFormat);
    },
  },
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => (
      <span className="truncate max-w-[200px]">
        {row.getValue("companyName") || "Unknown"}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
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
    accessorKey: "status",
    header: "Status",
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
    accessorKey: "volume",
    header: "Volume",
    cell: ({ row }) => {
      const volume = row.getValue("volume") as number | null;
      return volume ? `${volume} m³` : "-";
    },
  },
  {
    accessorKey: "weight",
    header: "Weight",
    cell: ({ row }) => {
      const weight = row.getValue("weight") as number | null;
      return weight ? `${weight} kg` : "-";
    },
  },
  {
    accessorKey: "totalAmount",
    header: () => <div className="text-right">Amount</div>,
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