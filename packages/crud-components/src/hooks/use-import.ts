import { useCallback, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "@midday/ui/use-toast";
import type {
  BaseEntity,
  ImportData,
  ImportOptions,
  ImportResult,
  ImportError,
  FieldMapping,
  ProgressState,
} from "../types";

interface UseImportConfig<T extends BaseEntity> {
  onProgress?: (progress: ProgressState) => void;
  onComplete?: (result: ImportResult<T>) => void;
  onError?: (error: Error) => void;
  batchSize?: number;
  maxFileSize?: number; // in bytes
  allowedFormats?: string[];
  validateRow?: (row: any, index: number) => string[] | null;
  transformRow?: (row: any, index: number) => Partial<T>;
}

interface ParsedData {
  headers: string[];
  rows: any[];
  fileName?: string;
  format: "csv" | "xlsx" | "json";
}

/**
 * Hook for handling data import from various formats (CSV, Excel, JSON)
 * 
 * @param config Configuration for import operations
 * @returns Methods and state for importing data
 * 
 * @example
 * ```tsx
 * const importHook = useImport<Customer>({
 *   batchSize: 100,
 *   validateRow: (row, index) => {
 *     const errors: string[] = [];
 *     if (!row.email) errors.push("Email is required");
 *     if (!row.name) errors.push("Name is required");
 *     return errors.length > 0 ? errors : null;
 *   },
 *   onProgress: (progress) => {
 *     console.log(`Import progress: ${progress.current}/${progress.total}`);
 *   },
 * });
 * 
 * // Parse file
 * const result = await importHook.parseFile(file);
 * 
 * // Set field mapping
 * importHook.setMapping({
 *   "Customer Name": "name",
 *   "Email Address": "email",
 *   "Phone Number": "phone",
 * });
 * 
 * // Preview data with mapping
 * const preview = importHook.previewImport(10);
 * 
 * // Execute import
 * const importResult = await importHook.executeImport(dataProvider.import);
 * ```
 */
export function useImport<T extends BaseEntity>(
  config: UseImportConfig<T> = {}
) {
  const {
    onProgress,
    onComplete,
    onError,
    batchSize = 100,
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    allowedFormats = [".csv", ".xlsx", ".xls", ".json"],
    validateRow,
    transformRow,
  } = config;

  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [progress, setProgress] = useState<ProgressState>({
    current: 0,
    total: 0,
    status: "idle",
  });
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Parse a file and extract data
   */
  const parseFile = useCallback(
    async (file: File): Promise<ParsedData> => {
      if (file.size > maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${maxFileSize / 1024 / 1024}MB`);
      }

      const fileExtension = file.name.toLowerCase().split('.').pop();
      if (!allowedFormats.some(format => format.includes(fileExtension || ""))) {
        throw new Error(`File format not supported. Allowed formats: ${allowedFormats.join(", ")}`);
      }

      setIsLoading(true);
      setProgress({ current: 0, total: 0, status: "running", message: "Parsing file..." });

      try {
        let result: ParsedData;

        if (fileExtension === "csv") {
          result = await parseCSV(file);
        } else if (fileExtension === "xlsx" || fileExtension === "xls") {
          result = await parseExcel(file);
        } else if (fileExtension === "json") {
          result = await parseJSON(file);
        } else {
          throw new Error(`Unsupported file format: ${fileExtension}`);
        }

        setParsedData(result);
        setProgress({
          current: result.rows.length,
          total: result.rows.length,
          status: "completed",
          message: "File parsed successfully",
        });

        toast({
          variant: "success",
          title: "File parsed",
          description: `Successfully parsed ${result.rows.length} rows`,
        });

        return result;
      } catch (error) {
        const err = error as Error;
        setProgress({
          current: 0,
          total: 0,
          status: "error",
          message: err.message,
        });
        onError?.(err);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [maxFileSize, allowedFormats, onError]
  );

  /**
   * Parse CSV file
   */
  const parseCSV = (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(", ")}`));
            return;
          }

          const headers = results.meta.fields || [];
          const rows = results.data as any[];

          resolve({
            headers,
            rows,
            fileName: file.name,
            format: "csv",
          });
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        },
      });
    });
  };

  /**
   * Parse Excel file
   */
  const parseExcel = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          
          // Use first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length === 0) {
            reject(new Error("Excel file is empty"));
            return;
          }

          const headers = jsonData[0].map((header: any) => String(header).trim());
          const rows = jsonData.slice(1).map((row) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          resolve({
            headers,
            rows,
            fileName: file.name,
            format: "xlsx",
          });
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Parse JSON file
   */
  const parseJSON = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          
          if (!Array.isArray(jsonData)) {
            reject(new Error("JSON file must contain an array of objects"));
            return;
          }

          if (jsonData.length === 0) {
            reject(new Error("JSON file is empty"));
            return;
          }

          // Extract headers from first object
          const headers = Object.keys(jsonData[0]);

          resolve({
            headers,
            rows: jsonData,
            fileName: file.name,
            format: "json",
          });
        } catch (error) {
          reject(new Error(`Failed to parse JSON file: ${(error as Error).message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  };

  /**
   * Set field mapping between file columns and entity fields
   */
  const setMapping = useCallback((mapping: FieldMapping) => {
    setFieldMapping(mapping);
  }, []);

  /**
   * Auto-detect field mapping based on field names
   */
  const autoDetectMapping = useCallback(
    (entityFields: string[]): FieldMapping => {
      if (!parsedData) return {};

      const mapping: FieldMapping = {};
      const normalizeField = (field: string) =>
        field.toLowerCase().replace(/[^a-z0-9]/g, "");

      for (const header of parsedData.headers) {
        const normalizedHeader = normalizeField(header);
        
        // Find best match
        const match = entityFields.find(field => {
          const normalizedField = normalizeField(field);
          return normalizedField === normalizedHeader ||
                 normalizedField.includes(normalizedHeader) ||
                 normalizedHeader.includes(normalizedField);
        });

        if (match) {
          mapping[header] = match;
        }
      }

      setFieldMapping(mapping);
      return mapping;
    },
    [parsedData]
  );

  /**
   * Preview import data with current mapping
   */
  const previewImport = useCallback(
    (limit = 10): { data: Partial<T>[]; errors: ImportError[] } => {
      if (!parsedData) {
        return { data: [], errors: [] };
      }

      const previewData: Partial<T>[] = [];
      const previewErrors: ImportError[] = [];

      const rowsToPreview = parsedData.rows.slice(0, limit);

      for (let i = 0; i < rowsToPreview.length; i++) {
        const row = rowsToPreview[i];
        
        try {
          // Apply field mapping
          const mappedRow: any = {};
          for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
            if (row[sourceField] !== undefined) {
              mappedRow[targetField] = row[sourceField];
            }
          }

          // Apply transformation
          const transformedRow = transformRow ? transformRow(mappedRow, i) : mappedRow;

          // Validate row
          const validationErrors = validateRow ? validateRow(transformedRow, i) : null;
          if (validationErrors) {
            previewErrors.push({
              row: i + 1,
              message: validationErrors.join(", "),
              data: transformedRow,
            });
          } else {
            previewData.push(transformedRow);
          }
        } catch (error) {
          previewErrors.push({
            row: i + 1,
            message: (error as Error).message,
            data: row,
          });
        }
      }

      return { data: previewData, errors: previewErrors };
    },
    [parsedData, fieldMapping, transformRow, validateRow]
  );

  /**
   * Execute the import operation
   */
  const executeImport = useCallback(
    async (
      importFunction: (data: ImportData<T>) => Promise<ImportResult<T>>
    ): Promise<ImportResult<T>> => {
      if (!parsedData) {
        throw new Error("No data to import. Please parse a file first.");
      }

      setIsLoading(true);
      setErrors([]);
      setProgress({
        current: 0,
        total: parsedData.rows.length,
        status: "running",
        message: "Importing data...",
        startTime: new Date(),
      });

      try {
        const importData: Partial<T>[] = [];
        const importErrors: ImportError[] = [];

        // Process all rows
        for (let i = 0; i < parsedData.rows.length; i++) {
          const row = parsedData.rows[i];

          try {
            // Apply field mapping
            const mappedRow: any = {};
            for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
              if (row[sourceField] !== undefined) {
                mappedRow[targetField] = row[sourceField];
              }
            }

            // Apply transformation
            const transformedRow = transformRow ? transformRow(mappedRow, i) : mappedRow;

            // Validate row
            const validationErrors = validateRow ? validateRow(transformedRow, i) : null;
            if (validationErrors) {
              importErrors.push({
                row: i + 1,
                message: validationErrors.join(", "),
                data: transformedRow,
              });
            } else {
              importData.push(transformedRow);
            }
          } catch (error) {
            importErrors.push({
              row: i + 1,
              message: (error as Error).message,
              data: row,
            });
          }

          // Update progress
          const current = i + 1;
          setProgress(prev => ({ ...prev, current }));
          onProgress?.({ ...progress, current, total: parsedData.rows.length });
        }

        // Execute import
        const result = await importFunction({
          data: importData,
          mapping: fieldMapping,
          options: {
            skipHeader: true,
            skipEmptyLines: true,
          },
        });

        // Combine validation errors with import errors
        const allErrors = [...importErrors, ...result.errors];

        const finalResult: ImportResult<T> = {
          ...result,
          errors: allErrors,
        };

        setErrors(allErrors);
        setProgress({
          current: parsedData.rows.length,
          total: parsedData.rows.length,
          status: "completed",
          message: `Import completed. ${result.success.length} successful, ${allErrors.length} errors`,
          endTime: new Date(),
        });

        onComplete?.(finalResult);

        toast({
          variant: allErrors.length > 0 ? "warning" : "success",
          title: "Import completed",
          description: `${result.success.length} records imported successfully${
            allErrors.length > 0 ? `, ${allErrors.length} errors` : ""
          }`,
        });

        return finalResult;
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
        setIsLoading(false);
      }
    },
    [parsedData, fieldMapping, transformRow, validateRow, onProgress, onComplete, onError, progress]
  );

  /**
   * Reset import state
   */
  const reset = useCallback(() => {
    setParsedData(null);
    setFieldMapping({});
    setProgress({ current: 0, total: 0, status: "idle" });
    setErrors([]);
    setIsLoading(false);
  }, []);

  /**
   * Get suggested mappings for common field names
   */
  const getSuggestedMappings = useCallback(() => {
    if (!parsedData) return {};

    const commonMappings: Record<string, string[]> = {
      name: ["name", "customer_name", "full_name", "client_name", "company"],
      email: ["email", "email_address", "e_mail", "mail"],
      phone: ["phone", "telephone", "phone_number", "mobile", "cell"],
      address: ["address", "street", "street_address", "location"],
      city: ["city", "town", "locality"],
      state: ["state", "province", "region"],
      zip: ["zip", "postal_code", "postcode", "zipcode"],
      country: ["country", "nation"],
    };

    const suggestions: FieldMapping = {};
    
    for (const header of parsedData.headers) {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
      
      for (const [field, variations] of Object.entries(commonMappings)) {
        if (variations.some(variation => 
          normalizedHeader.includes(variation) || variation.includes(normalizedHeader)
        )) {
          suggestions[header] = field;
          break;
        }
      }
    }

    return suggestions;
  }, [parsedData]);

  return {
    // Core methods
    parseFile,
    setMapping,
    autoDetectMapping,
    previewImport,
    executeImport,
    reset,

    // Utility methods
    getSuggestedMappings,

    // State
    parsedData,
    fieldMapping,
    progress,
    errors,
    isLoading,
    
    // Computed state
    hasData: !!parsedData,
    hasMapping: Object.keys(fieldMapping).length > 0,
    canImport: !!parsedData && Object.keys(fieldMapping).length > 0,
  };
}