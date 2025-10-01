"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { cn } from "@midday/ui/cn";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Upload, X, File, Image } from "lucide-react";
import { forwardRef, useCallback, useId } from "react";
import { useFormContext } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import type { BaseFieldProps, FileData, FileUploadConfig } from "../types";

export interface FileUploadFieldProps extends BaseFieldProps, FileUploadConfig {
  /** Accept file types */
  accept?: Record<string, string[]>;
  /** Show file preview */
  showPreview?: boolean;
  /** Upload area text */
  uploadText?: string;
  /** Drop area text */
  dropText?: string;
  /** File size formatter */
  formatFileSize?: (bytes: number) => string;
}

/**
 * Default file size formatter
 */
const defaultFormatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * FileUploadField component for file upload with drag & drop
 * 
 * @example
 * ```tsx
 * <FileUploadField
 *   name="files"
 *   label="Upload Files"
 *   multiple
 *   maxFiles={5}
 *   maxSize={10 * 1024 * 1024} // 10MB
 *   accept={{
 *     'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
 *     'application/pdf': ['.pdf']
 *   }}
 * />
 * ```
 */
export const FileUploadField = forwardRef<HTMLDivElement, FileUploadFieldProps>(
  (
    {
      name,
      control,
      label,
      description,
      disabled,
      required,
      className,
      error,
      maxFiles = 1,
      maxSize = 5 * 1024 * 1024, // 5MB
      multiple = false,
      accept,
      showPreview = true,
      uploadText = "Choose files or drag and drop",
      dropText = "Drop files here",
      formatFileSize = defaultFormatFileSize,
      ...props
    },
    ref
  ) => {
    const uploadId = useId();
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("FileUploadField must be used within a Form or have control prop");
    }

    const onDrop = useCallback((acceptedFiles: File[], field: any) => {
      const currentFiles = field.value || [];
      const newFiles = acceptedFiles.map((file) => ({
        file,
        id: `${uploadId}-${Date.now()}-${Math.random()}`,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));

      const updatedFiles = multiple 
        ? [...currentFiles, ...newFiles].slice(0, maxFiles)
        : newFiles.slice(0, 1);

      field.onChange(updatedFiles);
    }, [uploadId, multiple, maxFiles]);

    const removeFile = useCallback((fileId: string, field: any) => {
      const currentFiles = field.value || [];
      const updatedFiles = currentFiles.filter((f: FileData) => f.id !== fileId);
      
      // Revoke object URLs to prevent memory leaks
      const removedFile = currentFiles.find((f: FileData) => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      
      field.onChange(updatedFiles);
    }, []);

    const isImage = (file: File) => file.type.startsWith('image/');

    return (
      <FormField
        control={formControl}
        name={name}
        render={({ field }) => {
          const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop: (files) => onDrop(files, field),
            accept,
            maxSize,
            multiple,
            disabled,
          });

          const files: FileData[] = field.value || [];

          return (
            <FormItem className={cn(className)} ref={ref}>
              {label && (
                <FormLabel>
                  {label}
                  {required && <span className="text-destructive ml-1">*</span>}
                </FormLabel>
              )}
              <FormControl>
                <div className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <input {...getInputProps()} {...props} />
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium">
                      {isDragActive ? dropText : uploadText}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {maxSize && `Max size: ${formatFileSize(maxSize)}`}
                      {maxFiles > 1 && ` • Max files: ${maxFiles}`}
                    </p>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((fileData) => (
                        <div
                          key={fileData.id}
                          className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
                        >
                          {showPreview && fileData.preview ? (
                            <img
                              src={fileData.preview}
                              alt="Preview"
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-muted-foreground/10 rounded flex items-center justify-center">
                              {isImage(fileData.file) ? (
                                <Image className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <File className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {fileData.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(fileData.file.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(fileData.id, field)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              {description && (
                <FormDescription>{description}</FormDescription>
              )}
              <FormMessage>{error}</FormMessage>
            </FormItem>
          );
        }}
      />
    );
  }
);

FileUploadField.displayName = "FileUploadField";