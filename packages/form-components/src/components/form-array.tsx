"use client";

import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { forwardRef, Fragment } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { BaseFieldProps } from "../types";

export interface FormArrayProps extends BaseFieldProps {
  /** Render function for each array item */
  children: (params: {
    field: any;
    index: number;
    remove: () => void;
    move: (from: number, to: number) => void;
  }) => React.ReactNode;
  /** Default value for new items */
  defaultValue?: any;
  /** Minimum number of items */
  minItems?: number;
  /** Maximum number of items */
  maxItems?: number;
  /** Add button text */
  addButtonText?: string;
  /** Remove button text */
  removeButtonText?: string;
  /** Whether items can be reordered */
  sortable?: boolean;
  /** Show item numbers */
  showItemNumbers?: boolean;
  /** Card wrapper for items */
  cardWrapper?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Add button variant */
  addButtonVariant?: "default" | "outline" | "ghost" | "secondary";
}

/**
 * FormArray component for dynamic field arrays (add/remove)
 * 
 * @example
 * ```tsx
 * <FormArray
 *   name="items"
 *   label="Items"
 *   addButtonText="Add Item"
 *   defaultValue={{ name: "", price: 0 }}
 *   minItems={1}
 *   maxItems={10}
 * >
 *   {({ field, index, remove }) => (
 *     <div className="space-y-4">
 *       <TextField name={`items.${index}.name`} label="Name" />
 *       <NumberField name={`items.${index}.price`} label="Price" />
 *       <Button onClick={remove} variant="outline">Remove</Button>
 *     </div>
 *   )}
 * </FormArray>
 * ```
 */
export const FormArray = forwardRef<HTMLDivElement, FormArrayProps>(
  (
    {
      name,
      control,
      label,
      description,
      disabled,
      required,
      className,
      error,
      children,
      defaultValue = {},
      minItems = 0,
      maxItems,
      addButtonText = "Add Item",
      removeButtonText = "Remove",
      sortable = false,
      showItemNumbers = false,
      cardWrapper = false,
      emptyMessage = "No items added yet",
      addButtonVariant = "outline",
      ...props
    },
    ref
  ) => {
    const form = useFormContext();
    const formControl = control || form?.control;

    if (!formControl) {
      throw new Error("FormArray must be used within a Form or have control prop");
    }

    const { fields, append, remove, move } = useFieldArray({
      control: formControl,
      name,
    });

    const canAdd = !maxItems || fields.length < maxItems;
    const canRemove = fields.length > minItems;

    const handleAdd = () => {
      if (canAdd) {
        append(defaultValue);
      }
    };

    const handleRemove = (index: number) => {
      if (canRemove) {
        remove(index);
      }
    };

    const handleMove = (from: number, to: number) => {
      if (sortable && from !== to && to >= 0 && to < fields.length) {
        move(from, to);
      }
    };

    const renderItem = (field: any, index: number) => {
      const itemContent = children({
        field,
        index,
        remove: () => handleRemove(index),
        move: handleMove,
      });

      if (cardWrapper) {
        return (
          <Card key={field.id} className="relative">
            {(sortable || showItemNumbers) && (
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {sortable && (
                      <div className="cursor-move">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    {showItemNumbers && (
                      <span className="text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>
                  {canRemove && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(index)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
            )}
            <CardContent className={cardWrapper && (sortable || showItemNumbers) ? "pt-0" : ""}>
              {itemContent}
            </CardContent>
          </Card>
        );
      }

      return (
        <div key={field.id} className="relative space-y-4 p-4 border rounded-lg">
          {(sortable || showItemNumbers || canRemove) && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {sortable && (
                  <div className="cursor-move">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                {showItemNumbers && (
                  <span className="text-sm font-medium text-muted-foreground">
                    Item #{index + 1}
                  </span>
                )}
              </div>
              {canRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {removeButtonText}
                </Button>
              )}
            </div>
          )}
          {itemContent}
        </div>
      );
    };

    return (
      <div className={cn("space-y-4", className)} ref={ref} {...props}>
        {label && (
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </label>
            {description && (
              <p className="text-[0.8rem] text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">{emptyMessage}</p>
            </div>
          ) : (
            <Fragment>
              {fields.map((field, index) => renderItem(field, index))}
            </Fragment>
          )}

          {canAdd && (
            <Button
              type="button"
              variant={addButtonVariant}
              onClick={handleAdd}
              disabled={disabled}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addButtonText}
              {maxItems && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({fields.length}/{maxItems})
                </span>
              )}
            </Button>
          )}
        </div>

        {error && (
          <p className="text-[0.8rem] font-medium text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

FormArray.displayName = "FormArray";