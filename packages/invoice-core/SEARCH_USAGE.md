# Invoice Core - Smart Search Usage Guide

The invoice-core package now includes a fully extensible smart search system for line items that can be configured for different business types.

## Quick Start

### 1. Basic Setup (Construction/Dirt Business)

```typescript
import { 
  getConstructionPreset,
  UnifiedSearch 
} from '@midday/invoice-core';

// In your invoice form component
function InvoiceLineItems() {
  const trpc = useTRPC();
  
  // Setup search function
  const searchJobs = async (query: string, options: any) => {
    const result = await trpc.job.search.query({ 
      q: query,
      ...options 
    });
    return result.data;
  };
  
  // Get preset configuration
  const preset = getConstructionPreset(searchJobs);
  
  // Handle item selection
  const handleSelect = (lineItem: LineItemMetadata) => {
    // Add to form
    append(lineItem);
  };
  
  return (
    <UnifiedSearch
      providers={preset.searchProviders.providers}
      onSelect={handleSelect}
      placeholder="Search jobs..."
      customerId={customerId}
    />
  );
}
```

### 2. Multi-Provider Setup (Service Business)

```typescript
import { 
  getServicePreset,
  UnifiedSearch 
} from '@midday/invoice-core';

function InvoiceLineItems() {
  const trpc = useTRPC();
  
  // Setup multiple search functions
  const searchServices = async (query: string) => {
    return await trpc.services.search.query({ q: query });
  };
  
  const searchJobs = async (query: string) => {
    return await trpc.jobs.search.query({ q: query });
  };
  
  // Get preset with multiple providers
  const preset = getServicePreset(searchServices, searchJobs);
  
  return (
    <UnifiedSearch
      providers={preset.searchProviders.providers}
      onSelect={handleSelect}
      enableMultiSearch={true} // Show results from all providers
      placeholder="Search services or jobs..."
    />
  );
}
```

### 3. Custom Search Provider

```typescript
import { SearchProvider, LineItemMetadata } from '@midday/invoice-core';

class CustomSearchProvider implements SearchProvider {
  id = 'custom';
  name = 'My Custom Search';
  
  async search(query: string, options?: SearchOptions) {
    // Your custom search logic
    const results = await myCustomAPI.search(query);
    
    return results.map(item => ({
      id: item.id,
      title: item.name,
      subtitle: item.category,
      metadata: this.transformToLineItem(item),
      displayData: item,
    }));
  }
  
  transformToLineItem(result: any): LineItemMetadata {
    return {
      name: result.name,
      quantity: 1,
      price: result.price,
      // Add your custom fields
      customField1: result.customData,
    };
  }
}
```

## Business Type Presets

### Construction/Dirt Moving
```typescript
const preset = getConstructionPreset(jobSearchFn);
// Includes: Job search, weighbridge fields, EPA levy tracking
```

### Retail/E-commerce
```typescript
const preset = getRetailPreset(catalogSearchFn);
// Includes: Product catalog, SKU tracking, inventory
```

### Professional Services
```typescript
const preset = getServicePreset(serviceSearchFn, jobSearchFn);
// Includes: Service catalog, hourly billing, project tracking
```

### Freelance/Consulting
```typescript
const preset = getFreelancePreset(serviceSearchFn, catalogSearchFn);
// Includes: Mixed services/products, milestone tracking
```

### Custom/Hybrid
```typescript
const preset = getHybridPreset({
  jobs: jobSearchFn,
  catalog: catalogSearchFn,
  services: serviceSearchFn,
});
// Includes: All providers, maximum flexibility
```

## Advanced Features

### Custom Result Components

```typescript
class MyProvider implements SearchProvider {
  // ... other methods
  
  ResultComponent = ({ result, onSelect }) => (
    <div onClick={() => onSelect(result)}>
      <img src={result.displayData.imageUrl} />
      <span>{result.title}</span>
      <button>Quick Add</button>
    </div>
  );
}
```

### Search Hooks

```typescript
import { useLineItemSearch } from '@midday/invoice-core';

function MyComponent() {
  const {
    search,
    searchAll,
    isSearching,
    results,
    transformToLineItem,
  } = useLineItemSearch({
    providers: [/* your providers */],
    enableMultiSearch: true,
  });
  
  // Use the hook for custom search UI
}
```

### Custom Fields in Line Items

The `ExtendedLineItem` type supports any custom fields:

```typescript
interface ExtendedLineItem extends BaseLineItem {
  // Standard fields
  name: string;
  quantity?: number;
  price?: number;
  unit?: string;
  
  // Any custom fields
  [key: string]: any;
}
```

This means you can add business-specific fields without modifying the core package:

```typescript
const lineItem: ExtendedLineItem = {
  name: "Custom Service",
  quantity: 1,
  price: 100,
  
  // Your custom fields
  projectPhase: "Development",
  contractNumber: "C-2024-001",
  approvalStatus: "Pending",
  customMetadata: { /* any data */ },
};
```

## Migration from Existing Code

### From Midday's DescriptionWithJobSearch

```typescript
// Before
<DescriptionWithJobSearch
  name={name}
  index={index}
  // ... props
/>

// After
<UnifiedSearch
  providers={[new JobSearchProvider(searchJobs)]}
  onSelect={(lineItem) => {
    setValue(`lineItems.${index}`, lineItem);
  }}
  renderInput={(props) => <Editor {...props} />}
/>
```

### From Workbooks' ItemSelector

```typescript
// Before
<ItemSelector
  onSelect={handleSelectFromCatalog}
  trigger={/* ... */}
/>

// After
<UnifiedSearch
  providers={[new CatalogSearchProvider(searchCatalog)]}
  onSelect={handleSelectFromCatalog}
/>
```

## Benefits

1. **Extensible**: Add any search provider without modifying core
2. **Type-Safe**: Full TypeScript support with generics
3. **Business-Specific**: Pre-configured for common business types
4. **Flexible**: Mix and match providers as needed
5. **Future-Proof**: Easy to add new fields and providers
6. **Reusable**: Share search logic across different UIs