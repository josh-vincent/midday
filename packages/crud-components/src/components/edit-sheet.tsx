"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@midday/ui/button";
import { BaseSheet } from "@midday/overlay-components/base-sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Textarea } from "@midday/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Checkbox } from "@midday/ui/checkbox";
import { toast } from "@midday/ui/use-toast";
import { Alert, AlertDescription } from "@midday/ui/alert";
import type {
  BaseEntity,
  FormConfig,
  FormField as FormFieldConfig,
  SheetConfig,
  ConflictResolution,
} from "../types";

interface EditSheetProps<T extends BaseEntity> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: T;
  formConfig: FormConfig<Partial<T>>;
  onUpdate: (id: string, data: Partial<T>) => Promise<T>;
  title?: string;
  description?: string;
  sheetConfig?: SheetConfig;
  submitText?: string;
  cancelText?: string;
  resetText?: string;
  showResetButton?: boolean;
  optimisticUpdates?: boolean;
  conflictResolution?: ConflictResolution<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onConflict?: (local: T, remote: T) => void;
}

/**
 * Generic edit sheet component for updating existing entities
 * 
 * @param props Configuration props for the edit sheet
 * @returns Edit sheet component
 * 
 * @example
 * ```tsx
 * const customerEditConfig: FormConfig<Partial<Customer>> = {
 *   schema: z.object({
 *     name: z.string().min(2).optional(),
 *     email: z.string().email().optional(),
 *     phone: z.string().optional(),
 *   }),
 *   fields: [
 *     { name: "name", label: "Customer Name", type: "text" },
 *     { name: "email", label: "Email Address", type: "email" },
 *     { name: "phone", label: "Phone Number", type: "text" },
 *   ],
 * };
 * 
 * <EditSheet
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   entity={customer}
 *   formConfig={customerEditConfig}
 *   onUpdate={updateCustomer}
 *   title="Edit Customer"
 *   showResetButton={true}
 * />
 * ```
 */
