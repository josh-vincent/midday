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
import type { MockCustomer } from "@/lib/mock/stripe-mock";

interface StripeCustomerSheetProps {
  customer?: MockCustomer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StripeCustomerSheet({
  customer,
  open,
  onOpenChange,
}: StripeCustomerSheetProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    status: customer?.status || "active",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name || !formData.email) {
        throw new Error("Name and email are required");
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: customer ? "Customer updated" : "Customer created",
        description: `Successfully ${customer ? 'updated' : 'created'} customer ${formData.name}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save customer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {customer ? "Edit Customer" : "Create Customer"}
          </SheetTitle>
          <SheetDescription>
            {customer 
              ? `Manage customer information for ${customer.name}`
              : "Add a new customer to your Stripe account"
            }
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {customer && (
            <div className="space-y-4 pb-4 border-b">
              <div className="space-y-2">
                <Label>Customer ID</Label>
                <div className="text-sm font-mono bg-muted px-2 py-1 rounded">{customer.id}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <Badge variant={customer.status === "active" ? "default" : "outline"}>
                    {customer.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="text-sm">{customer.created.toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subscriptions</Label>
                  <div className="text-sm">
                    {customer.subscriptions} {customer.subscriptions === 1 ? 'subscription' : 'subscriptions'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total Spent</Label>
                  <div className="text-sm font-mono">${customer.totalSpent.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Acme Corporation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="billing@acme.com"
              required
            />
          </div>

          {customer && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {customer && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Create new subscription
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Send invoice
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Open billing portal
                </Button>
              </div>
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
                ? (customer ? "Updating..." : "Creating...") 
                : (customer ? "Update Customer" : "Create Customer")
              }
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}