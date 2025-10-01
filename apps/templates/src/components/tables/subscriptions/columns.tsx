"use client";

import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import { Checkbox } from "@midday/ui/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import type { MockSubscription } from "@/lib/mock/stripe-mock";
import { ActionsMenu } from "./actions-menu";

export type Subscription = MockSubscription;

export const columns: ColumnDef<Subscription>[] = [
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
    accessorKey: "customerName",
    meta: {
      className:
        "w-[200px] min-w-[200px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      const customerName = row.original.customerName;
      const subscriptionId = row.original.id;
      
      return (
        <div className="space-y-1">
          <span className="font-medium">{customerName}</span>
          <div className="text-xs text-muted-foreground font-mono">{subscriptionId}</div>
        </div>
      );
    },
  },
  {
    header: "Product",
    accessorKey: "product",
    cell: ({ row }) => {
      return <span className="font-medium">{row.original.product}</span>;
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const cancelAtPeriodEnd = row.original.cancelAtPeriodEnd;
      
      const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
          case "active":
            return cancelAtPeriodEnd ? "outline" : "default";
          case "trialing":
            return "secondary";
          case "past_due":
          case "incomplete":
            return "destructive";
          case "canceled":
            return "outline";
          default:
            return "outline";
        }
      };

      return (
        <div className="space-y-1">
          <Badge variant={getStatusVariant(status)}>
            {status.replace("_", " ")}
          </Badge>
          {cancelAtPeriodEnd && status === "active" && (
            <div className="text-xs text-muted-foreground">Ends at period</div>
          )}
        </div>
      );
    },
  },
  {
    header: "Amount",
    accessorKey: "price",
    cell: ({ row }) => {
      const amount = row.original.price;
      const interval = row.original.interval;
      
      return (
        <span className="font-mono">
          ${amount.toLocaleString()}/{interval}
        </span>
      );
    },
  },
  {
    header: "Next Billing",
    accessorKey: "currentPeriodEnd",
    cell: ({ row }) => {
      const date = row.original.currentPeriodEnd;
      const cancelAtPeriodEnd = row.original.cancelAtPeriodEnd;
      
      if (cancelAtPeriodEnd) {
        return <span className="text-muted-foreground">Ends {date.toLocaleDateString()}</span>;
      }
      
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
  {
    header: "Trial End",
    accessorKey: "trialEnd",
    cell: ({ row }) => {
      const trialEnd = row.original.trialEnd;
      
      if (!trialEnd) return "-";
      
      return <span className="text-amber-600">{trialEnd.toLocaleDateString()}</span>;
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