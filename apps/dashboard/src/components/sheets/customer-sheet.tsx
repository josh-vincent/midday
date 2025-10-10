"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { useTRPC } from "@/trpc/client";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "@midday/ui/use-toast";

export function CustomerSheet() {
  const { createCustomer, customerId, setParams } = useCustomerParams();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    contact: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    website: "",
    taxNumber: "",
    note: "",
  });

  // Fetch customer data when editing
  const { data: customerData } = useQuery(
    trpc.customers.getById.queryOptions(
      { id: customerId || "" },
      {
        enabled: !!customerId,
      }
    )
  );

  // Populate form when customer data is loaded
  useEffect(() => {
    if (customerData) {
      setFormData({
        name: customerData.name || "",
        email: customerData.email || "",
        phone: customerData.phone || "",
        contact: customerData.contact || "",
        addressLine1: customerData.addressLine1 || "",
        addressLine2: customerData.addressLine2 || "",
        city: customerData.city || "",
        state: customerData.state || "",
        zipCode: customerData.postalCode || "",
        country: customerData.country || "",
        website: customerData.website || "",
        taxNumber: customerData.taxNumber || "",
        note: customerData.note || "",
      });
    }
  }, [customerData]);

  const upsertMutation = useMutation(
    trpc.customers.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' &&
                   queryKey[1] &&
                   queryKey[1].toString().startsWith('customers.');
          },
        });
        toast({
          title: customerId ? "Customer updated successfully" : "Customer created successfully",
        });
        setParams(null);
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          contact: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
          website: "",
          taxNumber: "",
          note: "",
        });
        setIsLoading(false);
      },
      onError: (error) => {
        toast({
          title: `Failed to ${customerId ? "update" : "create"} customer: ` + error.message,
        });
        setIsLoading(false);
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: "Customer name is required",
      });
      return;
    }
    setIsLoading(true);
    upsertMutation.mutate({
      ...(customerId && { id: customerId }),
      ...formData,
      zip: formData.zipCode,
      vatNumber: formData.taxNumber,
    });
  };

  const isOpen = createCustomer || !!customerId;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setParams(null);
          // Reset form when closing
          setFormData({
            name: "",
            email: "",
            phone: "",
            contact: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
            website: "",
            taxNumber: "",
            note: "",
          });
        }
      }}
    >
      <SheetContent className="sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{customerId ? "Edit" : "Create"} Customer</SheetTitle>
          <SheetDescription>
            {customerId ? "Update customer information" : "Add a new customer to your database"}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Acme Inc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="contact@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">contact person</Label>
            <Input
              id="contact"
              type="text"
              value={formData.contact}
              onChange={(e) =>
                setFormData({ ...formData, contact: e.target.value })
              }
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="0400 123 567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxNumber">Tax Number</Label>
            <Input
              id="taxNumber"
              value={formData.taxNumber}
              onChange={(e) =>
                setFormData({ ...formData, taxNumber: e.target.value })
              }
              placeholder="12345678"
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <h4 className="font-medium">Address</h4>
            
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine1: e.target.value })
                }
                placeholder="123 Main St"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine2: e.target.value })
                }
                placeholder="Suite 100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Melbourne"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="VIC"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                  placeholder="3000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  placeholder="Australia"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <textarea
              id="note"
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setParams(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading
                ? (customerId ? "Updating..." : "Creating...")
                : (customerId ? "Update Customer" : "Create Customer")
              }
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}