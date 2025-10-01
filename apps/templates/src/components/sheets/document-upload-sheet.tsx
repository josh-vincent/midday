"use client";

import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Progress } from "@midday/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import {
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  X,
  Plus,
  FolderOpen,
  Check,
  AlertCircle,
} from "lucide-react";
import type { MockFolder } from "@/lib/mock/documents-mock";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[], folderId?: string) => Promise<void>;
  folders: MockFolder[];
  selectedFolderId?: string | null;
};

type FileWithMetadata = {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  id: string;
  description?: string;
  tags: string[];
};

const typeIcons = {
  'application/pdf': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/vnd.ms-excel': FileText,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileText,
  'application/vnd.ms-powerpoint': FileText,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': FileText,
  'text/plain': FileText,
  'image/': Image,
  'video/': Video,
  'audio/': Music,
  'application/zip': Archive,
  'application/x-rar-compressed': Archive,
  'application/x-7z-compressed': Archive,
  'default': File,
};

const getFileIcon = (mimeType: string) => {
  for (const [type, icon] of Object.entries(typeIcons)) {
    if (type !== 'default' && mimeType.startsWith(type)) {
      return icon;
    }
  }
  return typeIcons.default;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const availableTags = [
  "important",
  "draft",
  "final",
  "confidential",
  "urgent",
  "review",
  "approved",
  "template",
  "legal",
  "financial",
  "marketing",
  "hr",
  "technical",
  "public",
  "internal",
  "client",
  "project",
  "policy",
  "guidelines",
];

export function DocumentUploadSheet({
  open,
  onOpenChange,
  onUpload,
  folders,
  selectedFolderId,
}: Props) {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(selectedFolderId || "folder_root");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = (newFiles: File[]) => {
    const filesWithMetadata: FileWithMetadata[] = newFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending",
      id: Math.random().toString(36).substr(2, 9),
      tags: [],
    }));

    setFiles((prev) => [...prev, ...filesWithMetadata]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileMetadata = (id: string, updates: Partial<FileWithMetadata>) => {
    setFiles((prev) => 
      prev.map((f) => f.id === id ? { ...f, ...updates } : f)
    );
  };

  const addTag = (fileId: string, tag: string) => {
    updateFileMetadata(fileId, {
      tags: files.find(f => f.id === fileId)?.tags.includes(tag) 
        ? files.find(f => f.id === fileId)?.tags || []
        : [...(files.find(f => f.id === fileId)?.tags || []), tag]
    });
  };

  const removeTag = (fileId: string, tag: string) => {
    updateFileMetadata(fileId, {
      tags: files.find(f => f.id === fileId)?.tags.filter(t => t !== tag) || []
    });
  };

  const simulateUpload = async (file: FileWithMetadata) => {
    updateFileMetadata(file.id, { status: "uploading" });
    
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      updateFileMetadata(file.id, { progress: i });
    }
    
    updateFileMetadata(file.id, { status: "completed" });
  };

  const handleUpload = async () => {
    setUploading(true);
    
    try {
      // Simulate uploading all files
      await Promise.all(files.map(simulateUpload));
      
      // Call the actual upload function
      await onUpload(
        files.map(f => f.file), 
        selectedFolder === "folder_root" ? undefined : selectedFolder
      );
      
      // Clear files and close sheet
      setFiles([]);
      onOpenChange(false);
    } catch (error) {
      // Mark all files as error
      setFiles(prev => prev.map(f => ({ ...f, status: "error" as const })));
    } finally {
      setUploading(false);
    }
  };

  const canUpload = files.length > 0 && files.every(f => f.status !== "uploading");
  const allCompleted = files.length > 0 && files.every(f => f.status === "completed");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Upload Documents</SheetTitle>
          <SheetDescription>
            Upload files to your document library
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Folder Selection */}
          <div>
            <Label>Upload to folder</Label>
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="folder_root">
                  <div className="flex items-center">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Root
                  </div>
                </SelectItem>
                {folders.filter(f => f.id !== "folder_root").map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Area */}
          {files.length === 0 && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Drop files here</h3>
                <p className="text-sm text-muted-foreground">
                  or click to browse your computer
                </p>
              </div>
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Files to upload ({files.length})</h3>
                {!uploading && (
                  <input
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                    id="add-more"
                  />
                )}
                {!uploading && (
                  <Label htmlFor="add-more" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Plus className="h-4 w-4 mr-2" />
                        Add More
                      </span>
                    </Button>
                  </Label>
                )}
              </div>

              <div className="space-y-3">
                {files.map((fileItem) => {
                  const Icon = getFileIcon(fileItem.file.type);
                  
                  return (
                    <div key={fileItem.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{fileItem.file.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(fileItem.file.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {fileItem.status === "completed" && (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                          {fileItem.status === "error" && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          {!uploading && fileItem.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(fileItem.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {fileItem.status === "uploading" && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{fileItem.progress}%</span>
                          </div>
                          <Progress value={fileItem.progress} />
                        </div>
                      )}

                      {fileItem.status === "pending" && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`desc-${fileItem.id}`}>Description (optional)</Label>
                            <Textarea
                              id={`desc-${fileItem.id}`}
                              placeholder="Add a description..."
                              value={fileItem.description || ""}
                              onChange={(e) => updateFileMetadata(fileItem.id, { description: e.target.value })}
                              className="mt-1"
                              rows={2}
                            />
                          </div>

                          <div>
                            <Label>Tags</Label>
                            <div className="mt-1">
                              <Select onValueChange={(tag) => addTag(fileItem.id, tag)}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Add tags..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableTags
                                    .filter(tag => !fileItem.tags.includes(tag))
                                    .map((tag) => (
                                    <SelectItem key={tag} value={tag}>
                                      {tag}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              {fileItem.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {fileItem.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="gap-1">
                                      {tag}
                                      <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => removeTag(fileItem.id, tag)}
                                      />
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          {files.length > 0 && (
            <div className="flex justify-between pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setFiles([])}
                disabled={uploading}
              >
                Clear All
              </Button>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                
                {allCompleted ? (
                  <Button onClick={() => onOpenChange(false)}>
                    Done
                  </Button>
                ) : (
                  <Button 
                    onClick={handleUpload}
                    disabled={!canUpload || uploading}
                  >
                    {uploading ? "Uploading..." : `Upload ${files.length} file(s)`}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}