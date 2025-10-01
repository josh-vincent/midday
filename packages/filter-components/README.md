# @midday/filter-components

A comprehensive filter components package for unified search and filter UI components built on top of @midday/ui.

## Features

- **SearchField**: Debounced search input with clear button
- **DateRangePicker**: Date range selection with presets (Today, Last 7 days, Last 30 days, Custom)
- **MultiSelectFilter**: Multi-select dropdown with search functionality
- **TagFilter**: Tag-based filtering with visual chips
- **StatusFilter**: Status selection with colored indicators
- **AmountRangeFilter**: Min/max amount inputs with validation
- **SavedFilters**: Save and load filter presets
- **URL Sync**: Automatic synchronization with URL query parameters
- **TypeScript**: Full TypeScript support with comprehensive types

## Installation

This package is part of the Midday monorepo and uses workspace dependencies:

```bash
# Install dependencies
bun install
```

## Quick Start

### Basic Filter Setup

```tsx
import { useFilters, SearchField, DateRangePicker } from "@midday/filter-components";
import type { TransactionFilters } from "./types";

function TransactionFilters() {
  const { filter, setFilter, hasFilters, clearAllFilters } = useFilters<TransactionFilters>({
    search: "",
    dateRange: null,
    status: [],
  });

  return (
    <div className="space-y-4">
      <SearchField
        value={filter.search}
        onChange={(search) => setFilter({ ...filter, search })}
        config={{
          placeholder: "Search transactions...",
          debounceMs: 300,
          clearable: true,
        }}
      />
      
      <DateRangePicker
        value={filter.dateRange}
        onChange={(dateRange) => setFilter({ ...filter, dateRange })}
        clearable
      />
      
      {hasFilters && (
        <button onClick={clearAllFilters}>Clear All Filters</button>
      )}
    </div>
  );
}
```

### With URL Synchronization

```tsx
import { useFilters, useFilterSync } from "@midday/filter-components";

function TransactionPage() {
  const { filter, setFilter } = useFilters<TransactionFilters>();
  
  // Automatically sync with URL
  useFilterSync(filter, setFilter, {
    enabled: true,
    debounceMs: 500,
  });

  return (
    <div>
      {/* Your filter components */}
    </div>
  );
}
```

### Multi-Select Filters

```tsx
import { MultiSelectFilter } from "@midday/filter-components";

const statusOptions = [
  { label: "Active", value: "active", color: "#10b981" },
  { label: "Inactive", value: "inactive", color: "#ef4444" },
  { label: "Pending", value: "pending", color: "#f59e0b" },
];

function StatusFilters() {
  return (
    <MultiSelectFilter
      options={statusOptions}
      value={selectedStatuses}
      onChange={setSelectedStatuses}
      config={{
        placeholder: "Select statuses...",
        searchable: true,
        maxDisplay: 3,
      }}
    />
  );
}
```

### Saved Filters

```tsx
import { SavedFilters } from "@midday/filter-components";

function FilterManager() {
  return (
    <SavedFilters
      currentFilters={filters}
      onLoadFilter={setFilters}
      storageKey="transaction-filters"
    />
  );
}
```

## Components

### SearchField

Debounced search input with clear functionality.

**Props:**
- `value?: string` - Current search value
- `onChange?: (value: string) => void` - Callback when value changes
- `config?: SearchFieldConfig` - Configuration options
- `disabled?: boolean` - Whether the field is disabled
- `loading?: boolean` - Whether to show loading state

**Config Options:**
- `placeholder?: string` - Placeholder text
- `debounceMs?: number` - Debounce delay (default: 300ms)
- `clearable?: boolean` - Show clear button (default: true)
- `icon?: React.ReactNode` - Custom search icon

### DateRangePicker

Date range selection with preset options.

**Props:**
- `value?: DateRange` - Current date range
- `onChange?: (dateRange: DateRange | undefined) => void` - Callback when range changes
- `presets?: DateRangePreset[]` - Available preset options
- `placeholder?: string` - Placeholder text
- `clearable?: boolean` - Show clear button

