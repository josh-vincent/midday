# @midday/import-export

A comprehensive data import/export package supporting multiple file formats, data transformation, validation, and mapping capabilities.

## Features

- **Multi-Format Support**: CSV, Excel (XLSX/XLS), JSON, XML import/export
- **Data Transformation**: Field mapping, data type conversion, validation
- **Column Mapping**: Interactive UI for mapping source to target fields
- **File Upload**: Drag-and-drop file upload with progress tracking
- **Data Validation**: Schema validation, business rule validation
- **Batch Processing**: Large file processing with progress indicators
- **Error Handling**: Detailed error reporting and data recovery
- **Preview**: Data preview before import/export operations
- **Templates**: Reusable import/export templates

## Installation

```bash
npm install @midday/import-export
```

## Quick Start

### Basic CSV Import

```typescript
import { ImportExportManager, CSVImporter } from "@midday/import-export";

const manager = new ImportExportManager();

// Import CSV file
const result = await manager.importFile({
  file: csvFile,
  type: "csv",
  mapping: {
    "First Name": "firstName",
    "Last Name": "lastName", 
    "Email": "email",
    "Phone": "phone",
  },
  validation: {
    required: ["firstName", "lastName", "email"],
    email: ["email"],
    phone: ["phone"],
  },
});

console.log(`Imported ${result.successCount} records`);
if (result.errors.length > 0) {
  console.log(`${result.errors.length} errors occurred`);
}
```

### Excel Export

```typescript
import { ExcelExporter } from "@midday/import-export";

const exporter = new ExcelExporter();

// Export data to Excel
const buffer = await exporter.export({
  data: customers,
  sheets: [
    {
      name: "Customers",
      columns: [
        { key: "id", header: "ID", width: 10 },
        { key: "firstName", header: "First Name", width: 20 },
        { key: "lastName", header: "Last Name", width: 20 },
        { key: "email", header: "Email", width: 30 },
        { key: "createdAt", header: "Created", width: 15, format: "date" },
      ],
    },
  ],
  formatting: {
    headerStyle: {
      font: { bold: true },
      fill: { fgColor: "CCCCCC" },
    },
  },
});

// Save or download the file
fs.writeFileSync("customers.xlsx", buffer);
```

### Column Mapping UI

```tsx
import { ColumnMapper, FileUploader } from "@midday/import-export";

function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    
    // Generate preview
    const previewData = await generatePreview(uploadedFile);
    setPreview(previewData);
  };

  const handleMappingChange = (sourceField: string, targetField: string) => {
    setMapping(prev => ({
      ...prev,
      [sourceField]: targetField,
    }));
  };

  const handleImport = async () => {
    if (!file) return;

    const result = await importManager.importFile({
      file,
      type: "csv",
      mapping,
      validation: {
        required: ["name", "email"],
        email: ["email"],
      },
    });

    // Handle import result
    console.log(`Imported ${result.successCount} records`);
  };

  return (
    <div>
      <FileUploader
        onFileSelect={handleFileUpload}
        acceptedTypes={[".csv", ".xlsx", ".json"]}
        maxFileSize={10 * 1024 * 1024} // 10MB
      />

      {file && preview.length > 0 && (
        <ColumnMapper
          sourceFields={Object.keys(preview[0] || {})}
          targetFields={["id", "name", "email", "phone", "address"]}
          mapping={mapping}
          onMappingChange={handleMappingChange}
          preview={preview.slice(0, 5)}
        />
      )}

      <button onClick={handleImport} disabled={!file}>
        Import Data
      </button>
    </div>
  );
}
```

### Data Transformation

