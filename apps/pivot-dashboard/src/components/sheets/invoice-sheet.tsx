"use client";

import { InvoiceContent as InvoiceContentComponent } from "@/components/invoice-content";
import { FormContext } from "@midday/invoice-components/form";
import { useTRPC } from "@/trpc/client";
import { InvoiceSheet as BaseInvoiceSheet } from "@midday/invoice-components/sheet";
import { DashboardInvoiceDependencies } from "@/providers/invoice-dependencies-provider";
import { useRouter } from "next/navigation";

export function InvoiceSheet() {
  const trpc = useTRPC();
  const router = useRouter();

  return (
    <DashboardInvoiceDependencies>
      <BaseInvoiceSheet
        trpc={trpc}
        router={router}
        InvoiceContent={InvoiceContentComponent}
        FormContext={FormContext}
      />
    </DashboardInvoiceDependencies>
  );
}