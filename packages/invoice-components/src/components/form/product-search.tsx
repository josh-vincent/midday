"use client";

import { useTRPC } from "../../context/dependencies-context";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@midday/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "./input";

type ProductSearchProps = {
  name: string;
  index: number;
};

export function ProductSearch({ name, index }: ProductSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { setValue, watch } = useFormContext();
  const trpc = useTRPC();

  const currentValue = watch(name) || "";
  const currency = watch("template.currency");

  // Search for products when user types
  const { data: searchResults = [] } = useQuery(
    trpc.invoiceProducts.search.queryOptions(
      {
        query: searchQuery,
        limit: 10,
      },
      {
        enabled: searchQuery.length > 0 && open,
        staleTime: 5 * 60 * 1000, // 5 minutes
      }
    )
  );

  // Get top products for initial display
  const { data: topProducts = [] } = useQuery(
    trpc.invoiceProducts.getTop.queryOptions(
      { limit: 10 },
      {
        enabled: open && searchQuery.length === 0,
        staleTime: 5 * 60 * 1000,
      }
    )
  );

  const displayProducts = searchQuery.length > 0 ? searchResults : topProducts;

  const upsertProductMutation = useMutation(
    trpc.invoiceProducts.upsert.mutationOptions()
  );

  const handleSelectProduct = (product: typeof displayProducts[number]) => {
    // Set the line item values from the selected product
    setValue(name, product.name);
    setValue(`lineItems.${index}.price`, product.price ?? 0);
    setValue(`lineItems.${index}.unit`, product.unit ?? "");

    // Upsert the product to update usage statistics
    upsertProductMutation.mutate({
      name: product.name,
      description: product.description ?? undefined,
      price: product.price ?? undefined,
      currency: product.currency ?? currency,
      unit: product.unit ?? undefined,
    });

    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            name={name}
            value={currentValue}
            onChange={(e) => {
              setValue(name, e.target.value);
              setSearchQuery(e.target.value);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Product or service"
            className="w-full"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search products..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery.length > 0 ? (
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">No products found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start typing to use this as a new product
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Start typing to search products
                </div>
              )}
            </CommandEmpty>
            {displayProducts.length > 0 && (
              <CommandGroup heading={searchQuery.length > 0 ? "Search Results" : "Frequently Used"}>
                {displayProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.name}
                    onSelect={() => handleSelectProduct(product)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{product.name}</span>
                        {product.price && product.currency && (
                          <span className="text-sm text-muted-foreground">
                            {new Intl.NumberFormat(undefined, {
                              style: 'currency',
                              currency: product.currency,
                            }).format(Number(product.price))}
                            {product.unit && ` / ${product.unit}`}
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {product.description}
                        </span>
                      )}
                      {product.usageCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Used {product.usageCount} {product.usageCount === 1 ? 'time' : 'times'}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}