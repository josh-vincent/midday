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
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";

const formSchema = z.object({
  customerLabel: z.string().min(1),
  fromLabel: z.string().min(1),
  invoiceNoLabel: z.string().min(1),
  issueDateLabel: z.string().min(1),
  dueDateLabel: z.string().min(1),
  descriptionLabel: z.string().min(1),
  priceLabel: z.string().min(1),
  quantityLabel: z.string().min(1),
  totalLabel: z.string().min(1),
  totalSummaryLabel: z.string().optional(),
  vatLabel: z.string().optional(),
  taxLabel: z.string().optional(),
  subtotalLabel: z.string().optional(),
  discountLabel: z.string().optional(),
  paymentLabel: z.string().min(1),
  noteLabel: z.string().min(1),
});

export function TemplateLabels({ template }: { template: any }) {
  const trpc = useTRPC();
  const updateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      customerLabel: template?.customerLabel || "To",
      fromLabel: template?.fromLabel || "From",
      invoiceNoLabel: template?.invoiceNoLabel || "Invoice No",
      issueDateLabel: template?.issueDateLabel || "Issue Date",
      dueDateLabel: template?.dueDateLabel || "Due Date",
      descriptionLabel: template?.descriptionLabel || "Description",
      priceLabel: template?.priceLabel || "Price",
      quantityLabel: template?.quantityLabel || "Quantity",
      totalLabel: template?.totalLabel || "Total",
      totalSummaryLabel: template?.totalSummaryLabel || "Total",
      vatLabel: template?.vatLabel || "VAT",
      taxLabel: template?.taxLabel || "Tax",
      subtotalLabel: template?.subtotalLabel || "Subtotal",
      discountLabel: template?.discountLabel || "Discount",
      paymentLabel: template?.paymentLabel || "Payment Details",
      noteLabel: template?.noteLabel || "Note",
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        customerLabel: template.customerLabel || "To",
        fromLabel: template.fromLabel || "From",
        invoiceNoLabel: template.invoiceNoLabel || "Invoice No",
        issueDateLabel: template.issueDateLabel || "Issue Date",
        dueDateLabel: template.dueDateLabel || "Due Date",
        descriptionLabel: template.descriptionLabel || "Description",
        priceLabel: template.priceLabel || "Price",
        quantityLabel: template.quantityLabel || "Quantity",
        totalLabel: template.totalLabel || "Total",
        totalSummaryLabel: template.totalSummaryLabel || "Total",
        vatLabel: template.vatLabel || "VAT",
        taxLabel: template.taxLabel || "Tax",
        subtotalLabel: template.subtotalLabel || "Subtotal",
        discountLabel: template.discountLabel || "Discount",
        paymentLabel: template.paymentLabel || "Payment Details",
        noteLabel: template.noteLabel || "Note",
      });
    }
  }, [template, form]);

  const onSubmit = form.handleSubmit((data) => {
    updateMutation.mutate(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Invoice Labels</CardTitle>
            <CardDescription>
              Customize the labels that appear on your invoices.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fromLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceNoLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueDateLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDateLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descriptionLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantityLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subtotalLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtotal Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Details Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="noteLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Label</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
              Save Labels
            </SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
