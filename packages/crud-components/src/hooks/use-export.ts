import { useCallback, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "@midday/ui/use-toast";
import type {
  BaseEntity,
  ExportFormat,
  ExportParams,
  ExportResult,
  ProgressState,
} from "../types";

interface UseExportConfig<T extends BaseEntity> {
  onProgress?: (progress: ProgressState) => void;
  onComplete?: (result: ExportResult) => void;
  onError?: (error: Error) => void;
  defaultFormat?: ExportFormat;
  maxRecords?: number;
  chunkSize?: number;
}

interface ExportColumn<T> {
  key: keyof T;
  label: string;
  format?: (value: any) => string;
  width?: number;
}

/**
 * Hook for handling data export to various formats (CSV, Excel, JSON, PDF)
 * 
 * @param config Configuration for export operations
 * @returns Methods and state for exporting data
 * 
 * @example
 * ```tsx
 * const exportHook = useExport<Customer>({
 *   defaultFormat: "xlsx",
 *   onProgress: (progress) => {
 *     console.log(`Export progress: ${progress.current}/${progress.total}`);
 *   },
 * });
 * 
 * // Define export columns
 * const columns: ExportColumn<Customer>[] = [
 *   { key: "name", label: "Customer Name" },
 *   { key: "email", label: "Email Address" },
 *   { key: "phone", label: "Phone Number" },
 *   { key: "createdAt", label: "Created", format: (date) => date.toLocaleDateString() },
 * ];
 * 
 * // Export data
 * const result = await exportHook.exportData(customers, {
 *   format: "xlsx",
 *   filename: "customers",
 *   columns,
 * });
 * ```
 */
export function useExport<T extends BaseEntity>(
  config: UseExportConfig<T> = {}
) {
  const {
    onProgress,
    onComplete,
    onError,
    defaultFormat = "csv",
    maxRecords = 100000,
    chunkSize = 1000,
  } = config;

  const [progress, setProgress] = useState<ProgressState>({
    current: 0,
    total: 0,
    status: "idle",
  });
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Export data to specified format
   */
  const exportData = useCallback(
    async (
      data: T[],
      options: {
        format?: ExportFormat;
        filename?: string;
        columns?: ExportColumn<T>[];
        includeHeaders?: boolean;
        customHeaders?: Record<string, string>;
      } = {}
    ): Promise<ExportResult> => {
      const {
        format = defaultFormat,
        filename = "export",
        columns,
        includeHeaders = true,
        customHeaders = {},
      } = options;

      if (data.length === 0) {
        throw new Error("No data to export");
      }

      if (data.length > maxRecords) {
        throw new Error(`Cannot export more than ${maxRecords} records`);
      }

      setIsExporting(true);
      setProgress({
        current: 0,
        total: data.length,
        status: "running",
        message: `Exporting ${data.length} records...`,
        startTime: new Date(),
      });

      try {
        let result: ExportResult;

        switch (format) {
          case "csv":
            result = await exportToCSV(data, filename, columns, includeHeaders, customHeaders);
            break;
          case "xlsx":
            result = await exportToExcel(data, filename, columns, includeHeaders, customHeaders);
            break;
          case "json":
            result = await exportToJSON(data, filename, columns);
            break;
          case "pdf":
            result = await exportToPDF(data, filename, columns, customHeaders);
            break;
          default:
            throw new Error(`Unsupported export format: ${format}`);
        }

        setProgress({
          current: data.length,
          total: data.length,
          status: "completed",
          message: "Export completed successfully",
          endTime: new Date(),
        });

        onComplete?.(result);

        toast({
          variant: "success",
          title: "Export completed",
          description: `${data.length} records exported successfully`,
        });

        return result;
      } catch (error) {
        const err = error as Error;
        setProgress(prev => ({
          ...prev,
          status: "error",
          message: err.message,
          endTime: new Date(),
        }));
        onError?.(err);
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [defaultFormat, maxRecords, onProgress, onComplete, onError]
  );

  /**
   * Export to CSV format
   */
  const exportToCSV = async (
    data: T[],
    filename: string,
    columns?: ExportColumn<T>[],
    includeHeaders = true,
    customHeaders: Record<string, string> = {}
  ): Promise<ExportResult> => {
    const processedData = processDataForExport(data, columns);
    
    const csvData = Papa.unparse(processedData, {
      header: includeHeaders,
      skipEmptyLines: true,
    });

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      url,
      filename: `${filename}.csv`,
      format: "csv",
    };
  };

  /**
   * Export to Excel format
   */
  const exportToExcel = async (
    data: T[],
    filename: string,
    columns?: ExportColumn<T>[],
    includeHeaders = true,
    customHeaders: Record<string, string> = {}
  ): Promise<ExportResult> => {
    const processedData = processDataForExport(data, columns);
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(processedData, {
      header: columns?.map(col => col.label) || Object.keys(processedData[0] || {}),
      skipHeader: !includeHeaders,
    });

    // Set column widths if specified
    if (columns) {
      const colWidths = columns.map(col => ({
        wch: col.width || 15,
      }));
      worksheet["!cols"] = colWidths;
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate buffer
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { 
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
    });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      url,
      filename: `${filename}.xlsx`,
      format: "xlsx",
    };
  };

  /**
   * Export to JSON format
   */
  const exportToJSON = async (
    data: T[],
    filename: string,
    columns?: ExportColumn<T>[]
  ): Promise<ExportResult> => {
    const processedData = processDataForExport(data, columns);
    
    const jsonData = JSON.stringify(processedData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      url,
      filename: `${filename}.json`,
      format: "json",
    };
  };

  /**
   * Export to PDF format (basic implementation)
   */
  const exportToPDF = async (
    data: T[],
    filename: string,
    columns?: ExportColumn<T>[],
    customHeaders: Record<string, string> = {}
  ): Promise<ExportResult> => {
    // This is a simplified PDF implementation
    // In a real application, you'd use a proper PDF library like jsPDF
    const processedData = processDataForExport(data, columns);
    
    // Create HTML table
    const headers = columns?.map(col => col.label) || Object.keys(processedData[0] || {});
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <h1>${customHeaders.title || "Data Export"}</h1>
        <table>
          <thead>
            <tr>${headers.map(header => `<th>${header}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${processedData.map(row => 
              `<tr>${headers.map(header => `<td>${row[header] || ""}</td>`).join("")}</tr>`
            ).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // For PDF, we'd typically use window.print() or a PDF library
    // This opens the HTML in a new window for now
    window.open(url, "_blank");

    return {
      url,
      filename: `${filename}.html`,
      format: "pdf",
    };
  };

  /**
   * Process data according to column specifications
   */
  const processDataForExport = (data: T[], columns?: ExportColumn<T>[]) => {
    if (!columns) {
      return data;
    }

    return data.map((item, index) => {
      const processedItem: any = {};
      
      columns.forEach(column => {
        const value = item[column.key];
        processedItem[column.label] = column.format ? column.format(value) : value;
      });

      // Update progress
      setProgress(prev => ({ ...prev, current: index + 1 }));
      onProgress?.({
        current: index + 1,
        total: data.length,
        status: "running",
        message: "Processing data...",
      });

      return processedItem;
    });
  };

  /**
   * Generate export template with sample data
   */
  const generateTemplate = useCallback(
    (
      columns: ExportColumn<T>[],
      format: ExportFormat = "csv",
      sampleData?: Partial<T>[]
    ) => {
      const templateData = sampleData || [
        columns.reduce((obj, col) => {
          obj[col.label] = `Sample ${col.label}`;
          return obj;
        }, {} as any),
      ];

      return exportData(templateData as T[], {
        format,
        filename: "template",
        columns,
      });
    },
    [exportData]
  );

  /**
   * Get export statistics
   */
  const getExportStats = useCallback(() => {
    const duration = progress.endTime && progress.startTime 
      ? progress.endTime.getTime() - progress.startTime.getTime()
      : 0;

    return {
      recordsProcessed: progress.current,
      totalRecords: progress.total,
      duration,
      recordsPerSecond: duration > 0 ? (progress.current / duration) * 1000 : 0,
      status: progress.status,
    };
  }, [progress]);

  return {
    // Core methods
    exportData,
    generateTemplate,

    // Utility methods
    getExportStats,

    // State
    progress,
    isExporting,
    
    // Computed state
    canExport: !isExporting,
  };
}