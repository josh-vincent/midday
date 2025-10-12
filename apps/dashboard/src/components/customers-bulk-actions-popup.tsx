"use client";

import { useCustomersStore } from "@/store/customers";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2, Mail, FileDown, Tag, X } from "lucide-react";
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

export function CustomersBulkActionsPopup() {
  const { rowSelection, setRowSelection } = useCustomersStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const selectedCustomerIds = Object.keys(rowSelection);
  const hasSelection = selectedCustomerIds.length > 0;

  // Calculate summary of selected customers
  const summary = useMemo(() => {
    return {
      count: selectedCustomerIds.length,
    };
  }, [selectedCustomerIds]);

  const deleteCustomersMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // TODO: Implement bulk delete
      console.log("Deleting customers:", ids);
      return { count: ids.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'trpc' &&
                 queryKey[1] &&
                 queryKey[1].toString().startsWith('customers.');
        },
      });
      setRowSelection({});
      toast({
        title: `Deleted ${data.count} customers`,
        variant: "success",
        duration: 3500,
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete customers",
        variant: "error",
        duration: 3500,
      });
    },
  });

  const handleAddTags = () => {
    // TODO: Implement bulk tag functionality
    console.log("Add tags to customers:", selectedCustomerIds);
    toast({
      title: "Add tags feature coming soon",
      duration: 2500,
    });
    setRowSelection({});
  };

  const handleSendEmail = () => {
    // TODO: Implement bulk email functionality
    console.log("Send email to customers:", selectedCustomerIds);
    toast({
      title: "Send email feature coming soon",
      duration: 2500,
    });
    setRowSelection({});
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting customers:", selectedCustomerIds);
    toast({
      title: "Export feature coming soon",
      duration: 2500,
    });
    setRowSelection({});
  };

  const handleDelete = () => {
    deleteCustomersMutation.mutate(selectedCustomerIds);
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
                  {summary.count} {summary.count === 1 ? 'customer' : 'customers'} selected
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="space-x-2" disabled={deleteCustomersMutation.isPending}>
                    <span>Actions</span>
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleAddTags}>
                    <Tag className="mr-2 h-4 w-4" />
                    Add Tags
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleSendEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
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
                      selected customers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      {deleteCustomersMutation.isPending ? (
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
