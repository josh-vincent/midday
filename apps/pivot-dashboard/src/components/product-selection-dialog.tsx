"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { useToast } from "@midday/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ProductSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductSelectionDialog({
  open,
  onOpenChange,
}: ProductSelectionDialogProps) {
  const trpc = useTRPC();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery(
    trpc.billing.getProducts.queryOptions()
  );

  const createCheckout = useMutation(
    trpc.billing.createCheckout.mutationOptions({
      onSuccess: (result) => {
        window.location.href = result.url;
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create checkout",
          variant: "destructive",
        });
      },
    })
  );

  const handleSelectProduct = (productId: string) => {
    createCheckout.mutate({
      productId: productId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Choose a Plan</DialogTitle>
          <DialogDescription>
            Select a plan to get started with billing
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid gap-4 py-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-4 hover:border-primary transition-colors"
              >
                <h3 className="font-semibold text-lg">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {product.description}
                  </p>
                )}
                <div className="mt-4">
                  <Button
                    onClick={() => handleSelectProduct(product.id)}
                    disabled={createCheckout.isPending}
                    className="w-full"
                  >
                    {createCheckout.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Select Plan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No products available at the moment
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
