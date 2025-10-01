"use client";

import React from "react";
import { Download, FileText, Table as TableIcon, File, Loader2 } from "lucide-react";
import { Button } from "@midday/ui/button";
import { BaseModal } from "@midday/overlay-components/base-modal";
import { Label } from "@midday/ui/label";
import { Progress } from "@midday/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Checkbox } from "@midday/ui/checkbox";
import { Input } from "@midday/ui/input";
import { toast } from "@midday/ui/use-toast";
import { useExport } from "../hooks/use-export";
import type {
  BaseEntity,
  ExportFormat,
  ExportColumn,
} from "../types";

interface ExportDialogProps<T extends BaseEntity> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: T[];
  availableColumns: ExportColumn<T>[];
  title?: string;
  description?: string;
  defaultFormat?: ExportFormat;
  defaultFilename?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

const formatIcons = {
  csv: FileText,
  xlsx: TableIcon,
  json: File,
  pdf: FileText,
};

const formatLabels = {
  csv: "CSV (Comma Separated Values)",
  xlsx: "Excel Spreadsheet",
  json: "JSON (JavaScript Object Notation)",
  pdf: "PDF Document",
};

/**
 * Generic export dialog component for exporting entity data
 * 
 * @param props Configuration props for the export dialog
 * @returns Export dialog component
 * 
 * @example
 * ```tsx
 * const customerColumns: ExportColumn<Customer>[] = [
 *   { key: "name", label: "Customer Name" },
 *   { key: "email", label: "Email Address" },
 *   { key: "phone", label: "Phone Number" },
 *   { key: "createdAt", label: "Created Date", format: (date) => date.toLocaleDateString() },
 * ];
 * 
 * <ExportDialog
 *   open={isExportOpen}
 *   onOpenChange={setIsExportOpen}
 *   data={customers}
 *   availableColumns={customerColumns}
 *   title="Export Customers"
 *   defaultFilename="customers"
 * />
 * ```
 */
export function ExportDialog<T extends BaseEntity>({
  open,
  onOpenChange,
  data,
  availableColumns,
  title = "Export Data",
  description = "Choose format and columns to export your data",
  defaultFormat = "csv",
  defaultFilename = "export",
  onSuccess,
  onError,
}: ExportDialogProps<T>) {
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>(defaultFormat);
  const [filename, setFilename] = React.useState(defaultFilename);
  const [selectedColumns, setSelectedColumns] = React.useState<Set<keyof T>>(
    new Set(availableColumns.map(col => col.key))
  );
  const [includeHeaders, setIncludeHeaders] = React.useState(true);

  const exportHook = useExport<T>({
    defaultFormat,
    onProgress: (progress) => {
      console.log("Export progress:", progress);
    },
    onComplete: (result) => {
      onSuccess?.(result);
      onOpenChange(false);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const handleColumnToggle = (columnKey: keyof T) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnKey)) {
      newSelected.delete(columnKey);
    } else {
      newSelected.add(columnKey);
    }
    setSelectedColumns(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedColumns.size === availableColumns.length) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(availableColumns.map(col => col.key)));
    }
  };

  const handleExport = async () => {
    if (selectedColumns.size === 0) {
      toast({
        variant: "destructive",
        title: "No columns selected",
        description: "Please select at least one column to export",
      });
      return;
    }

    const columnsToExport = availableColumns.filter(col => selectedColumns.has(col.key));

    try {
      await exportHook.exportData(data, {
        format: selectedFormat,
        filename,
        columns: columnsToExport,
        includeHeaders,
      });
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedFormat(defaultFormat);
      setFilename(defaultFilename);
      setSelectedColumns(new Set(availableColumns.map(col => col.key)));
      setIncludeHeaders(true);
    }
  }, [open, defaultFormat, defaultFilename, availableColumns]);

  const getFormatDescription = (format: ExportFormat) => {
    switch (format) {
      case "csv":
        return "Best for importing into other applications or spreadsheet software";
      case "xlsx":
        return "Excel format with formatting and styling preserved";
      case "json":
        return "Structured data format ideal for developers and APIs";
      case "pdf":
        return "Formatted document for viewing and printing";
      default:
        return "";
    }
  };

  return (
    <BaseModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="md"
    >
      <div className="space-y-6">
        {/* Export Progress */}
        {exportHook.isExporting && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Exporting data...</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{exportHook.progress.message}</span>
                <span>{exportHook.progress.current}/{exportHook.progress.total}</span>
              </div>
              <Progress value={(exportHook.progress.current / exportHook.progress.total) * 100} />
            </div>
          </div>
        )}

        {!exportHook.isExporting && (
          <>
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Export Format</Label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(formatIcons) as ExportFormat[]).map((format) => {
                  const Icon = formatIcons[format];
                  return (
                    <button
                      key={format}
                      type="button"
                      onClick={() => setSelectedFormat(format)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        selectedFormat === format
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/20"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{format.toUpperCase()}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatLabels[format]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                {getFormatDescription(selectedFormat)}
              </p>
            </div>

            {/* Filename */}
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Enter filename"
                />
                <span className="text-sm text-muted-foreground">.{selectedFormat}</span>
              </div>
            </div>

            {/* Column Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Columns to Export</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedColumns.size === availableColumns.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableColumns.map((column) => (
                  <div key={column.key as string} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key as string}
                      checked={selectedColumns.has(column.key)}
                      onCheckedChange={() => handleColumnToggle(column.key)}
                    />
                    <Label
                      htmlFor={column.key as string}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {selectedColumns.size} of {availableColumns.length} columns selected
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-headers"
                    checked={includeHeaders}
                    onCheckedChange={setIncludeHeaders}
                  />
                  <Label
                    htmlFor="include-headers"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Include column headers
                  </Label>
                </div>
              </div>
            </div>

            {/* Export Summary */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="text-sm font-medium">Export Summary</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Format: {formatLabels[selectedFormat]}</div>
                <div>Records: {data.length.toLocaleString()}</div>
                <div>Columns: {selectedColumns.size}</div>
                <div>Estimated size: ~{Math.round(data.length * selectedColumns.size * 10 / 1024)} KB</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleExport}
                disabled={selectedColumns.size === 0 || !filename.trim()}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Export {data.length} Records
              </Button>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}