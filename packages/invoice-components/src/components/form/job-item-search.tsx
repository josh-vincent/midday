"use client";

import { useTRPC } from "../../context/dependencies-context";
import { GenericItemSearch } from "./generic-item-search";
import type { ItemSearchProps, ItemWithMetadata, ItemType } from "../../types/item-search";

/**
 * Job-specific item search component that searches both jobs and products
 */
export function JobItemSearch({ name, index }: Omit<ItemSearchProps, 'config'>) {
  const trpc = useTRPC();

  // Custom search function that queries both jobs and products
  const searchFn = async (query: string, types: ItemType[]): Promise<ItemWithMetadata[]> => {
    const results: ItemWithMetadata[] = [];
    const promises: Promise<void>[] = [];

    // Search jobs if included in types
    if (types.includes("job")) {
      const jobPromise = fetch(`/api/trpc/job.list?input=${encodeURIComponent(JSON.stringify({ q: query, limit: 10 }))}`)
        .then(res => res.json())
        .then((response) => {
          const jobsData = response?.result?.data;
          if (jobsData?.data) {
            const jobItems: ItemWithMetadata[] = jobsData.data.map((job: any) => ({
              id: job.id,
              name: job.jobNumber || job.companyName || "Untitled Job",
              description: `${job.companyName || ''} - ${job.addressSite || ''}`.trim() || undefined,
              price: job.totalAmount || job.estimatedCost || 0,
              currency: job.currency || "USD",
              unit: job.unit || undefined,
              type: "job" as const,
            }));
            results.push(...jobItems);
          }
        })
        .catch((error) => {
          console.error("Error searching jobs:", error);
        });
      promises.push(jobPromise);
    }

    // Search products if included in types
    if (types.includes("product")) {
      const productPromise = fetch(`/api/trpc/invoiceProducts.search?input=${encodeURIComponent(JSON.stringify({ query, limit: 10 }))}`)
        .then(res => res.json())
        .then((response) => {
          const productsData = response?.result?.data;
          if (productsData && Array.isArray(productsData)) {
            const productItems: ItemWithMetadata[] = productsData.map((product: any) => ({
              id: product.id,
              name: product.name,
              description: product.description || undefined,
              price: product.price,
              currency: product.currency,
              unit: product.unit || undefined,
              type: "product" as const,
              usageCount: product.usageCount,
            }));
            results.push(...productItems);
          }
        })
        .catch((error) => {
          console.error("Error searching products:", error);
        });
      promises.push(productPromise);
    }

    await Promise.all(promises);
    return results;
  };

  // Custom top items function for initial display
  const topItemsFn = async (types: ItemType[]): Promise<ItemWithMetadata[]> => {
    const results: ItemWithMetadata[] = [];
    const promises: Promise<void>[] = [];

    // Get recent pending jobs
    if (types.includes("job")) {
      const jobPromise = fetch(`/api/trpc/job.list?input=${encodeURIComponent(JSON.stringify({ limit: 5 }))}`)
        .then(res => res.json())
        .then((response) => {
          const jobsData = response?.result?.data;
          if (jobsData?.data) {
            const jobItems: ItemWithMetadata[] = jobsData.data.map((job: any) => ({
              id: job.id,
              name: job.jobNumber || job.companyName || "Untitled Job",
              description: `${job.companyName || ''} - ${job.addressSite || ''}`.trim() || undefined,
              price: job.totalAmount || job.estimatedCost || 0,
              currency: job.currency || "USD",
              unit: job.unit || undefined,
              type: "job" as const,
            }));
            results.push(...jobItems);
          }
        })
        .catch((error) => {
          console.error("Error fetching top jobs:", error);
        });
      promises.push(jobPromise);
    }

    // Get top products
    if (types.includes("product")) {
      const productPromise = fetch(`/api/trpc/invoiceProducts.getTop?input=${encodeURIComponent(JSON.stringify({ limit: 5 }))}`)
        .then(res => res.json())
        .then((response) => {
          const productsData = response?.result?.data;
          if (productsData && Array.isArray(productsData)) {
            const productItems: ItemWithMetadata[] = productsData.map((product: any) => ({
              id: product.id,
              name: product.name,
              description: product.description || undefined,
              price: product.price,
              currency: product.currency,
              unit: product.unit || undefined,
              type: "product" as const,
              usageCount: product.usageCount,
            }));
            results.push(...productItems);
          }
        })
        .catch((error) => {
          console.error("Error fetching top products:", error);
        });
      promises.push(productPromise);
    }

    await Promise.all(promises);
    return results;
  };

  return (
    <GenericItemSearch
      name={name}
      index={index}
      searchFn={searchFn}
      topItemsFn={topItemsFn}
      config={{
        itemTypes: ["job", "product"],
        groupByType: true,
        showMetadata: true,
        showPrice: true,
        showUsageCount: false,
        placeholder: "Search jobs or products...",
        searchPlaceholder: "Search jobs, products...",
        typeLabels: {
          job: "Active Jobs",
          product: "Products",
        },
      }}
    />
  );
}

/**
 * Example: Multi-type item search with grouping
 *
 * Searches across products, jobs, and quotes with grouping
 */
export function MultiItemSearch({ name, index }: Omit<ItemSearchProps, 'config'>) {
  return (
    <GenericItemSearch
      name={name}
      index={index}
      config={{
        itemTypes: ["product", "job", "quote", "service"],
        groupByType: true,
        showMetadata: true,
        showPrice: true,
        placeholder: "Search items...",
        searchPlaceholder: "Search products, jobs, quotes, services...",
        typeLabels: {
          product: "Products & Services",
          job: "Jobs",
          quote: "Quotes",
          service: "Services",
        },
      }}
    />
  );
}

/**
 * Example: Multi-select item search
 *
 * Allows selecting multiple items at once
 */
export function MultiSelectItemSearch({
  name,
  index,
  onItemsSelected,
}: Omit<ItemSearchProps, 'config'> & {
  onItemsSelected?: (items: ItemWithMetadata[]) => void;
}) {
  return (
    <GenericItemSearch
      name={name}
      index={index}
      config={{
        itemTypes: ["product", "job"],
        groupByType: true,
        multiSelect: true,
        showMetadata: true,
        showPrice: true,
        placeholder: "Select multiple items...",
        searchPlaceholder: "Search and select multiple items...",
        onSelect: onItemsSelected,
      }}
    />
  );
}