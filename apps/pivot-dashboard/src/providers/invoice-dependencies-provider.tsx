"use client";

import {
  InvoiceDependenciesProvider,
  type InvoiceComponentDependencies,
} from "@midday/invoice-components";
import { useTRPC } from "@/trpc/client";
import { useUserQuery } from "@/hooks/use-user";
import { useUpload } from "@/hooks/use-upload";
import { useZodForm } from "@/hooks/use-zod-form";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { Editor } from "@/components/editor";
import type { ReactNode } from "react";

export function DashboardInvoiceDependencies({
  children,
}: {
  children: ReactNode;
}) {
  const trpc = useTRPC();

  const dependencies: InvoiceComponentDependencies = {
    trpc,
    useUserQuery,
    useUpload,
    useZodForm,
    useCustomerParams,
    Editor,
  };

  return (
    <InvoiceDependenciesProvider dependencies={dependencies}>
      {children}
    </InvoiceDependenciesProvider>
  );
}