import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { formatRelativeTime } from "@/utils/format";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useDebounceValue } from "usehooks-ts";
import { OpenURL } from "../open-url";
import { CustomerDetails } from "./customer-details";
import { EditBlock } from "./edit-block";
import type { InvoiceFormValues } from "./form-context";
import { FromDetails } from "./from-details";
import { LineItems } from "./line-items";
import { Logo } from "./logo";
import { Meta } from "./meta";
import { NoteDetails } from "./note-details";
import { PaymentDetails } from "./payment-details";
import { SubmitButton } from "./submit-button";
import { Summary } from "./summary";
import { transformFormValuesToDraft } from "./utils";

export function Form() {
  const { invoiceId, setParams } = useInvoiceParams();
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();
  const [lastEditedText, setLastEditedText] = useState("");

  const form = useFormContext();
  const token = form.watch("token");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const draftInvoiceMutation = useMutation(
    trpc.invoice.draft.mutationOptions({
      onSuccess: (data) => {
        console.log("Draft saved successfully:", data);
        if (!invoiceId && data?.id) {
          console.log("Setting invoice ID from draft:", data.id);
          setParams({ type: "edit", invoiceId: data.id });
        }

        setLastUpdated(new Date());

        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' && 
                   queryKey[1] && 
                   (queryKey[1].toString().startsWith('invoice.get') ||
                    queryKey[1].toString().startsWith('invoice.invoiceSummary') ||
                    queryKey[1].toString().startsWith('invoice.getInvoiceByToken'));
          },
        });
      },
      onError: (error) => {
        console.error("Failed to save draft:", error);
      },
    }),
  );

  // Job status update mutation for when jobs are added to invoice
  const updateJobStatusMutation = useMutation(
    trpc.job.updateManyStatus.mutationOptions({
      onSuccess: (data) => {
        console.log(`Updated ${data.count} jobs to in_progress status`);
        // Invalidate job queries to refresh UI
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' && 
                   queryKey[1] && 
                   queryKey[1].toString().startsWith('job.');
          },
        });
      },
      onError: (error) => {
        console.error("Failed to update job statuses:", error);
        // Don't show error toast as this is a secondary operation
      },
    }),
  );

  const createInvoiceMutation = useMutation(
    trpc.invoice.create.mutationOptions({
      onSuccess: (data) => {
        console.log("Invoice created successfully:", data);
        console.log("Created invoice amounts:", {
          amount: data.amount,
          subtotal: data.subtotal,
          tax: data.tax,
          vat: data.vat,
          lineItems: data.lineItems?.map((item: any) => ({ name: item.name, price: item.price, quantity: item.quantity }))
        });
        
        // Update job statuses to "in_progress" if jobs were used for this invoice
        if (typeof window !== "undefined") {
          const storedJobs = sessionStorage.getItem("selectedJobsForInvoice");
          if (storedJobs) {
            try {
              const jobGroups = JSON.parse(storedJobs);
              const allJobIds: string[] = [];
              
              // Extract all job IDs from the grouped structure
              jobGroups.forEach((group: any) => {
                if (group.jobs && Array.isArray(group.jobs)) {
                  group.jobs.forEach((job: any) => {
                    if (job.id) allJobIds.push(job.id);
                  });
                }
              });
              
              if (allJobIds.length > 0) {
                console.log(`Updating ${allJobIds.length} jobs to in_progress status`);
                updateJobStatusMutation.mutate({
                  ids: allJobIds,
                  status: "in_progress"
                });
              }
              
              // Clear the stored jobs after processing
              sessionStorage.removeItem("selectedJobsForInvoice");
            } catch (error) {
              console.error("Error processing stored jobs:", error);
              sessionStorage.removeItem("selectedJobsForInvoice"); // Clear anyway
            }
          }
        }

        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' && 
                   queryKey[1] && 
                   (queryKey[1].toString().startsWith('invoice.get') ||
                    queryKey[1].toString().startsWith('invoice.getById') ||
                    queryKey[1].toString().startsWith('invoice.invoiceSummary') ||
                    queryKey[1].toString().startsWith('search.global'));
          },
        });

        setParams({ type: "success", invoiceId: data.id });
      },
      onError: (error) => {
        console.error("Failed to create invoice - Full error:", error);
        console.error("Error message:", error.message);
        console.error("Error data:", error.data);
        console.error("Error shape:", error.shape);
        console.error("Error code:", error.code);
        console.error("Error stack:", error.stack);
        console.error("Error keys:", Object.keys(error));
        console.error("Stringified error:", JSON.stringify(error, null, 2));
      },
    }),
  );

  // Only watch the fields that are used in the upsert action
  // Watch the entire form to ensure all changes trigger draft saves
  const formValues = useWatch({
    control: form.control,
  });

  const isDirty = form.formState.isDirty;
  const invoiceNumberValid = !form.getFieldState("invoiceNumber").error;
  const [debouncedValue] = useDebounceValue(formValues, 500);

  useEffect(() => {
    console.log("Draft save effect triggered:", {
      isDirty,
      invoiceNumberValid,
      debouncedValue: !!debouncedValue,
      isPending: draftInvoiceMutation.isPending,
    });
    
    if (isDirty && invoiceNumberValid && !draftInvoiceMutation.isPending) {
      const currentFormValues = form.getValues();
      const draftData = transformFormValuesToDraft(currentFormValues);
      console.log("Saving draft with data:", draftData);
      
      draftInvoiceMutation.mutate(
        // @ts-expect-error
        draftData,
      );
    }
  }, [debouncedValue, isDirty, invoiceNumberValid]);

  useEffect(() => {
    const updateLastEditedText = () => {
      if (!lastUpdated) {
        setLastEditedText("");
        return;
      }

      setLastEditedText(`Edited ${formatRelativeTime(lastUpdated)}`);
    };

    updateLastEditedText();
    const intervalId = setInterval(updateLastEditedText, 1000);

    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  // Submit the form and the draft invoice
  const handleSubmit = (values: InvoiceFormValues) => {
    console.log("Form submitted with values:", values);
    console.log("URL invoiceId:", invoiceId);
    console.log("Form values.id:", values.id);
    
    const finalInvoiceId = values.id || invoiceId;
    
    if (!finalInvoiceId) {
      console.error("No invoice ID available for creation!");
      return;
    }

    console.log("Creating invoice with ID:", finalInvoiceId);
    
    // Always save draft first to ensure the latest data is persisted
    const currentFormValues = form.getValues();
    const draftData = transformFormValuesToDraft(currentFormValues);
    
    // Ensure the draft has the correct ID
    draftData.id = finalInvoiceId;
    
    console.log("Saving final draft before invoice creation:", {
      ...draftData,
      lineItems: draftData.lineItems?.map(item => ({ 
        name: item.name, 
        quantity: item.quantity, 
        price: item.price 
      }))
    });
    
    // Save draft first, then create invoice
    draftInvoiceMutation.mutate(
      // @ts-expect-error
      draftData,
      {
        onSuccess: (draftResult) => {
          console.log("Final draft saved successfully:", draftResult);
          const createId = draftResult?.id || finalInvoiceId;
          console.log("Now creating invoice with ID:", createId);
          
          if (!createId) {
            console.error("No valid invoice ID available after draft creation");
            return;
          }
          
          // Proceed immediately with invoice creation - no setTimeout needed
          console.log("Draft save confirmed, proceeding with invoice creation");
          createInvoiceMutation.mutate({
            id: createId,
            deliveryType: values.template.deliveryType ?? "create",
            scheduledAt: values.scheduledAt || undefined,
          });
        },
        onError: (error) => {
          console.error("Failed to save final draft - Full error:", error);
          console.error("Draft save error message:", error.message);
          console.error("Draft save error data:", error.data);
          console.error("Draft save error stringified:", JSON.stringify(error, null, 2));
          
          // Show user-friendly error message
          alert(`Failed to save invoice draft: ${error.message || 'Unknown error'}. Please check the console for details and try again.`);
        }
      }
    );
  };

  // Prevent form from submitting when pressing enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <form
      // @ts-expect-error
      onSubmit={form.handleSubmit((values) => {
        console.log("Form onSubmit triggered");
        handleSubmit(values);
      })}
      className="relative h-full"
      onKeyDown={handleKeyDown}
    >
      <ScrollArea className="h-[calc(100vh-200px)] bg-background" hideScrollbar>
        <div className="p-8 pb-4 h-full flex flex-col">
          <div className="flex justify-between">
            <Meta />
            <Logo />
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8 mb-4">
            <div>
              <FromDetails />
            </div>
            <div>
              <CustomerDetails />
            </div>
          </div>

          <EditBlock name="topBlock" />

          <div className="mt-4">
            <LineItems />
          </div>

          <div className="mt-12 flex justify-end mb-8">
            <Summary />
          </div>

          <div className="flex flex-col mt-auto">
            <div className="grid grid-cols-2 gap-6 mb-4 overflow-hidden">
              <PaymentDetails />
              <NoteDetails />
            </div>

            <EditBlock name="bottomBlock" />
          </div>
        </div>
      </ScrollArea>

      <div className="absolute bottom-14 w-full h-9">
        <div className="flex justify-between items-center mt-auto">
          <div className="flex space-x-2 items-center text-xs text-[#808080]">
            {token && (
              <>
                <OpenURL
                  href={`${getUrl()}/i/${token}`}
                  className="flex items-center gap-1"
                  title="Refresh the preview page to see latest changes"
                >
                  <Icons.ExternalLink className="size-3" />
                  <span>Preview invoice</span>
                </OpenURL>

                {(draftInvoiceMutation.isPending || lastEditedText) && (
                  <span>-</span>
                )}
              </>
            )}

            {(draftInvoiceMutation.isPending || lastEditedText) && (
              <span>
                {draftInvoiceMutation.isPending ? "Saving" : lastEditedText}
              </span>
            )}
          </div>

          <SubmitButton
            type="submit"
            isSubmitting={createInvoiceMutation.isPending}
            disabled={
              createInvoiceMutation.isPending || draftInvoiceMutation.isPending
            }
          />
        </div>
      </div>
    </form>
  );
}
