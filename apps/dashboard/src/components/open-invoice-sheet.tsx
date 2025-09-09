"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
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
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function OpenInvoiceSheet() {
  const { setParams } = useInvoiceParams();
  const trpc = useTRPC();
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);

  const { data: templateConfig } = useQuery(
    trpc.invoiceTemplate.isConfigured.queryOptions()
  );

  const handleCreateInvoice = () => {
    if (!templateConfig?.isConfigured) {
      setShowAlert(true);
      return;
    }
    setParams({ type: "create" });
  };

  const handleSetupInvoicing = () => {
    setShowAlert(false);
    router.push("/settings/invoice");
  };

  return (
    <div>
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCreateInvoice}
          >
            <Icons.Add />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setup Required</AlertDialogTitle>
            <AlertDialogDescription>
              Before creating invoices, you need to setup your invoice templates with company details and payment information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetupInvoicing}>
              Setup Invoicing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
