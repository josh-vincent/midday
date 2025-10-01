"use client";

import React from "react";
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@midday/ui/button";
import { BaseSheet } from "@midday/overlay-components/base-sheet";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Progress } from "@midday/ui/progress";
import { Alert, AlertDescription } from "@midday/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Badge } from "@midday/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { toast } from "@midday/ui/use-toast";
import { useImport } from "../hooks/use-import";
import type {
  BaseEntity,
  ImportData,
  ImportResult,
  FieldMapping,
  SheetConfig,
} from "../types";

interface ImportSheetProps<T extends BaseEntity> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ImportData<T>) => Promise<ImportResult<T>>;
  entityFields: { key: keyof T; label: string; required?: boolean }[];
  title?: string;
  description?: string;
  sheetConfig?: SheetConfig;
  allowedFormats?: string[];
  maxFileSize?: number;
  sampleData?: Partial<T>[];
  onSuccess?: (result: ImportResult<T>) => void;
  onError?: (error: Error) => void;
}

/**
 * Generic import sheet component for importing entities from files
 * 
 * @param props Configuration props for the import sheet
 * @returns Import sheet component
 * 
 * @example
 * ```tsx
 * const customerFields = [
 *   { key: "name", label: "Customer Name", required: true },
 *   { key: "email", label: "Email Address", required: true },
 *   { key: "phone", label: "Phone Number" },
 *   { key: "company", label: "Company" },
 * ];
 * 
 * <ImportSheet
 *   open={isImportOpen}
 *   onOpenChange={setIsImportOpen}
 *   onImport={importCustomers}
 *   entityFields={customerFields}
 *   title="Import Customers"
 *   description="Import customers from CSV or Excel files"
 * />
 * ```
 */
