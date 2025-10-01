# @midday/storage

A comprehensive file storage abstraction layer supporting multiple cloud providers, local storage, CDN integration, and advanced file management features.

## Features

- **Multi-Provider Support**: AWS S3, Google Cloud Storage, Azure Blob, Local Storage, Cloudflare R2, DigitalOcean Spaces
- **File Management**: Upload, download, delete, copy, move operations with metadata tracking
- **Image Processing**: Resize, compress, thumbnail generation, watermarking
- **File Validation**: MIME type checking, size limits, virus scanning
- **CDN Integration**: Automatic CDN distribution and cache management
- **Access Control**: File permissions, access logging, expiration
- **Versioning**: File version management and rollback capabilities
- **Analytics**: Storage usage statistics and reporting

## Installation

```bash
npm install @midday/storage
```

## Quick Start

### Basic Usage

```typescript
import { StorageManager, S3Provider } from "@midday/storage";

// Configure storage provider
const s3Provider = new S3Provider({
  provider: "s3",
  region: "us-east-1",
  bucket: "my-app-storage",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const storageManager = new StorageManager(s3Provider, repository);

// Upload a file
const file = await storageManager.upload({
  file: fileBuffer,
  filename: "document.pdf",
  mimeType: "application/pdf",
  path: "documents/",
  metadata: {
    userId: "user123",
    category: "invoice",
  },
});

// Download a file
const fileData = await storageManager.download(file.id);

// Get file metadata
const metadata = await storageManager.getFileMetadata(file.id);

// Delete a file
await storageManager.delete(file.id);
```

### Image Processing

```typescript
import { FileProcessor } from "@midday/storage";

const processor = new FileProcessor();

// Process image with multiple sizes
const result = await processor.processImage(imageBuffer, {
  resize: {
    enabled: true,
    sizes: [
      { name: "thumbnail", width: 150, height: 150, crop: true },
      { name: "medium", width: 500, height: 500 },
      { name: "large", width: 1200, height: 1200 },
    ],
  },
  compression: {
    enabled: true,
    quality: 85,
  },
  thumbnail: {
    enabled: true,
    width: 200,
    height: 200,
  },
});

// Upload processed images
const uploadPromises = [
  storageManager.upload({
    file: result.processed,
    filename: "image.jpg",
    path: "images/",
  }),
  ...result.thumbnails.map(thumb =>
    storageManager.upload({
      file: thumb.buffer,
      filename: `image-${thumb.name}.jpg`,
      path: "images/thumbnails/",
    })
  ),
];

await Promise.all(uploadPromises);
```

### File Validation

```typescript
import { FileValidator } from "@midday/storage";

const validator = new FileValidator();

// Validate uploaded file
const validation = await validator.validateFile(
  {
    filename: "document.pdf",
    size: fileBuffer.length,
    mimeType: "application/pdf",
    content: fileBuffer,
  },
  {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    requireSignature: true,
  }
);

if (!validation.valid) {
  throw new Error(`File validation failed: ${validation.errors.join(", ")}`);
}
```

### CDN Integration

```typescript
import { CDNManager } from "@midday/storage";

const cdnManager = new CDNManager({
  provider: "cloudflare",
  zoneId: "your-zone-id",
  apiToken: "your-api-token",
  domain: "cdn.yourdomain.com",
});

// Upload and distribute to CDN
const file = await storageManager.upload({
  file: fileBuffer,
  filename: "image.jpg",
  path: "images/",
  options: {
    distributeToCDN: true,
    cacheControl: "public, max-age=31536000",
  },
});

// Get CDN URL
const cdnUrl = await cdnManager.getCDNUrl(file.id);

// Purge from CDN cache
await cdnManager.purgeCache([file.path]);
```

### Access Control

```typescript
import { FileManager } from "@midday/storage";

const fileManager = new FileManager(repository);

// Grant file permissions
await fileManager.grantPermission({
  fileId: "file123",
  userId: "user456",
  permissions: ["read", "download"],
  grantedBy: "admin",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  conditions: {
    downloadLimit: 5,
    ipWhitelist: ["192.168.1.0/24"],
  },
});

// Check permissions
const canDownload = await fileManager.checkPermission("file123", "user456", "download");

// Log file access
await fileManager.logAccess({
  fileId: "file123",
  userId: "user456",
  action: "download",
  ipAddress: "192.168.1.100",
});
```

### Bulk Operations

