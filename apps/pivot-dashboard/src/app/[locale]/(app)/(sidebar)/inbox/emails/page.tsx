import { SyncedEmailsList } from "@/components/inbox/synced-emails-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Synced Emails | ToCLD",
};

/**
 * Demo page showing how to use email syncing with Gmail/Outlook
 *
 * This page demonstrates:
 * 1. Fetching email connections (server action)
 * 2. Syncing emails from Gmail/Outlook (server action)
 * 3. Displaying synced emails (client component with React Query)
 *
 * See: /docs/EMAIL_INTEGRATION_NEXTJS.md for full documentation
 */
export default async function SyncedEmailsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Synced Emails</h1>
          <p className="text-muted-foreground mt-2">
            View and sync emails from your connected Gmail or Outlook account.
          </p>
        </div>

        <SyncedEmailsList />

        <div className="border rounded-lg p-6 bg-muted/50">
          <h2 className="text-lg font-semibold mb-2">How it works</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Connect Gmail or Outlook in{" "}
              <a href="/settings/integrations" className="underline">
                Settings → Integrations
              </a>
            </li>
            <li>Select your email account from the dropdown above</li>
            <li>Click "Sync" to fetch your latest emails</li>
            <li>Emails are stored in the database for fast access</li>
          </ol>

          <div className="mt-4 p-4 bg-background rounded border">
            <h3 className="font-medium text-sm mb-2">Technical Details</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                <strong>Server Action:</strong>{" "}
                <code className="bg-muted px-1 rounded">
                  syncEmailsAction()
                </code>{" "}
                - Fetches emails from Gmail/Outlook API
              </li>
              <li>
                <strong>Database:</strong> Emails stored in{" "}
                <code className="bg-muted px-1 rounded">synced_emails</code>{" "}
                table
              </li>
              <li>
                <strong>Provider:</strong> Uses{" "}
                <code className="bg-muted px-1 rounded">
                  @midday/email-providers
                </code>{" "}
                package
              </li>
              <li>
                <strong>Client Component:</strong> React Query for caching and
                state management
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
