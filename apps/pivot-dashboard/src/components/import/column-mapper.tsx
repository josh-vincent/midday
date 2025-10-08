"use client";

import type { ColumnMapping } from "@midday/db/types/dirt";
import { Alert, AlertDescription } from "@midday/ui/alert";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Card } from "@midday/ui/card";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface ColumnMapperProps {
  csvHeaders: string[];
  sampleData: Record<string, any>[];
  onMappingComplete: (mappings: ColumnMapping[]) => void;
  savedTemplate?: ColumnMapping[];
}

// Define target fields with their metadata
const TARGET_FIELDS = [
  // Required fields
  {
    field: "ticketNumber",
    label: "Ticket Number",
    dataType: "string",
    required: true,
  },
  {
    field: "truckRego",
    label: "Truck Registration",
    dataType: "string",
    required: true,
  },
  {
    field: "grossWeight",
    label: "Gross Weight (tonnes)",
    dataType: "number",
    required: true,
  },
  {
    field: "tareWeight",
    label: "Tare Weight (tonnes)",
    dataType: "number",
    required: true,
  },

  // Optional fields
  {
    field: "weighInTime",
    label: "Weigh In Time",
    dataType: "date",
    required: false,
  },
  {
    field: "weighOutTime",
    label: "Weigh Out Time",
    dataType: "date",
    required: false,
  },
  {
    field: "materialType",
    label: "Material Type",
    dataType: "string",
    required: false,
  },
  {
    field: "siteFrom",
    label: "Site From",
    dataType: "string",
    required: false,
  },
  { field: "siteTo", label: "Site To", dataType: "string", required: false },
  {
    field: "purchaseOrder",
    label: "Purchase Order",
    dataType: "string",
    required: false,
  },
  {
    field: "costCenter",
    label: "Cost Center",
    dataType: "string",
    required: false,
  },
  {
    field: "customerName",
    label: "Customer Name",
    dataType: "string",
    required: false,
  },
  {
    field: "rate",
    label: "Rate per Tonne",
    dataType: "number",
    required: false,
  },
  {
    field: "epaLevyRate",
    label: "EPA Levy Rate",
    dataType: "number",
    required: false,
  },
] as const;