```typescript
// Upload multiple files
const files = [
  { file: buffer1, filename: "doc1.pdf", path: "documents/" },
  { file: buffer2, filename: "doc2.pdf", path: "documents/" },
  { file: buffer3, filename: "doc3.pdf", path: "documents/" },
];

const uploadResults = await storageManager.uploadBatch(files);

// Copy files to different location
await storageManager.copyBatch(
  uploadResults.map(r => r.id),
  "documents/archive/"
);

// Delete multiple files
await storageManager.deleteBatch(uploadResults.map(r => r.id));
```

## API Reference

### StorageManager

Main class for file storage operations.

#### Methods

- `upload(options)` - Upload a single file
- `uploadBatch(files)` - Upload multiple files
- `download(fileId)` - Download file content
- `delete(fileId)` - Delete a file
- `deleteBatch(fileIds)` - Delete multiple files
- `copy(fileId, newPath)` - Copy file to new location
- `move(fileId, newPath)` - Move file to new location
- `getFileMetadata(fileId)` - Get file metadata
- `listFiles(filter?)` - List files with filtering
- `getStorageStats(filter?)` - Get storage usage statistics

### FileProcessor

Image and file processing utilities.

#### Methods

- `processImage(buffer, options)` - Process images with resize, compression, etc.
- `generateThumbnail(buffer, options)` - Generate image thumbnails
- `addWatermark(buffer, watermark)` - Add watermarks to images
- `extractMetadata(buffer, mimeType)` - Extract file metadata
- `convertFormat(buffer, fromFormat, toFormat)` - Convert between formats

### FileValidator

File validation and security scanning.

#### Methods

- `validateFile(file, rules)` - Validate file against rules
- `scanForViruses(buffer)` - Scan file for malware
- `checkMimeType(buffer, expectedType)` - Verify MIME type
- `validateSignature(buffer, filename)` - Check file signature

### CDNManager

CDN integration and cache management.

#### Methods

- `distributeFile(fileId)` - Distribute file to CDN
- `getCDNUrl(fileId)` - Get CDN URL for file
- `purgeCache(paths)` - Purge files from CDN cache
- `setCacheHeaders(fileId, headers)` - Set cache control headers
- `getDistributionStats()` - Get CDN distribution statistics

## Provider Configuration

### AWS S3

```typescript
const s3Provider = new S3Provider({
  provider: "s3",
  region: "us-east-1",
  bucket: "my-bucket",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  encryption: {
    enabled: true,
    algorithm: "AES256",
  },
});
```

### Google Cloud Storage

```typescript
const gcsProvider = new GCSProvider({
  provider: "gcs",
  bucket: "my-bucket",
  credentials: {
    projectId: "my-project",
    keyFilename: "path/to/keyfile.json",
  },
});
```

### Azure Blob Storage

```typescript
const azureProvider = new AzureProvider({
  provider: "azure",
  bucket: "my-container",
  credentials: {
    accountName: "mystorageaccount",
    accountKey: process.env.AZURE_STORAGE_KEY,
  },
});
```

### Local Storage

```typescript
const localProvider = new LocalProvider({
  provider: "local",
  bucket: "uploads",
  credentials: {
    basePath: "/var/storage",
  },
});
```

## File Processing Options

### Image Resize

```typescript
const processing = {
  resize: {
    enabled: true,
    sizes: [
      {
        name: "thumbnail",
        width: 150,
        height: 150,
        quality: 80,
        crop: true,
        format: "webp",
      },
      {
        name: "medium",
        width: 800,
        height: 600,
        quality: 85,
      },
    ],
  },
};
```

### Compression

```typescript
const processing = {
  compression: {
    enabled: true,
    quality: 85,
    progressive: true,
  },
};
```

### Watermarking

```typescript
const processing = {
  watermark: {
    enabled: true,
    image: "path/to/watermark.png",
    position: "bottom-right",
    opacity: 0.5,
  },
};
```

## Validation Rules

### File Size and Type

```typescript
const validation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ],
  allowedExtensions: [".jpg", ".png", ".pdf"],
  requireSignature: true,
};
```

### Image Dimensions

```typescript
const validation = {
  maxDimensions: { width: 4000, height: 4000 },
  minDimensions: { width: 100, height: 100 },
};
```

## Access Control

### File Permissions

```typescript
const permission = {
  fileId: "file123",
  userId: "user456",
  permissions: ["read", "download", "share"],
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  conditions: {
    downloadLimit: 10,
    ipWhitelist: ["192.168.1.0/24"],
    timeRestrictions: {
      startTime: "09:00",
      endTime: "17:00",
      timezone: "UTC",
      daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
    },
  },
};
```

## Testing

```bash
npm test
```

## License

Private package for Midday platform.