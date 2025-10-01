// Core Form Fields
export { TextField } from "./components/text-field";
export { NumberField } from "./components/number-field";
export { SelectField } from "./components/select-field";
export { MultiSelectField } from "./components/multi-select-field";
export { DateField } from "./components/date-field";
export { DateRangeField } from "./components/date-range-field";
export { TextareaField } from "./components/textarea-field";
export { CheckboxField } from "./components/checkbox-field";
export { RadioGroupField } from "./components/radio-group-field";
export { SwitchField } from "./components/switch-field";
export { FileUploadField } from "./components/file-upload-field";
export { CurrencyField } from "./components/currency-field";
export { PercentageField } from "./components/percentage-field";
export { ComboboxField } from "./components/combobox-field";

// Advanced Components
export { FormArray } from "./components/form-array";

// Hooks
export { useForm } from "./hooks/use-form";

// Utilities
export * from "./utils/validation";

// Types
export type * from "./types";

// Re-export common types for convenience
export type {
  BaseFieldProps,
  Option,
  OptionGroup,
  FileData,
  FileUploadConfig,
  FormStep,
  FormFieldConfig,
  FormSectionConfig,
  FormConfig,
  FieldDependency,
  FormPersistenceConfig,
  ValidationRule,
  CurrencyConfig,
  DateRange,
  ColorValue,
} from "./types";