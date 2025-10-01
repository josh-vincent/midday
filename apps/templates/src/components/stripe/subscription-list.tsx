"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Skeleton } from "@midday/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { useToast } from "@midday/ui/use-toast";
import { MoreVertical, Pause, Play, XCircle, RefreshCw } from "lucide-react";
import { stripeAPI, type MockSubscription } from "@/lib/mock/stripe-mock";

export function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState<MockSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await stripeAPI.getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      toast({
        title: "Error loading subscriptions",
        description: "Failed to fetch subscription data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, subscription: MockSubscription) => {
    toast({
      title: `${action} Subscription`,
      description: `${action} action triggered for ${subscription.customerName}`,
    });

    // Simulate state change
    if (action === "Cancel") {
      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscription.id
            ? { ...sub, status: "canceled" as const, cancelAtPeriodEnd: true }
            : sub
        )
      );
    } else if (action === "Pause") {
      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscription.id
            ? { ...sub, status: "past_due" as const }
            : sub
        )
      );
    } else if (action === "Resume") {
      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscription.id
            ? { ...sub, status: "active" as const }
            : sub
        )
      );
    }
  };

  const getStatusBadge = (status: MockSubscription["status"]) => {
    const variants: Record<MockSubscription["status"], "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trialing: "secondary",
      past_due: "destructive",
      canceled: "outline",
      incomplete: "destructive",
    };

    return (
      <Badge variant={variants[status]}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>
              Manage customer subscriptions and billing cycles
            </CardDescription>
          </div>
          <Button onClick={loadSubscriptions} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-medium">
                    {subscription.customerName}
                  </TableCell>
                  <TableCell>{subscription.product}</TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>
                    {formatCurrency(subscription.price)}/{subscription.interval}
                  </TableCell>
                  <TableCell>
                    {subscription.cancelAtPeriodEnd ? (
                      <span className="text-muted-foreground">Canceling</span>
                    ) : (
                      formatDate(subscription.currentPeriodEnd)
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {subscription.status === "active" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleAction("Pause", subscription)}
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Pause Subscription
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction("Cancel", subscription)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Subscription
                            </DropdownMenuItem>
                          </>
                        )}
                        {subscription.status === "past_due" && (
                          <DropdownMenuItem
                            onClick={() => handleAction("Resume", subscription)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Resume Subscription
                          </DropdownMenuItem>
                        )}
                        {subscription.status === "canceled" && (
                          <DropdownMenuItem
                            onClick={() => handleAction("Reactivate", subscription)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reactivate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}