"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@midday/ui/checkbox";
import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Banknote,
  Repeat
} from "lucide-react";
import type { MockTransaction } from "@/lib/mock/transactions-mock";

export const columns: ColumnDef<MockTransaction>[] = [
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
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {format(new Date(row.getValue("date")), "MMM dd, yyyy")}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <div className="max-w-[300px]">
          <div className="font-medium truncate">{transaction.description}</div>
          {transaction.merchant && (
            <div className="text-xs text-muted-foreground">{transaction.merchant}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal">
        {row.getValue("category")}
      </Badge>
    ),
  },
  {
    accessorKey: "account",
    header: "Account",
    cell: ({ row }) => {
      const transaction = row.original;
      const Icon = transaction.method === "card" ? CreditCard : Banknote;
      return (
        <div className="flex items-center space-x-2">
          <Icon className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{transaction.account}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const transaction = row.original;
      const isCredit = transaction.type === "credit";
      const Icon = isCredit ? ArrowUpRight : ArrowDownRight;
      
      return (
        <div className={cn(
          "flex items-center space-x-1 font-medium",
          isCredit ? "text-green-600" : "text-red-600"
        )}>
          <Icon className="h-3 w-3" />
          <span>
            {isCredit ? "+" : "-"}
            ${Math.abs(transaction.amount).toLocaleString()}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const transaction = row.original;
      
      const statusConfig = {
        pending: { label: "Pending", variant: "secondary" as const },
        completed: { label: "Completed", variant: "default" as const },
        failed: { label: "Failed", variant: "destructive" as const },
        cancelled: { label: "Cancelled", variant: "outline" as const },
      };
      
      const config = statusConfig[status as keyof typeof statusConfig];
      
      return (
        <div className="flex items-center space-x-2">
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
          {transaction.isRecurring && (
            <Repeat className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      );
    },
  },
  {
    id: "balance",
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const balance = row.original.balance;
      if (!balance) return null;
      
      return (
        <div className="text-sm text-muted-foreground">
          ${balance.toLocaleString()}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
  },
];