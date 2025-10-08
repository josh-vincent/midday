"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@midday/ui/button";
import { Skeleton } from "@midday/ui/skeleton";
import { useToast } from "@midday/ui/use-toast";

export function BillingOrders() {
  const trpc = useTRPC();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery(
    trpc.billing.orders.queryOptions({
      pageSize: 50,
    })
  );

  const downloadInvoice = useMutation(
    trpc.billing.getInvoice.mutationOptions({
      onSuccess: (result) => {
        if (result.status === "ready" && result.downloadUrl) {
          // Open in new tab
          window.open(result.downloadUrl, "_blank");
          toast({
            title: "Invoice downloaded",
            description: "Your invoice has been opened in a new tab",
          });
        } else if (result.status === "generating") {
          toast({
            title: "Generating invoice",
            description: "Your invoice is being generated. Please try again in a moment.",
          });
        }
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    })
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-10 w-[100px]" />
          </div>
        ))}
      </div>
    );
  }

  const orders = data?.data || [];

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <div className="space-y-2">
          <p className="text-sm font-medium">No billing history</p>
          <p className="text-sm text-muted-foreground">
            Your billing history will appear here once you make a purchase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <p className="font-medium">{order.product.name}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  order.status === "succeeded"
                    ? "bg-green-100 text-green-700"
                    : order.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: order.amount.currency,
                }).format(order.amount.amount / 100)}
              </span>
              <span>•</span>
              <span>{format(new Date(order.createdAt), "MMM d, yyyy")}</span>
            </div>
          </div>

          {order.invoiceId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadInvoice.mutate(order.id)}
              disabled={downloadInvoice.isPending}
            >
              {downloadInvoice.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Invoice
                </>
              )}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
