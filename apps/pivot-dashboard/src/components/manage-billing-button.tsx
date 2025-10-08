"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import { ProductSelectionDialog } from "./product-selection-dialog";
import { useState } from "react";

export function ManageBillingButton() {
  const trpc = useTRPC();
  const { toast } = useToast();
  const [showProductDialog, setShowProductDialog] = useState(false);

  const getPortalUrl = useMutation(
    trpc.billing.getCustomerPortalUrl.mutationOptions({
      onSuccess: (result) => {
        window.open(result.url, "_blank");
      },
      onError: (error) => {
        // If the error is about no billing account, show product selection dialog
        if (
          error.message.includes("No billing account") ||
          error.message.includes("404") ||
          error.message.includes("ResourceNotFound") ||
          error.message.includes("Not found")
        ) {
          setShowProductDialog(true);
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to open customer portal",
            variant: "destructive",
          });
        }
      },
    })
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => getPortalUrl.mutate(undefined)}
        disabled={getPortalUrl.isPending}
      >
        <Settings className="h-4 w-4 mr-2" />
        Manage Billing
      </Button>

      <ProductSelectionDialog
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
      />
    </>
  );
}