**Built-in Presets:**
- Today
- Yesterday
- Last 7 days
- Last 30 days
- Last 90 days
- This month
- Last month
- This year
- Last year

### MultiSelectFilter

Multi-select dropdown with search and batch operations.

**Props:**
- `options: FilterOption[]` - Available options
- `value?: string[]` - Selected values
- `onChange?: (values: string[]) => void` - Callback when selection changes
- `config?: MultiSelectConfig` - Configuration options

**Config Options:**
- `placeholder?: string` - Placeholder text
- `searchPlaceholder?: string` - Search input placeholder
- `maxDisplay?: number` - Max items to display before showing count
- `clearable?: boolean` - Show clear button
- `searchable?: boolean` - Enable search functionality

### AmountRangeFilter

Min/max amount inputs with validation.

**Props:**
- `value?: AmountRange` - Current range
- `onChange?: (range: AmountRange | undefined) => void` - Callback when range changes
- `currency?: string` - Currency symbol (default: "$")
- `minPlaceholder?: string` - Min input placeholder
- `maxPlaceholder?: string` - Max input placeholder

### TagFilter

Tag-based filtering with visual chips.

**Props:**
- `availableTags: Tag[]` - Available tags
- `selectedTags?: string[]` - Selected tag IDs
- `onChange?: (tagIds: string[]) => void` - Callback when selection changes
- `maxDisplay?: number` - Max tags to display before showing count

### StatusFilter

Status selection with colored indicators.

**Props:**
- `options: StatusOption[]` - Available status options
- `value?: string[]` - Selected values
- `onChange?: (values: string[]) => void` - Callback when selection changes
- `multiple?: boolean` - Allow multiple selection
- `clearable?: boolean` - Show clear button

### SavedFilters

Save and load filter presets with localStorage persistence.

**Props:**
- `currentFilters: T` - Current filter state
- `onLoadFilter: (filters: T) => void` - Callback when loading a filter
- `storageKey?: string` - localStorage key

## Hooks

### useFilters

Main hook for filter state management.

```tsx
const { filter, setFilter, hasFilters, clearAllFilters } = useFilters<T>(
  initialFilters,
  defaultKeys
);
```

### useFilterSync

Synchronize filters with URL query parameters.

```tsx
const { syncToUrl, syncFromUrl, clearUrlFilters } = useFilterSync(
  filters,
  setFilters,
  { enabled: true, debounceMs: 300 }
);
```

### useDebounceFilter

Debounce filter values to prevent excessive updates.

```tsx
const debouncedValue = useDebounceFilter(value, { delay: 300 });
```

### useSavedFilters

Manage saved filter presets with localStorage.

```tsx
const {
  savedFilters,
  saveFilter,
  loadFilter,
  deleteFilter,
  exportFilters,
  importFilters,
} = useSavedFilters<T>("storage-key");
```

## Utilities

### Filter State Management

```tsx
import {
  hasActiveFilters,
  cleanFilters,
  areFiltersEqual,
  createEmptyFilterState,
  mergeFilters,
} from "@midday/filter-components";

// Check if any filters are active
const isActive = hasActiveFilters(filters);

// Remove null/undefined values
const cleaned = cleanFilters(filters);

// Compare filter states
const isEqual = areFiltersEqual(filters1, filters2);
```

### URL Serialization

```tsx
import {
  serializeFiltersToQuery,
  deserializeFiltersFromQuery,
} from "@midday/filter-components";

// Convert filters to URL query params
const query = serializeFiltersToQuery(filters);

// Convert URL query params to filters
const filters = deserializeFiltersFromQuery(query);
```

## TypeScript Support

The package provides comprehensive TypeScript types:

```tsx
import type {
  FilterState,
  FilterHookReturn,
  DateRangePreset,
  FilterOption,
  StatusOption,
  Tag,
  SavedFilter,
  AmountRange,
  SearchFieldConfig,
  MultiSelectConfig,
} from "@midday/filter-components";
```

## License

Private - part of the Midday monorepo.