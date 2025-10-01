import * as XLSX from "xlsx";
import { format } from "date-fns";

/**
 * Configuration options for data export
 */
export interface ExportOptions {
  /** Filename for the exported file (without extension) */
  filename?: string;
  /** Custom headers mapping for columns */
  headers?: Record<string, string>;
  /** Columns to include in export (if not provided, all columns are included) */
  includeColumns?: string[];
  /** Columns to exclude from export */
  excludeColumns?: string[];
  /** Custom date format for date fields */
  dateFormat?: string;
  /** Whether to include timestamp in filename */
  includeTimestamp?: boolean;
  /** Worksheet name for Excel export */
  worksheetName?: string;
}

/**
 * Type for data transformation function
 */
export type DataTransformer<T> = (data: T) => Record<string, any>;

/**
 * Utility function to transform data for export
 */
function transformDataForExport<T>(
  data: T[],
  options: ExportOptions = {},
  transformer?: DataTransformer<T>
): Record<string, any>[] {
  const {
    headers = {},
    includeColumns,
    excludeColumns = [],
    dateFormat = "yyyy-MM-dd HH:mm:ss",
  } = options;

  return data.map(item => {
    // Apply custom transformation if provided
    const transformedItem = transformer ? transformer(item) : (item as Record<string, any>);
    
    // Create export object
    const exportItem: Record<string, any> = {};
    
    Object.keys(transformedItem).forEach(key => {
      // Skip excluded columns
      if (excludeColumns.includes(key)) return;
      
      // Include only specified columns if provided
      if (includeColumns && !includeColumns.includes(key)) return;
      
      const value = transformedItem[key];
      const headerKey = headers[key] || key;
      
      // Format dates
      if (value instanceof Date) {
        exportItem[headerKey] = format(value, dateFormat);
      } else if (typeof value === "string" && !isNaN(Date.parse(value))) {
        // Try to parse string dates
        try {
          const date = new Date(value);
          exportItem[headerKey] = format(date, dateFormat);
        } catch {
          exportItem[headerKey] = value;
        }
      } else if (value === null || value === undefined) {
        exportItem[headerKey] = "";
      } else if (typeof value === "object") {
        // Convert objects to JSON strings
        exportItem[headerKey] = JSON.stringify(value);
      } else {
        exportItem[headerKey] = value;
      }
    });
    
    return exportItem;
  });
}

/**
 * Generate filename with optional timestamp
 */
function generateFilename(baseFilename: string, includeTimestamp: boolean): string {
  if (!includeTimestamp) return baseFilename;
  
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  return `${baseFilename}_${timestamp}`;
}

/**
 * Export data to CSV format
 * 
 * @param data - Array of data objects to export
 * @param options - Export configuration options
 * @param transformer - Optional function to transform data before export
 * 
 * @example
 * ```tsx
 * // Basic CSV export
 * exportToCSV(users, {
 *   filename: 'users',
 *   headers: {
 *     firstName: 'First Name',
 *     lastName: 'Last Name',
 *     email: 'Email Address'
 *   }
 * });
 * 
 * // CSV export with data transformation
 * exportToCSV(orders, {
 *   filename: 'orders',
 *   includeTimestamp: true
 * }, (order) => ({
 *   id: order.id,
 *   customer: order.customer.name,
 *   total: `$${order.total.toFixed(2)}`,
 *   status: order.status.toUpperCase()
 * }));
 * ```
 */
export function exportToCSV<T>(
  data: T[],
  options: ExportOptions = {},
  transformer?: DataTransformer<T>
): void {
  const {
    filename = "export",
    includeTimestamp = false,
  } = options;

  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const transformedData = transformDataForExport(data, options, transformer);
  
  // Convert to CSV
  const headers = Object.keys(transformedData[0]);
  const csvContent = [
    headers.join(","),
    ...transformedData.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    )
  ].join("\n");

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const finalFilename = generateFilename(filename, includeTimestamp);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${finalFilename}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

/**
 * Export data to Excel format (.xlsx)
 * 
 * @param data - Array of data objects to export
 * @param options - Export configuration options
 * @param transformer - Optional function to transform data before export
 * 
 * @example
 * ```tsx
 * // Basic Excel export
 * exportToExcel(products, {
 *   filename: 'products',
 *   worksheetName: 'Product List',
 *   headers: {
 *     name: 'Product Name',
 *     price: 'Price ($)',
 *     category: 'Category'
 *   }
 * });
 * 
 * // Excel export with multiple sheets (advanced usage)
 * exportToExcel([
 *   { name: 'Products', data: products },
 *   { name: 'Categories', data: categories }
 * ], {
 *   filename: 'catalog',
 *   includeTimestamp: true
 * });
 * ```
 */
export function exportToExcel<T>(
  data: T[] | Array<{ name: string; data: T[] }>,
  options: ExportOptions = {},
  transformer?: DataTransformer<T>
): void {
  const {
    filename = "export",
    worksheetName = "Sheet1",
    includeTimestamp = false,
  } = options;

  // Check if data is array of sheets or single sheet
  const isMultiSheet = Array.isArray(data) && data.length > 0 && 
    typeof data[0] === "object" && "name" in data[0] && "data" in data[0];

  if (!isMultiSheet && (data as T[]).length === 0) {
    console.warn("No data to export");
    return;
  }

  const workbook = XLSX.utils.book_new();

  if (isMultiSheet) {
    // Handle multiple sheets
    const sheets = data as Array<{ name: string; data: T[] }>;
    
    sheets.forEach(sheet => {
      if (sheet.data.length === 0) return;
      
      const transformedData = transformDataForExport(sheet.data, options, transformer);
      const worksheet = XLSX.utils.json_to_sheet(transformedData);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });
  } else {
    // Handle single sheet
    const transformedData = transformDataForExport(data as T[], options, transformer);
    const worksheet = XLSX.utils.json_to_sheet(transformedData);
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
  }

  // Generate and download file
  const finalFilename = generateFilename(filename, includeTimestamp);
  XLSX.writeFile(workbook, `${finalFilename}.xlsx`);
}

/**
 * Export filtered/selected table data
 * 
 * @param allData - Complete dataset
 * @param selectedIds - Array of selected item IDs
 * @param options - Export configuration options
 * @param transformer - Optional function to transform data before export
 * @param idField - Field name to use for ID matching (defaults to 'id')
 * 
 * @example
 * ```tsx
 * // Export only selected rows
 * exportSelectedData(
 *   allUsers,
 *   selectedUserIds,
 *   { filename: 'selected_users', format: 'csv' },
 *   undefined,
 *   'userId'
 * );
 * ```
 */
export function exportSelectedData<T extends Record<string, any>>(
  allData: T[],
  selectedIds: string[],
  options: ExportOptions & { format?: "csv" | "excel" } = {},
  transformer?: DataTransformer<T>,
  idField: keyof T = "id"
): void {
  if (selectedIds.length === 0) {
    console.warn("No items selected for export");
    return;
  }

  const selectedData = allData.filter(item => 
    selectedIds.includes(String(item[idField]))
  );

  if (selectedData.length === 0) {
    console.warn("No matching data found for selected IDs");
    return;
  }

  const { format = "csv", ...exportOptions } = options;

  if (format === "excel") {
    exportToExcel(selectedData, exportOptions, transformer);
  } else {
    exportToCSV(selectedData, exportOptions, transformer);
  }
}