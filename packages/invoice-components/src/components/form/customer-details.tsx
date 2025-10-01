"use client";

import { Editor } from "../../context/dependencies-context";
import { useInvoiceParams } from "../../hooks/use-invoice-params";
import { useTRPC } from "../../context/dependencies-context";
import { transformCustomerToContent } from "@midday/invoice/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { JSONContent } from "@tiptap/react";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { SelectCustomer } from "./select-customer";
import { LabelInput } from "./label-input";

export function CustomerDetails() {
  const { control, setValue, watch } = useFormContext();
  const { setParams, selectedCustomerId } = useInvoiceParams();

  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  const content = watch("customerDetails");
  const id = watch("id");
  const formCustomerId = watch("customerId");

  // Use URL param customerId if available, otherwise use form's customerId
  const effectiveCustomerId = selectedCustomerId || formCustomerId;

  const { data: customer } = useQuery(
    trpc.customers.getById.queryOptions(
      { id: effectiveCustomerId! },
      {
        enabled: !!effectiveCustomerId,
      },
    ),
  );

  const handleLabelSave = (value: string) => {
    updateTemplateMutation.mutate({ customerLabel: value });
  };

  const handleOnChange = (content?: JSONContent | null) => {
    // Reset the selected customer id when the content is changed
    setParams({ selectedCustomerId: null });

    setValue("customerDetails", content, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (!content) {
      setValue("customerName", null, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("customerId", null, { shouldValidate: true, shouldDirty: true });
    }
  };

  useEffect(() => {
    if (customer) {
      const customerContent = transformCustomerToContent(customer);

      setValue("customerName", customer.name, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("customerId", customer.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("customerDetails", customerContent, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // Remove the selected customer id from the url after setting values
      setParams({ selectedCustomerId: null });
    }
  }, [customer, setValue, setParams]);

  const hasContent = content && typeof content === 'object' && content.type === 'doc' &&
                     content.content && content.content.length > 0;

  return (
    <div>
      <LabelInput
        name="template.customerLabel"
        className="mb-2 block"
        onSave={handleLabelSave}
      />
      {hasContent ? (
        <Controller
          name="customerDetails"
          control={control}
          render={({ field }) => {
            // Parse the content if it's a string
            let content = field.value;
            if (typeof content === 'string') {
              try {
                content = JSON.parse(content);
              } catch (e) {
                // If it's not valid JSON, treat it as plain text
                content = {
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: content || "",
                        },
                      ],
                    },
                  ],
                };
              }
            }

            return (
              <Editor
                // NOTE: This is a workaround to get the new content to render
                key={`customer-${id}-${selectedCustomerId}`}
                initialContent={content}
                onChange={handleOnChange}
                className="min-h-[90px]"
              />
            );
          }}
        />
      ) : (
        <SelectCustomer />
      )}
    </div>
  );
}
