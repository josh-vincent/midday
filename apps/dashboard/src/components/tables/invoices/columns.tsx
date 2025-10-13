"use client";

import { FormatAmount } from "@/components/format-amount";
import { InvoiceStatus } from "@/components/invoice-status";
import { formatDate, getDueDateStatus } from "@/utils/format";
import { getWebsiteLogo } from "@midday/utils/logos";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
import { TooltipProvider } from "@midday/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import * as React from "react";
import { ActionsMenu } from "./actions-menu";
import { MobileCheckbox } from "@midday/table-components";
import { CustomerCell } from "./customer-cell";

export type Invoice = NonNullable<
  RouterOutputs["invoice"]["get"]["data"]
>[number];

export const columns: ColumnDef<Invoice>[] = [
  {
    id: "select",
    size: 40,
    meta: {
      className:
        "sticky left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-30 max-w-[33vw]",
    },
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <MobileCheckbox
          isHeader
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-center">
          <MobileCheckbox
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
    header: "Title",
    accessorKey: "title",
    meta: {
      className:
        "w-[120px] min-w-[120px] md:w-[180px] md:min-w-[180px] sticky left-[40px] bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      const status = row.original.status;

      // Determine dot color based on status
      let dotColor = "bg-gray-500"; // draft
      if (status === "unpaid") dotColor = "bg-red-500";
      if (status === "paid") dotColor = "bg-green-500";
      if (status === "canceled") dotColor = "bg-gray-500";
      if (status === "overdue") dotColor = "bg-orange-500";
      if (status === "scheduled") dotColor = "bg-blue-500";

      // @ts-expect-error template is a jsonb field
      const title = row.original.template?.title as string | undefined;
      const invoiceNumber = row.original.invoiceNumber;
      return (
        <span
          className={cn({
            "line-through": row.original.status === "canceled",
          })}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`}
              title={status}
            />
            <div className="flex flex-col gap-0.5">
              <span>{title || "Invoice"}</span>
              <span className="text-xs text-muted-foreground font-mono">{invoiceNumber}</span>
            </div>
          </div>
        </span>
      );
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row, table }) => {
      const status = row.getValue("status") as string;
      const scheduledAt = row.original.scheduledAt;

      if (status === "scheduled" && scheduledAt) {
        return (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger>
                <InvoiceStatus status={status as any} />
              </TooltipTrigger>
              <TooltipContent
                className="text-xs py-1 px-2"
                side="right"
                sideOffset={5}
              >
                Scheduled to send:{" "}
                {format(
                  scheduledAt,
                  `MMM d, ${table.options.meta?.timeFormat === 24 ? "HH:mm" : "h:mm a"}`,
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return <InvoiceStatus status={status as any} />;
    },
  },
  {
    header: "Due date",
    accessorKey: "dueDate",
    cell: ({ row, table }) => {
      const date = row.original.dueDate;

      const showDate =
        row.original.status === "unpaid" || row.original.status === "overdue";

      return (
        <div className="flex flex-col space-y-1 w-[80px]">
          <span>
            {date ? formatDate(date, table.options.meta?.dateFormat) : "-"}
          </span>
          {showDate && (
            <span className="text-xs text-muted-foreground">
              {date ? getDueDateStatus(date as string) : "-"}
            </span>
          )}
        </div>
      );
    },
  },
  {
    header: "Customer",
    accessorKey: "customer",
    size: 60,
    cell: ({ row }) => (
      <CustomerCell invoice={row.original} />
    ),
  },
  {
    header: "Amount",
    accessorKey: "amount",
    meta: { hideOnMobile: true },
    cell: ({ row }) => {
      if (!row.original.amount) return "-";
      return (
        <span
          className={cn("flex items-center gap-2", {
            "line-through": row.original.status === "canceled",
          })}
        >
          <FormatAmount
            amount={row.original.amount}
            currency={row.original.currency ?? "USD"}
          />
        </span>
      );
    },
  },
  {
    header: "VAT Rate",
    accessorKey: "vatRate",
    meta: { hideOnMobile: true },
    cell: ({ row }) => {
      // @ts-expect-error template is a jsonb field
      const vatRate = row.original.template.vatRate as number | undefined;
      const value =
        vatRate !== undefined && vatRate !== null ? `${vatRate}%` : "-";
      return (
        <span
          className={cn({
            "line-through": row.original.status === "canceled",
          })}
        >
          {value}
        </span>
      );
    },
  },
  {
    header: "VAT Amount",
    accessorKey: "vatAmount",
    meta: { hideOnMobile: true },
    cell: ({ row }) => (
      <span
        className={cn({
          "line-through": row.original.status === "canceled",
        })}
      >
        <FormatAmount
          amount={(row.original?.vat as number) ?? null}
          currency={row.original.currency ?? "USD"}
        />
      </span>
    ),
  },
  {
    header: "Tax Rate",
    accessorKey: "taxRate",
    meta: { hideOnMobile: true },
    cell: ({ row }) => {
      // @ts-expect-error template is a jsonb field
      const taxRate = row.original.template.taxRate as number | undefined;
      const value =
        taxRate !== undefined && taxRate !== null ? `${taxRate}%` : "-";
      return (
        <span
          className={cn({
            "line-through": row.original.status === "canceled",
          })}
        >
          {value}
        </span>
      );
    },
  },
  {
    header: "Tax Amount",
    accessorKey: "taxAmount",
    meta: { hideOnMobile: true },
    cell: ({ row }) => (
      <span
        className={cn({
          "line-through": row.original.status === "canceled",
        })}
      >
        <FormatAmount
          amount={(row.original.tax as number) ?? null}
          currency={row.original.currency ?? "USD"}
        />
      </span>
    ),
  },
  {
    header: "Excl. VAT",
    accessorKey: "exclVat",
    meta: { hideOnMobile: true },
    cell: ({ row }) => (
      <span
        className={cn({
          "line-through": row.original.status === "canceled",
        })}
      >
        <FormatAmount
          amount={
            (row.original.amount as number) - (row.original.vat as number)
          }
          currency={row.original.currency ?? "USD"}
        />
      </span>
    ),
  },
  {
    header: "Excl. Tax",
    accessorKey: "exclTax",
    meta: { hideOnMobile: true },
    cell: ({ row }) => (
      <span
        className={cn({
          "line-through": row.original.status === "canceled",
        })}
      >
        <FormatAmount
          amount={
            (row.original.amount as number) - (row.original.tax as number)
          }
          currency={row.original.currency ?? "USD"}
        />
      </span>
    ),
  },
  {
    header: "Internal Note",
    accessorKey: "internalNote",
    meta: { hideOnMobile: true },
    cell: ({ row }) => {
      return <span className="truncate">{row.original.internalNote}</span>;
    },
  },
  {
    header: "Issue date",
    accessorKey: "issueDate",
    meta: { hideOnMobile: true },
    cell: ({ row, table }) => {
      const date = row.original.issueDate;
      return (
        <span>
          {date ? formatDate(date, table.options.meta?.dateFormat) : "-"}
        </span>
      );
    },
  },
  {
    header: "Sent at",
    accessorKey: "sentAt",
    meta: { hideOnMobile: true },
    cell: ({ row, table }) => {
      const sentAt = row.original.sentAt;
      const sentTo = row.original.sentTo;

      if (!sentAt) {
        return "-";
      }

      if (!sentTo) {
        return formatDate(sentAt, table.options.meta?.dateFormat);
      }

      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger className="flex items-center space-x-2">
              {formatDate(sentAt, table.options.meta?.dateFormat)}
            </TooltipTrigger>
            <TooltipContent
              className="text-xs py-1 px-2"
              side="right"
              sideOffset={5}
            >
              {sentTo}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    meta: {
      className:
        "text-right sticky right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-30 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      return <ActionsMenu row={row.original} />;
    },
  },
];
