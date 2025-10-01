"use client";

import { Badge } from "@midday/ui/badge";
import { Checkbox } from "@midday/ui/checkbox";
import { cn } from "@midday/ui/cn";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
import { TooltipProvider } from "@midday/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import * as React from "react";
import { ActionsMenu } from "./actions-menu";
import { Star, Paperclip } from "lucide-react";
import type { MockEmail } from "@/lib/mock/email-mock";

export type Email = MockEmail;

export const columns: ColumnDef<Email>[] = [
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
    header: "From",
    accessorKey: "from",
    meta: {
      className:
        "w-[200px] min-w-[200px] md:sticky md:left-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-20 border-r border-border before:absolute before:right-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:right-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-l after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row }) => {
      const from = row.original.from;
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="size-6">
            <AvatarFallback className="text-[9px] font-medium">
              {from.name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{from.name}</p>
            <p className="text-xs text-muted-foreground truncate">{from.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    header: "Subject",
    accessorKey: "subject",
    cell: ({ row }) => {
      const isUnread = !row.original.read;
      const isImportant = row.original.important;
      const hasAttachments = row.original.attachments && row.original.attachments.length > 0;
      
      return (
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className={cn("text-sm truncate", {
                "font-semibold": isUnread,
              })}>
                {row.original.subject}
              </span>
              {hasAttachments && (
                <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-1">
              {row.original.snippet}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    header: "Status",
    accessorKey: "read",
    cell: ({ row }) => {
      const isUnread = !row.original.read;
      const isImportant = row.original.important;
      const isStarred = row.original.starred;
      
      return (
        <div className="flex items-center space-x-1">
          {isUnread && (
            <Badge variant="secondary" className="text-xs">
              Unread
            </Badge>
          )}
          {isImportant && (
            <Badge variant="destructive" className="text-xs">
              Important
            </Badge>
          )}
          {isStarred && (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          )}
        </div>
      );
    },
  },
  {
    header: "Labels",
    accessorKey: "labels",
    cell: ({ row }) => {
      const labels = row.original.labels;
      
      if (!labels || labels.length === 0) return "-";
      
      return (
        <div className="flex items-center space-x-1">
          {labels.slice(0, 2).map((label) => (
            <Badge key={label} variant="outline" className="text-xs px-1 py-0">
              {label}
            </Badge>
          ))}
          {labels.length > 2 && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{labels.length - 2}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                  {labels.slice(2).join(", ")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    header: "Provider",
    accessorKey: "provider",
    cell: ({ row }) => {
      const provider = row.original.provider;
      return (
        <Badge variant="outline" className="text-xs">
          {provider === "gmail" ? "Gmail" : "Outlook"}
        </Badge>
      );
    },
  },
  {
    header: "Date",
    accessorKey: "date",
    cell: ({ row }) => {
      const date = row.original.date;
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      let displayText: string;
      if (diffHours < 1) displayText = "Just now";
      else if (diffHours < 24) displayText = `${diffHours}h ago`;
      else if (diffHours < 48) displayText = "Yesterday";
      else displayText = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-sm">{displayText}</span>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              {date.toLocaleString()}
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
        "text-right md:sticky md:right-0 bg-background group-hover:bg-[#F2F1EF] group-hover:dark:bg-secondary z-30 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border after:absolute after:left-[-24px] after:top-0 after:bottom-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-background group-hover:after:to-muted after:z-[-1]",
    },
    cell: ({ row, table }) => {
      const { onEmailSelect, onComposeReply, onComposeForward } = (table as any).options.meta || {};
      return (
        <ActionsMenu 
          row={row.original} 
          onEmailSelect={onEmailSelect}
          onComposeReply={onComposeReply}
          onComposeForward={onComposeForward}
        />
      );
    },
  },
];