import { z } from "zod";

export const StorageProviderSchema = z.enum([
  "s3",
  "gcs", 
  "azure",
  "local",
  "cloudflare_r2",
  "digitalocean_spaces"
]);

export const StorageConfigSchema = z.object({
  provider: StorageProviderSchema,
  region: z.string().optional(),
  bucket: z.string(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  endpoint: z.string().optional(),
  forcePathStyle: z.boolean().optional(),
  credentials: z.record(z.string()).optional(),
  maxFileSize: z.number().default(10 * 1024 * 1024), // 10MB
  allowedMimeTypes: z.array(z.string()).optional(),
  encryption: z.object({
    enabled: z.boolean().default(false),
    algorithm: z.string().optional(),
    keyId: z.string().optional(),
  }).optional(),
  versioning: z.boolean().default(false),
  lifecycle: z.object({
    enabled: z.boolean().default(false),
    rules: z.array(z.object({
      id: z.string(),
      prefix: z.string().optional(),
      days: z.number(),
      action: z.enum(["delete", "archive", "transition"]),
      storageClass: z.string().optional(),
    })),
  }).optional(),
});

export const FileMetadataSchema = z.object({
  id: z.string(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  path: z.string(),
  bucket: z.string(),
  url: z.string().optional(),
  tags: z.record(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  checksum: z.string().optional(),
  uploadedBy: z.string().optional(),
  uploadedAt: z.date(),
  lastModified: z.date(),
  expiresAt: z.date().optional(),
  isPublic: z.boolean().default(false),
  version: z.string().optional(),
  thumbnails: z.array(z.object({
    size: z.string(),
    url: z.string(),
    width: z.number(),
    height: z.number(),
  })).optional(),
});

export const StorageOperationSchema = z.object({
  id: z.string(),
  type: z.enum(["upload", "download", "delete", "copy", "move", "list"]),
  fileId: z.string().optional(),
  path: z.string(),
  size: z.number().optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed", "cancelled"]),
  progress: z.number().min(0).max(100).default(0),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  error: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const StorageStatsSchema = z.object({
  totalFiles: z.number(),
  totalSize: z.number(),
  usedSpace: z.number(),
  availableSpace: z.number().optional(),
  filesByType: z.record(z.number()),
  uploadsByDate: z.record(z.number()),
  averageFileSize: z.number(),
  largestFile: z.object({
    filename: z.string(),
    size: z.number(),
  }).optional(),
  oldestFile: z.object({
    filename: z.string(),
    uploadedAt: z.date(),
  }).optional(),
});

export type StorageProvider = z.infer<typeof StorageProviderSchema>;
export type StorageConfig = z.infer<typeof StorageConfigSchema>;
export type FileMetadata = z.infer<typeof FileMetadataSchema>;
export type StorageOperation = z.infer<typeof StorageOperationSchema>;
export type StorageStats = z.infer<typeof StorageStatsSchema>;

export interface StorageRepository {
  // File metadata management
  saveFileMetadata(metadata: FileMetadata): Promise<void>;
  getFileMetadata(id: string): Promise<FileMetadata | null>;
  updateFileMetadata(id: string, updates: Partial<FileMetadata>): Promise<FileMetadata>;
  deleteFileMetadata(id: string): Promise<void>;
  listFiles(filter?: {
    bucket?: string;
    path?: string;
    mimeType?: string;
    uploadedBy?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<FileMetadata[]>;

  // Operation tracking
  createOperation(operation: Omit<StorageOperation, "id">): Promise<StorageOperation>;
  updateOperation(id: string, updates: Partial<StorageOperation>): Promise<StorageOperation>;
  getOperation(id: string): Promise<StorageOperation | null>;
  listOperations(filter?: {
    type?: string;
    status?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<StorageOperation[]>;

  // Statistics
  getStats(filter?: {
    bucket?: string;
    uploadedBy?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<StorageStats>;
}