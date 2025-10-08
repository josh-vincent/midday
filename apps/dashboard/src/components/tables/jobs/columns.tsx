"use client";

import { FormatAmount } from "@/components/format-amount";
import { Badge } from "@midday/ui/badge";
import { Checkbox } from "@midday/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import Link from "next/link";
import { ActionsMenu } from "./actions-menu";
import { CompanyCell } from "./company-cell";
import { RegoInput } from "../../rego-input";

export type Job = {
  id: string;
  jobNumber: string;
  jobDate: string | null;
  companyName: string | null;
  customerName?: string | null;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled" | "delivered" | "invoiced";
  totalAmount: number | null;
  currency: string;
  rego: string | null;
  pricePerUnit: number | null;
  cubicMetreCapacity: number | null;
  loadNumber: number | null;
  contactPerson: string | null;
  contactNumber: string | null;
  notes: string | null;
  teamId: string;
  customerId: string | null;
  volume: number | null;
  weight: number | null;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  invoiceStatus?: "draft" | "unpaid" | "paid" | "canceled" | "overdue" | null;
  createdAt: string;
  updatedAt: string;
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  invoiced: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
};

const invoiceStatusColors = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  unpaid: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  canceled: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  overdue: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
};

export const columns: ColumnDef<Job>[] = [
  {
    id: "select",
    size: 50,
    header: ({ table }) => (
      <div className="flex items-center justify-center px-3">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const invoiceStatus = row.original.invoiceStatus;

      // Determine dot color based on status
      let dotColor = "bg-yellow-500"; // pending
      if (status === "in_progress") dotColor = "bg-blue-500";
      if (status === "completed") dotColor = "bg-green-500";
      if (status === "cancelled") dotColor = "bg-gray-500";
      if (status === "delivered") dotColor = "bg-green-500";
      if (status === "invoiced" || invoiceStatus === "paid") dotColor = "bg-purple-500";
      if (invoiceStatus === "unpaid") dotColor = "bg-red-500";
      if (invoiceStatus === "overdue") dotColor = "bg-orange-500";

      return (
        <div
          className="flex items-center justify-center px-3 relative"
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
          <span
            className={`absolute top-2 right-2 w-2 h-2 rounded-full ${dotColor}`}
            title={invoiceStatus ? `${status} - ${invoiceStatus}` : status}
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
    cell: ({ row }) => {
      const jobNumber = row.getValue("jobNumber") as string;

      if (!jobNumber || jobNumber === "-") {
        return <Badge variant="outline">N/A</Badge>;
      }

      return <span className="font-medium">{jobNumber}</span>;
    },
  },
  {
    id: "jobDate",
    accessorKey: "jobDate",
    header: "Date",
    enableSorting: true,
    enableHiding: true,
    meta: { hideOnMobile: true },
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
    meta: { hideOnMobile: true },
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
    id: "rego",
    accessorKey: "rego",
    header: "Rego",
    enableSorting: true,
    enableHiding: true,
    meta: { hideOnMobile: true },
    cell: ({ row }) => {
      const rego = row.getValue("rego") as string | null;
      return rego ? (
        <Badge variant="outline" className="mx-auto justify-self-start text-2xl font-bold border-2 border-primary">
            {rego}
            </Badge>
      ) : (
        "-"
      );
    },
  },
  {
    id: "pricePerUnit",
    accessorKey: "pricePerUnit",
    header: "Price Per Unit",
    enableSorting: true,
    enableHiding: true,
    meta: { hideOnMobile: true },
    cell: ({ row }) => {
      const pricePerUnit = row.getValue("pricePerUnit") as number | null;
      return pricePerUnit ? `$${pricePerUnit}` : "-";
    },
  },
  {
    id: "cubicMetreCapacity",
    accessorKey: "cubicMetreCapacity",
    header: "Cubic Metre Capacity",
    enableSorting: true,
    enableHiding: true,
    meta: { hideOnMobile: true },
    cell: ({ row }) => {
      const cubicMetreCapacity = row.getValue("cubicMetreCapacity") as number | null;
      return cubicMetreCapacity ? `${cubicMetreCapacity} m³` : "-";
    },
  },
  {
    id: "loadNumber",
    accessorKey: "loadNumber",
    header: "Load Number",
    enableSorting: true,
    enableHiding: true,
    meta: { hideOnMobile: true },
    cell: ({ row }) => {
      const loadNumber = row.getValue("loadNumber") as number | null;
      return loadNumber ? `${loadNumber}` : "-";
    },
  },
  {
    id: "contactPerson",
    accessorKey: "contactPerson",
    header: "Contact Person",
    enableSorting: true,
    enableHiding: true,
    meta: { hideOnMobile: true },
    cell: ({ row }) => {
      const contactPerson = row.getValue("contactPerson") as string | null;
      return contactPerson ? contactPerson : "-";
    },
  },
  {
    id: "volume",
    accessorKey: "volume",
    header: "Volume",
    enableSorting: true,
    enableHiding: true,
    meta: { hideOnMobile: true },
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
    meta: { hideOnMobile: true },
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
          <FormatAmount
            amount={amount / 100}
            currency={currency}
          />
        </div>
      );
    },
  },
  {
    id: "invoiceNumber",
    accessorKey: "invoiceNumber",
    header: "Invoice #",
    enableSorting: true,
    enableHiding: true,
    meta: { hideOnMobile: true },
    cell: ({ row }) => {
      const invoiceNumber = row.getValue("invoiceNumber") as string | null;
      const invoiceId = row.original.invoiceId;

      if (!invoiceNumber) {
        return <span className="text-muted-foreground">-</span>;
      }

      if (invoiceId) {
        return (
          <Link
            href={`/invoices?type=edit&invoiceId=${invoiceId}`}
            className="font-mono text-sm text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {invoiceNumber}
          </Link>
        );
      }

      return <span className="font-mono text-sm">{invoiceNumber}</span>;
    },
  },
  {
    id: "invoiceStatus",
    accessorKey: "invoiceStatus",
    header: "Invoice Status",
    enableSorting: true,
    enableHiding: true,
    meta: { hideOnMobile: true },
    cell: ({ row }) => {
      const invoiceStatus = row.getValue("invoiceStatus") as Job["invoiceStatus"];
      if (!invoiceStatus) return <span className="text-muted-foreground">-</span>;

      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium capitalize ${
            invoiceStatusColors[invoiceStatus] || invoiceStatusColors.draft
          }`}
        >
          {invoiceStatus}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsMenu row={row} />,
  },
];