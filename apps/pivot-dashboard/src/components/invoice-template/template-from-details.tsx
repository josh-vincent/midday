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
  fromDetails: z.any().optional(),
});

export function TemplateFromDetails({ template }: { template: any }) {
  const trpc = useTRPC();
  const updateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      fromDetails: template?.fromDetails || "",
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        fromDetails: template.fromDetails || "",
      });
    }
  }, [template, form]);

  const onSubmit = form.handleSubmit((data) => {
    updateMutation.mutate({
      fromDetails: data.fromDetails || undefined,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>From Details</CardTitle>
            <CardDescription>
              Your company information that appears on invoices.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="fromDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Details</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Your Company Name&#10;123 Main Street&#10;City, State 12345&#10;Country&#10;Email: info@company.com&#10;Phone: +1 234 567 890"
                      className="min-h-[150px]"
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
              Save Company Details
            </SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
