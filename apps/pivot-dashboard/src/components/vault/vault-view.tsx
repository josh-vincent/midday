"use client";

import { useDocumentParams } from "@/hooks/use-document-params";
import { VaultGrid } from "./vault-grid";
import { VaultUploadZone } from "./vault-upload-zone";

// Vault table components removed for MVP
function DataTable() {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Table view coming soon
    </div>
  );
}

export function VaultView() {
  const { params } = useDocumentParams();

  return (
    <VaultUploadZone>
      {params.view === "grid" ? <VaultGrid /> : <DataTable />}
    </VaultUploadZone>
  );
}
