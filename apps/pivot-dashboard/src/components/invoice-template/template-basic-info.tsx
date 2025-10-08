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
import { SubmitButton } from "@midday/ui/submit-button";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  terms: z.string().optional(),
  note: z.string().optional(),
  paymentTerms: z.number().min(1).max(365).optional(),
});

export function TemplateBasicInfo({ template }: { template: any }) {
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
                    queryKey[1].toString().startsWith('invoice.templateIsConfigured'));
          },
        });
      },
      onError: (error) => {
        console.error("Failed to update template:", error);
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      title: template?.title || "",
      logoUrl: template?.logoUrl || "",
      terms: template?.terms || "",
      note: template?.note || "",
      paymentTerms: template?.paymentTerms || 30,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        title: template.title || "",
        logoUrl: template.logoUrl || "",
        terms: template.terms || "",
        note: template.note || "",
        paymentTerms: template.paymentTerms || 30,
      });
    }
  }, [template, form]);

  const onSubmit = form.handleSubmit((data) => {
    const payload = {
      title: data.title || undefined,
      logoUrl: data.logoUrl || undefined,
      terms: data.terms || undefined,
      note: data.note || undefined,
      paymentTerms: data.paymentTerms || undefined,
    };
    console.log("Submitting basic info:", payload);
    updateMutation.mutate(payload);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Set the title and logo for your invoices.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Invoice"
                      className="max-w-[300px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://example.com/logo.png"
                      className="max-w-[400px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms (days)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="30"
                      className="max-w-[200px]"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Payment is due within 30 days of invoice date..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Thank you for your business..."
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <SubmitButton
              isSubmitting={updateMutation.isPending}
              disabled={updateMutation.isPending}
            >
              Save
            </SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
