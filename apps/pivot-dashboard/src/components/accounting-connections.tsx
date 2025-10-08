"use client";

import { ConnectQuickBooks } from "@/components/connect-quickbooks";
import { ConnectXero } from "@/components/connect-xero";
import { AccountingConnectionStatus } from "@/components/accounting-connection-status";
import {
  getOAuthConnections,
  deleteOAuthConnection,
  saveOAuthConnection,
  type OAuthConnection,
} from "@/lib/oauth-storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
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
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function ConnectionSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  );
}

function DeleteConnectionButton({ connectionId, onDelete }: { connectionId: string; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteOAuthConnection(connectionId);
    onDelete();
    setOpen(false);
    setIsDeleting(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full w-7 h-7">
          <Icons.Delete size={16} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Connection</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this accounting integration? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConnectionItem({
  connection,
  onDelete,
}: {
  connection: OAuthConnection;
  onDelete: () => void;
}) {
  const providerNames = {
    quickbooks: "QuickBooks",
    xero: "Xero",
  };

  const providerColors = {
    quickbooks: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    xero: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <div className={`h-12 w-12 rounded flex items-center justify-center ${providerColors[connection.provider]}`}>
          <span className="font-semibold text-lg">
            {providerNames[connection.provider]?.[0] || "?"}
          </span>
        </div>
        <div>
          <p className="font-medium">
            {providerNames[connection.provider] || connection.provider}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {connection.tenantName && <span>{connection.tenantName}</span>}
            <AccountingConnectionStatus expiresAt={connection.credentials.expiresAt} />
          </div>
        </div>
      </div>
      <DeleteConnectionButton connectionId={connection.id} onDelete={onDelete} />
    </div>
  );
}

export function AccountingConnections() {
  const [connections, setConnections] = useState<OAuthConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Load connections from localStorage
  const loadConnections = async () => {
    const stored = await getOAuthConnections();
    setConnections(stored);
    setIsLoading(false);
  };

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const oauthSuccess = searchParams.get("oauth_success");
      const provider = searchParams.get("provider");
      const data = searchParams.get("data");

      if (oauthSuccess === "true" && provider && data) {
        try {
          const tokenData = JSON.parse(Buffer.from(data, "base64").toString());

          // Save to localStorage using the OAuth package
          await saveOAuthConnection({
            provider: tokenData.provider as "quickbooks" | "xero",
            teamId: "mock_team_123", // In production, get from session
            userId: "mock_user_123", // In production, get from session
            credentials: {
              accessToken: tokenData.accessToken,
              refreshToken: tokenData.refreshToken,
              expiresIn: tokenData.expiresIn,
              expiresAt: tokenData.expiresAt,
              connectedAt: tokenData.connectedAt,
              scope: tokenData.scope,
              tokenType: tokenData.tokenType,
            },
            tenantId: tokenData.tenantId || tokenData.realmId,
            tenantName: tokenData.tenantName,
            expiresAt: tokenData.expiresAt,
            metadata: {
              realmId: tokenData.realmId,
            },
          });

          toast({
            title: "Connection Successful",
            description: `Successfully connected to ${provider === "quickbooks" ? "QuickBooks" : "Xero"}`,
          });

          // Reload connections
          await loadConnections();

          // Clean URL
          window.history.replaceState({}, "", "/settings/integrations");
        } catch (error) {
          console.error("Error processing OAuth callback:", error);
          toast({
            title: "Connection Failed",
            description: "Failed to save connection data",
            variant: "destructive",
          });
        }
      }
    };

    handleCallback();
  }, [searchParams, toast]);

  // Initial load
  useEffect(() => {
    loadConnections();
  }, []);

  const handleDelete = () => {
    loadConnections();
    toast({
      title: "Connection Deleted",
      description: "Accounting integration has been removed",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounting Integrations</CardTitle>
        <CardDescription>
          Connect your accounting software to automatically sync transactions,
          invoices, and customers. (Testing mode: Using localStorage)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connected Accounts */}
        {isLoading ? (
          <div className="space-y-3">
            <ConnectionSkeleton />
            <ConnectionSkeleton />
          </div>
        ) : connections.length > 0 ? (
          <div className="space-y-3">
            {connections.map((connection) => (
              <ConnectionItem
                key={connection.id}
                connection={connection}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No accounting integrations connected yet.
          </p>
        )}

        {/* Available Integrations */}
        <div className="pt-4 border-t">
          <h3 className="font-medium mb-3">Available Integrations</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <ConnectQuickBooks />
            <ConnectXero />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
