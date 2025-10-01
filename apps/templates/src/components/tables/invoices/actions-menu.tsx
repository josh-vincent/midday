"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Button } from "@midday/ui/button";
import { 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Copy, 
  Eye,
  Send,
  Download,
  Share,
  CheckCircle,
  XCircle,
  RotateCcw,
  FileText,
  DollarSign
} from "lucide-react";
import type { MockInvoice } from "@/lib/mock/invoices-mock";

type Props = {
  row: MockInvoice;
  onEdit?: (invoice: MockInvoice) => void;
  onDelete?: (invoice: MockInvoice) => void;
  onSend?: (invoice: MockInvoice) => void;
  onMarkPaid?: (invoice: MockInvoice) => void;
  onDuplicate?: (invoice: MockInvoice) => void;
  onDownload?: (invoice: MockInvoice) => void;
  onPreview?: (invoice: MockInvoice) => void;
  onChangeStatus?: (invoice: MockInvoice, status: MockInvoice["status"]) => void;
};

const statusActions = [
  { value: "draft", label: "Mark as Draft", icon: FileText },
  { value: "sent", label: "Mark as Sent", icon: Send },
  { value: "paid", label: "Mark as Paid", icon: CheckCircle },
  { value: "overdue", label: "Mark as Overdue", icon: XCircle },
  { value: "cancelled", label: "Mark as Cancelled", icon: RotateCcw },
];

export function ActionsMenu({ 
  row, 
  onEdit, 
  onDelete, 
  onSend,
  onMarkPaid,
  onDuplicate,
  onDownload,
  onPreview,
  onChangeStatus
}: Props) {
  const canSend = row.status === "draft";
  const canMarkPaid = ["sent", "overdue", "partially_paid"].includes(row.status);
  const canEdit = ["draft", "sent"].includes(row.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => onPreview?.(row)}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onDownload?.(row)}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {canSend && (
          <DropdownMenuItem onClick={() => onSend?.(row)}>
            <Send className="mr-2 h-4 w-4" />
            Send Invoice
          </DropdownMenuItem>
        )}

        {canMarkPaid && (
          <DropdownMenuItem onClick={() => onMarkPaid?.(row)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Record Payment
          </DropdownMenuItem>
        )}

        {canEdit && (
          <DropdownMenuItem onClick={() => onEdit?.(row)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Invoice
          </DropdownMenuItem>
        )}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <CheckCircle className="mr-2 h-4 w-4" />
            Change Status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {statusActions.map((status) => {
              const Icon = status.icon;
              return (
                <DropdownMenuItem
                  key={status.value}
                  onClick={() => onChangeStatus?.(row, status.value as MockInvoice["status"])}
                  disabled={row.status === status.value}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {status.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem onClick={() => onDuplicate?.(row)}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Share className="mr-2 h-4 w-4" />
          Share Link
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onDelete?.(row)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}