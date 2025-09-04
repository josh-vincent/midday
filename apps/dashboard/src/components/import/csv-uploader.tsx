"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@midday/ui/button";
import { Card } from "@midday/ui/card";
import { Alert, AlertDescription } from "@midday/ui/alert";
import { Progress } from "@midday/ui/progress";
import { parseCSV, type CSVParseResult } from "@midday/utils/csv-parser";

interface CSVUploaderProps {
  onUpload: (result: CSVParseResult) => void;
  maxFileSize?: number; // in bytes
  accept?: string[];
}

export function CSVUploader({
  onUpload,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  accept = [".csv", ".xlsx", ".xls"],
}: CSVUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);
      setProgress(0);

      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles[0].errors;
        if (errors[0]?.code === "file-too-large") {
          setError(`File is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`);
        } else if (errors[0]?.code === "file-invalid-type") {
          setError("Invalid file type. Please upload a CSV or Excel file");
        } else {
          setError("Failed to upload file");
        }
        return;
      }

      if (acceptedFiles.length === 0) {
        return;
      }

      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      setUploading(true);

      try {
        // Simulate progress for better UX
        setProgress(20);

        // Parse the CSV file
        const result = await parseCSV(uploadedFile);
        
        setProgress(60);

        // Check for parsing errors
        if (result.errors.length > 0) {
          const criticalError = result.errors.find(e => e.type === "Quotes");
          if (criticalError) {
            throw new Error(`CSV parsing error at row ${criticalError.row}: ${criticalError.message}`);
          }
        }

        setProgress(80);

        // Check if we have data
        if (result.data.length === 0) {
          throw new Error("No data found in the file");
        }

        setProgress(100);

        // Call the onUpload callback with the parsed data
        onUpload(result);

        // Reset after successful upload
        setTimeout(() => {
          setFile(null);
          setProgress(0);
        }, 500);
      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Failed to parse CSV file");
        setFile(null);
      } finally {
        setUploading(false);
      }
    },
    [onUpload, maxFileSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    accept: accept.reduce((acc, ext) => {
      if (ext === ".csv") {
        acc["text/csv"] = [".csv"];
      } else if (ext === ".xlsx") {
        acc["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] = [".xlsx"];
      } else if (ext === ".xls") {
        acc["application/vnd.ms-excel"] = [".xls"];
      }
      return acc;
    }, {} as Record<string, string[]>),
    multiple: false,
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`
          relative overflow-hidden border-2 border-dashed p-8 text-center transition-colors
          ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
          ${uploading ? "pointer-events-none opacity-60" : "cursor-pointer"}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center space-y-4">
          {file ? (
            <>
              <FileSpreadsheet className="h-12 w-12 text-primary" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {isDragActive ? "Drop your file here" : "Drag & drop your CSV file here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse ({accept.join(", ")})
                </p>
              </div>
            </>
          )}

          {!file && !uploading && (
            <Button type="button" variant="outline" size="sm">
              Select File
            </Button>
          )}
        </div>

        {uploading && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <Progress value={progress} className="h-1 rounded-none" />
          </div>
        )}
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg bg-muted/50 p-4">
        <h4 className="mb-2 font-medium">Expected Format:</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• First row should contain column headers</li>
          <li>• Include: Ticket Number, Truck Rego, Gross Weight, Tare Weight</li>
          <li>• Dates should be in DD/MM/YYYY format</li>
          <li>• Maximum file size: {maxFileSize / 1024 / 1024}MB</li>
        </ul>
      </div>
    </div>
  );
}