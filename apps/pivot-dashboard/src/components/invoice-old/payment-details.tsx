"use client";

import { Editor } from "@/components/invoice/editor";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Controller, useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function PaymentDetails() {
  const { control, watch } = useFormContext();
  const id = watch("id");

  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  return (
    <div>
      <LabelInput
        name="template.paymentLabel"
        onSave={(value) => {
          updateTemplateMutation.mutate({ paymentLabel: value });
        }}
        className="mb-2 block"
      />

      <Controller
        control={control}
        name="paymentDetails"
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
              key={id}
              initialContent={content}
              onChange={field.onChange}
              onBlur={(content) => {
                updateTemplateMutation.mutate({
                  paymentDetails: content ? JSON.stringify(content) : null,
                });
              }}
              className="min-h-[78px]"
            />
          );
        }}
      />
    </div>
  );
}
