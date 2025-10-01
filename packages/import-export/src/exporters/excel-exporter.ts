import * as XLSX from "xlsx";
import type {
  ExportOptions,
  ExportResult,
  ExcelExportOptions,
  ExcelSheet,
  ColumnConfig,
} from "../types";

export class ExcelExporter {
  async export(
    data: any[] | Record<string, any[]>,
    options: Partial<ExcelExportOptions> = {}
  ): Promise<ExportResult> {
    try {
      const workbook = XLSX.utils.book_new();

      if (Array.isArray(data)) {
        // Single sheet export
        this.addSheet(
          workbook,
          data,
          options.sheetName || "Sheet1",
          options
        );
      } else {
        // Multiple sheets export
        for (const [sheetName, sheetData] of Object.entries(data)) {
          const sheetOptions = options.sheets?.find(s => s.name === sheetName);
          this.addSheet(
            workbook,
            sheetData,
            sheetName,
            sheetOptions || options
          );
        }
      }

      // Convert workbook to buffer
      const buffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      // Create blob
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Generate filename
      const fileName =
        options.fileName ||
        `export_${new Date().toISOString().split("T")[0]}.xlsx`;

      return {
        success: true,
        data: blob,
        fileName: fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`,
        format: "excel",
        size: blob.size,
        rows: Array.isArray(data) ? data.length : Object.values(data).reduce((sum, arr) => sum + arr.length, 0),
      };
    } catch (error) {
      return {
        success: false,
        fileName: options.fileName || "export.xlsx",
        format: "excel",
        size: 0,
        rows: 0,
        error: error instanceof Error ? error : new Error("Export failed"),
      };
    }
  }

  private addSheet(
    workbook: XLSX.WorkBook,
    data: any[],
    sheetName: string,
    options: Partial<ExcelExportOptions>
  ): void {
    // Prepare data
    const preparedData = this.prepareData(data, options);

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(preparedData, {
      header: options.columns
        ? (options.columns as any[]).map(c =>
            typeof c === "string" ? c : c.header || c.field
          )
        : undefined,
      skipHeader: options.headers === false,
    });

    // Apply column widths
    if (options.columns) {
      const cols: XLSX.ColInfo[] = [];
      const columnConfigs = options.columns as ColumnConfig[];
      
      columnConfigs.forEach((col, index) => {
        if (typeof col !== "string" && col.width) {
          cols[index] = { wch: col.width };
        }
      });

      if (cols.length > 0) {
        worksheet["!cols"] = cols;
      }
    }

    // Apply auto filter
    if (options.autoFilter !== false && preparedData.length > 0) {
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
      worksheet["!autofilter"] = { ref: XLSX.utils.encode_range(range) };
    }

    // Apply freeze panes
    if (options.freezePanes) {
      const view: XLSX.SheetView = {};
      
      if (options.freezePanes.row) {
        view.ySplit = options.freezePanes.row;
      }
      if (options.freezePanes.column) {
        view.xSplit = options.freezePanes.column;
      }
      
      worksheet["!views"] = [view];
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
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

        if (typeof value === "object" && value !== null) {
          if ("min" in value || "max" in value) {
            const numValue = Number(rowValue);
            if ("min" in value && numValue < value.min) return false;
            if ("max" in value && numValue > value.max) return false;
          } else if (Array.isArray(value)) {
            if (!value.includes(rowValue)) return false;
          } else if ("from" in value || "to" in value) {
            const date = new Date(rowValue);
            if ("from" in value && date < new Date(value.from)) return false;
            if ("to" in value && date > new Date(value.to)) return false;
          }
        } else {
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
          formattedRow[header] = value;
        }
      }

      return formattedRow;
    });
  }
}