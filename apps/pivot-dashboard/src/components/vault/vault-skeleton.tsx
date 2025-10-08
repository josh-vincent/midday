"use client";

import { useDocumentParams } from "@/hooks/use-document-params";
import { VaultGridSkeleton } from "./vault-grid-skeleton";
import { Skeleton } from "@midday/ui/skeleton";

// Vault table components removed for MVP
function DataTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function VaultSkeleton() {
  const { params } = useDocumentParams();

  if (params.view === "grid") {
    return <VaultGridSkeleton />;
  }

  return <DataTableSkeleton />;
}
