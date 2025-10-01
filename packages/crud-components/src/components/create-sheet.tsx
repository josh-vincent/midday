"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import type {
  BaseEntity,
  FormConfig,
  FormField as FormFieldConfig,
  SheetConfig,
} from "../types";

interface CreateSheetProps<T extends BaseEntity> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formConfig: FormConfig<Omit<T, "id" | "createdAt" | "updatedAt">>;
  onCreate: (data: Omit<T, "id" | "createdAt" | "updatedAt">) => Promise<T>;
  title?: string;
  description?: string;
  sheetConfig?: SheetConfig;
  submitText?: string;
  cancelText?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Generic create sheet component for creating new entities
 * 
 * @param props Configuration props for the create sheet
 * @returns Create sheet component
 * 
 * @example
 * ```tsx
 * const customerFormConfig: FormConfig<CustomerCreate> = {
 *   schema: z.object({
 *     name: z.string().min(2, "Name must be at least 2 characters"),
 *     email: z.string().email("Invalid email address"),
 *     phone: z.string().optional(),
 *   }),
 *   fields: [
 *     { name: "name", label: "Customer Name", type: "text", required: true },
 *     { name: "email", label: "Email Address", type: "email", required: true },
 *     { name: "phone", label: "Phone Number", type: "text" },
 *   ],
 * };
 * 
 * <CreateSheet
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   formConfig={customerFormConfig}
 *   onCreate={createCustomer}
 *   title="Create New Customer"
 *   description="Add a new customer to your database"
 * />
 * ```
 */
export function CreateSheet<T extends BaseEntity>({
  open,
  onOpenChange,
  formConfig,
  onCreate,
  title = "Create New Item",
  description = "Fill in the information below to create a new item.",
  sheetConfig,
  submitText = "Create",
  cancelText = "Cancel",
  onSuccess,
  onError,
}: CreateSheetProps<T>) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(formConfig.schema),
    defaultValues: formConfig.defaultValues || {},
    mode: formConfig.validation?.revalidateMode || "onSubmit",
  });

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await onCreate(data);
      form.reset();
      onOpenChange(false);
      onSuccess?.(result);
      toast({
        variant: "success",
        title: "Success",
        description: "Item created successfully",
      });
    } catch (error) {
      const err = error as Error;
      onError?.(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create item",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
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
          />
        );

      case "datetime":
        return (
          <Input
            type="datetime-local"
            placeholder={placeholder}
            {...field}
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
            <Button
              type="submit"
              disabled={isLoading}
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