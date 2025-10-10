"use client";

import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
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
import { mockCustomers, mockProducts } from "@/lib/mock/stripe-mock";

interface CreateSubscriptionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSubscriptionSheet({
  open,
  onOpenChange,
}: CreateSubscriptionSheetProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    productId: "",
    priceId: "",
    trialDays: 0,
  });

  const selectedProduct = mockProducts.find(p => p.id === formData.productId);
  const selectedPrice = selectedProduct?.prices.find(p => p.id === formData.priceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.customerId || !formData.productId || !formData.priceId) {
        throw new Error("Please fill in all required fields");
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const customer = mockCustomers.find(c => c.id === formData.customerId);
      const product = mockProducts.find(p => p.id === formData.productId);
      
      toast({
        title: "Subscription created",
        description: `Successfully created ${product?.name} subscription for ${customer?.name}`,
      });
      
      onOpenChange(false);
      
      // Reset form
      setFormData({
        customerId: "",
        productId: "",
        priceId: "",
        trialDays: 0,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subscription",
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
          <SheetTitle>Create New Subscription</SheetTitle>
          <SheetDescription>
            Create a new subscription for an existing customer
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select
              value={formData.customerId}
              onValueChange={(value) =>
                setFormData({ ...formData, customerId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {mockCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex flex-col items-start">
                      <span>{customer.name}</span>
                      <span className="text-xs text-muted-foreground">{customer.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Product *</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) =>
                setFormData({ ...formData, productId: value, priceId: "" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {mockProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex flex-col items-start">
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">{product.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Select
                value={formData.priceId}
                onValueChange={(value) =>
                  setFormData({ ...formData, priceId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a price" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct.prices.map((price) => (
                    <SelectItem key={price.id} value={price.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          ${price.amount} / {price.interval}
                          {price.intervalCount && price.intervalCount > 1 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (every {price.intervalCount} {price.interval}s)
                            </span>
                          )}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="trialDays">Trial Days</Label>
            <Input
              id="trialDays"
              type="number"
              min="0"
              max="365"
              value={formData.trialDays}
              onChange={(e) =>
                setFormData({ ...formData, trialDays: parseInt(e.target.value) || 0 })
              }
              placeholder="0"
            />
            <div className="text-xs text-muted-foreground">
              Number of trial days before billing begins (optional)
            </div>
          </div>

          {selectedPrice && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Subscription Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Product:</span>
                  <span>{selectedProduct?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span>${selectedPrice.amount} / {selectedPrice.interval}</span>
                </div>
                {formData.trialDays > 0 && (
                  <div className="flex justify-between">
                    <span>Trial:</span>
                    <span>{formData.trialDays} days</span>
                  </div>
                )}
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
              {isLoading ? "Creating..." : "Create Subscription"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}