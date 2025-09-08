"use client";

import { InvoicesColumnVisibility } from "@/components/invoices-column-visibility";
import { useInvoicesStore, type Invoice } from "@/store/invoices";
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
import { ChevronDown, Download, Plus, Send } from "lucide-react";
import { useRouter } from "next/navigation";

interface InvoicesActionsProps {
  invoices?: Invoice[];
  onSend?: (ids: string[]) => void;
  onDownload?: (ids: string[]) => void;
  onDelete?: (ids: string[]) => void;
  onMarkPaid?: (ids: string[]) => void;
}

export function InvoicesActions({ 
  invoices = [],
  onSend,
  onDownload,
  onDelete,
  onMarkPaid
}: InvoicesActionsProps) {
  const { setRowSelection, rowSelection } = useInvoicesStore();
  const router = useRouter();

  const invoiceIds = Object.keys(rowSelection);

  const handleStatusUpdate = (status: string) => {
    if (status === "paid" && onMarkPaid) {
      onMarkPaid(invoiceIds);
    }
    // TODO: Implement other status updates
    console.log("Update status to:", status, "for invoices:", invoiceIds);
    setRowSelection(() => ({}));
  };

  const handleSendSelected = () => {
    if (onSend) {
      onSend(invoiceIds);
    }
    setRowSelection(() => ({}));
  };

  const handleDownloadSelected = () => {
    if (onDownload) {
      onDownload(invoiceIds);
    }
    setRowSelection(() => ({}));
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(invoiceIds);
    }
    setRowSelection(() => ({}));
  };

  const handleCreateInvoice = () => {
    router.push("/invoices?type=create");
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
                  <Button variant="outline" className="space-x-2">
                    <span>Actions</span>
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleStatusUpdate("draft")}>
                    Mark as Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusUpdate("sent")}>
                    Mark as Sent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusUpdate("paid")}>
                    Mark as Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusUpdate("cancelled")}>
                    Mark as Cancelled
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleSendSelected}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadSelected}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Selected
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
      <InvoicesColumnVisibility />
      <Button onClick={handleCreateInvoice}>
        <Plus className="mr-2 h-4 w-4" />
        Create Invoice
      </Button>
    </div>
  );
}