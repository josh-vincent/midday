"use client";

import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import { Checkbox } from "@midday/ui/checkbox";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockCustomer } from "@/lib/mock/stripe-mock";
import { ActionsMenu } from "./actions-menu";

export type StripeCustomer = MockCustomer;

export const columns: ColumnDef<StripeCustomer>[] = [
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
    header: "Customer",
    accessorKey: "name",
    meta: {
      className:
        "w-[250px] min-w-[250px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      const customer = row.original;
      
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-medium">
              {customer.name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <span className="font-medium">{customer.name}</span>
            <div className="text-xs text-muted-foreground">{customer.email}</div>
            <div className="text-xs text-muted-foreground font-mono">{customer.id}</div>
          </div>
        </div>
      );
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      
      return (
        <Badge variant={status === "active" ? "default" : "outline"}>
          {status}
        </Badge>
      );
    },
  },
  {
    header: "Subscriptions",
    accessorKey: "subscriptions",
    cell: ({ row }) => {
      const count = row.original.subscriptions;
      
      return (
        <div className="flex items-center space-x-2">
          <span className="font-mono">{count}</span>
          <span className="text-xs text-muted-foreground">
            {count === 1 ? "subscription" : "subscriptions"}
          </span>
        </div>
      );
    },
  },
  {
    header: "Total Spent",
    accessorKey: "totalSpent",
    cell: ({ row }) => {
      const amount = row.original.totalSpent;
      
      return (
        <span className="font-mono">
          ${amount.toLocaleString()}
        </span>
      );
    },
  },
  {
    header: "Created",
    accessorKey: "created",
    cell: ({ row }) => {
      const date = row.original.created;
      
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    meta: {
      className:
        "text-right md:sticky md:right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-30 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      return <ActionsMenu row={row.original} />;
    },
  },
];