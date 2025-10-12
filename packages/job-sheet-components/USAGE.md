# Usage Guide

## Installation

The package is automatically available in your monorepo workspace. Add it to your app's `package.json`:

```json
{
  "dependencies": {
    "@midday/job-sheet-components": "workspace:*"
  }
}
```

## Basic Job Sheet

Use the basic job sheet for create/edit functionality:

```tsx
import { JobSheet } from "@midday/job-sheet-components/job-sheet";
import { useState } from "react";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    jobNumber: "",
    status: "delivered",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <JobSheet
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      formData={formData}
      onFormChange={setFormData}
      onSubmit={handleSubmit}
      onCancel={() => setIsOpen(false)}
      trpcClient={trpc}
    />
  );
}
```

## Enhanced Job View Sheet

Use the enhanced view sheet to display job details with all related information:

```tsx
import { JobViewSheet } from "@midday/job-sheet-components/job-view-sheet";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

function JobDetailsComponent({ jobId }: { jobId: string }) {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery({
    ...trpc.job.getById.queryOptions({ id: jobId }),
    enabled: !!jobId,
  });

  return (
    <JobViewSheet
      isOpen={true}
      onOpenChange={(open) => {
        if (!open) {
          // Handle close
        }
      }}
      data={data}
      isLoading={isLoading}
      onEdit={() => {
        // Switch to edit mode
      }}
      trpcClient={trpc}
      // Optional: Control which sections to show
      showCustomerSection={true}
      showLocationSection={true}
      showInvoiceSection={true}
      showTimelineSection={true}
    />
  );
}
```

## Using Individual Sections

You can also use individual sections in your own layouts:

```tsx
import {
  CustomerDetailsSection,
  LocationDetailsSection,
  InvoiceDetailsSection,
  TimelineSection,
} from "@midday/job-sheet-components/sections";
import { Accordion } from "@midday/ui/accordion";

function CustomJobView({ jobData }) {
  return (
    <Accordion type="single" collapsible>
      <CustomerDetailsSection
        data={jobData}
        customerId={jobData.customerId}
      />
      <LocationDetailsSection
        data={jobData}
        locationId={jobData.locationId}
      />
      <InvoiceDetailsSection
        data={jobData}
        invoiceId={jobData.invoiceId}
      />
      <TimelineSection
        events={jobData.timeline}
      />
    </Accordion>
  );
}
```

## TypeScript Types

Import types for better type safety:

```tsx
import type {
  JobData,
  JobViewSheetProps,
  TimelineEvent
} from "@midday/job-sheet-components/types";

const jobData: JobData = {
  id: "job-123",
  title: "Delivery Job",
  status: "in_progress",
  // ... other fields
};
```

## Customization

The components use the shared `@midday/ui` package for styling, so they'll automatically match your app's theme.

### Custom Status Colors

If you need custom status colors, you can override them in your app's CSS or create a wrapper component.

### Adding Custom Sections

Create your own accordion sections following the same pattern:

```tsx
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";

function CustomSection({ data }) {
  return (
    <AccordionItem value="custom" className="border-b">
      <AccordionTrigger className="py-3">
        <div className="flex items-center gap-2">
          <YourIcon className="size-4" />
          <span className="font-medium">Custom Section</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-2">
        {/* Your content */}
      </AccordionContent>
    </AccordionItem>
  );
}
```