export function ImportSheet<T extends BaseEntity>({
  open,
  onOpenChange,
  onImport,
  entityFields,
  title = "Import Data",
  description = "Import data from CSV or Excel files",
  sheetConfig,
  allowedFormats = [".csv", ".xlsx", ".xls"],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  sampleData,
  onSuccess,
  onError,
}: ImportSheetProps<T>) {
  const [currentStep, setCurrentStep] = React.useState<"upload" | "mapping" | "preview" | "import">("upload");
  const [file, setFile] = React.useState<File | null>(null);

  const importHook = useImport<T>({
    maxFileSize,
    allowedFormats,
    validateRow: (row, index) => {
      const errors: string[] = [];
      entityFields.forEach((field) => {
        if (field.required && !row[field.key]) {
          errors.push(`${field.label} is required`);
        }
      });
      return errors.length > 0 ? errors : null;
    },
    onProgress: (progress) => {
      console.log("Import progress:", progress);
    },
    onComplete: (result) => {
      onSuccess?.(result);
      toast({
        variant: result.errors.length > 0 ? "warning" : "success",
        title: "Import completed",
        description: `${result.success.length} records imported${
          result.errors.length > 0 ? `, ${result.errors.length} errors` : ""
        }`,
      });
    },
    onError: (error) => {
      onError?.(error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error.message,
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      setFile(selectedFile);
      await importHook.parseFile(selectedFile);
      setCurrentStep("mapping");
    } catch (error) {
      console.error("Failed to parse file:", error);
    }
  };

  const handleMappingComplete = () => {
    if (!importHook.hasMapping) {
      toast({
        variant: "destructive",
        title: "Mapping required",
        description: "Please map at least one field before proceeding",
      });
      return;
    }
    setCurrentStep("preview");
  };

  const handleImport = async () => {
    if (!importHook.canImport) return;
    
    setCurrentStep("import");
    try {
      await importHook.executeImport(onImport);
      onOpenChange(false);
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  const handleCancel = () => {
    importHook.reset();
    setCurrentStep("upload");
    setFile(null);
    onOpenChange(false);
  };

  const autoDetectMapping = () => {
    const mapping = importHook.autoDetectMapping(entityFields.map(f => f.key as string));
    importHook.setMapping(mapping);
  };

  const downloadTemplate = () => {
    const templateData = sampleData || [
      entityFields.reduce((obj, field) => {
        obj[field.label] = `Sample ${field.label}`;
        return obj;
      }, {} as any),
    ];

    const csvContent = [
      entityFields.map(f => f.label).join(","),
      ...templateData.map(row => 
        entityFields.map(f => row[f.label] || "").join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Upload a CSV or Excel file containing your data. Make sure your file includes headers in the first row.
        </AlertDescription>
      </Alert>

      <div className="text-center">
        <Button onClick={downloadTemplate} variant="outline" className="mb-4">
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-upload">Select File</Label>
        <Input
          id="file-upload"
          type="file"
          accept={allowedFormats.join(",")}
          onChange={handleFileChange}
          disabled={importHook.isLoading}
        />
        {file && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {file.name} ({Math.round(file.size / 1024)} KB)
          </div>
        )}
      </div>

      {importHook.progress.status === "running" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Parsing file...</span>
            <span>{importHook.progress.current}/{importHook.progress.total}</span>
          </div>
          <Progress value={(importHook.progress.current / importHook.progress.total) * 100} />
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium">File Requirements</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Supported formats: {allowedFormats.join(", ")}</li>
          <li>• Maximum file size: {Math.round(maxFileSize / 1024 / 1024)}MB</li>
          <li>• First row must contain column headers</li>
          <li>• Required fields: {entityFields.filter(f => f.required).map(f => f.label).join(", ")}</li>
        </ul>
      </div>
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Map Fields</h3>
          <p className="text-sm text-muted-foreground">
            Map your file columns to the corresponding fields
          </p>
        </div>
        <Button onClick={autoDetectMapping} variant="outline" size="sm">
          Auto-detect
        </Button>
      </div>

      <div className="space-y-4">
        {importHook.parsedData?.headers.map((header) => (
          <div key={header} className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium">{header}</Label>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <Select
                value={importHook.fieldMapping[header] || ""}
                onValueChange={(value) => {
                  const newMapping = { ...importHook.fieldMapping };
                  if (value) {
                    newMapping[header] = value;
                  } else {
                    delete newMapping[header];
                  }
                  importHook.setMapping(newMapping);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Skip this column</SelectItem>
                  {entityFields.map((field) => (
                    <SelectItem key={field.key as string} value={field.key as string}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setCurrentStep("upload")} className="flex-1">
          Back
        </Button>
        <Button onClick={handleMappingComplete} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const preview = importHook.previewImport(10);
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Preview Import</h3>
          <p className="text-sm text-muted-foreground">
            Review the first 10 rows of your import data
          </p>
        </div>

        {preview.errors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Found {preview.errors.length} validation errors. Please fix these issues before importing.
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {entityFields
                  .filter(field => Object.values(importHook.fieldMapping).includes(field.key as string))
                  .map((field) => (
                    <TableHead key={field.key as string}>{field.label}</TableHead>
                  ))}
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.data.slice(0, 10).map((row, index) => (
                <TableRow key={index}>
                  {entityFields
                    .filter(field => Object.values(importHook.fieldMapping).includes(field.key as string))
                    .map((field) => (
                      <TableCell key={field.key as string}>
                        {String(row[field.key] || "")}
                      </TableCell>
                    ))}
                  <TableCell>
                    <Badge variant="secondary">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Valid
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {preview.errors.slice(0, 5).map((error, index) => (
                <TableRow key={`error-${index}`}>
                  <TableCell colSpan={entityFields.length}>
                    <div className="text-destructive text-sm">
                      Row {error.row}: {error.message}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      Error
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep("mapping")} className="flex-1">
            Back
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={preview.errors.length > 0}
            className="flex-1"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import {preview.data.length} Records
          </Button>
        </div>
      </div>
    );
  };

  const renderImportStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Importing Data</h3>
        <p className="text-sm text-muted-foreground">
          Please wait while we import your data...
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{importHook.progress.message}</span>
          <span>{importHook.progress.current}/{importHook.progress.total}</span>
        </div>
        <Progress value={(importHook.progress.current / importHook.progress.total) * 100} />
      </div>

      {importHook.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {importHook.errors.length} errors occurred during import. Check the logs for details.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case "upload":
        return renderUploadStep();
      case "mapping":
        return renderMappingStep();
      case "preview":
        return renderPreviewStep();
      case "import":
        return renderImportStep();
      default:
        return renderUploadStep();
    }
  };

  return (
    <BaseSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="lg"
      {...sheetConfig}
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {[
            { key: "upload", label: "Upload" },
            { key: "mapping", label: "Map Fields" },
            { key: "preview", label: "Preview" },
            { key: "import", label: "Import" },
          ].map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
                  currentStep === step.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : index < ["upload", "mapping", "preview", "import"].indexOf(currentStep)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <span className="ml-2 text-sm font-medium">{step.label}</span>
              {index < 3 && <div className="ml-4 h-px w-8 bg-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Cancel Button */}
        {currentStep !== "import" && (
          <div className="flex justify-start pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </BaseSheet>
  );
}