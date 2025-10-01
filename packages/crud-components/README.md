# @midday/crud-components

A comprehensive collection of reusable CRUD (Create, Read, Update, Delete) components and hooks for React applications. Built with TypeScript, Zod validation, and designed to work seamlessly with the Midday UI system.

## Features

### 🎯 Core Components
- **CreateSheet**: Generic create entity sheet with dynamic form generation
- **EditSheet**: Edit entity sheet with optimistic updates and conflict resolution
- **DeleteConfirmation**: Delete confirmation dialog with bulk support
- **BulkEditSheet**: Edit multiple items at once with selective field updates
- **ImportSheet**: CSV/Excel import with field mapping and validation
- **ExportDialog**: Export data in multiple formats (CSV, Excel, JSON, PDF)

### 🔧 Powerful Hooks
- **useCRUD**: Main hook for CRUD operations with caching and state management
- **useOptimisticUpdate**: Optimistic updates with automatic rollback
- **useImport**: Handle file imports with parsing, validation, and mapping
- **useExport**: Export data with progress tracking and format options
- **useBulkOperations**: Manage bulk operations with batching and progress

### ✨ Advanced Features
- Optimistic updates with rollback
- Error handling and recovery
- Loading states and skeleton screens
- Form validation with Zod
- File upload support
- Progress indicators for bulk operations
- Undo/redo support
- Conflict resolution for concurrent edits
- Field mapping for imports
- Multiple export formats

## Installation

```bash
# Using bun (recommended)
bun add @midday/crud-components

# Using npm
npm install @midday/crud-components

# Using yarn
yarn add @midday/crud-components
```

## Quick Start

### 1. Define Your Entity Type

```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Create a Data Provider

```typescript
import { DataProvider } from "@midday/crud-components";

