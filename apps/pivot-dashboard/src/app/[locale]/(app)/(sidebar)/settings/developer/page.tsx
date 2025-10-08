import { CreateApiKeyModal } from "@/components/modals/create-api-key-modal";
import { DeleteApiKeyModal } from "@/components/modals/delete-api-key-modal";
import { EditApiKeyModal } from "@/components/modals/edit-api-key-modal";
import { DataTable } from "@/components/tables/api-keys";
import { batchPrefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer | Midday",
};

// OAuth components removed for MVP
function OAuthSecretModal() {
  return null;
}

function OAuthApplicationCreateSheet() {
  return null;
}

function OAuthApplicationEditSheet() {
  return null;
}

function OAuthDataTable() {
  return (
    <div className="flex items-center justify-center p-8 border rounded-lg">
      <p className="text-muted-foreground">OAuth applications coming soon</p>
    </div>
  );
}

export default async function Page() {
  batchPrefetch([
    trpc.apiKeys.get.queryOptions(),
  ]);

  return (
    <>
      <div className="space-y-12">
        <DataTable />
        <OAuthDataTable />
      </div>

      <EditApiKeyModal />
      <DeleteApiKeyModal />
      <CreateApiKeyModal />
      <OAuthSecretModal />
      <OAuthApplicationCreateSheet />
      <OAuthApplicationEditSheet />
    </>
  );
}
