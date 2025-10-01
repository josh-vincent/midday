"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useToast } from "@midday/ui/use-toast";
import { 
  Webhook, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Activity,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { stripeAPI, type MockWebhookEvent } from "@/lib/mock/stripe-mock";

export function WebhookEvents() {
  const [events, setEvents] = useState<MockWebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadEvents(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadEvents = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await stripeAPI.getWebhookEvents();
      setEvents(data);
    } catch (error) {
      if (!silent) {
        toast({
          title: "Error loading events",
          description: "Failed to fetch webhook events",
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRetry = (eventId: string) => {
    toast({
      title: "Retrying Event",
      description: `Reprocessing event ${eventId}...`,
    });
    
    // Simulate retry
    setEvents(prev =>
      prev.map(evt =>
        evt.id === eventId
          ? { ...evt, status: "processing" as const }
          : evt
      )
    );

    setTimeout(() => {
      setEvents(prev =>
        prev.map(evt =>
          evt.id === eventId
            ? { ...evt, status: "completed" as const }
            : evt
        )
      );
      toast({
        title: "Event Processed",
        description: `Event ${eventId} completed successfully`,
      });
    }, 2000);
  };

  const getEventIcon = (type: string) => {
    if (type.includes("customer")) return "👤";
    if (type.includes("subscription")) return "📊";
    if (type.includes("invoice")) return "📄";
    if (type.includes("payment")) return "💳";
    if (type.includes("checkout")) return "🛒";
    return "📨";
  };

  const getStatusBadge = (status: MockWebhookEvent["status"]) => {
    const config = {
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      processing: { variant: "default" as const, icon: Activity, color: "text-blue-600" },
      completed: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      failed: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
    };

    const { variant, icon: Icon, color } = config[status];

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status}
      </Badge>
    );
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const stats = {
    total: events.length,
    completed: events.filter(e => e.status === "completed").length,
    processing: events.filter(e => e.status === "processing").length,
    failed: events.filter(e => e.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Stream */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Webhook className="h-5 w-5" />
                <span>Webhook Event Stream</span>
              </CardTitle>
              <CardDescription>
                Real-time webhook processing status
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
                {autoRefresh ? "Live" : "Paused"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadEvents()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">{getEventIcon(event.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{event.type}</p>
                        {getStatusBadge(event.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.id} • {formatTime(event.created)}
                      </p>
                      {event.data?.object && (
                        <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/30 rounded">
                          <code className="font-mono">
                            {JSON.stringify(event.data.object, null, 2).substring(0, 100)}...
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {event.status === "failed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(event.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                    {event.status === "processing" && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Activity className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {stats.failed > 0 && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{stats.failed} Failed Events</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    These events failed processing and need manual review
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Review
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}