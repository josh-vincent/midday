"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import { Badge } from "@midday/ui/badge";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";

type OAuthProvider = "quickbooks" | "xero" | "outlook" | "gmail";

interface Integration {
  id: OAuthProvider;
  name: string;
  description: string;
  icon: string;
  color: string;
  available: boolean;
}

interface Connection {
  id: string;
  provider: OAuthProvider;
  teamId: string;
  expiresAt?: string;
}

const integrations: Integration[] = [
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Sync customers, invoices, and payments from QuickBooks Online",
    icon: "https://logo.clearbit.com/intuit.com",
    color: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    available: true,
  },
  {
    id: "xero",
    name: "Xero",
    description: "Sync accounting data from Xero",
    icon: "https://logo.clearbit.com/xero.com",
    color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    available: true,
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "Connect your Outlook calendar and email",
    icon: "https://logo.clearbit.com/microsoft.com",
    color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    available: true,
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Connect your Gmail account",
    icon: "https://logo.clearbit.com/google.com",
    color: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    available: true,
  },
];

function IntegrationCard({
  integration,
  connection,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
}: {
  integration: Integration;
  connection?: Connection;
  onConnect: (provider: OAuthProvider) => void;
  onDisconnect: (connectionId: string) => void;
  isConnecting: OAuthProvider | null;
  isDisconnecting: string | null;
}) {
  const isConnected = !!connection;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4 flex-1">
        <div className="h-12 w-12 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <img
            src={integration.icon}
            alt={integration.name}
            className="h-8 w-8 object-contain"
            onError={(e) => {
              // Fallback to letter avatar if logo fails
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              if (target.nextSibling) {
                (target.nextSibling as HTMLElement).style.display = "block";
              }
            }}
          />
          <span
            className="font-semibold text-lg hidden"
            style={{ display: "none" }}
          >
            {integration.name[0]}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{integration.name}</p>
            {isConnected && (
              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                Connected
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {integration.description}
          </p>
        </div>
      </div>
      <div>
        {!integration.available ? (
          <Button size="sm" disabled>
            Coming Soon
          </Button>
        ) : isConnected ? (
          <Button
            onClick={() => onDisconnect(connection.id)}
            disabled={isDisconnecting === connection.id}
            size="sm"
            variant="outline"
          >
            {isDisconnecting === connection.id ? (
              <>
                <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              "Disconnect"
            )}
          </Button>
        ) : (
          <Button
            onClick={() => onConnect(integration.id)}
            disabled={isConnecting === integration.id}
            size="sm"
          >
            {isConnecting === integration.id ? (
              <>
                <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export function OAuthIntegrations() {
  const [isConnecting, setIsConnecting] = useState<OAuthProvider | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch connections using tRPC
  const { data: connections = [], isLoading } = trpc.accountingConnections.get.useQuery();

  // Initiate connection mutation
  const initiateMutation = trpc.accountingConnections.initiateConnection.useMutation({
    onSuccess: (data) => {
      console.log('[OAuthIntegrations] Mutation onSuccess:', data);
      // Redirect to OAuth provider
      console.log('[OAuthIntegrations] Redirecting to authUrl:', data.authUrl);
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      console.error('[OAuthIntegrations] Mutation onError:', {
        message: error.message,
        data: error.data,
        shape: error.shape,
        cause: error.cause,
      });
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to initiate OAuth flow",
        variant: "destructive",
      });
      setIsConnecting(null);
    },
  });

  // Delete connection mutation
  const deleteMutation = trpc.accountingConnections.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Integration has been disconnected successfully",
      });
      // Invalidate connections query to refetch
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'trpc' &&
                 queryKey[1] &&
                 queryKey[1].toString().startsWith('accountingConnections.');
        },
      });
    },
    onError: (error) => {
      console.error("Disconnect error:", error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect integration",
        variant: "destructive",
      });
    },
  });

  // Handle OAuth callback
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      toast({
        title: "Connection Successful",
        description: "Your integration has been connected successfully",
      });
      // Invalidate connections query to refetch
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey[0] === 'trpc' &&
                 queryKey[1] &&
                 queryKey[1].toString().startsWith('accountingConnections.');
        },
      });
      // Clean URL
      router.replace("/settings/integrations");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_params: "Missing required parameters",
        missing_code: "Missing authorization code",
        missing_team_id: "Missing team ID",
        invalid_provider: "Invalid provider specified",
        token_exchange_failed: "Failed to exchange authorization code for tokens",
        storage_failed: "Failed to store connection",
        callback_failed: "OAuth callback failed",
        auth_required: "Authentication required",
      };

      toast({
        title: "Connection Failed",
        description: errorMessages[error] || decodeURIComponent(error),
        variant: "destructive",
      });
      // Clean URL
      router.replace("/settings/integrations");
    }
  }, [searchParams, toast, router, queryClient]);

  const handleConnect = async (provider: OAuthProvider) => {
    console.log('[OAuthIntegrations] handleConnect called with provider:', provider);

    // Only QuickBooks and Xero use the new OAuth flow via Supabase
    const supabaseProviders = ["quickbooks", "xero"] as const;

    setIsConnecting(provider);

    if (supabaseProviders.includes(provider as any)) {
      console.log('[OAuthIntegrations] Using Supabase OAuth flow for:', provider);
      try {
        // Use new tRPC/Supabase OAuth flow for accounting integrations
        console.log('[OAuthIntegrations] Calling initiateMutation.mutateAsync...');
        const result = await initiateMutation.mutateAsync({ provider: provider as "quickbooks" | "xero" });
        console.log('[OAuthIntegrations] Mutation result:', result);
      } catch (error) {
        console.error('[OAuthIntegrations] Mutation error caught:', error);
        // Error is already handled by onError callback
      }
    } else {
      console.log('[OAuthIntegrations] Using old OAuth flow for:', provider);
      // Fall back to old flow for email integrations (Gmail, Outlook)
      try {
        const baseUrl = window.location.origin;
        const authUrl = `${baseUrl}/api/oauth/${provider}/authorize`;
        console.log('[OAuthIntegrations] Redirecting to:', authUrl);
        window.location.href = authUrl;
      } catch (error) {
        console.error("Connection error:", error);
        toast({
          title: "Connection Failed",
          description: "Failed to initiate OAuth flow",
          variant: "destructive",
        });
        setIsConnecting(null);
      }
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    await deleteMutation.mutateAsync({ id: connectionId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>
          Connect your favorite apps to automate workflows and sync data
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icons.Spinner className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {integrations.map((integration) => {
              const connection = connections.find(
                (c) => c.provider === integration.id
              );
              return (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  connection={connection}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  isConnecting={isConnecting}
                  isDisconnecting={deleteMutation.isPending ? connection?.id || null : null}
                />
              );
            })}

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                All integrations use OAuth 2.0 for secure authentication. Your
                tokens are automatically refreshed to maintain connectivity.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
