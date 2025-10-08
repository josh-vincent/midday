"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Skeleton } from "@midday/ui/skeleton";

export function BillingSubscriptions() {
  const trpc = useTRPC();

  const { data: subscriptions, isLoading } = useQuery(
    trpc.billing.getSubscriptions.queryOptions()
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <div className="space-y-2">
          <p className="text-sm font-medium">No active subscriptions</p>
          <p className="text-sm text-muted-foreground">
            Subscribe to a plan to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((subscription) => (
        <div
          key={subscription.id}
          className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <p className="font-medium">{subscription.product.name}</p>
                {subscription.status === "active" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : subscription.status === "canceled" ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-600" />
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: subscription.price.currency,
                  }).format(subscription.price.amount / 100)}
                  {subscription.price.recurringInterval &&
                    ` / ${subscription.price.recurringInterval}`}
                </span>
                <span>•</span>
                <span>
                  Current period:{" "}
                  {format(
                    new Date(subscription.currentPeriodStart),
                    "MMM d, yyyy"
                  )}{" "}
                  -{" "}
                  {format(
                    new Date(subscription.currentPeriodEnd),
                    "MMM d, yyyy"
                  )}
                </span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <p className="text-xs text-yellow-600">
                  Will cancel at end of period
                </p>
              )}
            </div>
            <div className="text-right">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  subscription.status === "active"
                    ? "bg-green-100 text-green-700"
                    : subscription.status === "canceled"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {subscription.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
