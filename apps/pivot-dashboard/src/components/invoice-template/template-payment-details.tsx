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
import { SubmitButton } from "@midday/ui/submit-button";
import { Textarea } from "@midday/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";

const formSchema = z.object({
  paymentDetails: z.any().optional(),
  noteDetails: z.any().optional(),
});

export function TemplatePaymentDetails({ template }: { template: any }) {
  const trpc = useTRPC();
  const updateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      paymentDetails: template?.paymentDetails || "",
      noteDetails: template?.noteDetails || "",
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        paymentDetails: template.paymentDetails || "",
        noteDetails: template.noteDetails || "",
      });
    }
  }, [template, form]);

  const onSubmit = form.handleSubmit((data) => {
    updateMutation.mutate({
      paymentDetails: data.paymentDetails || undefined,
      noteDetails: data.noteDetails || undefined,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Payment & Notes</CardTitle>
            <CardDescription>
              Default payment details and notes that appear on invoices.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="paymentDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Details</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Bank: Example Bank&#10;Account Name: Your Company&#10;BSB: 123-456&#10;Account: 12345678&#10;PayID: info@company.com"
                        className="min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="noteDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Thank you for your business!&#10;Please remit payment within the terms stated above."
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter>
            <SubmitButton
              isSubmitting={updateMutation.isPending}
              disabled={updateMutation.isPending}
            >
              Save Payment Details
            </SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
