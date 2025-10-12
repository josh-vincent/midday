"use client";

import { useInvoiceStore } from "@/store/invoice";
import { formatAmount } from "@/utils/format";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2, Send, FileDown, X } from "lucide-react";
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";

export function InvoicesBulkActionsPopup() {
  const { rowSelection, setRowSelection } = useInvoiceStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const selectedInvoiceIds = Object.keys(rowSelection);
  const hasSelection = selectedInvoiceIds.length > 0;

  // Calculate summary of selected invoices
  const summary = useMemo(() => {
    // TODO: Get actual invoice data from store or query
    // For now, just show count
    return {
      count: selectedInvoiceIds.length,
    };
  }, [selectedInvoiceIds]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      // TODO: Implement bulk status update
      console.log("Updating invoices:", ids, "to status:", status);
      return { count: ids.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'trpc' &&
                 queryKey[1] &&
                 queryKey[1].toString().startsWith('invoice.');
        },
      });
      setRowSelection({});
      toast({
        title: `Updated ${data.count} invoices`,
        variant: "success",
        duration: 3500,
      });
    },
    onError: () => {
      toast({
        title: "Failed to update invoices",
        variant: "error",
        duration: 3500,
      });
    },
  });

  const deleteInvoicesMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // TODO: Implement bulk delete
      console.log("Deleting invoices:", ids);
      return { count: ids.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'trpc' &&
                 queryKey[1] &&
                 queryKey[1].toString().startsWith('invoice.');
        },
      });
      setRowSelection({});
      toast({
        title: `Deleted ${data.count} invoices`,
        variant: "success",
        duration: 3500,
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete invoices",
        variant: "error",
        duration: 3500,
      });
    },
  });

  const handleStatusUpdate = (status: "paid" | "unpaid" | "overdue" | "canceled") => {
    updateStatusMutation.mutate({
      ids: selectedInvoiceIds,
      status,
    });
  };

  const handleSendInvoices = () => {
    // TODO: Implement send invoices functionality
    console.log("Sending invoices:", selectedInvoiceIds);
    toast({
      title: "Send invoices feature coming soon",
      duration: 2500,
    });
    setRowSelection({});
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting invoices:", selectedInvoiceIds);
    toast({
      title: "Export feature coming soon",
      duration: 2500,
    });
    setRowSelection({});
  };

  const handleDelete = () => {
    deleteInvoicesMutation.mutate(selectedInvoiceIds);
  };

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-0 right-0 mx-auto z-50 bg-background border rounded-lg shadow-lg p-4 max-w-3xl w-[calc(100%-2rem)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {summary.count} {summary.count === 1 ? 'invoice' : 'invoices'} selected
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="space-x-2" disabled={updateStatusMutation.isPending || deleteInvoicesMutation.isPending}>
                    {updateStatusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
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

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="bg-transparent border border-destructive hover:bg-transparent"
                  >
                    <Icons.Delete className="text-destructive" size={18} />
                  </Button>
                </AlertDialogTrigger>
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
                      {deleteInvoicesMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirm"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setRowSelection({})}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
