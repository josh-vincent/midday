import { z } from "zod";

export const FileTypeSchema = z.enum([
  "image",
  "video", 
  "audio",
  "document",
  "spreadsheet",
  "presentation",
  "pdf",
  "text",
  "archive",
  "code",
  "other"
]);

export const ImageFormatSchema = z.enum([
  "jpeg",
  "jpg", 
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
  "tiff"
]);

export const VideoFormatSchema = z.enum([
  "mp4",
  "avi",
  "mov",
  "wmv",
  "flv",
  "webm",
  "mkv",
  "m4v"
]);

export const DocumentFormatSchema = z.enum([
  "pdf",
  "doc",
  "docx", 
  "txt",
  "rtf",
  "odt",
  "pages"
]);

export const FileValidationSchema = z.object({
  minSize: z.number().optional(),
  maxSize: z.number().optional(),
  allowedMimeTypes: z.array(z.string()).optional(),
  allowedExtensions: z.array(z.string()).optional(),
  blockedMimeTypes: z.array(z.string()).optional(),
  blockedExtensions: z.array(z.string()).optional(),
  requireSignature: z.boolean().default(false),
  maxDimensions: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
  minDimensions: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
});

export const FileProcessingSchema = z.object({
  resize: z.object({
    enabled: z.boolean().default(false),
    sizes: z.array(z.object({
      name: z.string(),
      width: z.number(),
      height: z.number(),
      quality: z.number().min(1).max(100).default(90),
      format: ImageFormatSchema.optional(),
      crop: z.boolean().default(false),
    })),
  }).optional(),
  compression: z.object({
    enabled: z.boolean().default(false),
    quality: z.number().min(1).max(100).default(85),
    progressive: z.boolean().default(true),
  }).optional(),
  watermark: z.object({
    enabled: z.boolean().default(false),
    image: z.string(),
    position: z.enum(["top-left", "top-right", "bottom-left", "bottom-right", "center"]),
    opacity: z.number().min(0).max(1).default(0.5),
  }).optional(),
  thumbnail: z.object({
    enabled: z.boolean().default(false),
    width: z.number().default(150),
    height: z.number().default(150),
    quality: z.number().min(1).max(100).default(80),
  }).optional(),
});

export const FileScanResultSchema = z.object({
  id: z.string(),
  fileId: z.string(),
  scannedAt: z.date(),
  status: z.enum(["clean", "infected", "suspicious", "error"]),
  threats: z.array(z.object({
    type: z.string(),
    name: z.string(),
    severity: z.enum(["low", "medium", "high", "critical"]),
    description: z.string(),
  })),
  engine: z.string(),
  engineVersion: z.string(),
  scanDuration: z.number(), // milliseconds
  fileSize: z.number(),
  checksum: z.string(),
});

export const FileAccessLogSchema = z.object({
  id: z.string(),
  fileId: z.string(),
  userId: z.string().optional(),
  action: z.enum(["view", "download", "share", "delete", "copy", "move"]),
  timestamp: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const FilePermissionSchema = z.object({
  fileId: z.string(),
  userId: z.string().optional(),
  groupId: z.string().optional(),
  roleId: z.string().optional(),
  permissions: z.array(z.enum([
    "read",
    "write", 
    "delete",
    "share",
    "admin"
  ])),
  grantedBy: z.string(),
  grantedAt: z.date(),
  expiresAt: z.date().optional(),
  conditions: z.object({
    ipWhitelist: z.array(z.string()).optional(),
    timeRestrictions: z.object({
      startTime: z.string(),
      endTime: z.string(),
      timezone: z.string(),
      daysOfWeek: z.array(z.number()),
    }).optional(),
    downloadLimit: z.number().optional(),
    accessCount: z.number().default(0),
  }).optional(),
});

export type FileType = z.infer<typeof FileTypeSchema>;
export type ImageFormat = z.infer<typeof ImageFormatSchema>;
export type VideoFormat = z.infer<typeof VideoFormatSchema>;
export type DocumentFormat = z.infer<typeof DocumentFormatSchema>;
export type FileValidation = z.infer<typeof FileValidationSchema>;
export type FileProcessing = z.infer<typeof FileProcessingSchema>;
export type FileScanResult = z.infer<typeof FileScanResultSchema>;
export type FileAccessLog = z.infer<typeof FileAccessLogSchema>;
export type FilePermission = z.infer<typeof FilePermissionSchema>;

export interface FileManager {
  // File type detection
  detectFileType(filename: string, mimeType?: string): FileType;
  getFileExtension(filename: string): string;
  getMimeType(filename: string): string;
  
  // File validation
  validateFile(file: {
    filename: string;
    size: number;
    mimeType: string;
    content?: Buffer;
  }, validation: FileValidation): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
  
  // File processing
  processImage(
    buffer: Buffer,
    processing: FileProcessing,
    format?: ImageFormat
  ): Promise<{
    processed: Buffer;
    thumbnails: Array<{
      name: string;
      buffer: Buffer;
      width: number;
      height: number;
    }>;
    metadata: {
      width: number;
      height: number;
      format: string;
      size: number;
    };
  }>;
  
  // File security
  scanFile(fileId: string, buffer: Buffer): Promise<FileScanResult>;
  quarantineFile(fileId: string, reason: string): Promise<void>;
  
  // File permissions
  grantPermission(permission: Omit<FilePermission, "grantedAt">): Promise<void>;
  revokePermission(fileId: string, userId: string): Promise<void>;
  checkPermission(fileId: string, userId: string, action: string): Promise<boolean>;
  
  // Access logging
  logAccess(log: Omit<FileAccessLog, "id" | "timestamp">): Promise<void>;
  getAccessLogs(fileId: string, limit?: number): Promise<FileAccessLog[]>;
}