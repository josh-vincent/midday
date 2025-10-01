"use client";

import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Badge } from "@midday/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useToast } from "@midday/ui/use-toast";
import { useState } from "react";
import type { MockSubscription } from "@/lib/mock/stripe-mock";

interface SubscriptionSheetProps {
  subscription?: MockSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionSheet({
  subscription,
  open,
  onOpenChange,
}: SubscriptionSheetProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    product: subscription?.product || "",
    price: subscription?.price || 0,
    interval: subscription?.interval || "monthly",
    status: subscription?.status || "active",
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: subscription ? "Subscription updated" : "Subscription created",
        description: `Successfully ${subscription ? 'updated' : 'created'} subscription for ${subscription?.customerName || 'customer'}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trialing: "secondary",
      past_due: "destructive",
      canceled: "outline",
      incomplete: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {subscription ? "Edit Subscription" : "Create Subscription"}
          </SheetTitle>
          <SheetDescription>
            {subscription 
              ? `Manage subscription for ${subscription.customerName}`
              : "Create a new subscription for a customer"
            }
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {subscription && (
            <div className="space-y-4 pb-4 border-b">
              <div className="space-y-2">
                <Label>Customer</Label>
                <div className="text-sm font-medium">{subscription.customerName}</div>
                <div className="text-xs text-muted-foreground font-mono">{subscription.id}</div>
              </div>

              <div className="space-y-2">
                <Label>Current Status</Label>
                <div>{getStatusBadge(subscription.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Period End</Label>
                  <div className="text-sm">{subscription.currentPeriodEnd.toLocaleDateString()}</div>
                </div>
                {subscription.trialEnd && (
                  <div className="space-y-2">
                    <Label>Trial End</Label>
                    <div className="text-sm text-amber-600">{subscription.trialEnd.toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Input
              id="product"
              value={formData.product}
              onChange={(e) =>
                setFormData({ ...formData, product: e.target.value })
              }
              placeholder="Pro Plan"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                placeholder="199"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Interval</Label>
              <Select
                value={formData.interval}
                onValueChange={(value: "monthly" | "yearly") =>
                  setFormData({ ...formData, interval: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {subscription && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading 
                ? (subscription ? "Updating..." : "Creating...") 
                : (subscription ? "Update Subscription" : "Create Subscription")
              }
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}