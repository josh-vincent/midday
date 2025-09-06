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
  title: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export function TemplateBasicInfo({ template }: { template: any }) {
  const trpc = useTRPC();
  const updateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      title: template?.title || "",
      logoUrl: template?.logoUrl || "",
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        title: template.title || "",
        logoUrl: template.logoUrl || "",
      });
    }
  }, [template, form]);

  const onSubmit = form.handleSubmit((data) => {
    updateMutation.mutate({
      title: data.title || undefined,
      logoUrl: data.logoUrl || undefined,
    });
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