export function EditSheet<T extends BaseEntity>({
  open,
  onOpenChange,
  entity,
  formConfig,
  onUpdate,
  title = "Edit Item",
  description = "Make changes to the item below.",
  sheetConfig,
  submitText = "Save Changes",
  cancelText = "Cancel",
  resetText = "Reset",
  showResetButton = true,
  optimisticUpdates = false,
  conflictResolution,
  onSuccess,
  onError,
  onConflict,
}: EditSheetProps<T>) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [conflictData, setConflictData] = React.useState<T | null>(null);
  const originalDataRef = React.useRef<T>(entity);

  // Update original data when entity changes
  React.useEffect(() => {
    originalDataRef.current = entity;
  }, [entity]);

  const form = useForm({
    resolver: zodResolver(formConfig.schema),
    defaultValues: getFormDefaultValues(entity, formConfig),
    mode: formConfig.validation?.revalidateMode || "onSubmit",
  });

  // Watch for form changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === "change" && name) {
        const currentValues = form.getValues();
        const originalValues = getFormDefaultValues(originalDataRef.current, formConfig);
        const changed = JSON.stringify(currentValues) !== JSON.stringify(originalValues);
        setHasChanges(changed);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, formConfig]);

  function getFormDefaultValues(entity: T, config: FormConfig<Partial<T>>) {
    const defaults: any = {};
    config.fields.forEach((field) => {
      const fieldName = field.name as keyof T;
      defaults[fieldName] = entity[fieldName] ?? config.defaultValues?.[fieldName];
    });
    return defaults;
  }

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Filter out unchanged fields
      const changedData: Partial<T> = {};
      const originalValues = getFormDefaultValues(originalDataRef.current, formConfig);
      
      Object.keys(data).forEach((key) => {
        if (data[key] !== originalValues[key]) {
          changedData[key as keyof T] = data[key];
        }
      });

      if (Object.keys(changedData).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were made to save.",
        });
        onOpenChange(false);
        return;
      }

      const result = await onUpdate(entity.id, changedData);
      
      // Check for conflicts if conflict resolution is enabled
      if (conflictResolution && result.updatedAt !== entity.updatedAt) {
        setConflictData(result);
        onConflict?.(entity, result);
        return;
      }

      setHasChanges(false);
      onOpenChange(false);
      onSuccess?.(result);
      
      toast({
        variant: "success",
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (error) {
      const err = error as Error;
      onError?.(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update item",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (!confirmed) return;
    }
    form.reset();
    setHasChanges(false);
    onOpenChange(false);
  };

  const handleReset = () => {
    const confirmed = window.confirm("Are you sure you want to reset all changes?");
    if (confirmed) {
      form.reset(getFormDefaultValues(originalDataRef.current, formConfig));
      setHasChanges(false);
    }
  };

  const handleConflictResolution = async (strategy: "overwrite" | "merge" | "cancel") => {
    if (!conflictData) return;

    switch (strategy) {
      case "overwrite":
        // Proceed with original update
        const changedData: Partial<T> = {};
        const formValues = form.getValues();
        const originalValues = getFormDefaultValues(originalDataRef.current, formConfig);
        
        Object.keys(formValues).forEach((key) => {
          if (formValues[key] !== originalValues[key]) {
            changedData[key as keyof T] = formValues[key];
          }
        });

        try {
          const result = await onUpdate(entity.id, { ...changedData, updatedAt: conflictData.updatedAt });
          setConflictData(null);
          setHasChanges(false);
          onOpenChange(false);
          onSuccess?.(result);
          toast({
            variant: "success",
            title: "Changes saved",
            description: "Your changes have been saved, overwriting remote changes.",
          });
        } catch (error) {
          const err = error as Error;
          onError?.(err);
        }
        break;

      case "merge":
        // Merge with remote changes
        if (conflictResolution?.resolver) {
          const merged = conflictResolution.resolver(entity, conflictData);
          form.reset(getFormDefaultValues(merged, formConfig));
          originalDataRef.current = merged;
          setConflictData(null);
          setHasChanges(false);
        }
        break;

      case "cancel":
        // Discard local changes and use remote version
        form.reset(getFormDefaultValues(conflictData, formConfig));
        originalDataRef.current = conflictData;
        setConflictData(null);
        setHasChanges(false);
        break;
    }
  };

  const renderField = (fieldConfig: FormFieldConfig<any>) => {
    const { name, label, type, placeholder, description, required, options, conditional } = fieldConfig;

    // Check conditional visibility
    if (conditional) {
      const dependentValue = form.watch(conditional.dependsOn as string);
      if (!conditional.condition(dependentValue)) {
        return null;
      }
    }

    return (
      <FormField
        key={name as string}
        control={form.control}
        name={name as string}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {renderFieldInput(type, field, placeholder, options)}
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const renderFieldInput = (type: string, field: any, placeholder?: string, options?: any[]) => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            placeholder={placeholder}
            {...field}
          />
        );

      case "select":
        return (
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <label
              htmlFor={field.name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {placeholder}
            </label>
          </div>
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={placeholder}
            {...field}
            onChange={(e) => field.onChange(e.target.valueAsNumber)}
          />
        );

      case "email":
        return (
          <Input
            type="email"
            placeholder={placeholder}
            {...field}
          />
        );

      case "password":
        return (
          <Input
            type="password"
            placeholder={placeholder}
            {...field}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            placeholder={placeholder}
            {...field}
            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
          />
        );

      case "datetime":
        return (
          <Input
            type="datetime-local"
            placeholder={placeholder}
            {...field}
            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
          />
        );

      case "time":
        return (
          <Input
            type="time"
            placeholder={placeholder}
            {...field}
          />
        );

      case "url":
        return (
          <Input
            type="url"
            placeholder={placeholder}
            {...field}
          />
        );

      case "phone":
        return (
          <Input
            type="tel"
            placeholder={placeholder}
            {...field}
          />
        );

      default:
        return (
          <Input
            type="text"
            placeholder={placeholder}
            {...field}
          />
        );
    }
  };

  const renderFormLayout = () => {
    const { layout } = formConfig;
    
    if (layout?.sections) {
      return layout.sections.map((section, index) => (
        <div key={index} className="space-y-4">
          {section.title && (
            <div className="space-y-1">
              <h3 className="text-lg font-medium">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
            </div>
          )}
          <div className={`grid gap-4 ${layout.columns ? `grid-cols-${layout.columns}` : "grid-cols-1"}`}>
            {section.fields.map((fieldName) => {
              const fieldConfig = formConfig.fields.find(f => f.name === fieldName);
              return fieldConfig ? renderField(fieldConfig) : null;
            })}
          </div>
        </div>
      ));
    }

    return (
      <div className={`grid gap-4 ${layout?.columns ? `grid-cols-${layout.columns}` : "grid-cols-1"}`}>
        {formConfig.fields.map(renderField)}
      </div>
    );
  };

  return (
    <BaseSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      {...sheetConfig}
    >
      {conflictData && (
        <Alert className="mb-4">
          <AlertDescription>
            This item has been modified by someone else. How would you like to proceed?
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConflictResolution("overwrite")}
              >
                Overwrite
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConflictResolution("merge")}
                disabled={!conflictResolution?.resolver}
              >
                Merge
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConflictResolution("cancel")}
              >
                Use Remote Version
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {renderFormLayout()}
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              {cancelText}
            </Button>
            
            {showResetButton && hasChanges && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {resetText}
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={isLoading || !hasChanges}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitText}
            </Button>
          </div>
        </form>
      </Form>
    </BaseSheet>
  );
}