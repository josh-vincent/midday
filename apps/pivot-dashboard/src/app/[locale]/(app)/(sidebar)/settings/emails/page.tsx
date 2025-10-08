import { EmailConnectionsTable } from "@/components/tables/email-connections";
import { ConnectEmailButton } from "@/components/email/connect-email-button";
import { DisconnectEmailModal } from "@/components/modals/disconnect-email-modal";
import { batchPrefetch, trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Connections | Midday",
};

export default async function Page() {
  batchPrefetch([
    trpc.emails.connections.queryOptions(),
  ]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Email Connections</h2>
            <p className="text-muted-foreground mt-1">
              Connect your email accounts to sync and manage emails
            </p>
          </div>
          <ConnectEmailButton />
        </div>

        <EmailConnectionsTable />
      </div>

      <DisconnectEmailModal />
    </>
  );
}