```typescript
import { DataTransformer } from "@midday/import-export";

const transformer = new DataTransformer();

// Transform data during import
const result = await manager.importFile({
  file: csvFile,
  type: "csv",
  mapping: {
    "Customer Name": "name",
    "Email Address": "email",
    "Phone Number": "phone",
    "Registration Date": "createdAt",
  },
  transforms: {
    name: (value) => value.trim().toLowerCase(),
    email: (value) => value.toLowerCase(),
    phone: (value) => value.replace(/[^\d]/g, ""),
    createdAt: (value) => new Date(value).toISOString(),
  },
  validation: {
    required: ["name", "email"],
    email: ["email"],
    custom: {
      phone: (value) => /^\d{10}$/.test(value) || "Phone must be 10 digits",
    },
  },
});
```

### Template-Based Import

```typescript
// Create reusable import template
const customerTemplate = {
  name: "Customer Import",
  description: "Standard customer data import",
  fileType: "csv",
  mapping: {
    "First Name": "firstName",
    "Last Name": "lastName",
    "Email": "email",
    "Phone": "phone",
    "Company": "company",
  },
  validation: {
    required: ["firstName", "lastName", "email"],
    email: ["email"],
  },
  transforms: {
    email: (value: string) => value.toLowerCase().trim(),
    phone: (value: string) => value.replace(/[^\d]/g, ""),
  },
};

// Use template for import
const result = await manager.importWithTemplate({
  file: csvFile,
  template: customerTemplate,
});
```

## API Reference

### ImportExportManager

Main class for coordinating import/export operations.

#### Methods

- `importFile(options)` - Import data from file
- `exportData(data, options)` - Export data to file
- `importWithTemplate(options)` - Import using predefined template
- `validateFile(file, schema)` - Validate file before import
- `generatePreview(file, options?)` - Generate data preview
- `getImportProgress(jobId)` - Get import job progress
- `cancelImport(jobId)` - Cancel running import

### DataTransformer

Handles data transformation and mapping.

#### Methods

- `transform(data, transforms)` - Apply transformations to data
- `mapFields(data, mapping)` - Map source fields to target fields
- `validateData(data, schema)` - Validate transformed data
- `cleanData(data, rules)` - Clean and normalize data
- `deduplicateData(data, rules)` - Remove duplicate records

### MappingEngine

Intelligent field mapping and suggestion engine.

#### Methods

- `suggestMapping(sourceFields, targetFields)` - Suggest field mappings
- `validateMapping(mapping, schema)` - Validate field mapping
- `generateMapping(source, target, options?)` - Auto-generate mapping
- `optimizeMapping(mapping, data)` - Optimize mapping based on data

## File Format Support

### CSV Import/Export

```typescript
const csvOptions = {
  delimiter: ",",
  quote: '"',
  escape: '"',
  header: true,
  encoding: "utf8",
  skipEmptyLines: true,
  skipLinesWithError: false,
};
```

### Excel Import/Export

```typescript
const excelOptions = {
  sheetName: "Sheet1",
  headerRow: 1,
  startRow: 2,
  startColumn: 1,
  dateFormat: "yyyy-mm-dd",
  numberFormat: "#,##0.00",
};
```

### JSON Import/Export

```typescript
const jsonOptions = {
  arrayPath: "data", // Path to array in nested JSON
  flattenObjects: true,
  preserveTypes: true,
  dateFormat: "iso",
};
```

### XML Import/Export

```typescript
const xmlOptions = {
  rootElement: "records",
  recordElement: "record",
  attributePrefix: "@",
  textElement: "#text",
  ignoreAttributes: false,
};
```

## Validation Rules

### Built-in Validators

```typescript
const validationRules = {
  required: ["name", "email"], // Required fields
  email: ["email", "contactEmail"], // Email format validation
  phone: ["phone", "mobile"], // Phone number validation
  url: ["website"], // URL validation
  number: ["age", "salary"], // Numeric validation
  date: ["birthDate", "hireDate"], // Date validation
  length: {
    name: { min: 2, max: 50 },
    description: { max: 500 },
  },
  range: {
    age: { min: 18, max: 65 },
    salary: { min: 0 },
  },
  pattern: {
    zipCode: /^\d{5}(-\d{4})?$/,
    ssn: /^\d{3}-\d{2}-\d{4}$/,
  },
  custom: {
    department: (value) => 
      ["sales", "marketing", "engineering"].includes(value.toLowerCase()) ||
      "Department must be sales, marketing, or engineering",
  },
};
```

