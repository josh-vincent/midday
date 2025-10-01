# @midday/form-components

A comprehensive form components package for Midday applications built on top of React Hook Form and Zod validation.

## Features

- 🎯 **Type-safe**: Full TypeScript support with Zod validation
- 🎨 **Consistent Design**: Built on @midday/ui components
- 🔧 **Developer Friendly**: Easy-to-use API with excellent DX
- 📱 **Responsive**: Mobile-first design approach
- ♿ **Accessible**: ARIA compliant and keyboard navigable
- 🚀 **Performance**: Optimized for minimal re-renders
- 🎭 **Flexible**: Highly customizable and extensible

## Installation

```bash
npm install @midday/form-components
```

## Quick Start

```tsx
import { useForm, TextField, NumberField, SelectField } from "@midday/form-components";
import { Form } from "@midday/ui/form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(18, "Must be 18 or older"),
  category: z.string().min(1, "Category is required"),
});

function MyForm() {
  const form = useForm({
    schema,
    defaultValues: {
      name: "",
      age: 0,
      category: "",
    },
    onSubmit: async (data) => {
      console.log(data);
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit} className="space-y-4">
        <TextField
          name="name"
          label="Full Name"
          placeholder="Enter your name"
          required
        />
        
        <NumberField
          name="age"
          label="Age"
          min={18}
          max={120}
        />
        
        <SelectField
          name="category"
          label="Category"
          options={[
            { label: "Developer", value: "dev" },
            { label: "Designer", value: "design" },
            { label: "Manager", value: "mgmt" },
          ]}
        />
        
        <button type="submit">Submit</button>
      </form>
    </Form>
  );
}
```

## Core Form Fields

### TextField
Text input with validation support.

```tsx
<TextField
  name="email"
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  required
  leftIcon={<Mail className="h-4 w-4" />}
/>
```

### NumberField
Numeric input with formatting and validation.

```tsx
<NumberField
  name="amount"
  label="Amount"
  decimalScale={2}
  thousandSeparator=","
  prefix="$"
  min={0}
/>
```

### SelectField
Single select dropdown with grouping support.

```tsx
<SelectField
  name="country"
  label="Country"
  options={[
    {
      label: "North America",
      options: [
        { label: "United States", value: "us" },
        { label: "Canada", value: "ca" },
      ],
    },
  ]}
/>
```

### MultiSelectField
Multi-select with tags and creation support.

```tsx
<MultiSelectField
  name="skills"
  label="Skills"
  options={skillOptions}
  maxSelected={5}
  creatable
  badgeVariant="secondary"
/>
```

### DateField
Date picker with customizable format and constraints.

```tsx
<DateField
  name="birthDate"
  label="Birth Date"
  dateFormat="PPP"
  toDate={new Date()}
  required
/>
```

### DateRangeField
Date range picker for selecting periods.

```tsx
<DateRangeField
  name="dateRange"
  label="Project Duration"
  numberOfMonths={2}
  showCompare
/>
```

### TextareaField
Multi-line text input with auto-resize.

```tsx
<TextareaField
  name="description"
  label="Description"
  rows={4}
  maxLength={500}
  autoResize
/>
```

### CheckboxField
Checkbox input with flexible labeling.

```tsx
<CheckboxField
  name="terms"
  text="I agree to the terms and conditions"
  required
/>
```

### RadioGroupField
Radio button group with layout options.

```tsx
<RadioGroupField
  name="plan"
  label="Subscription Plan"
  options={planOptions}
  orientation="horizontal"
/>
```

### SwitchField
Toggle switch for boolean values.

```tsx
<SwitchField
  name="notifications"
  text="Enable email notifications"
  description="Receive updates about your account"
/>
```

### FileUploadField
Drag & drop file upload with preview.

```tsx
<FileUploadField
  name="files"
  label="Upload Documents"
  multiple
  maxFiles={5}
  maxSize={10 * 1024 * 1024} // 10MB
  accept={{
    'image/*': ['.jpeg', '.jpg', '.png'],
    'application/pdf': ['.pdf'],
  }}
  showPreview
/>
```

### CurrencyField
Currency input with locale-aware formatting.

```tsx
<CurrencyField
  name="price"
  label="Price"
  currency="USD"
  locale="en-US"
  min={0}
/>
```

### PercentageField
Percentage input with range validation.

```tsx
<PercentageField
  name="discount"
  label="Discount"
  min={0}
  max={100}
  decimalScale={2}
/>
```

### ComboboxField
Searchable select with creation support.

```tsx
<ComboboxField
  name="technology"
  label="Technology"
  options={techOptions}
  searchPlaceholder="Search technologies..."
  creatable
/>
```

## Advanced Components

### FormArray
Dynamic field arrays with add/remove functionality.

```tsx
<FormArray
  name="items"
  label="Line Items"
  addButtonText="Add Item"
  defaultValue={{ name: "", quantity: 1, price: 0 }}
  minItems={1}
  maxItems={10}
  cardWrapper
>
  {({ index, remove }) => (
    <div className="grid grid-cols-3 gap-4">
      <TextField name={`items.${index}.name`} label="Item Name" />
      <NumberField name={`items.${index}.quantity`} label="Quantity" min={1} />
      <CurrencyField name={`items.${index}.price`} label="Price" min={0} />
    </div>
  )}
</FormArray>
```

## Enhanced useForm Hook

The enhanced `useForm` hook provides additional features beyond React Hook Form:

```tsx
const form = useForm({
  schema: mySchema,
  defaultValues: initialData,
  autoSave: {
    key: "my-form",
    storage: "localStorage",
    debounceMs: 1000,
    exclude: ["password"],
  },
  onSubmit: async (data) => {
    const processed = await processData(data);
    await api.submit(processed);
  },
  transformData: (data) => ({
    ...data,
    timestamp: new Date().toISOString(),
  }),
});
```

### Auto-save Features
- Automatic form persistence to localStorage/sessionStorage
- Configurable debounce timing
- Field exclusion from auto-save
- Automatic restoration on page reload

## Validation Utilities

Pre-built validation schemas for common use cases:

```tsx
import { stringValidation, numberValidation, dateValidation } from "@midday/form-components";

const schema = z.object({
  email: stringValidation.email(),
  age: numberValidation.min(18),
  birthDate: dateValidation.past(),
  password: passwordValidation.strong(),
  creditCard: creditCardValidation.number(),
});
```

## TypeScript Support

All components are fully typed with comprehensive interfaces:

```tsx
import type { 
  BaseFieldProps, 
  Option, 
  FormConfig, 
  ValidationRule 
} from "@midday/form-components";

interface CustomFieldProps extends BaseFieldProps {
  customProp: string;
}
```

## Styling and Theming

Components inherit styling from @midday/ui and support custom classes:

```tsx
<TextField
  name="field"
  className="custom-field-class"
  // All Tailwind classes work
/>
```

## Performance

- Minimal re-renders with React Hook Form's optimized updates
- Lazy validation with Zod schemas
- Efficient file handling with proper cleanup
- Debounced auto-save to prevent excessive storage writes

## Accessibility

- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader friendly
- Focus management
- Error announcements

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- ES2020+ JavaScript features

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add tests for new components
4. Ensure TypeScript types are correct
5. Submit a pull request

## License

MIT License - see LICENSE file for details.