export function ColumnMapper({
  csvHeaders,
  sampleData,
  onMappingComplete,
  savedTemplate,
}: ColumnMapperProps) {
  const [mappings, setMappings] = useState<Map<string, string>>(new Map());
  const [autoMapped, setAutoMapped] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-map columns on mount
  useEffect(() => {
    if (savedTemplate) {
      // Use saved template
      const newMappings = new Map<string, string>();
      const newAutoMapped = new Set<string>();

      savedTemplate.forEach((mapping) => {
        if (csvHeaders.includes(mapping.sourceColumn)) {
          newMappings.set(mapping.targetField, mapping.sourceColumn);
          newAutoMapped.add(mapping.targetField);
        }
      });

      setMappings(newMappings);
      setAutoMapped(newAutoMapped);
    } else {
      // Attempt auto-mapping based on column names
      autoMapColumns();
    }
  }, [csvHeaders, savedTemplate]);

  const autoMapColumns = () => {
    const newMappings = new Map<string, string>();
    const newAutoMapped = new Set<string>();

    // Common column name patterns to match
    const patterns: Record<string, RegExp[]> = {
      ticketNumber: [/ticket/i, /docket/i, /number/i],
      truckRego: [/truck/i, /rego/i, /registration/i, /vehicle/i],
      grossWeight: [/gross/i, /gross.*weight/i],
      tareWeight: [/tare/i, /tare.*weight/i, /empty.*weight/i],
      weighInTime: [/weigh.*in/i, /in.*time/i, /arrival/i],
      weighOutTime: [/weigh.*out/i, /out.*time/i, /departure/i],
      materialType: [/material/i, /type/i, /product/i],
      siteFrom: [/from/i, /origin/i, /pickup/i],
      siteTo: [/to/i, /destination/i, /delivery/i],
      purchaseOrder: [/po/i, /purchase.*order/i, /p\.o\./i],
      customerName: [/customer/i, /client/i, /company/i],
      rate: [/rate/i, /price/i, /cost.*per/i],
    };

    TARGET_FIELDS.forEach((targetField) => {
      const fieldPatterns = patterns[targetField.field];
      if (!fieldPatterns) return;

      // Find best matching CSV header
      for (const csvHeader of csvHeaders) {
        for (const pattern of fieldPatterns) {
          if (pattern.test(csvHeader)) {
            newMappings.set(targetField.field, csvHeader);
            newAutoMapped.add(targetField.field);
            return; // Found match, move to next field
          }
        }
      }
    });

    setMappings(newMappings);
    setAutoMapped(newAutoMapped);
  };

  const handleMappingChange = (targetField: string, csvHeader: string) => {
    const newMappings = new Map(mappings);

    if (csvHeader === "") {
      newMappings.delete(targetField);
    } else {
      // Check if this CSV header is already mapped to another field
      const existingMapping = Array.from(newMappings.entries()).find(
        ([field, header]) => header === csvHeader && field !== targetField,
      );

      if (existingMapping) {
        // Remove the existing mapping
        newMappings.delete(existingMapping[0]);
      }

      newMappings.set(targetField, csvHeader);
    }

    setMappings(newMappings);

    // Remove from auto-mapped if manually changed
    if (autoMapped.has(targetField)) {
      const newAutoMapped = new Set(autoMapped);
      newAutoMapped.delete(targetField);
      setAutoMapped(newAutoMapped);
    }
  };

  const validateMappings = (): boolean => {
    const newErrors: string[] = [];

    // Check required fields are mapped
    const requiredFields = TARGET_FIELDS.filter((f) => f.required);
    for (const field of requiredFields) {
      if (!mappings.has(field.field)) {
        newErrors.push(`${field.label} is required but not mapped`);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleComplete = () => {
    if (!validateMappings()) {
      return;
    }

    // Convert mappings to ColumnMapping array
    const columnMappings: ColumnMapping[] = [];

    mappings.forEach((csvHeader, targetField) => {
      const fieldDef = TARGET_FIELDS.find((f) => f.field === targetField);
      if (fieldDef) {
        columnMappings.push({
          sourceColumn: csvHeader,
          targetField: targetField,
          dataType: fieldDef.dataType as
            | "string"
            | "number"
            | "date"
            | "boolean",
          required: fieldDef.required,
        });
      }
    });

    onMappingComplete(columnMappings);
  };

  const getSampleValue = (csvHeader: string, index = 0): string => {
    if (!sampleData[index]) return "";
    const value = sampleData[index][csvHeader];
    return value !== undefined && value !== null ? String(value) : "";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-4">
        <h3 className="mb-2 font-medium">Map CSV Columns to Invoice Fields</h3>
        <p className="text-sm text-muted-foreground">
          Match your CSV columns to the corresponding invoice fields. Required
          fields are marked with an asterisk.
        </p>
      </div>

      <div className="space-y-3">
        {TARGET_FIELDS.map((targetField) => {
          const isAutoMapped = autoMapped.has(targetField.field);
          const selectedHeader = mappings.get(targetField.field) || "";

          return (
            <Card key={targetField.field} className="p-4">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Target field */}
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    {targetField.label}
                    {targetField.required && (
                      <span className="text-destructive">*</span>
                    )}
                    {isAutoMapped && (
                      <Badge variant="secondary" className="text-xs">
                        Auto
                      </Badge>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Type: {targetField.dataType}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* CSV column selector */}
                <div className="space-y-2">
                  <Select
                    value={selectedHeader}
                    onValueChange={(value) =>
                      handleMappingChange(targetField.field, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select CSV column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {csvHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Show sample value */}
                  {selectedHeader && (
                    <p className="text-xs text-muted-foreground">
                      Sample: {getSampleValue(selectedHeader) || "(empty)"}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-inside list-disc">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {mappings.size} of {TARGET_FIELDS.length} fields mapped
          {mappings.size >= TARGET_FIELDS.filter((f) => f.required).length && (
            <CheckCircle2 className="ml-2 inline h-4 w-4 text-green-500" />
          )}
        </div>

        <Button
          onClick={handleComplete}
          disabled={
            mappings.size < TARGET_FIELDS.filter((f) => f.required).length
          }
        >
          Continue to Validation
        </Button>
      </div>
    </div>
  );
}
