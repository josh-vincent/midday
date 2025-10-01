"use client";

import { Button } from "@midday/ui/button";
import { Mail, Search, Inbox } from "lucide-react";

interface EmptyStateProps {
  onComposeEmail?: () => void;
}

export function EmptyState({ onComposeEmail }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
          <Inbox className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No emails</h2>
          <p className="text-[#606060] text-sm max-w-md">
            Your inbox is empty. When you receive emails, they'll appear here. <br />
            You can also compose a new email to get started.
          </p>
        </div>

        {onComposeEmail && (
          <Button
            variant="outline"
            onClick={onComposeEmail}
          >
            <Mail className="w-4 h-4 mr-2" />
            Compose email
          </Button>
        )}
      </div>
    </div>
  );
}

interface NoResultsProps {
  searchQuery?: string;
  onClearFilters?: () => void;
}

export function NoResults({ searchQuery, onClearFilters }: NoResultsProps) {
  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">No results found</h2>
          <p className="text-[#606060] text-sm max-w-md">
            {searchQuery 
              ? `No emails found matching "${searchQuery}". Try a different search term or adjust your filters.`
              : "No emails match your current filters. Try adjusting the filters or search criteria."
            }
          </p>
        </div>

        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

interface SyncingStateProps {
  provider?: "gmail" | "outlook" | "all";
}

export function SyncingState({ provider = "all" }: SyncingStateProps) {
  const providerText = provider === "all" ? "your email accounts" : provider === "gmail" ? "Gmail" : "Outlook";
  
  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
          <Mail className="w-8 h-8 text-muted-foreground animate-pulse" />
        </div>
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">Syncing emails</h2>
          <p className="text-[#606060] text-sm max-w-md">
            We're currently syncing your emails from {providerText}. <br />
            This may take a few moments.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
        </div>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center ">
      <div className="flex flex-col items-center mt-40">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <Mail className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">Error loading emails</h2>
          <p className="text-[#606060] text-sm max-w-md">
            {error || "There was an error loading your emails. Please try again."}
          </p>
        </div>

        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}