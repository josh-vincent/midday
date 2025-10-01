"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Users, CheckCircle, XCircle } from "lucide-react";
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
import { Progress } from "@midday/ui/progress";
import { Alert, AlertDescription } from "@midday/ui/alert";
import { Badge } from "@midday/ui/badge";
import { toast } from "@midday/ui/use-toast";
import { useBulkOperations } from "../hooks/use-bulk-operations";
import type {
  BaseEntity,
  FormConfig,
  FormField as FormFieldConfig,
  SheetConfig,
} from "../types";

interface BulkEditSheetProps<T extends BaseEntity> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entities: T[];
  formConfig: FormConfig<Partial<T>>;
  onBulkUpdate: (ids: string[], data: Partial<T>) => Promise<T[]>;
  getEntityName?: (entity: T) => string;
  title?: string;
  description?: string;
  sheetConfig?: SheetConfig;
  submitText?: string;
  cancelText?: string;
  batchSize?: number;
  onSuccess?: (results: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Generic bulk edit sheet component for updating multiple entities
 * 
 * @param props Configuration props for the bulk edit sheet
 * @returns Bulk edit sheet component
 * 
 * @example
 * ```tsx
 * const customerBulkEditConfig: FormConfig<Partial<Customer>> = {
 *   schema: z.object({
 *     status: z.string().optional(),
 *     tags: z.array(z.string()).optional(),
 *     notes: z.string().optional(),
 *   }),
 *   fields: [
 *     { name: "status", label: "Status", type: "select", options: [
 *       { value: "active", label: "Active" },
 *       { value: "inactive", label: "Inactive" },
 *     ]},
 *     { name: "notes", label: "Notes", type: "textarea" },
 *   ],
 * };
 * 
 * <BulkEditSheet
 *   open={isBulkEditOpen}
 *   onOpenChange={setIsBulkEditOpen}
 *   entities={selectedCustomers}
 *   formConfig={customerBulkEditConfig}
 *   onBulkUpdate={bulkUpdateCustomers}
 *   title="Edit Multiple Customers"
 * />
 * ```
 */
export function BulkEditSheet<T extends BaseEntity>({
  open,
  onOpenChange,
  entities,
  formConfig,
  onBulkUpdate,
  getEntityName = (entity: T) => `${entity.id}`,
  title = "Bulk Edit",
  description,
  sheetConfig,
  submitText = "Update All",
  cancelText = "Cancel",
  batchSize = 50,
  onSuccess,
  onError,
}: BulkEditSheetProps<T>) {
  const [fieldsToUpdate, setFieldsToUpdate] = React.useState<Set<string>>(new Set());
  
  const form = useForm({
    resolver: zodResolver(formConfig.schema),
    defaultValues: formConfig.defaultValues || {},
    mode: formConfig.validation?.revalidateMode || "onSubmit",
  });

  const bulkOps = useBulkOperations<T>({
    defaultBatchSize: batchSize,
    onProgress: (progress) => {
      console.log("Bulk edit progress:", progress);
    },
    onComplete: (result) => {
      onSuccess?.(result);
      onOpenChange(false);
      toast({
        variant: result.errors.length > 0 ? "warning" : "success",
        title: "Bulk update completed",
        description: `${result.success.length} items updated${
          result.errors.length > 0 ? `, ${result.errors.length} failed` : ""
        }`,
      });
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const defaultDescription = `Update ${entities.length} selected items. Only checked fields will be modified.`;

  const handleSubmit = async (data: any) => {
    // Filter data to only include fields that are selected for update
    const updateData: Partial<T> = {};
    fieldsToUpdate.forEach((fieldName) => {
      if (data[fieldName] !== undefined) {
        updateData[fieldName as keyof T] = data[fieldName];
      }
    });

    if (fieldsToUpdate.size === 0) {
      toast({
        variant: "destructive",
        title: "No fields selected",
        description: "Please select at least one field to update",
      });
      return;
    }

    const entityIds = entities.map(e => e.id);
    await bulkOps.bulkUpdate(entityIds, updateData, onBulkUpdate);
  };

  const handleCancel = () => {
    form.reset();
    setFieldsToUpdate(new Set());
    onOpenChange(false);
  };

  const handleFieldToggle = (fieldName: string) => {
    const newFields = new Set(fieldsToUpdate);
    if (newFields.has(fieldName)) {
      newFields.delete(fieldName);
    } else {
      newFields.add(fieldName);
    }
    setFieldsToUpdate(newFields);
  };

  const renderField = (fieldConfig: FormFieldConfig<any>) => {
    const { name, label, type, placeholder, description, options, conditional } = fieldConfig;
    const fieldName = name as string;
    const isSelected = fieldsToUpdate.has(fieldName);

    // Check conditional visibility
    if (conditional) {
      const dependentValue = form.watch(conditional.dependsOn as string);
      if (!conditional.condition(dependentValue)) {
        return null;
      }
    }

    return (
      <div key={fieldName} className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`field-${fieldName}`}
            checked={isSelected}
            onCheckedChange={() => handleFieldToggle(fieldName)}
          />
          <Label
            htmlFor={`field-${fieldName}`}
            className="text-sm font-medium cursor-pointer flex-1"
          >
            {label}
          </Label>
        </div>
        
        {isSelected && (
          <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  {renderFieldInput(type, field, placeholder, options)}
                </FormControl>
                {description && <FormDescription>{description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
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

      case "date":
        return (
          <Input
            type="date"
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

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setFieldsToUpdate(new Set());
      form.reset();
      bulkOps.reset();
    }
  }, [open, form, bulkOps]);

  return (
    <BaseSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description || defaultDescription}
      size="lg"
      {...sheetConfig}
    >
      <div className="space-y-6">
        {/* Selected Items Summary */}
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Editing {entities.length} selected item{entities.length !== 1 ? 's' : ''}
              </span>
              <Badge variant="secondary">
                {entities.length} items
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Bulk Operation Progress */}
        {bulkOps.isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Updating items...</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{bulkOps.progress.message}</span>
                <span>{bulkOps.progress.current}/{bulkOps.progress.total}</span>
              </div>
              <Progress value={(bulkOps.progress.current / bulkOps.progress.total) * 100} />
            </div>
            {bulkOps.results && (
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  {bulkOps.results.success.length} successful
                </div>
                {bulkOps.results.errors.length > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-3 w-3" />
                    {bulkOps.results.errors.length} failed
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!bulkOps.isProcessing && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Field Selection and Input */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Fields to Update</h3>
                  <p className="text-sm text-muted-foreground">
                    Select the fields you want to update and provide new values
                  </p>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {formConfig.fields.map(renderField)}
                </div>

                {fieldsToUpdate.size > 0 && (
                  <Alert>
                    <AlertDescription>
                      {fieldsToUpdate.size} field{fieldsToUpdate.size !== 1 ? 's' : ''} selected for update.
                      These changes will be applied to all {entities.length} selected items.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Entity Preview */}
              {entities.length <= 10 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Items to update:</h4>
                  <div className="rounded-md border p-3 bg-muted/50 max-h-32 overflow-y-auto">
                    <div className="space-y-1">
                      {entities.map((entity) => (
                        <div key={entity.id} className="text-sm text-muted-foreground flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {getEntityName(entity)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={bulkOps.isProcessing}
                  className="flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  type="submit"
                  disabled={bulkOps.isProcessing || fieldsToUpdate.size === 0}
                  className="flex-1"
                >
                  {bulkOps.isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {submitText}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </BaseSheet>
  );
}