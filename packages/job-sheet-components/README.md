# @midday/job-sheet-components

Shared job sheet components for Midday applications.

## Features

- **Enhanced Job View Sheet**: Comprehensive job details view with accordion sections
- **Customer/Location Integration**: Rich relationship sections with quick links
- **Invoice/Quote Integration**: Direct access to related financial documents
- **Timeline & Activity**: Track job history and status changes
- **Asset Management**: Link and manage job-related assets
- **Keyboard Shortcuts**: Fast navigation and actions (⌘+S, ⌘+E, ⌘+M, ⌘+P)
- **Scheduling**: Advanced date/time picker with duration calculator

## Usage

```tsx
import { JobViewSheet } from '@midday/job-sheet-components/job-view-sheet';

function MyComponent() {
  return (
    <JobViewSheet
      jobId={jobId}
      onClose={() => {}}
      trpcClient={trpc}
    />
  );
}
```

## Components

- `job-sheet`: Basic job creation/edit sheet
- `job-view-sheet`: Enhanced view with all sections
- `sections/*`: Individual accordion sections (customer, location, invoice, quote, timeline, etc.)

## Exports

- `./job-sheet` - Basic job sheet component
- `./job-view-sheet` - Enhanced job view component
- `./sections` - All section components
- `./types` - TypeScript types
- `./hooks` - Shared hooks
