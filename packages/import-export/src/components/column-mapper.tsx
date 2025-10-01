"use client";

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
import { Switch } from "@midday/ui/switch";
import { AlertCircle, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import type { ColumnMapping, DataType } from "../types";
import { detectDataTypes } from "../utils/parsers";

interface ColumnMapperProps {
  sourceColumns: string[];
  targetFields: TargetField[];
  sampleData?: Record<string, any>[];
  savedTemplate?: ColumnMapping[];
  onMappingComplete: (mappings: ColumnMapping[]) => void;
  onTemplateS

?: (template: ColumnMapping[]) => void;
  allowCustomFields?: boolean;
  autoMap?: boolean;
}

export interface TargetField {
  field: string;
  label: string;
  dataType: DataType;
  required?: boolean;
  description?: string;
  format?: string;
  validation?: any[];
  defaultValue?: any;
}

export function ColumnMapper({
  sourceColumns,
  targetFields,
  sampleData = [],
  savedTemplate,
  onMappingComplete,
  onTemplateSave,
  allowCustomFields = false,
  autoMap = true,
}: ColumnMapperProps) {
  const [mappings, setMappings] = useState<Map<string, string>>(new Map());
  const [dataTypes, setDataTypes] = useState<Map<string, DataType>>(new Map());
  const [autoMapped, setAutoMapped] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [detectedTypes, setDetectedTypes] = useState<Record<string, DataType>>({});

  // Auto-detect data types
  useEffect(() => {
    if (sampleData.length > 0) {
      const types = detectDataTypes(sampleData);
      setDetectedTypes(types);
    }
  }, [sampleData]);

  // Load saved template or auto-map
  useEffect(() => {
    if (savedTemplate) {
      loadTemplate(savedTemplate);
    } else if (autoMap) {
      autoMapColumns();
    }
  }, [sourceColumns, targetFields, savedTemplate, autoMap]);

  const loadTemplate = useCallback((template: ColumnMapping[]) => {
    const newMappings = new Map<string, string>();
    const newDataTypes = new Map<string, DataType>();
    const newAutoMapped = new Set<string>();

    template.forEach(mapping => {
      if (sourceColumns.includes(mapping.sourceColumn)) {
        newMappings.set(mapping.targetField, mapping.sourceColumn);
        newDataTypes.set(mapping.targetField, mapping.dataType);
        newAutoMapped.add(mapping.targetField);
      }
    });

    setMappings(newMappings);
    setDataTypes(newDataTypes);
    setAutoMapped(newAutoMapped);
  }, [sourceColumns]);

  const autoMapColumns = useCallback(() => {
    const newMappings = new Map<string, string>();
    const newDataTypes = new Map<string, DataType>();
    const newAutoMapped = new Set<string>();

    // Create pattern map for each target field
    const patternMap: Record<string, RegExp[]> = {};
    
    targetFields.forEach(field => {
      const patterns: RegExp[] = [];
      const fieldName = field.field.toLowerCase();
      const labelName = field.label.toLowerCase();

      // Add exact match patterns
      patterns.push(new RegExp(`^${fieldName}$`, 'i'));
      patterns.push(new RegExp(`^${labelName}$`, 'i'));

      // Add partial match patterns
      const words = fieldName.split(/[_\s]+/);
      words.forEach(word => {
        if (word.length > 3) {
          patterns.push(new RegExp(word, 'i'));
        }
      });

      // Add common variations
      if (fieldName.includes('number') || fieldName.includes('no')) {
        patterns.push(/num|no|#/i);
      }
      if (fieldName.includes('date')) {
        patterns.push(/date|dt|time/i);
      }
      if (fieldName.includes('amount') || fieldName.includes('total')) {
        patterns.push(/amount|amt|total|sum/i);
      }
      if (fieldName.includes('quantity') || fieldName.includes('qty')) {
        patterns.push(/quantity|qty|count|volume/i);
      }
      if (fieldName.includes('price') || fieldName.includes('rate')) {
        patterns.push(/price|rate|cost|fee/i);
      }
      if (fieldName.includes('name')) {
        patterns.push(/name|title|description/i);
      }
      if (fieldName.includes('email')) {
        patterns.push(/email|mail|e-mail/i);
      }
      if (fieldName.includes('phone')) {
        patterns.push(/phone|tel|mobile|cell/i);
      }
      if (fieldName.includes('address')) {
        patterns.push(/address|addr|location|street/i);
      }

      patternMap[field.field] = patterns;
    });

    // Score each possible mapping
    const scores: Array<{ target: string; source: string; score: number }> = [];

    targetFields.forEach(targetField => {
      const patterns = patternMap[targetField.field];
      
      sourceColumns.forEach(sourceColumn => {
        let score = 0;
        const sourceLower = sourceColumn.toLowerCase();

        // Exact match gets highest score
        if (sourceLower === targetField.field.toLowerCase() || 
            sourceLower === targetField.label.toLowerCase()) {
          score = 100;
        } else {
          // Pattern matching
          patterns.forEach(pattern => {
            if (pattern.test(sourceColumn)) {
              score += 10;
            }
          });

          // Data type matching bonus
          if (detectedTypes[sourceColumn] === targetField.dataType) {
            score += 20;
          }
        }

        if (score > 0) {
          scores.push({ target: targetField.field, source: sourceColumn, score });
        }
      });
    });

    // Sort by score and apply best matches
    scores.sort((a, b) => b.score - a.score);
    const usedSources = new Set<string>();

    scores.forEach(({ target, source, score }) => {
      if (!newMappings.has(target) && !usedSources.has(source) && score >= 10) {
        const targetField = targetFields.find(f => f.field === target);
        if (targetField) {
          newMappings.set(target, source);
          newDataTypes.set(target, targetField.dataType);
          newAutoMapped.add(target);
          usedSources.add(source);
        }
      }
    });

    setMappings(newMappings);
    setDataTypes(newDataTypes);
    setAutoMapped(newAutoMapped);
  }, [sourceColumns, targetFields, detectedTypes]);

  const handleMappingChange = (targetField: string, sourceColumn: string) => {
    const newMappings = new Map(mappings);
    
    if (sourceColumn === "") {
      newMappings.delete(targetField);
    } else {
      // Remove any existing mapping for this source column
      const existingMapping = Array.from(newMappings.entries()).find(
        ([field, column]) => column === sourceColumn && field !== targetField
      );
      
      if (existingMapping) {
        newMappings.delete(existingMapping[0]);
      }
      
      newMappings.set(targetField, sourceColumn);
    }
    
    setMappings(newMappings);
    
    // Remove from auto-mapped if manually changed
    if (autoMapped.has(targetField)) {
      const newAutoMapped = new Set(autoMapped);
      newAutoMapped.delete(targetField);
      setAutoMapped(newAutoMapped);
    }
  };

  const handleDataTypeChange = (targetField: string, dataType: DataType) => {
    const newDataTypes = new Map(dataTypes);
    newDataTypes.set(targetField, dataType);
    setDataTypes(newDataTypes);
  };

  const validateMappings = (): boolean => {
    const newErrors: string[] = [];

    // Check required fields
    const requiredFields = targetFields.filter(f => f.required);
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

    const columnMappings: ColumnMapping[] = [];

    mappings.forEach((sourceColumn, targetField) => {
      const field = targetFields.find(f => f.field === targetField);
      if (field) {
        columnMappings.push({
          sourceColumn,
          targetField,
          dataType: dataTypes.get(targetField) || field.dataType,
          required: field.required,
          format: field.format,
          validation: field.validation,
          defaultValue: field.defaultValue,
        });
      }
    });

    onMappingComplete(columnMappings);
  };

  const handleSaveTemplate = () => {
    if (!onTemplateSave) return;

    const columnMappings: ColumnMapping[] = [];

    mappings.forEach((sourceColumn, targetField) => {
      const field = targetFields.find(f => f.field === targetField);
      if (field) {
        columnMappings.push({
          sourceColumn,
          targetField,
          dataType: dataTypes.get(targetField) || field.dataType,
          required: field.required,
        });
      }
    });

    onTemplateSave(columnMappings);
  };

  const getSampleValue = (column: string, index = 0): string => {
    if (!sampleData[index]) return "";
    const value = sampleData[index][column];
    return value !== undefined && value !== null ? String(value) : "";
  };

  const getMappingStatus = () => {
    const required = targetFields.filter(f => f.required).length;
    const mapped = targetFields.filter(f => f.required && mappings.has(f.field)).length;
    return { required, mapped, total: targetFields.length, totalMapped: mappings.size };
  };

  const status = getMappingStatus();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Map Columns to Fields</h3>
          <div className="flex items-center gap-2">
            {autoMap && (
              <Button
                variant="outline"
                size="sm"
                onClick={autoMapColumns}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Auto-Map
              </Button>
            )}
            {onTemplateSave && mappings.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveTemplate}
              >
                Save Template
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Match your data columns to the corresponding fields. Required fields are marked with *.
        </p>
        <div className="flex items-center gap-4 mt-3 text-sm">
          <span>
            Required: {status.mapped}/{status.required}
          </span>
          <span className="text-muted-foreground">
            Total: {status.totalMapped}/{status.total}
          </span>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="flex items-center space-x-2">
        <Switch
          id="advanced"
          checked={showAdvanced}
          onCheckedChange={setShowAdvanced}
        />
        <Label htmlFor="advanced">Show advanced options</Label>
      </div>

      {/* Mapping Grid */}
      <div className="space-y-3">
        {targetFields.map((targetField) => {
          const isAutoMapped = autoMapped.has(targetField.field);
          const selectedColumn = mappings.get(targetField.field) || "";
          const dataType = dataTypes.get(targetField.field) || targetField.dataType;
          const detectedType = selectedColumn ? detectedTypes[selectedColumn] : undefined;

          return (
            <Card key={targetField.field} className="p-4">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Target Field */}
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
                  {targetField.description && (
                    <p className="text-xs text-muted-foreground">
                      {targetField.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Type: {dataType}
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Source Column */}
                <div className="space-y-2">
                  <Select
                    value={selectedColumn}
                    onValueChange={(value) =>
                      handleMappingChange(targetField.field, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {sourceColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                          {detectedTypes[column] && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({detectedTypes[column]})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sample Value */}
                  {selectedColumn && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Sample: {getSampleValue(selectedColumn) || "(empty)"}
                      </p>
                      {detectedType && detectedType !== dataType && (
                        <p className="text-xs text-amber-600">
                          Detected as {detectedType}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Advanced Options */}
                  {showAdvanced && selectedColumn && (
                    <Select
                      value={dataType}
                      onValueChange={(value: DataType) =>
                        handleDataTypeChange(targetField.field, value)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Errors */}
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

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {status.totalMapped} of {status.total} fields mapped
          {status.mapped >= status.required && (
            <CheckCircle2 className="ml-2 inline h-4 w-4 text-green-500" />
          )}
        </div>

        <Button
          onClick={handleComplete}
          disabled={status.mapped < status.required}
        >
          Continue to Validation
        </Button>
      </div>
    </div>
  );
}