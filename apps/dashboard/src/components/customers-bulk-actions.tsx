"use client";

import { CustomersColumnVisibility } from "@/components/customers-column-visibility";
import { OpenCustomerSheet } from "@/components/open-customer-sheet";
import { useCustomersStore } from "@/store/customers";
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
import { ChevronDown, Mail, FileDown, Tag } from "lucide-react";

export function CustomersBulkActions() {
  const { setRowSelection, rowSelection } = useCustomersStore();

  const customerIds = Object.keys(rowSelection);

  const handleAddTags = () => {
    // TODO: Implement bulk tag functionality
    console.log("Add tags to customers:", customerIds);
    setRowSelection(() => ({}));
  };

  const handleSendEmail = () => {
    // TODO: Implement bulk email functionality
    console.log("Send email to customers:", customerIds);
    setRowSelection(() => ({}));
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export customers:", customerIds);
    setRowSelection(() => ({}));
  };

  const handleDelete = () => {
    // TODO: Implement delete mutation
    console.log("Delete customers:", customerIds);
    setRowSelection(() => ({}));
  };

  if (customerIds?.length) {
    return (
      <AlertDialog>
        <div className="ml-auto">
          <div className="flex items-center">
            <span className="text-sm text-[#606060] w-full">Bulk edit</span>
            <div className="h-8 w-[1px] bg-border ml-4 mr-4" />

            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="space-x-2" data-testid="customer-actions-menu-button">
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
              selected customers.
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
    <div className="space-x-2 flex">
      <CustomersColumnVisibility />
      <OpenCustomerSheet />
    </div>
  );
}
