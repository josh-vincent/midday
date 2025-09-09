"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import { Switch } from "@midday/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";

const formSchema = z.object({
  dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"]),
  size: z.enum(["a4", "letter"]),
  currency: z.string(),
  includeVat: z.boolean(),
  includeTax: z.boolean(),
  includeDiscount: z.boolean(),
  includeDecimals: z.boolean(),
  includePdf: z.boolean(),
  includeUnits: z.boolean(),
  includeQr: z.boolean(),
  vatRate: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  quantityLabel: z.string().optional(),
});

export function TemplateFormatOptions({ template }: { template: any }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const updateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions({
      onSuccess: () => {
        // Invalidate and refetch template data
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' && 
                   queryKey[1] && 
                   (queryKey[1].toString().startsWith('invoiceTemplate.get') ||
                    queryKey[1].toString().startsWith('invoiceTemplate.isConfigured'));
          },
        });
      },
      onError: (error) => {
        console.error("Failed to update template format options:", error);
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      dateFormat: template?.dateFormat || "dd/MM/yyyy",
      size: template?.size || "a4",
      currency: template?.currency || "AUD",
      includeVat: template?.includeVat || false,
      includeTax: template?.includeTax || false,
      includeDiscount: template?.includeDiscount || false,
      includeDecimals: template?.includeDecimals || true,
      includePdf: template?.includePdf || true,
      includeUnits: template?.includeUnits || false,
      includeQr: template?.includeQr || false,
      vatRate: template?.vatRate || 0,
      taxRate: template?.taxRate || 0,
      quantityLabel: template?.quantityLabel || "Qty",
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        dateFormat: template.dateFormat || "dd/MM/yyyy",
        size: template.size || "a4",
        currency: template.currency || "AUD",
        includeVat: template.includeVat || false,
        includeTax: template.includeTax || false,
        includeDiscount: template.includeDiscount || false,
        includeDecimals: template.includeDecimals !== false,
        includePdf: template.includePdf !== false,
        includeUnits: template.includeUnits || false,
        includeQr: template.includeQr || false,
        vatRate: template.vatRate || 0,
        taxRate: template.taxRate || 0,
        quantityLabel: template.quantityLabel || "Qty",
      });
    }
  }, [template, form]);

  const watchIncludeTax = form.watch("includeTax");
  const watchIncludeVat = form.watch("includeVat");
  const watchIncludeUnits = form.watch("includeUnits");

  const onSubmit = form.handleSubmit((data) => {
    console.log("Submitting format options:", data);
    updateMutation.mutate(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Format Options</CardTitle>
            <CardDescription>
              Configure the format and display options for your invoices.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Format</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                          <SelectItem value="dd.MM.yyyy">DD.MM.YYYY</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paper Size</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="a4">A4</SelectItem>
                          <SelectItem value="letter">Letter</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AUD">
                            AUD - Australian Dollar
                          </SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">
                            GBP - British Pound
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FormLabel className="font-normal">Include VAT</FormLabel>
                    
                    {watchIncludeVat && (
                      <FormField
                        control={form.control}
                        name="vatRate"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="20"
                                className="w-[80px]"
                                step="0.01"
                                min="0"
                                max="100"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <span className="text-sm text-muted-foreground">%</span>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="includeVat"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FormLabel className="font-normal">Include Sales Tax</FormLabel>
                    
                    {watchIncludeTax && (
                      <FormField
                        control={form.control}
                        name="taxRate"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="10"
                                className="w-[80px]"
                                step="0.01"
                                min="0"
                                max="100"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <span className="text-sm text-muted-foreground">%</span>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="includeTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="includeDiscount"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 w-full">
                        <FormLabel className="font-normal">
                          Include Discount Field
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="includeDecimals"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 w-full">
                        <FormLabel className="font-normal">
                          Show Decimals
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FormLabel className="font-normal">Include Units Field</FormLabel>
                    
                    {watchIncludeUnits && (
                      <FormField
                        control={form.control}
                        name="quantityLabel"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Qty"
                                className="w-[80px]"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="includeUnits"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="includePdf"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 w-full">
                        <FormLabel className="font-normal">
                          Attach PDF to Email
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="includeQr"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-y-0 w-full">
                        <FormLabel className="font-normal">
                          Include QR Code
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <SubmitButton
              isSubmitting={updateMutation.isPending}
              disabled={updateMutation.isPending}
            >
              Save Format Options
            </SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
