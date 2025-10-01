"use client";

import { useState, useCallback } from "react";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Badge } from "@midday/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@midday/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { cn } from "@midday/ui/cn";
import { Save, Star, MoreHorizontal, Edit, Trash2, Download, Upload } from "lucide-react";
import { format } from "date-fns";
import type { SavedFilter, FilterState } from "../types";
import { useSavedFilters } from "../hooks/use-saved-filters";

interface SavedFiltersProps<T extends FilterState> {
  /** Current filter state */
  currentFilters: T;
  /** Callback when a filter is loaded */
  onLoadFilter: (filters: T) => void;
  /** Storage key for localStorage */
  storageKey?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Component for saving and loading filter presets
 * 
 * @example
 * ```tsx
 * <SavedFilters
 *   currentFilters={filters}
 *   onLoadFilter={setFilters}
 *   storageKey="transaction-filters"
 * />
 * ```
 */
export function SavedFilters<T extends FilterState>({
  currentFilters,
  onLoadFilter,
  storageKey,
  className,
}: SavedFiltersProps<T>) {
  const {
    savedFilters,
    saveFilter,
    loadFilter,
    deleteFilter,
    updateFilter,
    setDefaultFilter,
    getDefaultFilter,
    filterNameExists,
    exportFilters,
    importFilters,
  } = useSavedFilters<T>(storageKey);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null);
  const [filterName, setFilterName] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const handleSaveFilter = useCallback(() => {
    if (!filterName.trim()) return;

    if (editingFilter) {
      updateFilter(editingFilter.id, {
        name: filterName,
        description: filterDescription || undefined,
        filters: currentFilters,
        isDefault,
      });
    } else {
      saveFilter(filterName, currentFilters, filterDescription || undefined, isDefault);
    }

    setIsDialogOpen(false);
    setEditingFilter(null);
    setFilterName("");
    setFilterDescription("");
    setIsDefault(false);
  }, [
    filterName,
    filterDescription,
    isDefault,
    editingFilter,
    currentFilters,
    saveFilter,
    updateFilter,
  ]);

  const handleLoadFilter = useCallback((filterId: string) => {
    const filters = loadFilter(filterId);
    if (filters) {
      onLoadFilter(filters);
    }
  }, [loadFilter, onLoadFilter]);

  const handleEditFilter = useCallback((filter: SavedFilter) => {
    setEditingFilter(filter);
    setFilterName(filter.name);
    setFilterDescription(filter.description || "");
    setIsDefault(filter.isDefault || false);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteFilter = useCallback((filterId: string) => {
    deleteFilter(filterId);
  }, [deleteFilter]);

  const handleSetDefault = useCallback((filterId: string) => {
    setDefaultFilter(filterId);
  }, [setDefaultFilter]);

  const handleExport = useCallback(() => {
    const data = exportFilters();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saved-filters-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportFilters]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const count = importFilters(content);
        alert(`Successfully imported ${count} filters`);
      } catch (error) {
        alert("Failed to import filters. Please check the file format.");
      }
    };
    reader.readAsText(file);
  }, [importFilters]);

  const openSaveDialog = useCallback(() => {
    setEditingFilter(null);
    setFilterName("");
    setFilterDescription("");
    setIsDefault(false);
    setIsDialogOpen(true);
  }, []);

  const defaultFilter = getDefaultFilter();

  return (
    <div className={cn("space-y-2", className)}>
      {/* Main trigger and actions */}
      <div className="flex items-center gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={openSaveDialog}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Filter
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingFilter ? "Edit Filter" : "Save Filter"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="filter-name">Name</Label>
                <Input
                  id="filter-name"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Enter filter name"
                />
                {filterNameExists(filterName, editingFilter?.id) && (
                  <p className="text-xs text-red-500">
                    A filter with this name already exists
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-description">Description (optional)</Label>
                <Textarea
                  id="filter-description"
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  placeholder="Describe this filter..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is-default" className="text-sm">
                  Set as default filter
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveFilter}
                  disabled={!filterName.trim() || filterNameExists(filterName, editingFilter?.id)}
                >
                  {editingFilter ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export/Import */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={savedFilters.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-filters"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("import-filters")?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Saved filters list */}
      {savedFilters.length > 0 && (
        <div className="space-y-1">
          {savedFilters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLoadFilter(filter.id)}
                    className="flex-1 text-left hover:underline"
                  >
                    <span className="font-medium">{filter.name}</span>
                  </button>
                  
                  {filter.isDefault && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" />
                      Default
                    </Badge>
                  )}
                </div>
                
                {filter.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {filter.description}
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Updated {format(filter.updatedAt, "MMM dd, yyyy")}
                </p>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                
                <PopoverContent className="w-40 p-1" align="end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLoadFilter(filter.id)}
                    className="w-full justify-start gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Load
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditFilter(filter)}
                    className="w-full justify-start gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  
                  {!filter.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(filter.id)}
                      className="w-full justify-start gap-2"
                    >
                      <Star className="h-4 w-4" />
                      Set Default
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFilter(filter.id)}
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          ))}
        </div>
      )}

      {/* Default filter notice */}
      {defaultFilter && (
        <div className="text-xs text-muted-foreground">
          Default: <strong>{defaultFilter.name}</strong>
        </div>
      )}
    </div>
  );
}