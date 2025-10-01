"use client";

import { Alert, AlertDescription } from "@midday/ui/alert";
import { Button } from "@midday/ui/button";
import { Card } from "@midday/ui/card";
import { Progress } from "@midday/ui/progress";
import { AlertCircle, FileSpreadsheet, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { CSVParseResult, ImportOptions } from "../types";
import { parseFile } from "../utils/parsers";

interface FileUploaderProps {
  onUpload: (result: CSVParseResult, file: File) => void;
  onError?: (error: Error) => void;
  accept?: string[];
  maxFileSize?: number;
  multiple?: boolean;
  importOptions?: ImportOptions;
  className?: string;
  children?: React.ReactNode;
}

export function FileUploader({
  onUpload,
  onError,
  accept = [".csv", ".xlsx", ".xls"],
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  multiple = false,
  importOptions,
  className,
  children,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);
      setProgress(0);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles[0].errors;
        if (errors[0]?.code === "file-too-large") {
          const message = `File is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB`;
          setError(message);
          onError?.(new Error(message));
        } else if (errors[0]?.code === "file-invalid-type") {
          const message = "Invalid file type. Please upload a CSV or Excel file";
          setError(message);
          onError?.(new Error(message));
        } else {
          const message = "Failed to upload file";
          setError(message);
          onError?.(new Error(message));
        }
        return;
      }

      if (acceptedFiles.length === 0) {
        return;
      }

      const filesToProcess = multiple ? acceptedFiles : [acceptedFiles[0]];
      setFiles(filesToProcess);
      setUploading(true);

      try {
        // Process each file
        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          
          // Update progress
          setProgress((i / filesToProcess.length) * 50);

          // Parse the file
          const result = await parseFile(file, importOptions);

          setProgress(((i + 1) / filesToProcess.length) * 80);

          // Check for parsing errors
          if (result.errors.length > 0) {
            const criticalError = result.errors.find(e => e.type === "Quotes");
            if (criticalError) {
              throw new Error(
                `Parsing error at row ${criticalError.row}: ${criticalError.message}`
              );
            }
          }

          // Check if we have data
          if (result.data.length === 0) {
            throw new Error("No data found in the file");
          }

          setProgress(((i + 1) / filesToProcess.length) * 100);

          // Call the onUpload callback
          onUpload(result, file);
        }

        // Reset after successful upload
        setTimeout(() => {
          if (!multiple) {
            setFiles([]);
          }
          setProgress(0);
        }, 500);
      } catch (err) {
        console.error("Upload error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to parse file";
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        setFiles([]);
      } finally {
        setUploading(false);
      }
    },
    [onUpload, onError, maxFileSize, multiple, importOptions]
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
      } else if (ext === ".txt") {
        acc["text/plain"] = [".txt"];
      }
      return acc;
    }, {} as Record<string, string[]>),
    multiple,
    disabled: uploading,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length === 1) {
      setError(null);
      setProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (children) {
    return (
      <div className={className}>
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          {children}
        </div>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
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
          {files.length > 0 ? (
            <div className="w-full space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  {!uploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {isDragActive
                    ? "Drop your file here"
                    : multiple
                    ? "Drag & drop files here"
                    : "Drag & drop your file here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {accept.join(", ")} • Max {Math.round(maxFileSize / 1024 / 1024)}MB
                </p>
              </div>
            </>
          )}

          {files.length === 0 && !uploading && (
            <Button type="button" variant="outline" size="sm">
              Select {multiple ? "Files" : "File"}
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
    </div>
  );
}