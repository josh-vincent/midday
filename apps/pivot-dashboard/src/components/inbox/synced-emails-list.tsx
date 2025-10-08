"use client";

import { useState, useTransition } from "react";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useToast } from "@midday/ui/use-toast";
import {
  syncEmailsAction,
  getEmailConnectionsAction,
  getSyncedEmailsAction,
} from "@/actions/email/sync-emails-action";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Badge } from "@midday/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function SyncedEmailsList() {
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email connections
  const { data: connections, isLoading: loadingConnections } = useQuery({
    queryKey: ["email-connections"],
    queryFn: getEmailConnectionsAction,
  });

  // Fetch synced emails
  const { data: emails, isLoading: loadingEmails } = useQuery({
    queryKey: ["synced-emails", selectedConnection],
    queryFn: () =>
      getSyncedEmailsAction({
        connectionId: selectedConnection || undefined,
        limit: 10,
      }),
  });

  const handleSync = () => {
    if (!selectedConnection) {
      toast({
        title: "No connection selected",
        description: "Please select an email account first",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await syncEmailsAction({
          connectionId: selectedConnection,
          maxResults: 10,
        });

        if (result.success) {
          toast({
            title: "Sync Complete",
            description: `Synced ${result.synced.messages} emails`,
          });

          // Refresh the emails list
          queryClient.invalidateQueries({ queryKey: ["synced-emails"] });
        } else {
          toast({
            title: "Sync had errors",
            description: `${result.errors.length} errors occurred`,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Sync Failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    });
  };

  if (loadingConnections) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Synced Emails</CardTitle>
          <CardDescription>Loading connections...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Synced Emails</CardTitle>
          <CardDescription>
            No email accounts connected. Go to Settings → Integrations to
            connect Gmail or Outlook.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Synced Emails</CardTitle>
            <CardDescription>
              Last 10 emails from your connected account
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedConnection}
              onValueChange={setSelectedConnection}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.email_address || conn.provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSync}
              disabled={isPending || !selectedConnection}
              size="sm"
            >
              {isPending ? (
                <>
                  <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Icons.Refresh className="mr-2 h-4 w-4" />
                  Sync
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingEmails ? (
          <div className="flex items-center justify-center py-8">
            <Icons.Spinner className="h-6 w-6 animate-spin" />
          </div>
        ) : !emails || emails.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No emails synced yet.</p>
            <p className="text-sm">Click "Sync" to fetch your latest emails.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {emails.map((email) => (
              <div
                key={email.id}
                className="border rounded-lg p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">
                        {email.subject || "(No Subject)"}
                      </h4>
                      {!email.is_read && (
                        <Badge variant="default" className="h-5">
                          New
                        </Badge>
                      )}
                      {email.has_attachments && (
                        <Icons.Paperclip className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>From: {email.from_email}</span>
                      {email.received_at && (
                        <>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(email.received_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    {email.body_preview && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {email.body_preview}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
