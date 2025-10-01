"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@midday/ui/cn';
import { formatAmount } from '@midday/utils/format';
import type { SearchProvider, SearchResult, LineItemMetadata } from '../types';

interface UnifiedSearchProps {
  providers: SearchProvider[];
  onSelect: (item: LineItemMetadata, result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  currency?: string;
  locale?: string;
  customerId?: string;
  enableMultiSearch?: boolean;
  searchDebounceMs?: number;
  renderInput?: (props: any) => React.ReactNode;
}

export function UnifiedSearch({
  providers,
  onSelect,
  placeholder = "Search for items...",
  className,
  currency = 'USD',
  locale = 'en-US',
  customerId,
  enableMultiSearch = false,
  searchDebounceMs = 300,
  renderInput,
}: UnifiedSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Map<string, SearchResult[]>>(new Map());
  const [activeProvider, setActiveProvider] = useState(providers[0]?.id);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);
  
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length === 0) {
      setResults(new Map());
      setIsOpen(false);
      return;
    }
    
    setIsSearching(true);
    setIsOpen(true);
    
    try {
      if (enableMultiSearch) {
        // Search all providers
        const allResults = new Map<string, SearchResult[]>();
        const promises = providers.map(async (provider) => {
          try {
            const providerResults = await provider.search(searchQuery, { customerId });
            return { id: provider.id, results: providerResults };
          } catch (error) {
            console.error(`Search failed for ${provider.name}:`, error);
            return { id: provider.id, results: [] };
          }
        });
        
        const settled = await Promise.all(promises);
        settled.forEach(({ id, results }) => {
          allResults.set(id, results);
        });
        
        setResults(allResults);
      } else {
        // Search only active provider
        const provider = providers.find(p => p.id === activeProvider);
        if (provider) {
          const providerResults = await provider.search(searchQuery, { customerId });
          setResults(new Map([[provider.id, providerResults]]));
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [providers, activeProvider, customerId, enableMultiSearch]);
  
  const handleInputChange = (value: string) => {
    setQuery(value);
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, searchDebounceMs);
  };
  
  const handleSelect = (result: SearchResult, providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider) {
      const lineItem = provider.transformToLineItem(result);
      onSelect(lineItem, result);
      setQuery('');
      setIsOpen(false);
      setResults(new Map());
    }
  };
  
  const inputProps = {
    value: query,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value),
    onFocus: () => query.length > 0 && setIsOpen(true),
    placeholder,
    className: cn(
      "w-full px-3 py-2 text-sm border rounded-md",
      "focus:outline-none focus:ring-2 focus:ring-primary",
      className
    ),
  };
  
  return (
    <div className="relative" ref={containerRef}>
      {renderInput ? renderInput(inputProps) : <input {...inputProps} />}
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-auto rounded-md border bg-popover shadow-lg">
          {enableMultiSearch && providers.length > 1 && (
            <div className="sticky top-0 z-10 flex gap-1 border-b bg-popover p-2">
              {providers.map(provider => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setActiveProvider(provider.id)}
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                    activeProvider === provider.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                >
                  {provider.icon && <provider.icon className="mr-1 h-3 w-3 inline" />}
                  {provider.name}
                </button>
              ))}
            </div>
          )}
          
          <div className="p-1">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.size === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              Array.from(results.entries()).map(([providerId, providerResults]) => {
                const provider = providers.find(p => p.id === providerId);
                if (!provider || providerResults.length === 0) return null;
                
                return (
                  <div key={providerId}>
                    {enableMultiSearch && (
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        {provider.name}
                      </div>
                    )}
                    
                    {providerResults.map(result => {
                      // Use custom result component if provided
                      if (provider.ResultComponent) {
                        return (
                          <provider.ResultComponent
                            key={result.id}
                            result={result}
                            onSelect={(r) => handleSelect(r, providerId)}
                          />
                        );
                      }
                      
                      // Default result rendering
                      return (
                        <button
                          key={result.id}
                          type="button"
                          className="w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent transition-colors"
                          onClick={() => handleSelect(result, providerId)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium">{result.title}</div>
                              {result.subtitle && (
                                <div className="text-xs text-muted-foreground">
                                  {result.subtitle}
                                </div>
                              )}
                              {result.description && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {result.description}
                                </div>
                              )}
                            </div>
                            
                            {result.displayData?.total && (
                              <div className="text-right">
                                <div className="font-medium">
                                  {formatAmount({
                                    amount: result.displayData.total,
                                    currency,
                                    locale,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                                {result.displayData.priceBreakdown && (
                                  <div className="text-xs text-muted-foreground">
                                    {result.displayData.priceBreakdown}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {result.displayData?.status && (
                            <span className={cn(
                              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium mt-1",
                              result.displayData.status === 'completed' && "bg-green-100 text-green-700",
                              result.displayData.status === 'in_progress' && "bg-blue-100 text-blue-700",
                              result.displayData.status === 'pending' && "bg-yellow-100 text-yellow-700"
                            )}>
                              {result.displayData.status.replace('_', ' ')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}