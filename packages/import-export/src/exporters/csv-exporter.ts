import Papa from "papaparse";
import type { ExportOptions, ExportResult, ColumnConfig } from "../types";

export class CSVExporter {
  async export(
    data: any[],
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    try {
      if (!data || data.length === 0) {
        throw new Error("No data to export");
      }

      // Prepare data for export
      const preparedData = this.prepareData(data, options);

      // Convert to CSV
      const csv = Papa.unparse(preparedData, {
        header: options.headers !== false,
        delimiter: options.format === "csv" ? "," : "\t",
        quotes: true,
        quoteChar: '"',
        escapeChar: '"',
        newline: "\r\n",
      });

      // Create blob
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

      // Generate filename
      const fileName =
        options.fileName ||
        `export_${new Date().toISOString().split("T")[0]}.csv`;

      return {
        success: true,
        data: blob,
        fileName: fileName.endsWith(".csv") ? fileName : `${fileName}.csv`,
        format: "csv",
        size: blob.size,
        rows: data.length,
      };
    } catch (error) {
      return {
        success: false,
        fileName: options.fileName || "export.csv",
        format: "csv",
        size: 0,
        rows: 0,
        error: error instanceof Error ? error : new Error("Export failed"),
      };
    }
  }

  private prepareData(
    data: any[],
    options: Partial<ExportOptions>
  ): any[] {
    const { columns, sortBy, filters, dateFormat, numberFormat } = options;

    let result = [...data];

    // Apply filters
    if (filters) {
      result = this.applyFilters(result, filters);
    }

    // Apply sorting
    if (sortBy && sortBy.length > 0) {
      result = this.applySorting(result, sortBy);
    }

    // Select and format columns
    if (columns) {
      result = this.formatColumns(result, columns, {
        dateFormat,
        numberFormat,
      });
    } else {
      // Format all columns with default formatting
      result = this.formatAllColumns(result, {
        dateFormat,
        numberFormat,
      });
    }

    return result;
  }

  private applyFilters(
    data: any[],
    filters: Record<string, any>
  ): any[] {
    return data.filter(row => {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === "") continue;

        const rowValue = row[key];

        // Handle different filter types
        if (typeof value === "object" && value !== null) {
          // Range filter
          if ("min" in value || "max" in value) {
            const numValue = Number(rowValue);
            if ("min" in value && numValue < value.min) return false;
            if ("max" in value && numValue > value.max) return false;
          }
          // Array filter (includes)
          else if (Array.isArray(value)) {
            if (!value.includes(rowValue)) return false;
          }
          // Date range
          else if ("from" in value || "to" in value) {
            const date = new Date(rowValue);
            if ("from" in value && date < new Date(value.from)) return false;
            if ("to" in value && date > new Date(value.to)) return false;
          }
        } else {
          // Exact match or partial string match
          if (typeof rowValue === "string" && typeof value === "string") {
            if (!rowValue.toLowerCase().includes(value.toLowerCase())) {
              return false;
            }
          } else if (rowValue !== value) {
            return false;
          }
        }
      }
      return true;
    });
  }

  private applySorting(
    data: any[],
    sortBy: Array<{ field: string; direction: "asc" | "desc" }>
  ): any[] {
    return [...data].sort((a, b) => {
      for (const sort of sortBy) {
        const aVal = a[sort.field];
        const bVal = b[sort.field];

        if (aVal === bVal) continue;

        let comparison = 0;
        if (aVal == null) comparison = 1;
        else if (bVal == null) comparison = -1;
        else if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        if (comparison !== 0) {
          return sort.direction === "asc" ? comparison : -comparison;
        }
      }
      return 0;
    });
  }

  private formatColumns(
    data: any[],
    columns: string[] | ColumnConfig[],
    formatting: {
      dateFormat?: string;
      numberFormat?: "US" | "EU";
    }
  ): any[] {
    const columnConfigs: ColumnConfig[] = columns.map(col =>
      typeof col === "string" ? { field: col } : col
    );

    return data.map(row => {
      const formattedRow: any = {};

      for (const config of columnConfigs) {
        const value = row[config.field];
        const header = config.header || config.field;

        if (config.format) {
          formattedRow[header] = config.format(value);
        } else {
          formattedRow[header] = this.formatValue(
            value,
            formatting.dateFormat,
            formatting.numberFormat
          );
        }
      }

      return formattedRow;
    });
  }

  private formatAllColumns(
    data: any[],
    formatting: {
      dateFormat?: string;
      numberFormat?: "US" | "EU";
    }
  ): any[] {
    return data.map(row => {
      const formattedRow: any = {};

      for (const [key, value] of Object.entries(row)) {
        formattedRow[key] = this.formatValue(
          value,
          formatting.dateFormat,
          formatting.numberFormat
        );
      }

      return formattedRow;
    });
  }

  private formatValue(
    value: any,
    dateFormat?: string,
    numberFormat?: "US" | "EU"
  ): any {
    if (value == null) return "";

    // Format dates
    if (value instanceof Date || (typeof value === "string" && !isNaN(Date.parse(value)))) {
      const date = value instanceof Date ? value : new Date(value);
      if (!isNaN(date.getTime())) {
        return this.formatDate(date, dateFormat);
      }
    }

    // Format numbers
    if (typeof value === "number") {
      return this.formatNumber(value, numberFormat);
    }

    // Format booleans
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    return String(value);
  }

  private formatDate(date: Date, format?: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    switch (format) {
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "DD.MM.YYYY":
        return `${day}.${month}.${year}`;
      case "YYYY-MM-DD":
      default:
        return `${year}-${month}-${day}`;
    }
  }

  private formatNumber(value: number, format?: "US" | "EU"): string {
    if (format === "EU") {
      // European format: 1.234,56
      return value
        .toFixed(2)
        .replace(/\./g, ",")
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    } else {
      // US format: 1,234.56
      return value
        .toFixed(2)
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    }
  }
}