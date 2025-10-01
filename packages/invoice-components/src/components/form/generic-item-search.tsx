"use client";

import { useTRPC } from "../../context/dependencies-context";
import {
  defaultItemSearchConfig,
  type ItemSearchConfig,
  type ItemSearchProps,
  type ItemWithMetadata,
  type ItemGroup,
  type ItemType,
} from "../../types/item-search";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@midday/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Badge } from "@midday/ui/badge";
import { Checkbox } from "@midday/ui/checkbox";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "./input";

export function GenericItemSearch({
  name,
  index,
  config: userConfig,
  searchFn,
  topItemsFn,
}: ItemSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<ItemWithMetadata[]>([]);
  const { setValue, watch } = useFormContext();
  const trpc = useTRPC();

  // Merge user config with defaults
  const config: ItemSearchConfig = {
    ...defaultItemSearchConfig,
    ...userConfig,
  };

  const currentValue = watch(name) || "";
  const currency = watch("template.currency");

  // Custom search query (when searchFn is provided)
  const { data: customSearchResults = [] } = useQuery({
    queryKey: ['customItemSearch', searchQuery, config.itemTypes],
    queryFn: () => searchFn ? searchFn(searchQuery, config.itemTypes) : Promise.resolve([]),
    enabled: searchQuery.length > 0 && open && !!searchFn,
    staleTime: 5 * 60 * 1000,
  });

  // Default product search query (when searchFn is NOT provided)
  const { data: searchResults = [] } = useQuery(
    trpc.invoiceProducts.search.queryOptions(
      {
        query: searchQuery,
        limit: config.maxResults,
      },
      {
        enabled: searchQuery.length > 0 && open && !searchFn,
        staleTime: 5 * 60 * 1000,
      }
    )
  );

  // Custom top items query (when topItemsFn is provided)
  const { data: customTopItems = [] } = useQuery({
    queryKey: ['customTopItems', config.itemTypes],
    queryFn: () => topItemsFn ? topItemsFn(config.itemTypes) : Promise.resolve([]),
    enabled: open && searchQuery.length === 0 && !!topItemsFn,
    staleTime: 5 * 60 * 1000,
  });

  // Default top products query (when topItemsFn is NOT provided)
  const { data: topProducts = [] } = useQuery(
    trpc.invoiceProducts.getTop.queryOptions(
      { limit: config.maxResults },
      {
        enabled: open && searchQuery.length === 0 && !topItemsFn,
        staleTime: 5 * 60 * 1000,
      }
    )
  );

  // Determine which data to display
  const displayItems = searchQuery.length > 0
    ? (searchFn ? customSearchResults : searchResults)
    : (topItemsFn ? customTopItems : topProducts);

  // Group items by type if configured
  const groupedItems = useMemo<ItemGroup[]>(() => {
    if (!config.groupByType) {
      return [{
        type: "product" as ItemType,
        label: "Items",
        items: displayItems as ItemWithMetadata[],
      }];
    }

    const groups = new Map<ItemType, ItemWithMetadata[]>();

    for (const item of displayItems as ItemWithMetadata[]) {
      const type = item.type || "product";
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(item);
    }

    return Array.from(groups.entries()).map(([type, items]) => ({
      type,
      label: config.typeLabels?.[type] || type,
      items,
    }));
  }, [displayItems, config.groupByType, config.typeLabels]);

  const upsertProductMutation = useMutation(
    trpc.invoiceProducts.upsert.mutationOptions()
  );

  const handleSelectItem = (item: ItemWithMetadata) => {
    if (config.multiSelect) {
      // Toggle selection for multi-select mode
      const isSelected = selectedItems.some(i => i.id === item.id);
      if (isSelected) {
        setSelectedItems(selectedItems.filter(i => i.id !== item.id));
      } else {
        setSelectedItems([...selectedItems, item]);
      }
    } else {
      // Single select mode - apply immediately
      applyItem(item);
      setOpen(false);
    }
  };

  const applyItem = (item: ItemWithMetadata) => {
    // Set the line item values from the selected item
    setValue(name, item.name);
    setValue(`lineItems.${index}.price`, item.price ?? 0);
    setValue(`lineItems.${index}.unit`, item.unit ?? "");

    // Upsert the product to update usage statistics (for products only)
    if (item.type === "product" || !item.type) {
      upsertProductMutation.mutate({
        name: item.name,
        description: item.description ?? undefined,
        price: item.price ?? undefined,
        currency: item.currency ?? currency,
        unit: item.unit ?? undefined,
      });
    }
  };

  const handleApplyMultiSelect = () => {
    if (selectedItems.length > 0) {
      // For multi-select, apply the first item to current line
      // and add additional lines for the rest
      selectedItems.forEach((item, idx) => {
        if (idx === 0) {
          applyItem(item);
        } else {
          // Trigger callback to add new line items
          config.onSelect?.([item]);
        }
      });

      setSelectedItems([]);
      setOpen(false);
    }
  };

  const renderItemContent = (item: ItemWithMetadata) => {
    if (config.renderItem) {
      return config.renderItem(item);
    }

    return (
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {config.multiSelect && (
              <Checkbox
                checked={selectedItems.some(i => i.id === item.id)}
                onCheckedChange={() => handleSelectItem(item)}
              />
            )}
            <span className="font-medium truncate">{item.name}</span>
            {item.type && config.groupByType && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {config.typeLabels?.[item.type] || item.type}
              </Badge>
            )}
          </div>
          {config.showPrice && item.price && item.currency && (
            <span className="text-sm text-muted-foreground shrink-0">
              {new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: item.currency,
              }).format(Number(item.price))}
              {item.unit && ` / ${item.unit}`}
            </span>
          )}
        </div>
        {config.showMetadata && item.description && (
          <span className="text-xs text-muted-foreground line-clamp-1">
            {item.description}
          </span>
        )}
        {config.showUsageCount && item.usageCount && item.usageCount > 0 && (
          <span className="text-xs text-muted-foreground">
            Used {item.usageCount} {item.usageCount === 1 ? 'time' : 'times'}
          </span>
        )}
      </div>
    );
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
            placeholder={config.placeholder}
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
            placeholder={config.searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery.length > 0 ? (
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">No items found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start typing to use this as a new item
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Start typing to search items
                </div>
              )}
            </CommandEmpty>

            {groupedItems.map((group) => (
              group.items.length > 0 && (
                <CommandGroup
                  key={group.type}
                  heading={searchQuery.length > 0 ? "Search Results" : group.label}
                >
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => !config.multiSelect && handleSelectItem(item)}
                      className="cursor-pointer"
                    >
                      {renderItemContent(item)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            ))}

            {config.multiSelect && selectedItems.length > 0 && (
              <div className="p-2 border-t">
                <button
                  type="button"
                  onClick={handleApplyMultiSelect}
                  className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                >
                  Add {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}
                </button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}