"use client";

import { useState, useCallback, useMemo } from 'react';
import type { 
  SearchProvider, 
  SearchResult, 
  SearchOptions, 
  SearchProviderConfig,
  LineItemMetadata 
} from './types';

export interface UseLineItemSearchOptions {
  providers: SearchProvider[];
  defaultProvider?: string;
  enableMultiSearch?: boolean;
  searchDebounceMs?: number;
  defaultOptions?: SearchOptions;
}

export interface UseLineItemSearchReturn {
  search: (query: string, providerId?: string) => Promise<SearchResult[]>;
  searchAll: (query: string) => Promise<Map<string, SearchResult[]>>;
  transformToLineItem: (result: SearchResult, providerId: string) => LineItemMetadata;
  isSearching: boolean;
  results: SearchResult[];
  resultsByProvider: Map<string, SearchResult[]>;
  activeProvider: string | null;
  setActiveProvider: (providerId: string) => void;
  availableProviders: SearchProvider[];
}

export function useLineItemSearch({
  providers,
  defaultProvider,
  enableMultiSearch = false,
  searchDebounceMs = 300,
  defaultOptions = {},
}: UseLineItemSearchOptions): UseLineItemSearchReturn {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [resultsByProvider, setResultsByProvider] = useState<Map<string, SearchResult[]>>(new Map());
  const [activeProvider, setActiveProvider] = useState<string | null>(defaultProvider || providers[0]?.id || null);
  
  const providerMap = useMemo(() => {
    return new Map(providers.map(p => [p.id, p]));
  }, [providers]);
  
  const search = useCallback(async (
    query: string, 
    providerId?: string
  ): Promise<SearchResult[]> => {
    const targetProviderId = providerId || activeProvider;
    if (!targetProviderId) return [];
    
    const provider = providerMap.get(targetProviderId);
    if (!provider) return [];
    
    setIsSearching(true);
    try {
      const searchResults = await provider.search(query, defaultOptions);
      setResults(searchResults);
      return searchResults;
    } catch (error) {
      console.error(`Search failed for provider ${targetProviderId}:`, error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [activeProvider, providerMap, defaultOptions]);
  
  const searchAll = useCallback(async (
    query: string
  ): Promise<Map<string, SearchResult[]>> => {
    if (!enableMultiSearch) {
      const singleResults = await search(query);
      return new Map([[activeProvider!, singleResults]]);
    }
    
    setIsSearching(true);
    const allResults = new Map<string, SearchResult[]>();
    
    try {
      const searchPromises = Array.from(providerMap.entries()).map(async ([id, provider]) => {
        try {
          const results = await provider.search(query, defaultOptions);
          return { id, results };
        } catch (error) {
          console.error(`Search failed for provider ${id}:`, error);
          return { id, results: [] };
        }
      });
      
      const settledResults = await Promise.all(searchPromises);
      
      settledResults.forEach(({ id, results }) => {
        allResults.set(id, results);
      });
      
      setResultsByProvider(allResults);
      
      // Flatten all results for the main results array
      const flatResults = Array.from(allResults.values()).flat();
      setResults(flatResults);
      
      return allResults;
    } finally {
      setIsSearching(false);
    }
  }, [enableMultiSearch, search, providerMap, defaultOptions, activeProvider]);
  
  const transformToLineItem = useCallback((
    result: SearchResult,
    providerId: string
  ): LineItemMetadata => {
    const provider = providerMap.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    return provider.transformToLineItem(result);
  }, [providerMap]);
  
  return {
    search,
    searchAll,
    transformToLineItem,
    isSearching,
    results,
    resultsByProvider,
    activeProvider,
    setActiveProvider,
    availableProviders: providers,
  };
}