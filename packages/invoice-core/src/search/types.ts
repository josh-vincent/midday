/**
 * Search Provider Types for Extensible Line Item Search
 */

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata: LineItemMetadata;
  displayData?: Record<string, any>;
  score?: number;
}

export interface LineItemMetadata {
  // Core fields
  name: string;
  quantity?: number;
  price?: number;
  unit?: string;
  
  // Reference fields
  referenceId?: string;
  referenceType?: string;
  
  // Extended fields (optional)
  [key: string]: any;
}

export interface SearchProvider {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  
  /**
   * Search for items based on query
   */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  
  /**
   * Transform search result to line item
   */
  transformToLineItem(result: SearchResult): LineItemMetadata;
  
  /**
   * Optional: Validate if provider is available
   */
  isAvailable?(): Promise<boolean>;
  
  /**
   * Optional: Custom result component
   */
  ResultComponent?: React.ComponentType<{ result: SearchResult; onSelect: (result: SearchResult) => void }>;
}

export interface SearchOptions {
  customerId?: string;
  limit?: number;
  filters?: Record<string, any>;
  includeMetadata?: boolean;
}

export type SearchProviderConfig = {
  providers: SearchProvider[];
  defaultProvider?: string;
  enableMultiSearch?: boolean;
  searchDebounceMs?: number;
};