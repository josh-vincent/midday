"use client";

import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { X } from "lucide-react";
import type { Tag } from "../types";

interface TagFilterProps {
  /** Available tags to select from */
  availableTags: Tag[];
  /** Currently selected tag IDs */
  selectedTags?: string[];
  /** Callback when tag selection changes */
  onChange?: (tagIds: string[]) => void;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Maximum number of tags to display before showing count */
  maxDisplay?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Tag-based filtering with visual chips
 * 
 * @example
 * ```tsx
 * <TagFilter
 *   availableTags={[
 *     { id: "1", label: "Business", color: "#3b82f6" },
 *     { id: "2", label: "Personal", color: "#10b981" }
 *   ]}
 *   selectedTags={selectedTagIds}
 *   onChange={setSelectedTagIds}
 *   maxDisplay={5}
 * />
 * ```
 */
export function TagFilter({
  availableTags,
  selectedTags = [],
  onChange,
  disabled,
  maxDisplay = 10,
  className,
}: TagFilterProps) {
  const selectedTagObjects = availableTags.filter(tag => 
    selectedTags.includes(tag.id)
  );

  const handleToggleTag = (tagId: string) => {
    if (disabled) return;
    
    const newSelection = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    onChange?.(newSelection);
  };

  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    
    const newSelection = selectedTags.filter(id => id !== tagId);
    onChange?.(newSelection);
  };

  const handleClearAll = () => {
    onChange?.([]);
  };

  if (availableTags.length === 0) {
    return null;
  }

  const displayTags = selectedTagObjects.slice(0, maxDisplay);
  const remainingCount = selectedTagObjects.length - maxDisplay;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected tags */}
      {selectedTagObjects.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected Tags</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {displayTags.map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="gap-1 pr-1"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : undefined,
                  borderColor: tag.color,
                }}
              >
                {tag.color && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                )}
                <span>{tag.label}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTag(tag.id, e)}
                    className="rounded-sm hover:bg-muted/50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            
            {remainingCount > 0 && (
              <Badge variant="secondary">
                +{remainingCount} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Available tags */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Available Tags</span>
        <div className="flex flex-wrap gap-1">
          {availableTags.map(tag => {
            const isSelected = selectedTags.includes(tag.id);
            
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggleTag(tag.id)}
                disabled={disabled}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  backgroundColor: isSelected && tag.color ? tag.color : undefined,
                  borderColor: tag.color && !isSelected ? tag.color : undefined,
                  border: tag.color && !isSelected ? "1px solid" : undefined,
                }}
              >
                {tag.color && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ 
                      backgroundColor: isSelected ? "white" : tag.color 
                    }}
                  />
                )}
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}