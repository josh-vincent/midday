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
  FileText,
  Mail,
  Phone,
  Archive,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  DollarSign,
  Users,
  Share,
  CreditCard
} from "lucide-react";
import type { MockCustomer } from "@/lib/mock/customers-mock";

type Props = {
  row: MockCustomer;
  onEdit?: (customer: MockCustomer) => void;
  onDelete?: (customer: MockCustomer) => void;
  onCreateInvoice?: (customer: MockCustomer) => void;
  onSendEmail?: (customer: MockCustomer) => void;
  onCall?: (customer: MockCustomer) => void;
  onArchive?: (customer: MockCustomer) => void;
  onReactivate?: (customer: MockCustomer) => void;
  onChangeStatus?: (customer: MockCustomer, status: MockCustomer["status"]) => void;
  onViewInvoices?: (customer: MockCustomer) => void;
  onViewPayments?: (customer: MockCustomer) => void;
};

const statusActions = [
  { value: "active", label: "Mark as Active", icon: CheckCircle },
  { value: "inactive", label: "Mark as Inactive", icon: Clock },
  { value: "suspended", label: "Mark as Suspended", icon: AlertTriangle },
  { value: "prospect", label: "Mark as Prospect", icon: Eye },
];

export function ActionsMenu({ 
  row, 
  onEdit, 
  onDelete, 
  onCreateInvoice,
  onSendEmail,
  onCall,
  onArchive,
  onReactivate,
  onChangeStatus,
  onViewInvoices,
  onViewPayments
}: Props) {
  const canCreateInvoice = row.status === "active" || row.status === "prospect";
  const canReactivate = row.status === "inactive" || row.status === "suspended";
  const canArchive = row.status !== "inactive";

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
        
        <DropdownMenuItem onClick={() => onEdit?.(row)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Customer
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {canCreateInvoice && (
          <DropdownMenuItem onClick={() => onCreateInvoice?.(row)}>
            <FileText className="mr-2 h-4 w-4" />
            Create Invoice
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => onViewInvoices?.(row)}>
          <FileText className="mr-2 h-4 w-4" />
          View Invoices ({row.totalInvoices})
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onViewPayments?.(row)}>
          <DollarSign className="mr-2 h-4 w-4" />
          View Payments
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onSendEmail?.(row)}>
          <Mail className="mr-2 h-4 w-4" />
          Send Email
        </DropdownMenuItem>

        {row.phone && (
          <DropdownMenuItem onClick={() => onCall?.(row)}>
            <Phone className="mr-2 h-4 w-4" />
            Call Customer
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
                  onClick={() => onChangeStatus?.(row, status.value as MockCustomer["status"])}
                  disabled={row.status === status.value}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {status.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {canReactivate && (
          <DropdownMenuItem onClick={() => onReactivate?.(row)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reactivate
          </DropdownMenuItem>
        )}

        {canArchive && (
          <DropdownMenuItem onClick={() => onArchive?.(row)}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}

        <DropdownMenuItem>
          <Share className="mr-2 h-4 w-4" />
          Share Contact
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