"use client";

import { BillingOrders } from "@/components/billing-orders";
import { BillingSubscriptions } from "@/components/billing-subscriptions";
import { ManageBillingButton } from "@/components/manage-billing-button";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@midday/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const customerSessionToken = searchParams.get("customer_session_token");

    if (customerSessionToken) {
      // Customer returned from successful checkout
      toast({
        title: "Payment successful",
        description: "Your subscription is now active",
      });

      // Invalidate queries to refresh billing data
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            queryKey[0] === "trpc" &&
            queryKey[1] &&
            queryKey[1].toString().startsWith("billing.")
          );
        },
      });

      // Clean up URL
      router.replace("/settings/billing");
    }
  }, [searchParams, toast, queryClient, router]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-medium">Billing & Invoices</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View your billing history and download invoices
          </p>
        </div>
        <ManageBillingButton />
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium mb-4">Active Subscriptions</h3>
          <BillingSubscriptions />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-4">Order History</h3>
          <BillingOrders />
        </div>
      </div>
    </div>
  );
}
