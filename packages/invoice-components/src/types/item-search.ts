/**
 * Generic item search types for invoice line items
 * Supports products, quotes, jobs, and other item types
 */

export type ItemType = "product" | "quote" | "job" | "service" | "custom";

export interface BaseItem {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
  type?: ItemType;
}

export interface ItemWithMetadata extends BaseItem {
  usageCount?: number;
  lastUsed?: Date | string | null;
  [key: string]: any; // Allow additional metadata
}

export interface ItemGroup {
  type: ItemType;
  label: string;
  items: ItemWithMetadata[];
}

export interface ItemSearchConfig {
  // Item types to include in search
  itemTypes: ItemType[];

  // Whether to group results by type
  groupByType?: boolean;

  // Whether to allow multi-select
  multiSelect?: boolean;

  // Custom labels for item types
  typeLabels?: Partial<Record<ItemType, string>>;

  // Placeholder text
  placeholder?: string;

  // Search input placeholder
  searchPlaceholder?: string;

  // Whether to show item metadata (usage count, price, etc.)
  showMetadata?: boolean;

  // Whether to show price in results
  showPrice?: boolean;

  // Whether to show usage count
  showUsageCount?: boolean;

  // Custom render function for item display
  renderItem?: (item: ItemWithMetadata) => React.ReactNode;

  // Callback when items are selected
  onSelect?: (items: ItemWithMetadata[]) => void;

  // Maximum items to display
  maxResults?: number;
}

export interface ItemSearchProps {
  name: string;
  index: number;
  config?: Partial<ItemSearchConfig>;

  // Optional custom query functions
  searchFn?: (query: string, types: ItemType[]) => Promise<ItemWithMetadata[]>;
  topItemsFn?: (types: ItemType[]) => Promise<ItemWithMetadata[]>;
}

// Default configuration
export const defaultItemSearchConfig: ItemSearchConfig = {
  itemTypes: ["product"],
  groupByType: false,
  multiSelect: false,
  typeLabels: {
    product: "Products",
    quote: "Quotes",
    job: "Jobs",
    service: "Services",
    custom: "Custom Items",
  },
  placeholder: "Search items...",
  searchPlaceholder: "Search products, quotes, jobs...",
  showMetadata: true,
  showPrice: true,
  showUsageCount: true,
  maxResults: 10,
};