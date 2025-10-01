"use client";

import { useState } from "react";
import { Input } from "@midday/ui/input";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@midday/ui/popover";
import { Calendar } from "@midday/ui/calendar";
import { Checkbox } from "@midday/ui/checkbox";
import { Label } from "@midday/ui/label";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  Upload,
  FolderPlus,
  RefreshCw,
  Grid3x3,
  List,
  X,
} from "lucide-react";
import type { MockFolder } from "@/lib/mock/documents-mock";

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  folderFilter: string;
  onFolderFilterChange: (folderId: string) => void;
  tagsFilter: string[];
  onTagsFilterChange: (tags: string[]) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onUploadDocument: () => void;
  onCreateFolder: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  totalDocuments: number;
  folders: MockFolder[];
};

const fileTypes = [
  { value: "", label: "All Types" },
  { value: "pdf", label: "PDF" },
  { value: "doc", label: "Word" },
  { value: "docx", label: "Word" },
  { value: "xlsx", label: "Excel" },
  { value: "xls", label: "Excel" },
  { value: "ppt", label: "PowerPoint" },
  { value: "pptx", label: "PowerPoint" },
  { value: "txt", label: "Text" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "zip", label: "Archive" },
  { value: "other", label: "Other" },
];

const availableTags = [
  "important",
  "draft",
  "final",
  "confidential",
  "urgent",
  "review",
  "approved",
  "archived",
  "template",
  "legal",
  "financial",
  "marketing",
  "hr",
  "technical",
  "public",
  "internal",
  "client",
  "project",
  "policy",
  "guidelines",
];

export function DocumentsHeader({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  folderFilter,
  onFolderFilterChange,
  tagsFilter,
  onTagsFilterChange,
  dateRange,
  onDateRangeChange,
  viewMode,
  onViewModeChange,
  onUploadDocument,
  onCreateFolder,
  onRefresh,
  isRefreshing,
  totalDocuments,
  folders,
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTagsFilter, setShowTagsFilter] = useState(false);

  const hasActiveFilters = typeFilter || folderFilter || tagsFilter.length > 0;

  const handleTagToggle = (tag: string) => {
    const newTags = tagsFilter.includes(tag)
      ? tagsFilter.filter(t => t !== tag)
      : [...tagsFilter, tag];
    onTagsFilterChange(newTags);
  };

  const clearFilters = () => {
    onTypeFilterChange("");
    onFolderFilterChange("");
    onTagsFilterChange([]);
    onDateRangeChange({
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(),
    });
  };

  return (
    <div className="space-y-4">
      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage and organize your files ({totalDocuments.toLocaleString()} documents)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={onCreateFolder}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          
          <Button size="sm" onClick={onUploadDocument}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents, descriptions, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* File Type Filter */}
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="File type" />
            </SelectTrigger>
            <SelectContent>
              {fileTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Folder Filter */}
          <Select value={folderFilter} onValueChange={onFolderFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Folders</SelectItem>
              {folders.filter(f => f.id !== "folder_root").map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tags Filter */}
          <Popover open={showTagsFilter} onOpenChange={setShowTagsFilter}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Tags
                {tagsFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1">
                    {tagsFilter.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filter by tags</h4>
                  {tagsFilter.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTagsFilterChange([])}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={tag}
                        checked={tagsFilter.includes(tag)}
                        onCheckedChange={() => handleTagToggle(tag)}
                      />
                      <Label
                        htmlFor={tag}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Date Range Filter */}
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={dateRange.from}
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onDateRangeChange({ from: range.from, to: range.to });
                    setShowDatePicker(false);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="rounded-l-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {typeFilter && (
            <Badge variant="secondary" className="gap-1">
              Type: {fileTypes.find(t => t.value === typeFilter)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onTypeFilterChange("")}
              />
            </Badge>
          )}
          {folderFilter && (
            <Badge variant="secondary" className="gap-1">
              Folder: {folders.find(f => f.id === folderFilter)?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFolderFilterChange("")}
              />
            </Badge>
          )}
          {tagsFilter.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              Tag: {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}