### Business Rule Validation

```typescript
const businessRules = {
  // Cross-field validation
  endDateAfterStartDate: (record) => {
    if (record.startDate && record.endDate) {
      return new Date(record.endDate) > new Date(record.startDate) ||
        "End date must be after start date";
    }
    return true;
  },
  
  // Conditional requirements
  managerRequired: (record) => {
    if (record.department === "sales" && !record.managerId) {
      return "Manager is required for sales department";
    }
    return true;
  },
};
```

## Error Handling

### Import Errors

```typescript
interface ImportResult {
  successCount: number;
  errorCount: number;
  warnings: string[];
  errors: Array<{
    row: number;
    field: string;
    value: any;
    message: string;
    code: string;
  }>;
  data: any[];
  skippedRows: number[];
}

// Handle import errors
const result = await manager.importFile(options);

if (result.errors.length > 0) {
  // Generate error report
  const errorReport = result.errors.map(error => ({
    row: error.row,
    issue: `${error.field}: ${error.message}`,
    value: error.value,
  }));
  
  // Export error report
  await exporter.export({
    data: errorReport,
    filename: "import-errors.xlsx",
  });
}
```

### Recovery Options

```typescript
// Skip invalid rows and continue
const importOptions = {
  file: csvFile,
  errorHandling: {
    skipInvalidRows: true,
    maxErrors: 100,
    stopOnErrors: false,
  },
};

// Validate before import
const validationResult = await manager.validateFile(csvFile, schema);

if (validationResult.errors.length > 0) {
  // Show validation errors to user
  // Allow user to fix file or proceed with valid rows only
}
```

## Performance Optimization

### Large File Processing

```typescript
// Process large files in chunks
const importOptions = {
  file: largeFile,
  processing: {
    chunkSize: 1000, // Process 1000 rows at a time
    parallel: true, // Enable parallel processing
    progressCallback: (progress) => {
      console.log(`Progress: ${progress.percentage}%`);
      updateProgressBar(progress);
    },
  },
};

// Stream processing for very large files
const stream = await manager.importFileStream({
  file: veryLargeFile,
  batchSize: 500,
  onBatch: async (batch, index) => {
    // Process each batch
    await processBatch(batch);
    console.log(`Processed batch ${index}`);
  },
});
```

### Memory Management

```typescript
// Optimize memory usage for large datasets
const exportOptions = {
  data: largDataset,
  type: "csv",
  streaming: true, // Stream data instead of loading all in memory
  compression: true, // Compress output
  bufferSize: 8192, // Control buffer size
};
```

## React Components

### FileUploader

```tsx
<FileUploader
  onFileSelect={(file) => setSelectedFile(file)}
  acceptedTypes={[".csv", ".xlsx", ".json"]}
  maxFileSize={10 * 1024 * 1024} // 10MB
  multiple={false}
  disabled={uploading}
  className="border-dashed border-2 p-8"
>
  <div className="text-center">
    <Upload className="mx-auto h-12 w-12 text-gray-400" />
    <p className="mt-2 text-sm text-gray-600">
      Click to upload or drag and drop
    </p>
    <p className="text-xs text-gray-500">
      CSV, Excel, or JSON files up to 10MB
    </p>
  </div>
</FileUploader>
```

### ColumnMapper

```tsx
<ColumnMapper
  sourceFields={sourceFields}
  targetFields={targetFields}
  mapping={mapping}
  onMappingChange={(source, target) => 
    setMapping(prev => ({ ...prev, [source]: target }))
  }
  preview={previewData}
  required={["name", "email"]}
  suggestions={mappingSuggestions}
  onAutoMap={() => setMapping(autoGeneratedMapping)}
/>
```

## Testing

```bash
npm test
```

## License

Private package for Midday platform.