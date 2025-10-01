"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { Switch } from "@midday/ui/switch";
import { Label } from "@midday/ui/label";
import { useToast } from "@midday/ui/use-toast";
import { 
  RefreshCw, 
  Cloud, 
  Check, 
  X,
  AlertCircle,
  Clock,
  Mail,
  Zap,
  Activity
} from "lucide-react";
import { emailAPI, type MockEmailSync } from "@/lib/mock/email-mock";

export function EmailSync() {
  const [syncStatus, setSyncStatus] = useState<MockEmailSync[]>([]);
  const [autoSync, setAutoSync] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSyncStatus();
    
    if (autoSync) {
      const interval = setInterval(() => {
        updateSyncProgress();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [autoSync]);

  const loadSyncStatus = async () => {
    const data = await emailAPI.getSyncStatus();
    setSyncStatus(data);
  };

  const updateSyncProgress = () => {
    setSyncStatus(prev =>
      prev.map(sync => {
        if (sync.status === "syncing" && sync.progress < 100) {
          const newProgress = Math.min(100, sync.progress + Math.floor(Math.random() * 10 + 5));
          return {
            ...sync,
            progress: newProgress,
            messagesSynced: Math.floor((sync.messagesScanned * newProgress) / 100),
            status: newProgress === 100 ? "completed" : "syncing",
            lastSync: newProgress === 100 ? new Date() : sync.lastSync,
          };
        }
        return sync;
      })
    );
  };

  const handleManualSync = async (provider: "gmail" | "outlook") => {
    setSyncing(true);
    toast({
      title: "Starting Sync",
      description: `Syncing emails from ${provider}...`,
    });

    setSyncStatus(prev =>
      prev.map(sync =>
        sync.provider === provider
          ? { ...sync, status: "syncing", progress: 0 }
          : sync
      )
    );

    try {
      await emailAPI.syncEmails(provider);
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${provider} emails`,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: `Failed to sync ${provider} emails`,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: MockEmailSync["status"]) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-green-500" />;
      case "syncing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: MockEmailSync["status"]) => {
    const variants = {
      completed: "default" as const,
      syncing: "secondary" as const,
      failed: "destructive" as const,
      idle: "outline" as const,
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Settings</CardTitle>
          <CardDescription>
            Configure email synchronization preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-sync">Automatic Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync emails every 5 minutes
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={setAutoSync}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="webhook">Webhook Integration</Label>
              <p className="text-sm text-muted-foreground">
                Real-time email updates via webhooks
              </p>
            </div>
            <Switch id="webhook" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="attachments">Sync Attachments</Label>
              <p className="text-sm text-muted-foreground">
                Download and store email attachments
              </p>
            </div>
            <Switch id="attachments" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Provider Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {syncStatus.map((sync) => (
          <Card key={sync.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Cloud className="h-5 w-5" />
                  <CardTitle className="text-lg capitalize">
                    {sync.provider}
                  </CardTitle>
                </div>
                {getStatusBadge(sync.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              {sync.status === "syncing" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{sync.progress}%</span>
                  </div>
                  <Progress value={sync.progress} />
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Messages Scanned</p>
                  <p className="text-xl font-bold">{sync.messagesScanned}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Messages Synced</p>
                  <p className="text-xl font-bold">{sync.messagesSynced}</p>
                </div>
              </div>

              {sync.errors > 0 && (
                <div className="flex items-center space-x-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{sync.errors} errors encountered</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last sync: {formatTime(sync.lastSync)}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleManualSync(sync.provider)}
                  disabled={syncing || sync.status === "syncing"}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${sync.status === "syncing" ? "animate-spin" : ""}`} />
                  Sync Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>
            Recent synchronization events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: "2 minutes ago", provider: "gmail", status: "completed", messages: 15 },
              { time: "5 minutes ago", provider: "outlook", status: "completed", messages: 8 },
              { time: "10 minutes ago", provider: "gmail", status: "completed", messages: 23 },
              { time: "15 minutes ago", provider: "outlook", status: "failed", messages: 0, error: "Authentication failed" },
              { time: "20 minutes ago", provider: "gmail", status: "completed", messages: 42 },
            ].map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {event.status === "completed" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {event.provider} Sync {event.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.time} • {event.messages > 0 ? `${event.messages} new messages` : event.error}
                    </p>
                  </div>
                </div>
                {event.status === "completed" && (
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    {event.messages}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Status */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Real-time email notifications setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Gmail Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Pub/Sub topic: projects/midday/topics/gmail-push
                  </p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Outlook Webhooks</p>
                  <p className="text-sm text-muted-foreground">
                    Subscription: /me/messages
                  </p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}