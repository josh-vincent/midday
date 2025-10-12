"use client";

import { InvoiceColumnVisibility } from "@/components/invoice-column-visibility";
import { OpenInvoiceSheet } from "@/components/open-invoice-sheet";
import { useInvoiceStore } from "@/store/invoice";
import type { Invoice } from "@/components/tables/invoices/columns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { ChevronDown, Send, FileDown } from "lucide-react";

interface InvoicesBulkActionsProps {
  invoices?: Invoice[];
}

export function InvoicesBulkActions({ invoices = [] }: InvoicesBulkActionsProps) {
  const { setRowSelection, rowSelection } = useInvoiceStore();

  const invoiceIds = Object.keys(rowSelection);

  const handleStatusUpdate = (status: string) => {
    // TODO: Implement status update mutation
    console.log("Update status to:", status, "for invoices:", invoiceIds);
    setRowSelection(() => ({}));
  };

  const handleSendInvoices = () => {
    // TODO: Implement send invoices functionality
    console.log("Send invoices:", invoiceIds);
    setRowSelection(() => ({}));
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export invoices:", invoiceIds);
    setRowSelection(() => ({}));
  };

  const handleDelete = () => {
    // TODO: Implement delete mutation
    console.log("Delete invoices:", invoiceIds);
    setRowSelection(() => ({}));
  };

  if (invoiceIds?.length) {
    return (
      <AlertDialog>
        <div className="ml-auto">
          <div className="flex items-center">
            <span className="text-sm text-[#606060] w-full">Bulk edit</span>
            <div className="h-8 w-[1px] bg-border ml-4 mr-4" />

            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="space-x-2" data-testid="invoice-actions-menu-button">
                    <span>Actions</span>
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("paid")}
                  >
                    Mark as Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("unpaid")}
                  >
                    Mark as Unpaid
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("overdue")}
                  >
                    Mark as Overdue
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusUpdate("canceled")}
                  >
                    Mark as Canceled
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleSendInvoices}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invoices
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleExport}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="destructive"
                  className="bg-transparent border border-destructive hover:bg-transparent"
                >
                  <Icons.Delete className="text-destructive" size={18} />
                </Button>
              </AlertDialogTrigger>
            </div>
          </div>
        </div>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <div className="space-x-2 hidden md:flex">
      <InvoiceColumnVisibility />
      <OpenInvoiceSheet />
    </div>
  );
}