const customerAPI: DataProvider<Customer> = {
  create: async (data) => {
    const response = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  update: async (id, data) => {
    const response = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  
  delete: async (id) => {
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
  },
  
  get: async (id) => {
    const response = await fetch(`/api/customers/${id}`);
    return response.json();
  },
  
  list: async (params) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/customers?${query}`);
    return response.json();
  },
};
```

### 3. Set Up Form Configuration

```typescript
import { z } from "zod";
import { FormConfig } from "@midday/crud-components";

const customerFormConfig: FormConfig<Omit<Customer, "id" | "createdAt" | "updatedAt">> = {
  schema: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    company: z.string().optional(),
    status: z.enum(["active", "inactive"]),
  }),
  
  fields: [
    { name: "name", label: "Customer Name", type: "text", required: true },
    { name: "email", label: "Email Address", type: "email", required: true },
    { name: "phone", label: "Phone Number", type: "phone" },
    { name: "company", label: "Company", type: "text" },
    { 
      name: "status", 
      label: "Status", 
      type: "select", 
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ]
    },
  ],
  
  layout: {
    columns: 2,
    sections: [
      {
        title: "Basic Information",
        fields: ["name", "email"],
      },
      {
        title: "Additional Details",
        fields: ["phone", "company", "status"],
      },
    ],
  },
};
```

### 4. Use CRUD Components

```typescript
import {
  useCRUD,
  CreateSheet,
  EditSheet,
  DeleteConfirmation,
  useDeleteConfirmation,
} from "@midday/crud-components";

function CustomerManagement() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>();
  
  const deleteConfirmation = useDeleteConfirmation<Customer>();
  
  const customerCRUD = useCRUD({
    dataProvider: customerAPI,
    optimisticUpdates: { enabled: true },
    enableUndo: true,
  });

  useEffect(() => {
    customerCRUD.fetchList();
  }, []);

  return (
    <div>
      {/* Customer List */}
      <div className="space-y-4">
        <Button onClick={() => setCreateOpen(true)}>
          Add Customer
        </Button>
        
        {customerCRUD.data.map((customer) => (
          <div key={customer.id} className="flex items-center justify-between p-4 border rounded">
            <div>
              <h3>{customer.name}</h3>
              <p>{customer.email}</p>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCustomer(customer);
                  setEditOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmation.confirmDelete(customer)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CRUD Components */}
      <CreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        formConfig={customerFormConfig}
        onCreate={customerCRUD.create}
        title="Create New Customer"
      />

      <EditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        entity={selectedCustomer!}
        formConfig={customerFormConfig}
        onUpdate={customerCRUD.update}
        title="Edit Customer"
        optimisticUpdates={true}
      />

      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={deleteConfirmation.setIsOpen}
        entity={deleteConfirmation.targetEntity}
        onDelete={async (ids) => {
          for (const id of ids) {
            await customerCRUD.delete(id);
          }
        }}
        getEntityName={(customer) => customer.name}
      />
    </div>
  );
}
```

## Advanced Usage

### Bulk Operations

```typescript
import { BulkEditSheet, useBulkOperations } from "@midday/crud-components";

function CustomerBulkEdit() {
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  const bulkEditConfig: FormConfig<Partial<Customer>> = {
    schema: z.object({
      status: z.enum(["active", "inactive"]).optional(),
      company: z.string().optional(),
    }),
    fields: [
      { 
        name: "status", 
        label: "Status", 
        type: "select",
        options: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]
      },
      { name: "company", label: "Company", type: "text" },
    ],
  };

  return (
    <BulkEditSheet
      open={bulkEditOpen}
      onOpenChange={setBulkEditOpen}
      entities={selectedCustomers}
      formConfig={bulkEditConfig}
      onBulkUpdate={async (ids, data) => {
        // Implement bulk update logic
        return customerAPI.bulkUpdate?.(ids, data) || [];
      }}
      title="Edit Multiple Customers"
    />
  );
}
```

### Import/Export

```typescript
import { ImportSheet, ExportDialog, ExportColumn } from "@midday/crud-components";

function CustomerImportExport() {
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  
  const customerFields = [
    { key: "name", label: "Customer Name", required: true },
    { key: "email", label: "Email Address", required: true },
    { key: "phone", label: "Phone Number" },
    { key: "company", label: "Company" },
  ];

  const exportColumns: ExportColumn<Customer>[] = [
    { key: "name", label: "Customer Name" },
    { key: "email", label: "Email Address" },
    { key: "phone", label: "Phone Number" },
    { key: "company", label: "Company" },
    { 
      key: "createdAt", 
      label: "Created Date", 
      format: (date) => new Date(date).toLocaleDateString() 
    },
  ];

  return (
    <div>
      <Button onClick={() => setImportOpen(true)}>
        Import Customers
      </Button>
      
      <Button onClick={() => setExportOpen(true)}>
        Export Customers
      </Button>

      <ImportSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={async (data) => {
          // Handle import logic
          return { success: [], errors: [], total: 0, processed: 0 };
        }}
        entityFields={customerFields}
        title="Import Customers"
      />

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        data={customers}
        availableColumns={exportColumns}
        title="Export Customers"
        defaultFilename="customers"
      />
    </div>
  );
}
```

## API Reference

### Core Hooks

#### useCRUD
Main hook for CRUD operations with state management.

```typescript
const crud = useCRUD({
  dataProvider: customerAPI,
  optimisticUpdates: { enabled: true },
  enableUndo: true,
  onError: (error, operation) => console.error(error),
  onSuccess: (data, operation) => console.log('Success:', data),
});
```

#### useOptimisticUpdate
Handle optimistic updates with automatic rollback.

```typescript
const optimistic = useOptimisticUpdate({
  rollbackDelay: 5000,
  onRollback: (error, originalData) => {
    toast.error("Update failed, changes reverted");
  },
});
```

### Components

All components are fully typed and accept comprehensive configuration options. See the TypeScript definitions for detailed prop interfaces.

## TypeScript Support

This package is built with TypeScript and provides comprehensive type definitions. All components and hooks are fully typed with generics to ensure type safety with your entity types.

## Contributing

This package is part of the Midday monorepo. Please refer to the main repository for contribution guidelines.

## License

MIT License - see the main repository for details.